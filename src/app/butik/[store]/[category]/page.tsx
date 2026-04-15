import DealsPage from "@/app/components/DealsPage";
import { SLUG_TO_STORE, formatStoreName } from "@/lib/seo";
import type { Metadata } from "next";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

function unslugCategory(slug: string): string {
  return slug.replace(/-/g, " ");
}

function titleCaseSv(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function resolveCategoryForStore(storeName: string, categorySlug: string): string | null {
  // Try to map slug -> actual category from cache, so filtering works reliably.
  try {
    const cacheDir = join(process.cwd(), "public", "cache");
    if (!existsSync(cacheDir)) return null;
    const files = readdirSync(cacheDir).filter((f) => /^deals-\d+\.json$/.test(f));
    for (const f of files) {
      const deals = JSON.parse(readFileSync(join(cacheDir, f), "utf-8")) as Array<{ store: string; category: string }>;
      for (const d of deals) {
        if (d.store !== storeName) continue;
        // Use same slugification as client
        const slug = d.category
          ?.trim()
          .toLowerCase()
          .replace(/&/g, " och ")
          .replace(/[^a-z0-9åäö]+/gi, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
        if (slug === categorySlug) return d.category;
      }
    }
  } catch {}
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ store: string; category: string }>;
}): Promise<Metadata> {
  const { store: storeSlug, category: categorySlug } = await params;
  const storeName = SLUG_TO_STORE[storeSlug];
  const storeLabel = storeName ? formatStoreName(storeName) : storeSlug;
  const catLabel = titleCaseSv(unslugCategory(categorySlug));

  const title = `${catLabel} – ${storeLabel} rea & deals`;
  const description = `Se deals inom ${catLabel} hos ${storeLabel}. Filtrera och hitta rätt produkt snabbt. Uppdateras löpande.`;

  return {
    title,
    description,
    alternates: { canonical: `https://www.dealable.se/butik/${storeSlug}/${categorySlug}` },
    openGraph: {
      title,
      description,
      url: `https://www.dealable.se/butik/${storeSlug}/${categorySlug}`,
    },
  };
}

export default async function StoreCategoryPage({
  params,
}: {
  params: Promise<{ store: string; category: string }>;
}) {
  const { store: storeSlug, category: categorySlug } = await params;
  const storeName = SLUG_TO_STORE[storeSlug];
  const initialStore = storeName || "Alla";

  const resolvedCategory =
    storeName ? resolveCategoryForStore(storeName, categorySlug) : null;
  const initialCategory = resolvedCategory || "Alla";

  const storeLabel = storeName ? formatStoreName(storeName) : storeSlug;
  const catLabel = resolvedCategory || titleCaseSv(unslugCategory(categorySlug));

  return (
    <DealsPage
      initialStore={initialStore}
      initialCategory={initialCategory}
      seoTitle={`${catLabel} – ${storeLabel} rea & deals`}
      seoDescription={`Se deals inom ${catLabel} hos ${storeLabel}. Filtrera och hitta rätt produkt snabbt.`}
    />
  );
}

