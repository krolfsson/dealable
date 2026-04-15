import DealsPage from "@/app/components/DealsPage";
import { SLUG_TO_STORE, formatStoreName } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ store: string }>;
}): Promise<Metadata> {
  const { store: storeSlug } = await params;
  const storeName = SLUG_TO_STORE[storeSlug];
  const label = storeName ? formatStoreName(storeName) : storeSlug;

  const title = `${label} rea & deals`;
  const description = storeName
    ? `Se de bästa dealsen från ${label}. Filtrera på underkategorier och hitta rätt produkt snabbt. Uppdateras löpande.`
    : `Se deals från ${label}. Filtrera och hitta rätt produkt snabbt.`;

  return {
    title,
    description,
    alternates: { canonical: `https://www.dealable.se/butik/${storeSlug}` },
    openGraph: {
      title,
      description,
      url: `https://www.dealable.se/butik/${storeSlug}`,
    },
  };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store: storeSlug } = await params;
  const storeName = SLUG_TO_STORE[storeSlug];

  // Fallback: if unknown slug, render "Alla" (still indexable but less ideal)
  const initialStore = storeName || "Alla";

  const label = storeName ? formatStoreName(storeName) : storeSlug;
  const seoTitle = `${label} rea & deals`;
  const seoDescription = storeName
    ? `Se de bästa dealsen från ${label}. Filtrera på underkategorier för att hitta rätt produkt snabbt.`
    : `Se deals från ${label}.`;

  return (
    <DealsPage
      initialStore={initialStore}
      seoTitle={seoTitle}
      seoDescription={seoDescription}
    />
  );
}

