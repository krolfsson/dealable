import DealsPage from "@/app/components/DealsPage";
import StoreJsonLd from "@/app/components/StoreJsonLd";
import StoreSeoSection from "@/app/components/StoreSeoSection";
import { SLUG_TO_STORE, STORE_SLUGS } from "@/lib/seo";
import { buildStoreMetadata } from "@/lib/store-seo";
import type { Metadata } from "next";

export function generateStaticParams() {
  return Object.values(STORE_SLUGS).map((store) => ({ store }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ store: string }>;
}): Promise<Metadata> {
  const { store: storeSlug } = await params;
  const storeName = SLUG_TO_STORE[storeSlug];

  if (!storeName) {
    return {
      title: "Butik",
      robots: { index: false, follow: true },
    };
  }

  const { title, description, keywords, canonical } = buildStoreMetadata(
    storeName,
    storeSlug
  );

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      locale: "sv_SE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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

  if (!storeName) {
    return (
      <DealsPage
        initialStore="Alla"
        seoTitle="Deals från alla butiker"
        seoDescription="Hitta de bästa erbjudandena från svenska butiker."
      />
    );
  }

  const { title, description, canonical } = buildStoreMetadata(storeName, storeSlug);

  return (
    <>
      <StoreJsonLd storeName={storeName} storeSlug={storeSlug} canonical={canonical} />
      <DealsPage
        initialStore={storeName}
        seoTitle={title}
        seoDescription={description}
      />
      <StoreSeoSection storeName={storeName} storeSlug={storeSlug} />
    </>
  );
}
