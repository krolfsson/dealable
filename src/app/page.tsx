"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Deal } from "@/lib/scraper";
import { timeAgo, formatPrice, parseDiscountValue } from "@/lib/scraper";

const STORE_CONFIG: Record<string, { emoji: string; color: string }> = {
  Alla: { emoji: "✨", color: "#a855f7" },
  "Padel Market": { emoji: "🏸", color: "#7c3aed" },
  "Nelly SE": { emoji: "👗", color: "#ec4899" },
  "NLY Man SE": { emoji: "👔", color: "#3b82f6" },
  "Outnorth SE": { emoji: "⛰️", color: "#059669" },
};

type SortOption = "discount" | "cheapest" | "expensive";
type DiscountFilter = "all" | "25" | "50";

const PAGE_SIZE = 60;

export default function Home() {
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [stores, setStores] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [activeStore, setActiveStore] = useState("Alla");
  const [sortBy, setSortBy] = useState<SortOption>("discount");
  const [minDiscount, setMinDiscount] = useState<DiscountFilter>("all");
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
      setStores(meta.stores || []);
      setLastUpdated(meta.lastUpdated || "");

      // 2. Load first chunk (fast, ~1 MB)
      const firstRes = await fetch("/cache/deals-0.json");
      if (!firstRes.ok) throw new Error("Kunde inte hämta deals");
      const firstChunk = await firstRes.json();
      setAllDeals(firstChunk);
      setError(null);
      setLoading(false);

      // 3. Load remaining chunks in background
      if (meta.totalChunks > 1) {
        const remaining: any[] = [];
        const fetches = [];
        for (let i = 1; i < meta.totalChunks; i++) {
          fetches.push(
            fetch(`/cache/deals-${i}.json`)
              .then(r => r.json())
              .then(chunk => { remaining.push(...chunk); })
          );
        }
        await Promise.all(fetches);
        setAllDeals(prev => [...prev, ...remaining]);
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

  // Client-side filter + sort (all computed from allDeals)
  const filteredDeals = useMemo(() => {
    let result = allDeals;

    // Filter by store
    if (activeStore !== "Alla") {
      result = result.filter((d) => d.store === activeStore);
    }

    // Filter by search
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

    // Filter by min discount
    if (minDiscount !== "all") {
      const min = parseInt(minDiscount);
      result = result.filter((d) => {
        const disc = parseDiscountValue(d.discount);
        return disc >= min;
      });
    }

    // Sort
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
  }, [allDeals, activeStore, debouncedSearch, minDiscount, sortBy]);

  const visibleDeals = filteredDeals.slice(0, visibleCount);
  const hasMore = visibleCount < filteredDeals.length;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeStore, debouncedSearch, minDiscount, sortBy]);

  // Infinite scroll
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

  // Pull-to-refresh
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

  const discountLabels: Record<DiscountFilter, string> = {
    all: "Alla 🏷️",
    "25": ">25% 🔥",
    "50": ">50% 🤯",
  };

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const storeButtons = ["Alla", ...stores];

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
        .deal-card .card-image { width: 120px; min-width: 120px; min-height: 120px; padding: 16px; background: #ffffff; }
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
        .update-badge { font-size: 11px; color: #a78bfa; font-weight: 500; display: inline-flex; align-items: center; gap: 4px; }
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
          .deal-card { flex-direction: column !important; }
          .deal-card .card-image { width: 100% !important; min-width: 0 !important; min-height: 0 !important; height: auto !important; padding: 8px !important; }
          .card-image-spacer { display: block !important; width: 100%; padding-bottom: 65%; }
          .deal-card .card-info { padding: 8px 10px 10px; }
          .deal-card .card-brand { font-size: 9px; }
          .deal-card .card-title { font-size: 12px; }
          .deal-card .card-price { font-size: 13px; }
          .deal-card .card-original { font-size: 10px; }
          .deal-card .card-time { font-size: 10px; }
          .deal-card .card-badge { font-size: 9px; padding: 2px 5px; }
          .mobile-nav-title { font-size: 17px !important; }
          .mobile-search { font-size: 12px !important; padding: 6px 12px !important; }
          .store-btn { font-size: 12px !important; padding: 8px 12px !important; }
          .store-scroll { justify-content: flex-start !important; flex-wrap: nowrap !important; }
          .sort-bar-count { font-size: 11px !important; }
          .sort-option { font-size: 11px !important; padding: 3px 7px !important; white-space: nowrap !important; }
          .filter-option { font-size: 11px !important; padding: 3px 7px !important; white-space: nowrap !important; }
          .filter-row { gap: 4px !important; }
        }
      `,
        }}
      />

      {/* Pull-to-refresh */}
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

      {/* Header */}
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

        {/* Store buttons */}
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
              const isActive = activeStore === store;
              return (
                <button
                  key={store}
                  className="store-btn"
                  onClick={() => setActiveStore(store)}
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${config.color}, ${config.color}dd)`
                      : "#f3e8ff",
                    color: isActive ? "#fff" : "#7e22ce",
                    boxShadow: isActive
                      ? `0 4px 15px ${config.color}40`
                      : "none",
                  }}
                >
                  <span>{config.emoji}</span>
                  <span>
                    {store === "Alla"
                      ? "Alla butiker"
                      : store.replace(" SE", "")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Sort & filter bar */}
      <section
        style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 20px 8px" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {(["discount", "cheapest", "expensive"] as SortOption[]).map(
              (option) => (
                <button
                  key={option}
                  className={`sort-option ${sortBy === option ? "active" : ""}`}
                  onClick={() => setSortBy(option)}
                >
                  {sortLabels[option]}
                </button>
              )
            )}
          </div>

          <div
            className="filter-row"
            style={{ display: "flex", gap: 6, alignItems: "center" }}
          >
            {(["all", "25", "50"] as DiscountFilter[]).map((option) => (
              <button
                key={option}
                className={`filter-option ${minDiscount === option ? "active" : ""}`}
                onClick={() => setMinDiscount(option)}
              >
                {discountLabels[option]}
              </button>
            ))}
          </div>

          <p
            className="sort-bar-count"
            style={{
              fontSize: 13,
              color: "#9ca3af",
              margin: 0,
              textAlign: "center",
            }}
          >
            <span style={{ fontWeight: 600, color: "#7e22ce" }}>
              {filteredDeals.length}
            </span>{" "}
            deals
            {minDiscount === "25"
              ? " med >25% rabatt"
              : minDiscount === "50"
                ? " med >50% rabatt"
                : " med minst 20% rabatt"}
            {lastUpdated && (
              <span className="update-badge">
                {" "}
                <span className="update-dot" /> {timeAgo(lastUpdated)} sedan
              </span>
            )}
          </p>
        </div>
      </section>

      {/* Deal grid */}
      <section
        style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 20px 80px" }}
      >
        <div className="deal-grid">
          {visibleDeals.map((deal) => {
            const storeConfig = STORE_CONFIG[deal.store] || {
              emoji: "🏪",
              color: "#a855f7",
            };
            return (
              <a
                key={deal.id}
                href={deal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="deal-link"
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
                  <div
                    className="card-image"
                    style={{ position: "relative", overflow: "hidden" }}
                  >
                    <div className="card-image-spacer" />
                    {deal.image ? (
                      <Image
                        src={deal.image}
                        alt={deal.title}
                        fill
                        sizes="(max-width: 640px) 50vw, 140px"
                        style={{ objectFit: "contain" }}
                      />
                    ) : (
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
                        {storeConfig.emoji}
                      </div>
                    )}
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
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        flexWrap: "wrap",
                      }}
                    >
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
                      <span
                        className="card-store"
                        style={{ color: storeConfig.color }}
                      >
                        • {deal.store.replace(" SE", "")}
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
                        {deal.originalPrice > 0 &&
                          deal.originalPrice !== deal.price && (
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

        {/* Loading more indicator */}
        {hasMore && (
          <div className="load-more-spinner">
            <div className="load-more-dot" />
            <div className="load-more-dot" />
            <div className="load-more-dot" />
            <span style={{ fontSize: 13, marginLeft: 4 }}>
              Scrolla för fler deals...
            </span>
          </div>
        )}

        {/* All loaded */}
        {!hasMore && allDeals.length > 0 && visibleDeals.length > 0 && (
          <p
            style={{
              textAlign: "center",
              padding: "24px",
              color: "#c4b5fd",
              fontSize: 13,
            }}
          >
            ✨ Du har sett alla {filteredDeals.length} deals!
          </p>
        )}

        {/* Empty state */}
        {!loading && filteredDeals.length === 0 && allDeals.length > 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#a78bfa",
            }}
          >
            <p style={{ fontSize: 40, margin: 0 }}>🔍</p>
            <p style={{ fontSize: 16, fontWeight: 600 }}>
              Inga deals hittades
            </p>
            <p style={{ fontSize: 14 }}>
              Prova en annan butik eller sökterm
            </p>
          </div>
        )}

        {/* Initial loading */}
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#a78bfa",
            }}
          >
            <p style={{ fontSize: 40, margin: 0 }}>⏳</p>
            <p style={{ fontSize: 16, fontWeight: 600 }}>Laddar deals...</p>
          </div>
        )}

        {error && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#f43f5e",
            }}
          >
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

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #ede9fe",
          padding: "24px 0",
          background: "#faf8ff",
        }}
      >
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
          <span style={{ fontSize: 13, color: "#a78bfa" }}>
            © 2026 Dealable
          </span>
          <span style={{ fontSize: 12, color: "#c4b5fd" }}>
            Innehåller affiliatelänkar från{" "}
            {stores.length > 0
              ? stores.map((s) => s.replace(" SE", "")).join(", ")
              : "våra partners"}
            .
          </span>
          <span style={{ fontSize: 13, color: "#a78bfa" }}>
            Made in Stockholm 🇸🇪
          </span>
        </div>
      </footer>
    </div>
  );
}
