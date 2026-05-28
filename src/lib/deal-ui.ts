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
};

function dealTrendingKey(deal: Deal): string {
  return `${deal.store}|${deal.id}`;
}

/** Max 10 % of products per store get the Trendar badge (highest discount / hot first). */
export function computeTrendingDealKeys(deals: Deal[]): Set<string> {
  const byStore = new Map<string, Deal[]>();
  for (const d of deals) {
    const list = byStore.get(d.store) ?? [];
    list.push(d);
    byStore.set(d.store, list);
  }

  const trending = new Set<string>();
  for (const storeDeals of byStore.values()) {
    const maxCount = Math.floor(storeDeals.length * 0.1);
    if (maxCount <= 0) continue;

    const ranked = [...storeDeals].sort((a, b) => {
      const hotDiff = (b.hot ? 1 : 0) - (a.hot ? 1 : 0);
      if (hotDiff !== 0) return hotDiff;
      const discountDiff = parseDiscountValue(b.discount) - parseDiscountValue(a.discount);
      if (discountDiff !== 0) return discountDiff;
      return hashId(dealTrendingKey(a)) - hashId(dealTrendingKey(b));
    });

    for (let i = 0; i < maxCount && i < ranked.length; i++) {
      trending.add(dealTrendingKey(ranked[i]!));
    }
  }

  return trending;
}

export function getDealTrustSignals(
  deal: Deal,
  feedUpdatedAt: string,
  options?: { trending?: boolean }
): DealTrustSignals {
  const h = hashId(dealTrendingKey(deal));
  const discount = parseDiscountValue(deal.discount);
  const trending = options?.trending ?? false;

  let urgency: DealTrustSignals["urgency"] = null;
  if (h % 19 === 0) urgency = "few_left";
  else if (discount >= 25 && h % 13 === 0) urgency = "ending_soon";

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
