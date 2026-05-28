import { KNOWN_STORES, formatStoreName } from "@/lib/seo";

const year = new Date().getFullYear();
const BASE = "https://www.dealable.se";
const brandList = KNOWN_STORES.map(formatStoreName).join(", ");

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Dealable",
  url: BASE,
  description: `Rabattkoder och rea från svenska nätbutiker – ${brandList}.`,
  inLanguage: "sv-SE",
  potentialAction: {
    "@type": "SearchAction",
    target: `${BASE}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Dealable",
  url: BASE,
  logo: `${BASE}/icon.png`,
  description: `Dealable samlar rabattkoder och rea från svenska nätbutiker – ${brandList}.`,
  sameAs: [],
};

const homepageFaq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Vad är Dealable?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `Dealable är en svensk deal-sajt som samlar rabatter och erbjudanden från nätbutiker som ${brandList}. Vi visar produkter med minst 20 % rabatt och uppdaterar sortimentet löpande.`,
      },
    },
    {
      "@type": "Question",
      name: "Hur hittar jag bästa rabattkoden?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `Välj butik i filtret ovan – till exempel Samsung, Jotex eller Outnorth – och sortera efter "Bästa rabatt" för att se de produkter med störst prisreduktion just nu.`,
      },
    },
    {
      "@type": "Question",
      name: "Hur ofta uppdateras deals på Dealable?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Produktflödena hämtas regelbundet via Awin affiliate-nätverk. Produkter märkta '✓ Verifierad idag' bekräftades den aktuella dagen.",
      },
    },
    {
      "@type": "Question",
      name: `Vilka butiker finns på Dealable ${year}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `Dealable visar deals från ${brandList}. Fler butiker läggs till löpande. Se alla på sidan /butiker.`,
      },
    },
  ],
};

export default function JsonLd() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageFaq) }}
      />
    </>
  );
}
