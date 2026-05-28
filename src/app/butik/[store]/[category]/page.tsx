import DealsPage from "@/app/components/DealsPage";
import StoreSeoSection from "@/app/components/StoreSeoSection";
import { SLUG_TO_STORE, STORE_SLUGS } from "@/lib/seo";
import { buildCategoryMetadata } from "@/lib/store-seo";
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
  try {
    const cacheDir = join(process.cwd(), "public", "cache");
    if (!existsSync(cacheDir)) return null;
    const files = readdirSync(cacheDir).filter((f) => /^deals-\d+\.json$/.test(f));
    for (const f of files) {
      const deals = JSON.parse(readFileSync(join(cacheDir, f), "utf-8")) as Array<{
        store: string;
        category: string;
      }>;
      for (const d of deals) {
        if (d.store !== storeName) continue;
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

export async function generateStaticParams() {
  const params: { store: string; category: string }[] = [];
  try {
    const cacheDir = join(process.cwd(), "public", "cache");
    if (!existsSync(cacheDir)) {
      return Object.values(STORE_SLUGS).map((store) => ({
        store,
        category: "alla",
      }));
    }

    const categoriesByStore = new Map<string, Map<string, number>>();
    const files = readdirSync(cacheDir).filter((f) => /^deals-\d+\.json$/.test(f));

    for (const f of files) {
      const deals = JSON.parse(readFileSync(join(cacheDir, f), "utf-8")) as Array<{
        store: string;
        category: string;
      }>;
      for (const d of deals) {
        const store = d.store;
        const cat = (d.category || "").trim();
        if (!store || !cat || !STORE_SLUGS[store]) continue;
        if (!categoriesByStore.has(store)) categoriesByStore.set(store, new Map());
        const m = categoriesByStore.get(store)!;
        m.set(cat, (m.get(cat) || 0) + 1);
      }
    }

    for (const [storeName, cats] of categoriesByStore.entries()) {
      const storeSlug = STORE_SLUGS[storeName];
      const topCats = Array.from(cats.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12);

      for (const [cat] of topCats) {
        const categorySlug = cat
          .trim()
          .toLowerCase()
          .replace(/&/g, " och ")
          .replace(/[^a-z0-9åäö]+/gi, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
        if (categorySlug) {
          params.push({ store: storeSlug, category: categorySlug });
        }
      }
    }
  } catch {}

  return params.length > 0 ? params : [{ store: "samsung", category: "mobil" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ store: string; category: string }>;
}): Promise<Metadata> {
  const { store: storeSlug, category: categorySlug } = await params;
  const storeName = SLUG_TO_STORE[storeSlug];
  const catLabel = titleCaseSv(unslugCategory(categorySlug));

  if (!storeName) {
    return { title: "Kategori", robots: { index: false } };
  }

  const resolved = resolveCategoryForStore(storeName, categorySlug);
  const categoryLabel = resolved || catLabel;

  const { title, description, keywords, canonical } = buildCategoryMetadata(
    storeName,
    storeSlug,
    categoryLabel,
    categorySlug
  );

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, locale: "sv_SE", type: "website" },
    twitter: { card: "summary_large_image", title, description },
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

  const catLabel = resolvedCategory || titleCaseSv(unslugCategory(categorySlug));

  if (!storeName) {
    return <DealsPage initialStore={initialStore} initialCategory={initialCategory} />;
  }

  const { title, description } = buildCategoryMetadata(
    storeName,
    storeSlug,
    catLabel,
    categorySlug
  );

  return (
    <>
      <DealsPage
        initialStore={initialStore}
        initialCategory={initialCategory}
        seoTitle={title}
        seoDescription={description}
      />
      <StoreSeoSection storeName={storeName} storeSlug={storeSlug} />
    </>
  );
}
