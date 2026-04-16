// src/lib/scraper.ts
// Type definitions and helpers for deal scraping

export interface Deal {
  id: number;
  title: string;
  brand: string;
  store: string;
  price: number;
  originalPrice: number;
  discount: string;
  category: string;
  image: string;
  /** Extra Awin image URLs (thumb / alternates) used if the primary image fails to load */
  imageFallbacks?: string[];
  url: string;
  couponCode?: string;
  hot: boolean;
  firstSeen: string;
}

export interface DealsData {
  lastUpdated: string;
  deals: Deal[];
}

/**
 * Calculate time-ago string from a date
 */
export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 60) return `${Math.max(1, diffMin)}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

/**
 * Format SEK price
 */
export function formatPrice(price: number): string {
  if (price === 0) return "";
  return price.toLocaleString("sv-SE") + " kr";
}

/**
 * Parse discount for sorting (returns absolute number)
 */
export function parseDiscountValue(discount: string): number {
  const num = parseInt(discount.replace(/[^0-9]/g, ""));
  return isNaN(num) ? 0 : num;
}
/**
 * Upgrade Productserve image URLs to higher resolution
 */
export function getHiResImage(url: string, w = 640, h = 640): string {
  if (!url) return url;
  // Productserve proxy supports w/h
  if (url.includes("productserve.com")) {
    return url
      .replace(/([?&])w=\d+/, `$1w=${w}`)
      .replace(/([?&])h=\d+/, `$1h=${h}`);
  }
  // Ellos/Jotex assets support a single w= param
  if (url.includes("ellosgroup.com")) {
    if (/[?&]w=\d+/.test(url)) return url.replace(/([?&])w=\d+/, `$1w=${w}`);
    return url + (url.includes("?") ? "&" : "?") + `w=${w}`;
  }
  return url;
}
