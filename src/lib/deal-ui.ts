import type { Deal } from "@/lib/scraper";
import { parseDiscountValue } from "@/lib/scraper";

export const SEARCH_PLACEHOLDERS = [
  "Sök Nike skor…",
  "Hitta Dyson rea…",
  "Sök soffa Homeroom…",
  "Upptäck Outnorth jackor…",
];

export const TRENDING_SEARCHES = [
  "Jotex",
  "Outnorth",
  "Samsung",
  "Homeroom",
  "Nelly",
  "Dyson",
];

function hashId(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export type DealTrustSignals = {
  verifiedToday: boolean;
  updatedLabel: string;
  urgency: "few_left" | "ending_soon" | null;
  trending: boolean;
  clickCount: number;
};

export function getDealTrustSignals(
  deal: Deal,
  feedUpdatedAt: string
): DealTrustSignals {
  const h = hashId(`${deal.store}|${deal.id}`);
  const discount = parseDiscountValue(deal.discount);
  const trending = Boolean(deal.hot) || discount >= 35 || h % 11 === 0;

  let urgency: DealTrustSignals["urgency"] = null;
  if (h % 19 === 0) urgency = "few_left";
  else if (discount >= 25 && h % 13 === 0) urgency = "ending_soon";

  const clickCount = 8 + (h % 76);

  let verifiedToday = false;
  let updatedLabel = "";
  if (feedUpdatedAt) {
    const updated = new Date(feedUpdatedAt);
    const now = new Date();
    verifiedToday =
      updated.getUTCFullYear() === now.getUTCFullYear() &&
      updated.getUTCMonth() === now.getUTCMonth() &&
      updated.getUTCDate() === now.getUTCDate();
    const diffMin = Math.max(1, Math.floor((now.getTime() - updated.getTime()) / 60000));
    if (diffMin < 60) updatedLabel = `Uppdaterad ${diffMin} min sedan`;
    else if (diffMin < 24 * 60) updatedLabel = `Uppdaterad ${Math.floor(diffMin / 60)} h sedan`;
    else updatedLabel = "Uppdaterad idag";
  }

  return {
    verifiedToday,
    updatedLabel,
    urgency,
    trending,
    clickCount,
  };
}

export type FeedInsertVariant = "hero" | "editorial" | "best-today";

export type FeedItem =
  | { kind: "deal"; deal: Deal; index: number }
  | { kind: "insert"; deal: Deal; variant: FeedInsertVariant; index: number };

const INSERT_EVERY = 7;
const INSERT_OFFSET = 6;

export function buildFeedItems(deals: Deal[]): FeedItem[] {
  if (deals.length === 0) return [];

  const bestToday = [...deals].sort(
    (a, b) => parseDiscountValue(b.discount) - parseDiscountValue(a.discount)
  )[0];

  const items: FeedItem[] = [];
  const variants: FeedInsertVariant[] = ["best-today", "hero", "editorial"];
  let insertIdx = 0;

  deals.forEach((deal, i) => {
    items.push({ kind: "deal", deal, index: i });

    const cardNumber = i + 1;
    if (cardNumber >= INSERT_OFFSET && (cardNumber - INSERT_OFFSET) % INSERT_EVERY === 0 && insertIdx < 8) {
      const variant = variants[insertIdx % variants.length];
      items.push({
        kind: "insert",
        deal: variant === "best-today" ? bestToday : deal,
        variant,
        index: insertIdx,
      });
      insertIdx++;
    }
  });

  return items;
}

export const RECENT_SEARCHES_KEY = "dealable_recent_searches";

export function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string) {
  const q = query.trim();
  if (!q || typeof window === "undefined") return;
  const prev = loadRecentSearches().filter((s) => s.toLowerCase() !== q.toLowerCase());
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([q, ...prev].slice(0, 5)));
}
