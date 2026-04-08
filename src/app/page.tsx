"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import type { Deal } from "@/lib/scraper";
import { timeAgo, formatPrice, parseDiscountValue } from "@/lib/scraper";

// ─── Featured brand type ───
interface FeaturedBrand {
  id: string;
  name: string;
  tagline: string;
  category: string;
  color1: string;
  color2: string;
  emoji: string;
  url: string;
}

// ─── Category config med emojis ───
const CATEGORY_EMOJIS: Record<string, string> = {
  "Alla": "✨",
  "Padelracketar": "🏸",
  "Bollar": "🎾",
  "Skor": "👟",
  "Kläder": "👕",
  "Väskor": "🎒",
  "Tillbehör": "🎯",
  "Skydd": "🛡️",
  "Övrigt": "📦",
};

type SortOption = "popular" | "latest" | "discount";

function parseTimeAgoMinutes(dateStr: string): number {
  const now = new Date();
  const date = new Date(dateStr);
  return Math.floor((now.getTime() - date.getTime()) / 60000);
}

export default function Home() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [categories, setCategories] = useState<string[]>(["Alla"]);
  const [stores, setStores] = useState<string[]>([]);
  const [featuredBrands, setFeaturedBrands] = useState<FeaturedBrand[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState("Alla");
  const [activeStore, setActiveStore] = useState("Alla");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDeals() {
      try {
        setLoading(true);
        const res = await fetch("/api/deals");
        if (!res.ok) throw new Error("Kunde inte hämta deals");
        const data = await res.json();

        setDeals(data.deals);
        setCategories(data.categories);
        setStores(data.stores);
        setLastUpdated(data.lastUpdated);
        setError(null);
      } catch (err) {
        console.error("Failed to load deals:", err);
        setError("Kunde inte ladda deals. Försök igen senare.");
      } finally {
        setLoading(false);
      }
    }

    loadDeals();
  }, []);

  // ─── Filter ───
  let filtered =
    activeCategory === "Alla"
      ? [...deals]
      : deals.filter((d) => d.category === activeCategory);

  if (activeStore !== "Alla") {
    filtered = filtered.filter((d) => d.store === activeStore);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.brand.toLowerCase().includes(q) ||
        d.store.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
    );
  }

  // ─── Sort ───
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "popular") {
      if (a.hot !== b.hot) return a.hot ? -1 : 1;
      return parseTimeAgoMinutes(a.firstSeen) - parseTimeAgoMinutes(b.firstSeen);
    }
    if (sortBy === "latest") {
      return parseTimeAgoMinutes(a.firstSeen) - parseTimeAgoMinutes(b.firstSeen);
    }
    if (sortBy === "discount") {
      return parseDiscountValue(b.discount) - parseDiscountValue(a.discount);
    }
    return 0;
  });

  const sortLabels: Record<SortOption, string> = {
    popular: "Populärt 🔥",
    latest: "Senaste 🕐",
    discount: "Rabatt 💸",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#faf8ff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Quicksand:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        .logo-text {
          font-family: 'Fredoka', sans-serif;
          font-weight: 700;
          background: linear-gradient(135deg, #a855f7, #ec4899, #f43f5e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .sticky-header {
          position: -webkit-sticky;
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(250, 248, 255, 0.85);
          -webkit-backdrop-filter: blur(20px);
          backdrop-filter: blur(20px);
        }

        .cat-btn {
          font-family: 'Quicksand', sans-serif !important;
          font-weight: 600 !important;
        }

        @media (hover: hover) and (pointer: fine) {
          .deal-card:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 30px rgba(168, 85, 247, 0.15) !important;
          }
          .featured-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.18) !important;
          }
        }

        .deal-card, .featured-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .deal-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }

        .deal-link {
          text-decoration: none;
          color: inherit;
          display: block;
          min-width: 0;
          overflow: hidden;
        }

        .deal-card { flex-direction: row; }
        .deal-card .card-image { width: 110px; min-width: 110px; min-height: 110px; }
        .deal-card .card-info { padding: 14px; }
        .deal-card .card-brand { font-size: 11px; }
        .deal-card .card-title { font-size: 15px; }
        .deal-card .card-price { font-size: 16px; }
        .deal-card .card-original { font-size: 13px; }
        .deal-card .card-time { font-size: 12px; }
        .deal-card .card-badge { font-size: 11px; padding: 2px 7px; }
        .card-image-spacer { display: none; }
        .card-store { font-size: 10px; color: #a78bfa; font-weight: 500; }

        /* ─── Featured grid ─── */
        .featured-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .featured-card {
          border-radius: 20px;
          padding: 28px 24px;
          color: #fff;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 180px;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
        }
        .featured-card .fc-emoji {
          font-size: 40px;
          margin-bottom: 12px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }
        .featured-card .fc-name {
          font-family: 'Fredoka', sans-serif;
          font-weight: 700;
          font-size: 24px;
          margin: 0;
          text-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        .featured-card .fc-tagline {
          font-family: 'Quicksand', sans-serif;
          font-size: 14px;
          font-weight: 600;
          margin: 6px 0 0;
          opacity: 0.92;
        }
        .featured-card .fc-cat {
          font-family: 'Quicksand', sans-serif;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          opacity: 0.7;
          margin-top: 14px;
        }
        .featured-card .fc-arrow {
          position: absolute;
          bottom: 20px;
          right: 20px;
          width: 32px;
          height: 32px;
          background: rgba(255,255,255,0.25);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          backdrop-filter: blur(4px);
        }
        .featured-card::after {
          content: '';
          position: absolute;
          top: -30%;
          right: -20%;
          width: 200px;
          height: 200px;
          background: rgba(255,255,255,0.08);
          border-radius: 50%;
          pointer-events: none;
        }

        .sort-option {
          font-family: 'Quicksand', sans-serif;
          cursor: pointer; padding: 4px 10px; border-radius: 100px;
          border: none; background: none; font-size: 14px;
          color: #9ca3af; font-weight: 600; transition: all 0.2s;
        }
        .sort-option:hover { background: #f3e8ff; color: #a855f7; }
        .sort-option.active {
          background: linear-gradient(135deg, #a855f7, #ec4899);
          color: #fff;
        }

        .store-select {
          font-family: 'Quicksand', sans-serif;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 100px;
          border: 1.5px solid #e9d5ff;
          background: #f5f3ff;
          color: #7e22ce;
          cursor: pointer;
          outline: none;
          transition: all 0.2s;
        }
        .store-select:focus {
          border-color: #c084fc;
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.15);
        }

        .gradient-badge {
          background: linear-gradient(135deg, #a855f7, #ec4899) !important;
        }

        .search-input:focus {
          border-color: #c084fc !important;
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.15);
        }

        .cat-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .cat-scroll::-webkit-scrollbar { display: none; }

        .update-badge {
          font-size: 11px; color: #a78bfa; font-weight: 500;
          display: flex; align-items: center; gap: 4px;
        }
        .update-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #34d399; display: inline-block;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @media (max-width: 640px) {
          .featured-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .featured-card {
            min-height: 140px !important;
            padding: 20px 18px !important;
            flex-direction: row !important;
            align-items: center !important;
            gap: 16px;
          }
          .featured-card .fc-emoji { font-size: 32px; margin-bottom: 0; }
          .featured-card .fc-name { font-size: 19px; }
          .featured-card .fc-tagline { font-size: 12px; }
          .featured-card .fc-cat { margin-top: 8px; font-size: 10px; }
          .featured-card .fc-arrow { bottom: 14px; right: 14px; width: 28px; height: 28px; font-size: 14px; }
          .featured-card .fc-text-wrap { flex: 1; }

          .deal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .deal-card { flex-direction: column !important; }
          .deal-card .card-image { width: 100% !important; min-width: 0 !important; min-height: 0 !important; height: auto !important; }
          .card-image-spacer { display: block !important; width: 100%; padding-bottom: 85%; }
          .deal-card .card-info { padding: 8px 10px 10px; }
          .deal-card .card-brand { font-size: 9px; }
          .deal-card .card-title { font-size: 12px; }
          .deal-card .card-price { font-size: 13px; }
          .deal-card .card-original { font-size: 10px; }
          .deal-card .card-time { font-size: 10px; }
          .deal-card .card-badge { font-size: 9px; padding: 2px 5px; }
          .mobile-nav-title { font-size: 17px !important; }
          .mobile-search { font-size: 12px !important; padding: 6px 12px !important; }
          .cat-btn { font-size: 12px !important; padding: 6px 10px !important; }
          .cat-scroll { justify-content: flex-start !important; flex-wrap: nowrap !important; }
          .sort-bar-inner { flex-direction: row !important; flex-wrap: nowrap !important; }
          .sort-bar-count { font-size: 12px !important; white-space: nowrap !important; }
          .sort-option { font-size: 11px !important; padding: 3px 7px !important; white-space: nowrap !important; }
        }
      `}</style>

      {/* ━━ STICKY HEADER ━━ */}
      <header className="sticky-header">
        <nav style={{ borderBottom: "1px solid #ede9fe" }}>
          <div style={{
            maxWidth: 1100, margin: "0 auto", padding: "0 20px",
            height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span className="logo-text mobile-nav-title" style={{ fontSize: 22, letterSpacing: "-0.5px" }}>
              dealable
            </span>
            <div style={{ flex: 1, maxWidth: 360, margin: "0 24px" }}>
              <input
                type="text"
                placeholder="🔍  Sök deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mobile-search search-input"
                style={{
                  width: "100%", background: "#f5f3ff",
                  border: "1.5px solid #e9d5ff", borderRadius: 100,
                  padding: "8px 16px", fontSize: 14, color: "#581c87",
                  outline: "none", transition: "all 0.2s",
                }}
              />
            </div>
            {/* ─── Butik-filter ─── */}
            {stores.length > 1 && (
              <select
                className="store-select"
                value={activeStore}
                onChange={(e) => setActiveStore(e.target.value)}
              >
                <option value="Alla">Alla butiker</option>
                {stores.map((store) => (
                  <option key={store} value={store}>{store}</option>
                ))}
              </select>
            )}
          </div>
        </nav>

        <div style={{ borderBottom: "1px solid #ede9fe" }}>
          <div className="cat-scroll" style={{
            maxWidth: 1100, margin: "0 auto", padding: "12px 20px",
            display: "flex", gap: 6,
            overflowX: "auto", flexWrap: "nowrap",
          }}>
            {categories.map((cat) => (
              <button
                key={cat}
                className="cat-btn"
                onClick={() => setActiveCategory(cat)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "8px 14px", borderRadius: 100, border: "none",
                  fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                  background: activeCategory === cat
                    ? "linear-gradient(135deg, #a855f7, #ec4899)"
                    : "#f3e8ff",
                  color: activeCategory === cat ? "#fff" : "#7e22ce",
                  transition: "all 0.2s",
                }}
              >
                <span>{CATEGORY_EMOJIS[cat] || "📦"}</span>
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ━━ FEATURED BRANDS ━━ */}
      {featuredBrands.length > 0 && activeCategory === "Alla" && !searchQuery && (
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 8px" }}>
          <div className="featured-grid">
            {featuredBrands.map((brand) => (
              <a
                key={brand.id}
                href={brand.url}
                target="_blank"
                rel="noopener noreferrer"
                className="featured-card"
                style={{
                  background: `linear-gradient(135deg, ${brand.color1}, ${brand.color2})`,
                }}
              >
                <div className="fc-text-wrap">
                  <div className="fc-emoji">{brand.emoji}</div>
                  <p className="fc-name">{brand.name}</p>
                  <p className="fc-tagline">{brand.tagline}</p>
                  <p className="fc-cat">{brand.category}</p>
                </div>
                <span className="fc-arrow">→</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ━━ SORT BAR ━━ */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 20px 8px" }}>
        <div className="sort-bar-inner" style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <p className="sort-bar-count" style={{ fontSize: 14, color: "#9ca3af", margin: 0, whiteSpace: "nowrap" }}>
              <span style={{ fontWeight: 600, color: "#7e22ce" }}>{sorted.length}</span> deals
            </p>
            {lastUpdated && (
              <span className="update-badge">
                <span className="update-dot" />
                Uppdaterad {timeAgo(lastUpdated)} sedan
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
            {(["popular", "latest", "discount"] as SortOption[]).map((option) => (
              <button
                key={option}
                className={`sort-option ${sortBy === option ? "active" : ""}`}
                onClick={() => setSortBy(option)}
              >
                {sortLabels[option]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ━━ DEAL GRID ━━ */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 20px 80px" }}>
        <div className="deal-grid">
          {sorted.map((deal) => (
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
                  borderRadius: 16, overflow: "hidden",
                  border: "1px solid #ede9fe", background: "#ffffff",
                  cursor: "pointer", display: "flex",
                  boxShadow: "0 2px 12px rgba(168, 85, 247, 0.06)",
                  height: "100%",
                }}
              >
                <div className="card-image" style={{
                  position: "relative", background: "#f5f3ff", overflow: "hidden",
                }}>
                  <div className="card-image-spacer" />
                  <Image
                    src={deal.image}
                    alt={deal.title}
                    fill
                    sizes="(max-width: 640px) 50vw, 140px"
                    style={{ objectFit: "cover" }}
                  />
                  <span className="card-badge gradient-badge" style={{
                    position: "absolute", top: 8, left: 8,
                    color: "#ffffff", fontWeight: 700, borderRadius: 100,
                  }}>
                    {deal.discount}
                  </span>
                </div>

                <div className="card-info" style={{
                  display: "flex", flexDirection: "column",
                  justifyContent: "center", flex: 1, minWidth: 0,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                    <p className="card-brand" style={{
                      fontWeight: 600, color: "#a78bfa",
                      textTransform: "uppercase", letterSpacing: "0.5px", margin: 0,
                      fontSize: 11,
                    }}>
                      {deal.brand}
                    </p>
                    {deal.hot && <span style={{ fontSize: 11 }}>🔥</span>}
                    <span className="card-store">• {deal.store}</span>
                  </div>

                  <h3 className="card-title" style={{
                    fontWeight: 600, color: "#1e1b4b", margin: "4px 0 0",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {deal.title}
                  </h3>

                  {(deal.price > 0 || deal.originalPrice > 0) && (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 5 }}>
                      {deal.price > 0 && (
                        <span className="card-price" style={{ fontWeight: 700, color: "#7e22ce", fontSize: 16 }}>
                          {formatPrice(deal.price)}
                        </span>
                      )}
                      {deal.originalPrice > 0 && deal.originalPrice !== deal.price && (
                        <span className="card-original" style={{ color: "#c4b5fd", textDecoration: "line-through", fontSize: 13 }}>
                          {formatPrice(deal.originalPrice)}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="card-time" style={{ color: "#a78bfa", margin: "6px 0 0", fontSize: 12 }}>
                    {timeAgo(deal.firstSeen)} sedan
                  </p>
                </div>
              </article>
            </a>
          ))}
        </div>

        {/* ─── Empty states ─── */}
        {!loading && sorted.length === 0 && deals.length > 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#a78bfa" }}>
            <p style={{ fontSize: 40, margin: 0 }}>🔍</p>
            <p style={{ fontSize: 16, fontWeight: 600 }}>Inga deals hittades</p>
            <p style={{ fontSize: 14 }}>Prova en annan kategori eller sökterm</p>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#a78bfa" }}>
            <p style={{ fontSize: 40, margin: 0 }}>⏳</p>
            <p style={{ fontSize: 16, fontWeight: 600 }}>Laddar deals...</p>
            <p style={{ fontSize: 14 }}>Första laddningen kan ta några sekunder</p>
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#f43f5e" }}>
            <p style={{ fontSize: 40, margin: 0 }}>⚠️</p>
            <p style={{ fontSize: 16, fontWeight: 600 }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 12, padding: "8px 20px", borderRadius: 100,
                border: "none", background: "linear-gradient(135deg, #a855f7, #ec4899)",
                color: "#fff", fontWeight: 600, cursor: "pointer",
              }}
            >
              Försök igen
            </button>
          </div>
        )}
      </section>

      {/* ━━ FOOTER ━━ */}
      <footer style={{ borderTop: "1px solid #ede9fe", padding: "24px 0", background: "#faf8ff" }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto", padding: "0 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 8,
        }}>
          <span style={{ fontSize: 13, color: "#a78bfa" }}>© 2026 Dealable</span>
          <span style={{ fontSize: 12, color: "#c4b5fd" }}>
            Sidan innehåller affiliatelänkar från {stores.length > 0 ? stores.join(", ") : "Padel Market"}.
          </span>
          <span style={{ fontSize: 13, color: "#a78bfa" }}>Made in Stockholm 🇸🇪</span>
        </div>
      </footer>
    </div>
  );
}