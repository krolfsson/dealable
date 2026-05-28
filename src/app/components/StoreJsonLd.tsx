import { getStoreSeoProfile } from "@/lib/store-seo";
import { formatStoreName } from "@/lib/seo";

export default function StoreJsonLd({
  storeName,
  storeSlug,
  canonical,
}: {
  storeName: string;
  storeSlug: string;
  canonical: string;
}) {
  const label = formatStoreName(storeName);
  const profile = getStoreSeoProfile(storeName);

  const faqPage =
    profile?.faq?.length ?
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: profile.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
    : null;

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${label} rabattkod, rea & deals`,
    description:
      profile?.intro ??
      `Aktuella deals och rabatter från ${label} på Dealable.se.`,
    url: canonical,
    inLanguage: "sv-SE",
    isPartOf: {
      "@type": "WebSite",
      name: "Dealable",
      url: "https://www.dealable.se",
    },
    about: {
      "@type": "Brand",
      name: label,
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Dealable",
        item: "https://www.dealable.se",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Butiker",
        item: "https://www.dealable.se/butiker",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: label,
        item: canonical,
      },
    ],
  };

  const scripts = [collectionPage, breadcrumb, ...(faqPage ? [faqPage] : [])];

  return (
    <>
      {scripts.map((data, i) => (
        <script
          key={`${storeSlug}-ld-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
    </>
  );
}
