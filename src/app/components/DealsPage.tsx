"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Deal } from "@/lib/scraper";
import { timeAgo, formatPrice, parseDiscountValue, getHiResImage } from "@/lib/scraper";
import { KNOWN_STORES, formatStoreName } from "@/lib/seo";

const STORE_CONFIG: Record<string, { emoji: string; color: string }> = {
  Alla: { emoji: "✨", color: "#a855f7" },
  "Apotek Hjärtat SE": { emoji: "💊", color: "#f97316" },
  "Diamond Smile SE": { emoji: "✨", color: "#38bdf8" },
  "Dyson SE": { emoji: "🌪️", color: "#64748b" },
  "Homeroom SE": { emoji: "🏠", color: "#0ea5e9" },
  "Jotex SE": { emoji: "🛋️", color: "#ea580c" },
  "Navimow EU": { emoji: "🌱", color: "#16a34a" },
  "Padel Market": { emoji: "🏸", color: "#7c3aed" },
  "Nelly SE": { emoji: "👗", color: "#ec4899" },
  "Ninja SE": { emoji: "🥷", color: "#0f172a" },
  "NLY Man SE": { emoji: "👔", color: "#3b82f6" },
  "Outnorth SE": { emoji: "⛰️", color: "#059669" },
  "Xiaomi SE": { emoji: "📱", color: "#ef4444" },
};

function buildImageAttemptList(deal: Deal): string[] {
  const raw = [deal.image, ...(deal.imageFallbacks || [])].map((s) => String(s || "").trim()).filter(Boolean);
  const out: string[] = [];
  const seen = new Set<string>();

  for (const url of raw) {
    const hi = getHiResImage(url, 1200, 1200);
    for (const candidate of hi === url ? [url] : [hi, url]) {
      if (!candidate || seen.has(candidate)) continue;
      seen.add(candidate);
      out.push(candidate);
    }
  }

  return out;
}

function DealCardImage({
  deal,
  placeholderEmoji,
}: {
  deal: Deal;
  placeholderEmoji: string;
}) {
  const attempts = useMemo(() => buildImageAttemptList(deal), [deal]);
  const [idx, setIdx] = useState(0);

  const src = attempts[idx] || "";
  const unoptimized =
    src.includes("productserve.com") || src.includes("res.cloudinary.com") || src.includes("ellosgroup.com");
  const referrerPolicy = src.includes("productserve.com") ? "no-referrer" : undefined;

  if (!src) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f3ff",
          color: "#c4b5fd",
          fontSize: 40,
        }}
      >
        {placeholderEmoji}
      </div>
    );
  }

  return (
    <Image
      key={src}
      src={src}
      alt={deal.title}
      fill
      sizes="(max-width: 640px) 45vw, 280px"
      quality={75}
      unoptimized={unoptimized}
      referrerPolicy={referrerPolicy}
      style={{ objectFit: "cover" }}
      onError={() => {
        setIdx((i) => (i + 1 < attempts.length ? i + 1 : i));
      }}
    />
  );
}

type SortOption = "discount" | "cheapest" | "expensive";

const PAGE_SIZE = 60;

export default function DealsPage({
  initialStore = "Alla",
  initialCategory = "Alla",
  seoTitle,
  seoDescription,
}: {
  initialStore?: string;
  initialCategory?: string;
  seoTitle?: string;
  seoDescription?: string;
}) {
  const track = useCallback((eventName: string, params?: Record<string, unknown>) => {
    try {
      // GA4 (loaded after cookie consent)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gtag = (window as any)?.gtag as undefined | ((...args: any[]) => void);
      if (typeof gtag === "function") {
        gtag("event", eventName, params || {});
      }
    } catch {
      // ignore
    }
  }, []);

  const [toast, setToast] = useState<{ message: string } | null>(null);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);
  const showToast = useCallback((message: string) => {
    setToast({ message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }, []);

  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [stores, setStores] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [activeStores, setActiveStores] = useState<Set<string>>(
    () => new Set(initialStore && initialStore !== "Alla" ? [initialStore] : [])
  );
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    () => new Set(initialCategory && initialCategory !== "Alla" ? [initialCategory] : [])
  );
  const [sortBy, setSortBy] = useState<SortOption>("discount");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Pull-to-refresh
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const PULL_THRESHOLD = 100;

  // Debounce search
  const searchTimeout = useRef<NodeJS.Timeout>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery]);

  // Load deals in chunks: meta + first chunk fast, rest in background
  const loadAllDeals = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Load meta (tiny file)
      const metaRes = await fetch("/cache/deals-meta.json");
      if (!metaRes.ok) throw new Error("Kunde inte hämta deals");
      const meta = await metaRes.json();
      const mergedStores = Array.from(
        new Set([...(meta.stores || []), ...KNOWN_STORES])
      ).sort((a, b) => a.localeCompare(b, "sv"));
      setStores(mergedStores);
      setLastUpdated(meta.lastUpdated || "");

      // 2. Load first chunk
      const firstRes = await fetch("/cache/deals-0.json");
      if (!firstRes.ok) throw new Error("Kunde inte hämta deals");
      const firstChunk = (await firstRes.json()) as Deal[];
      // Hard client-side dedupe (defense-in-depth)
      const seenFirst = new Set<string>();
      const uniqueFirst = firstChunk.filter((d) => {
        const k = `${d.store}|${d.url || ""}|${d.id}`;
        if (seenFirst.has(k)) return false;
        seenFirst.add(k);
        return true;
      });
      setAllDeals(uniqueFirst);
      setError(null);
      setLoading(false);

      // 3. Load remaining chunks in background
      if (meta.totalChunks > 1) {
        const remaining: Deal[] = [];
        const fetches = [];
        for (let i = 1; i < meta.totalChunks; i++) {
          fetches.push(
            fetch(`/cache/deals-${i}.json`)
              .then((r) => r.json())
              .then((chunk) => {
                remaining.push(...(chunk as Deal[]));
              })
          );
        }
        await Promise.all(fetches);
        setAllDeals((prev) => {
          const merged = [...prev, ...remaining];
          const seen = new Set<string>();
          const unique: Deal[] = [];
          for (const d of merged) {
            const k = `${d.store}|${d.url || ""}|${d.id}`;
            if (seen.has(k)) continue;
            seen.add(k);
            unique.push(d);
          }
          return unique;
        });
      }
    } catch (err) {
      console.error("Failed to load deals:", err);
      setError("Kunde inte ladda deals. Försök igen senare.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllDeals();
  }, [loadAllDeals]);

  const storeFilterLabel =
    activeStores.size === 0 ? "Alla butiker" : `${activeStores.size} butik${activeStores.size === 1 ? "" : "er"}`;

  const selectedStoresOrAll = useMemo(() => {
    if (activeStores.size === 0) return null; // null means "all"
    return new Set(activeStores);
  }, [activeStores]);

  // Categories for the selected stores (union, dynamic)
  const storeCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of allDeals) {
      if (selectedStoresOrAll && !selectedStoresOrAll.has(d.store)) continue;
      const cat = (d.category || "").trim();
      if (!cat) continue;
      counts.set(cat, (counts.get(cat) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0], "sv"))
      .map(([category, count]) => ({ category, count }));
  }, [selectedStoresOrAll, allDeals]);

  // Client-side filter + sort
  const filteredDeals = useMemo(() => {
    let result = allDeals;

    if (selectedStoresOrAll) {
      result = result.filter((d) => selectedStoresOrAll.has(d.store));
    }

    if (activeCategories.size > 0) {
      result = result.filter((d) => activeCategories.has(d.category));
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.store.toLowerCase().includes(q) ||
          (d.brand && d.brand.toLowerCase().includes(q)) ||
          d.category.toLowerCase().includes(q)
      );
    }

    const sorted = [...result];
    if (sortBy === "discount") {
      sorted.sort(
        (a, b) => parseDiscountValue(b.discount) - parseDiscountValue(a.discount)
      );
    } else if (sortBy === "cheapest") {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === "expensive") {
      sorted.sort((a, b) => b.price - a.price);
    }

    return sorted;
  }, [allDeals, selectedStoresOrAll, activeCategories, debouncedSearch, sortBy]);

  const visibleDeals = filteredDeals.slice(0, visibleCount);
  const hasMore = visibleCount < filteredDeals.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeStores, activeCategories, debouncedSearch, sortBy]);

  // If the page is store/category-specific (SEO routes), keep initial selection stable
  useEffect(() => {
    if (initialStore && initialStore !== "Alla") {
      setActiveStores(new Set([initialStore]));
    }
    if (initialCategory && initialCategory !== "Alla") {
      setActiveCategories(new Set([initialCategory]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleStore = useCallback((store: string) => {
    setActiveStores((prev) => {
      const next = new Set(prev);
      if (store === "Alla") return new Set();
      if (next.has(store)) next.delete(store);
      else next.add(store);
      return next;
    });

    track("filter_store_toggle", {
      store: store === "Alla" ? "Alla" : store,
      action:
        store === "Alla"
          ? "reset_all"
          : activeStores.has(store)
            ? "remove"
            : "add",
      selected_store_count: store === "Alla" ? 0 : activeStores.size + (activeStores.has(store) ? -1 : 1),
    });
  }, []);

  const toggleCategory = useCallback((cat: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (cat === "Alla") return new Set();
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

    track("filter_category_toggle", {
      category: cat === "Alla" ? "Alla" : cat,
      action:
        cat === "Alla"
          ? "reset_all"
          : activeCategories.has(cat)
            ? "remove"
            : "add",
      selected_category_count: cat === "Alla" ? 0 : activeCategories.size + (activeCategories.has(cat) ? -1 : 1),
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore) return;
      const scrollBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 800;
      if (scrollBottom) {
        setVisibleCount((prev) => prev + PAGE_SIZE);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        touchStartY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || refreshing) return;
      const diff = e.touches[0].clientY - touchStartY.current;
      if (diff > 0 && window.scrollY === 0) {
        setPullDistance(Math.min(diff * 0.4, 150));
        if (diff > 10) e.preventDefault();
      }
    };
    const handleTouchEnd = async () => {
      if (!isPulling.current) return;
      isPulling.current = false;
      if (pullDistance >= PULL_THRESHOLD) {
        setRefreshing(true);
        setPullDistance(PULL_THRESHOLD);
        await loadAllDeals();
        setRefreshing(false);
      }
      setPullDistance(0);
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance, refreshing, loadAllDeals]);

  const sortLabels: Record<SortOption, string> = {
    discount: "Rabatt 💸",
    cheapest: "Billigast 💰",
    expensive: "Dyrast 💎",
  };

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const storeButtons = [
    "Alla",
    ...stores.slice().sort((a, b) => a.localeCompare(b, "sv")),
  ];

  const activeStoreLabel =
    activeStores.size === 0
      ? "Alla butiker"
      : activeStores.size === 1
        ? formatStoreName(Array.from(activeStores)[0]!)
        : storeFilterLabel;
  const h1 =
    seoTitle ||
    (activeStores.size === 0 ? "Deals från alla butiker" : `Deals från ${activeStoreLabel}`);
  const desc =
    seoDescription ||
    (activeStores.size === 0
      ? "Hitta de bästa erbjudandena från svenska butiker. Filtrera på butik, kategori och sortera efter rabatt eller pris."
      : `Se de bästa dealsen från ${activeStoreLabel}. Välj en eller flera kategorier för att snabbt hitta rätt.`);

  return (
    <div style={{ minHeight: "100vh", background: "#faf8ff" }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Quicksand:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .logo-text {
          font-family: 'Fredoka', sans-serif; font-weight: 700;
          background: linear-gradient(135deg, #a855f7, #ec4899, #f43f5e);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .sticky-header {
          position: -webkit-sticky; position: sticky; top: 0; z-index: 50;
          background: rgba(250, 248, 255, 0.85);
          -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px);
        }
        .store-btn {
          font-family: 'Quicksand', sans-serif !important; font-weight: 600 !important;
          cursor: pointer; border: none; border-radius: 100px;
          padding: 10px 18px; font-size: 14px;
          display: flex; align-items: center; gap: 6px;
          white-space: nowrap; flex-shrink: 0; transition: all 0.2s;
        }
        @media (hover: hover) and (pointer: fine) {
          .deal-card:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 30px rgba(168, 85, 247, 0.15) !important;
          }
        }
        .deal-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .deal-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
        .deal-link { text-decoration: none; color: inherit; display: block; min-width: 0; overflow: hidden; }
        .deal-card { flex-direction: row; }
        .deal-card .card-image { width: 160px; min-width: 160px; min-height: 160px; padding: 0; background: #ffffff; }
        .deal-card .card-info { padding: 16px; }
        .deal-card .card-brand { font-size: 11px; }
        .deal-card .card-title { font-size: 15px; }
        .deal-card .card-price { font-size: 16px; }
        .deal-card .card-original { font-size: 13px; }
        .deal-card .card-time { font-size: 12px; }
        .deal-card .card-badge { font-size: 11px; padding: 2px 7px; }
        .card-image-spacer { display: none; }
        .card-store { font-size: 10px; color: #a78bfa; font-weight: 500; }
        .sort-option {
          font-family: 'Quicksand', sans-serif; cursor: pointer; padding: 4px 10px;
          border-radius: 100px; border: none; background: none; font-size: 14px;
          color: #9ca3af; font-weight: 600; transition: all 0.2s;
        }
        .sort-option:hover { background: #f3e8ff; color: #a855f7; }
        .sort-option.active { background: linear-gradient(135deg, #a855f7, #ec4899); color: #fff; }
        .filter-option {
          font-family: 'Quicksand', sans-serif; cursor: pointer; padding: 4px 10px;
          border-radius: 100px; border: 1.5px solid #e9d5ff; background: none; font-size: 14px;
          color: #9ca3af; font-weight: 600; transition: all 0.2s;
        }
        .filter-option:hover { background: #f3e8ff; color: #a855f7; border-color: #c084fc; }
        .filter-option.active { background: linear-gradient(135deg, #f43f5e, #ec4899); color: #fff; border-color: transparent; }
        .gradient-badge { background: linear-gradient(135deg, #a855f7, #ec4899) !important; }
        .search-input:focus { border-color: #c084fc !important; box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.15); }
        .store-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .store-scroll::-webkit-scrollbar { display: none; }
        .update-dot { width: 6px; height: 6px; border-radius: 50%; background: #34d399; display: inline-block; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .pull-indicator { position: fixed; top: 0; left: 50%; transform: translateX(-50%); z-index: 100; display: flex; align-items: center; justify-content: center; pointer-events: none; transition: opacity 0.2s; }
        .pull-spinner { width: 36px; height: 36px; border-radius: 50%; background: #fff; box-shadow: 0 2px 12px rgba(168, 85, 247, 0.2); display: flex; align-items: center; justify-content: center; font-size: 18px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .pull-spinner.spinning { animation: spin 0.8s linear infinite; }
        .load-more-spinner { display: flex; justify-content: center; padding: 24px; color: #a78bfa; gap: 8px; align-items: center; }
        .load-more-dot { width: 8px; height: 8px; border-radius: 50%; background: #c4b5fd; animation: bounce 1.4s ease-in-out infinite; }
        .load-more-dot:nth-child(2) { animation-delay: 0.2s; }
        .load-more-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
        @media (max-width: 640px) {
          .deal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .deal-card { flex-direction: column !important; border-radius: 12px !important; }
          .deal-card .card-image { width: 100% !important; min-width: 0 !important; min-height: 0 !important; height: auto !important; padding: 0 !important; aspect-ratio: 3/4; }
          .deal-card .card-info { padding: 10px 10px 12px; }
          .deal-card .card-brand { font-size: 10px; }
          .deal-card .card-title { font-size: 13px; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis; }
          .deal-card .card-price { font-size: 15px; }
          .deal-card .card-original { font-size: 11px; }
          .deal-card .card-time { font-size: 10px; }
          .deal-card .card-badge { font-size: 10px; padding: 3px 7px; }
          .card-store { font-size: 9px !important; }
          .mobile-price-wrap { flex-direction: row !important; flex-wrap: wrap; align-items: baseline; gap: 5px !important; }
          .mobile-nav-title { font-size: 17px !important; }
          .mobile-search { font-size: 12px !important; padding: 6px 12px !important; }
          .store-btn { font-size: 12px !important; padding: 8px 12px !important; }
          .store-scroll { justify-content: flex-start !important; flex-wrap: nowrap !important; }
          .sort-bar-count { font-size: 11px !important; }
          .sort-option { font-size: 11px !important; padding: 3px 7px !important; white-space: nowrap !important; }
          .filter-option { font-size: 11px !important; padding: 3px 7px !important; white-space: nowrap !important; }
        }
      `,
        }}
      />

      {(pullDistance > 0 || refreshing) && (
        <div
          className="pull-indicator"
          style={{
            top: Math.min(pullDistance, 150) - 36,
            opacity: refreshing ? 1 : pullProgress,
          }}
        >
          <div
            className={`pull-spinner ${refreshing ? "spinning" : ""}`}
            style={{
              transform: refreshing
                ? undefined
                : `rotate(${pullProgress * 360}deg)`,
            }}
          >
            {refreshing ? "⏳" : pullProgress >= 1 ? "🔄" : "↓"}
          </div>
        </div>
      )}

      <header className="sticky-header">
        <nav style={{ borderBottom: "1px solid #ede9fe" }}>
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              padding: "0 20px",
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              className="logo-text mobile-nav-title"
              style={{ fontSize: 22, letterSpacing: "-0.5px" }}
            >
              dealable
            </span>
            <div style={{ flex: 1, maxWidth: 400, margin: "0 24px" }}>
              <input
                type="text"
                placeholder="🔍  Sök bland alla deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mobile-search search-input"
                style={{
                  width: "100%",
                  background: "#f5f3ff",
                  border: "1.5px solid #e9d5ff",
                  borderRadius: 100,
                  padding: "8px 16px",
                  fontSize: 14,
                  color: "#581c87",
                  outline: "none",
                  transition: "all 0.2s",
                  fontFamily: "'Quicksand', sans-serif",
                }}
              />
            </div>
            <div style={{ width: 80 }} />
          </div>
        </nav>

        <div style={{ borderBottom: "1px solid #ede9fe" }}>
          <div
            className="store-scroll"
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              padding: "12px 20px",
              display: "flex",
              gap: 8,
              overflowX: "auto",
              flexWrap: "nowrap",
            }}
          >
            {storeButtons.map((store) => {
              const config = STORE_CONFIG[store] || {
                emoji: "🏪",
                color: "#a855f7",
              };
              const isActive =
                store === "Alla" ? activeStores.size === 0 : activeStores.has(store);
              return (
                <button
                  key={store}
                  className="store-btn"
                  onClick={() => toggleStore(store)}
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${config.color}, ${config.color}dd)`
                      : "#f3e8ff",
                    color: isActive ? "#fff" : "#7e22ce",
                    boxShadow: isActive ? `0 4px 15px ${config.color}40` : "none",
                  }}
                >
                  <span>{config.emoji}</span>
                  <span>{store === "Alla" ? "Alla butiker" : formatStoreName(store)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {storeCategories.length > 0 && (
          <div style={{ borderBottom: "1px solid #ede9fe" }}>
            <div
              className="store-scroll"
              style={{
                maxWidth: 1100,
                margin: "0 auto",
                padding: "10px 20px",
                display: "flex",
                gap: 8,
                overflowX: "auto",
                flexWrap: "nowrap",
                alignItems: "center",
              }}
            >
              {["Alla", ...storeCategories.map((c) => c.category)].map((cat) => {
                const isActive =
                  cat === "Alla" ? activeCategories.size === 0 : activeCategories.has(cat);
                return (
                  <button
                    key={cat}
                    className={`filter-option ${isActive ? "active" : ""}`}
                    onClick={() => toggleCategory(cat)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      whiteSpace: "nowrap",
                    }}
                    title={
                      cat === "Alla"
                        ? "Visa alla kategorier"
                        : `${cat} (${
                            storeCategories.find((c) => c.category === cat)?.count ?? 0
                          })`
                    }
                  >
                    <span>{cat === "Alla" ? "Alla kategorier" : cat}</span>
                    {cat !== "Alla" && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: isActive ? "rgba(255,255,255,0.9)" : "#a78bfa",
                        }}
                      >
                        {storeCategories.find((c) => c.category === cat)?.count ?? 0}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {toast && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 18,
            transform: "translateX(-50%)",
            zIndex: 1000,
            background: "rgba(17, 24, 39, 0.92)",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
            maxWidth: "90vw",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 20px 8px" }}>
        <h1 style={{ margin: 0, fontSize: 22, color: "#1e1b4b", fontWeight: 800 }}>
          {h1}
        </h1>
        <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 14, maxWidth: 860 }}>
          {desc}
        </p>
      </section>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "8px 20px 8px" }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center", justifyContent: "center" }}>
          {(["discount", "cheapest", "expensive"] as SortOption[]).map((option) => (
            <button
              key={option}
              className={`sort-option ${sortBy === option ? "active" : ""}`}
              onClick={() => setSortBy(option)}
            >
              {sortLabels[option]}
            </button>
          ))}
        </div>

        <p
          className="sort-bar-count"
          style={{
            fontSize: 13,
            color: "#9ca3af",
            margin: "10px 0 0",
            textAlign: "center",
          }}
        >
          <span style={{ fontWeight: 600, color: "#7e22ce" }}>
            {filteredDeals.length}
          </span>{" "}
          affiliatedeals hittades
          {lastUpdated && (
            <>
              {" · "}
              <span className="update-dot" /> uppdaterad {timeAgo(lastUpdated)} sedan
            </>
          )}
        </p>
      </section>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 20px 80px" }}>
        <div className="deal-grid">
          {visibleDeals.map((deal) => {
            const storeConfig = STORE_CONFIG[deal.store] || {
              emoji: "🏪",
              color: "#a855f7",
            };
            return (
              <a
                key={`${deal.store}|${deal.id}`}
                href={deal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="deal-link"
                onClick={() => {
                  track("outbound_click", {
                    link_url: deal.url,
                    store: deal.store,
                    category: deal.category,
                    deal_id: deal.id,
                    discount: deal.discount,
                    price: deal.price,
                  });
                  showToast(`Öppnar deal hos ${formatStoreName(deal.store)}…`);
                }}
              >
                <article
                  className="deal-card"
                  style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    border: "1px solid #ede9fe",
                    background: "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    boxShadow: "0 2px 12px rgba(168, 85, 247, 0.06)",
                    height: "100%",
                  }}
                >
                  <div className="card-image" style={{ position: "relative", overflow: "hidden" }}>
                    <DealCardImage
                      key={`${deal.image}|${(deal.imageFallbacks || []).join("|")}`}
                      deal={deal}
                      placeholderEmoji={storeConfig.emoji}
                    />
                    <span
                      className="card-badge gradient-badge"
                      style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        color: "#ffffff",
                        fontWeight: 700,
                        borderRadius: 100,
                      }}
                    >
                      {deal.discount}
                    </span>
                  </div>
                  <div
                    className="card-info"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                      <p
                        className="card-brand"
                        style={{
                          fontWeight: 600,
                          color: "#a78bfa",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          margin: 0,
                          fontSize: 11,
                        }}
                      >
                        {deal.brand}
                      </p>
                      <span className="card-store" style={{ color: storeConfig.color }}>
                        • {formatStoreName(deal.store)}
                      </span>
                    </div>
                    <h3
                      className="card-title"
                      style={{
                        fontWeight: 600,
                        color: "#1e1b4b",
                        margin: "4px 0 0",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {deal.title}
                    </h3>
                    {(deal.price > 0 || deal.originalPrice > 0) && (
                      <div
                        className="mobile-price-wrap"
                        style={{
                          marginTop: 8,
                          display: "flex",
                          alignItems: "baseline",
                          gap: 5,
                        }}
                      >
                        {deal.price > 0 && (
                          <span
                            className="card-price"
                            style={{
                              fontWeight: 700,
                              color: "#7e22ce",
                              fontSize: 16,
                            }}
                          >
                            {formatPrice(deal.price)}
                          </span>
                        )}
                        {deal.originalPrice > 0 && deal.originalPrice !== deal.price && (
                          <span
                            className="card-original"
                            style={{
                              color: "#c4b5fd",
                              textDecoration: "line-through",
                              fontSize: 13,
                            }}
                          >
                            {formatPrice(deal.originalPrice)}
                          </span>
                        )}
                      </div>
                    )}
                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "7px 10px",
                          borderRadius: 999,
                          background: "linear-gradient(135deg, rgba(168, 85, 247, 0.14), rgba(236, 72, 153, 0.12))",
                          border: "1px solid rgba(168, 85, 247, 0.22)",
                          color: "#6d28d9",
                          fontSize: 12,
                          fontWeight: 700,
                          width: "fit-content",
                        }}
                      >
                        Öppna deal <span aria-hidden="true">→</span>
                      </span>
                    </div>
                    <p
                      className="card-time"
                      style={{
                        color: "#a78bfa",
                        margin: "6px 0 0",
                        fontSize: 12,
                      }}
                    >
                      {timeAgo(deal.firstSeen)} sedan
                    </p>
                  </div>
                </article>
              </a>
            );
          })}
        </div>

        {hasMore && (
          <div className="load-more-spinner">
            <div className="load-more-dot" />
            <div className="load-more-dot" />
            <div className="load-more-dot" />
            <span style={{ fontSize: 13, marginLeft: 4 }}>Scrolla för fler deals...</span>
          </div>
        )}

        {!hasMore && allDeals.length > 0 && visibleDeals.length > 0 && (
          <p
            style={{
              textAlign: "center",
              padding: "24px",
              color: "#c4b5fd",
              fontSize: 13,
            }}
          >
            ✨ Du har sett alla {filteredDeals.length} affiliatedeals!
          </p>
        )}

        {!loading && filteredDeals.length === 0 && allDeals.length > 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#a78bfa" }}>
            <p style={{ fontSize: 40, margin: 0 }}>🔍</p>
            <p style={{ fontSize: 16, fontWeight: 600 }}>Inga deals hittades</p>
            <p style={{ fontSize: 14 }}>Prova en annan butik, kategori eller sökterm</p>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#a78bfa" }}>
            <p style={{ fontSize: 40, margin: 0 }}>⏳</p>
            <p style={{ fontSize: 16, fontWeight: 600 }}>Laddar deals...</p>
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#f43f5e" }}>
            <p style={{ fontSize: 40, margin: 0 }}>⚠️</p>
            <p style={{ fontSize: 16, fontWeight: 600 }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 12,
                padding: "8px 20px",
                borderRadius: 100,
                border: "none",
                background: "linear-gradient(135deg, #a855f7, #ec4899)",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Försök igen
            </button>
          </div>
        )}
      </section>

      <footer style={{ borderTop: "1px solid #ede9fe", padding: "24px 0", background: "#faf8ff" }}>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 13, color: "#a78bfa" }}>© 2026 Dealable</span>
          <span style={{ fontSize: 12, color: "#c4b5fd" }}>
            Innehåller affiliatelänkar från{" "}
            {stores.length > 0 ? stores.map((s) => formatStoreName(s)).join(", ") : "våra partners"}.
          </span>
          <span style={{ fontSize: 13, color: "#a78bfa" }}>Made in Stockholm 🇸🇪</span>
        </div>
      </footer>
    </div>
  );
}

