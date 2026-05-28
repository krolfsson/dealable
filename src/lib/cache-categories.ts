import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { slugifyCategory } from "@/lib/seo";

export type StoreCategoryLink = {
  category: string;
  slug: string;
  count: number;
};

/** Top categories for a store from public/cache (build + runtime). */
export function getTopCategoriesForStore(
  storeName: string,
  limit = 10
): StoreCategoryLink[] {
  try {
    const cacheDir = join(process.cwd(), "public", "cache");
    if (!existsSync(cacheDir)) return [];

    const counts = new Map<string, number>();
    const files = readdirSync(cacheDir).filter((f) => /^deals-\d+\.json$/.test(f));

    for (const f of files) {
      const deals = JSON.parse(
        readFileSync(join(cacheDir, f), "utf-8")
      ) as Array<{ store: string; category: string }>;
      for (const d of deals) {
        if (d.store !== storeName) continue;
        const cat = (d.category || "").trim();
        if (!cat) continue;
        counts.set(cat, (counts.get(cat) || 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([category, count]) => ({
        category,
        slug: slugifyCategory(category),
        count,
      }));
  } catch {
    return [];
  }
}
