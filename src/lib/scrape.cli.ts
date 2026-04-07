// src/lib/scrape-cli.ts
// Run with: npx tsx src/lib/scrape-cli.ts
// This fetches real deals from Swedish e-commerce sites and writes to deals.json

import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import type { Deal, DealsData } from "./scraper";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

// ─── Existing deals (fallback / merge) ───
const DEALS_PATH = path.join(process.cwd(), "src", "data", "deals.json");

function loadExistingDeals(): DealsData {
  try {
    const raw = fs.readFileSync(DEALS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { lastUpdated: new Date().toISOString(), deals: [] };
  }
}

// ─── Unsplash fallback images per category ───
const CATEGORY_IMAGES: Record<string, string[]> = {
  Tech: [
    "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop",
  ],
  Home: [
    "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1560961911-ba7ef651a56c?w=800&h=800&fit=crop",
  ],
  Beauty: [
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1559590660-903e1e4b1e6a?w=800&h=800&fit=crop",
  ],
  Fashion: [
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop",
  ],
};

function pickImage(category: string, index: number): string {
  const images = CATEGORY_IMAGES[category] || CATEGORY_IMAGES["Tech"];
  return images[index % images.length];
}

// ─── Scraper: Elgiganten campaign page ───
async function scrapeElgiganten(): Promise<Deal[]> {
  const deals: Deal[] = [];
  try {
    console.log("🔍 Scraping Elgiganten...");
    const res = await fetch("https://www.elgiganten.se/kampanj/aktuell-kampanj", {
      headers: { "User-Agent": USER_AGENT },
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // Look for product cards with price info
    $('[data-testid="product-card"], .product-card, article').each((i, el) => {
      const titleEl = $(el).find("h2, h3, [class*='title'], [class*='name']").first();
      const title = titleEl.text().trim();
      if (!title || title.length < 5) return;

      // Try to find prices
      const allText = $(el).text();
      const priceMatch = allText.match(/(\d[\d\s]*)\.-/g);
      
      if (priceMatch && priceMatch.length >= 1) {
        const prices = priceMatch.map((p) =>
          parseInt(p.replace(/[^\d]/g, ""))
        ).filter((p) => p > 0);

        if (prices.length >= 1) {
          const salePrice = Math.min(...prices);
          const origPrice = Math.max(...prices);
          
          if (origPrice > salePrice && salePrice > 0) {
            const discountPct = Math.round(((origPrice - salePrice) / origPrice) * 100);
            
            // Determine category from title
            let category = "Tech";
            const lowerTitle = title.toLowerCase();
            if (lowerTitle.includes("dammsug") || lowerTitle.includes("tvätt") ||
                lowerTitle.includes("kaffe") || lowerTitle.includes("kyl") ||
                lowerTitle.includes("grill") || lowerTitle.includes("frys")) {
              category = "Home";
            }

            // Extract brand
            const brand = title.split(" ")[0];

            const link = $(el).find("a").first().attr("href");
            const url = link
              ? link.startsWith("http") ? link : `https://www.elgiganten.se${link}`
              : "https://www.elgiganten.se/kampanj/aktuell-kampanj";

            deals.push({
              id: 0,
              title,
              brand,
              store: "Elgiganten",
              price: salePrice,
              originalPrice: origPrice,
              discount: `-${discountPct}%`,
              category,
              image: pickImage(category, i),
              url,
              hot: discountPct >= 30,
              firstSeen: new Date().toISOString(),
            });
          }
        }
      }
    });

    console.log(`  ✅ Found ${deals.length} deals from Elgiganten`);
  } catch (err) {
    console.error("  ❌ Elgiganten scrape failed:", err);
  }
  return deals;
}

// ─── Scraper: Webhallen campaigns ───
async function scrapeWebhallen(): Promise<Deal[]> {
  const deals: Deal[] = [];
  try {
    console.log("🔍 Scraping Webhallen...");
    const res = await fetch("https://www.webhallen.com/se/campaigns", {
      headers: { "User-Agent": USER_AGENT },
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    $("a[href*='/campaign/'], a[href*='/product/']").each((i, el) => {
      const title = $(el).text().trim();
      if (title && title.length > 10 && title.length < 120) {
        const link = $(el).attr("href") || "";
        const url = link.startsWith("http")
          ? link
          : `https://www.webhallen.com${link}`;

        deals.push({
          id: 0,
          title: title.substring(0, 80),
          brand: title.split(" ")[0],
          store: "Webhallen",
          price: 0,
          originalPrice: 0,
          discount: "DEAL",
          category: "Tech",
          image: pickImage("Tech", i),
          url,
          hot: false,
          firstSeen: new Date().toISOString(),
        });
      }
    });
    console.log(`  ✅ Found ${deals.length} items from Webhallen`);
  } catch (err) {
    console.error("  ❌ Webhallen scrape failed:", err);
  }
  return deals.slice(0, 6);
}

// ─── Main: merge scraped + existing, write file ───
async function main() {
  console.log("\n🚀 Dealable Scraper Starting...\n");

  const existing = loadExistingDeals();

  // Scrape live data
  const [elgiganten, webhallen] = await Promise.all([
    scrapeElgiganten(),
    scrapeWebhallen(),
  ]);

  const scraped = [...elgiganten, ...webhallen];

  // Merge: use scraped if we got results, otherwise keep existing
  let finalDeals: Deal[];

  if (scraped.length >= 5) {
    // Enough scraped data – use it, but also keep manually curated deals
    // that have specific prices (our hand-verified deals)
    const curatedDeals = existing.deals.filter((d) => d.price > 0);
    const uniqueScraped = scraped.filter(
      (s) => !curatedDeals.some((c) => c.title === s.title)
    );
    finalDeals = [...curatedDeals, ...uniqueScraped];
  } else {
    // Scraping didn't return enough – keep existing deals but refresh timestamps
    console.log("⚠️  Not enough scraped deals, keeping existing data");
    finalDeals = existing.deals;
  }

  // Assign IDs
  finalDeals.forEach((deal, i) => {
    deal.id = i + 1;
  });

  // Cap at 40 deals
  finalDeals = finalDeals.slice(0, 40);

  const output: DealsData = {
    lastUpdated: new Date().toISOString(),
    deals: finalDeals,
  };

  fs.writeFileSync(DEALS_PATH, JSON.stringify(output, null, 2), "utf-8");
  console.log(
    `\n✅ Wrote ${finalDeals.length} deals to ${DEALS_PATH}`
  );
  console.log(`📅 Last updated: ${output.lastUpdated}\n`);
}

main().catch(console.error);