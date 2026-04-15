import { MetadataRoute } from "next";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { STORE_SLUGS, slugifyCategory } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.dealable.se";
  const now = new Date();

  const out: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
  ];

  // Build store + category pages from the current cache.
  // In Vercel builds, `scripts/update-cache.mjs` runs before `next build`,
  // so these files exist and reflect the latest data.
  try {
    const cacheDir = join(process.cwd(), "public", "cache");
    const metaPath = join(cacheDir, "deals-meta.json");
    const lastModified = existsSync(metaPath)
      ? new Date(JSON.parse(readFileSync(metaPath, "utf-8")).lastUpdated || now)
      : now;

    // Store pages (canonical slugs)
    for (const slug of Object.values(STORE_SLUGS)) {
      out.push({
        url: `${base}/butik/${slug}`,
        lastModified,
        changeFrequency: "hourly",
        priority: 0.8,
      });
    }

    // Category pages (top categories per store)
    if (existsSync(cacheDir)) {
      const dealFiles = readdirSync(cacheDir).filter((f) =>
        /^deals-\d+\.json$/.test(f)
      );

      const categoriesByStore = new Map<string, Map<string, number>>();
      for (const f of dealFiles) {
        const deals = JSON.parse(readFileSync(join(cacheDir, f), "utf-8")) as Array<{
          store: string;
          category: string;
        }>;
        for (const d of deals) {
          const store = d.store;
          const cat = (d.category || "").trim();
          if (!store || !cat) continue;
          if (!STORE_SLUGS[store]) continue;
          if (!categoriesByStore.has(store)) categoriesByStore.set(store, new Map());
          const m = categoriesByStore.get(store)!;
          m.set(cat, (m.get(cat) || 0) + 1);
        }
      }

      for (const [store, cats] of categoriesByStore.entries()) {
        const storeSlug = STORE_SLUGS[store];
        const topCats = Array.from(cats.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 12)
          .map(([cat]) => cat);

        for (const cat of topCats) {
          out.push({
            url: `${base}/butik/${storeSlug}/${slugifyCategory(cat)}`,
            lastModified,
            changeFrequency: "hourly",
            priority: 0.6,
          });
        }
      }
    }
  } catch {
    // Ignore sitemap enrichment failures – base URL still works
  }

  return out;
}