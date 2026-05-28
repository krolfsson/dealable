import { formatStoreName, slugifyCategory, STORE_SLUGS } from "@/lib/seo";

export type StoreSeoProfile = {
  /** Extra sökord utöver standard (rabatt, rea, rabattkod, …) */
  keywords: string[];
  /** Kort intro under deal-listan */
  intro: string;
  faq: { question: string; answer: string }[];
};

const BASE_KEYWORDS = (label: string) => [
  `${label} rabatt`,
  `${label} rabattkod`,
  `${label} rea`,
  `${label} kampanj`,
  `${label} erbjudande`,
  `${label} deals`,
  `${label} rabattkod 2026`,
];

export const STORE_SEO_PROFILES: Record<string, StoreSeoProfile> = {
  "Apotek Hjärtat SE": {
    keywords: [
      ...BASE_KEYWORDS("Apotek Hjärtat"),
      "apotek hjärtat online",
      "hudvård rea",
      "apotek kampanj",
    ],
    intro:
      "På Dealable samlar vi aktuella deals från Apotek Hjärtat – hudvård, hårvård, dermaprodukter och mer. Filtrera på kategori och jämför rabatter innan du handlar online.",
    faq: [
      {
        question: "Finns det rabatt på Apotek Hjärtat?",
        answer:
          "Ja. Vi listar produkter med minst 20 % rabatt från Apotek Hjärtats sortiment när de finns i feeden.",
      },
      {
        question: "Hur hittar jag bästa Apotek Hjärtat-dealen?",
        answer:
          "Välj Apotek Hjärtat som butik, sortera efter rabatt och filtrera på kategori – till exempel hudvård eller hårvård.",
      },
    ],
  },
  "Diamond Smile SE": {
    keywords: [
      ...BASE_KEYWORDS("Diamond Smile"),
      "tandblekning rabatt",
      "diamond smile kampanjkod",
    ],
    intro:
      "Se aktuella Diamond Smile-erbjudanden samlade på ett ställe. Vi visar deals med tydlig rabatt så du snabbt ser vad som är billigast just nu.",
    faq: [
      {
        question: "Har Diamond Smile rabattkod?",
        answer:
          "Kampanjkoder varierar. På Dealable ser du produkter med verifierad rabatt från butiken – klicka vidare för aktuella villkor.",
      },
    ],
  },
  "Dyson SE": {
    keywords: [
      ...BASE_KEYWORDS("Dyson"),
      "dyson rea sverige",
      "dyson kampanj",
      "dyson airwrap rabatt",
      "dyson dammsugare rea",
    ],
    intro:
      "Hitta Dyson-rea på populära produkter – dammsugare, stylers och luftbehandling. Deals uppdateras löpande från Dysons svenska sortiment.",
    faq: [
      {
        question: "När är Dyson på rea?",
        answer:
          "Rea och kampanjer växlar. På Dealable ser du alltid vilka Dyson-produkter som har rabatt just nu.",
      },
    ],
  },
  "Homeroom SE": {
    keywords: [
      ...BASE_KEYWORDS("Homeroom"),
      "homeroom rea möbler",
      "homeroom kampanj",
      "inredning rea online",
    ],
    intro:
      "Homeroom-deals på möbler och inredning – soffor, bord, förvaring och mer. Filtrera på kategori och hitta rabatterade favoriter.",
    faq: [
      {
        question: "Finns Homeroom rabattkod?",
        answer:
          "Ibland. Vi fokuserar på produkter med tydlig procentrabatt så du slipper leta i hela sortimentet.",
      },
    ],
  },
  "Jotex SE": {
    keywords: [
      ...BASE_KEYWORDS("Jotex"),
      "jotex rea",
      "jotex kampanj",
      "jotex uteköksrea",
      "jotex rabattkod",
    ],
    intro:
      "Jotex rea och kampanjer – textilier, utemöbler och heminredning. Se vilka produkter som har störst rabatt och uppdateras ofta.",
    faq: [
      {
        question: "Hur hittar jag Jotex rea?",
        answer:
          "Välj Jotex som butik på Dealable och sortera efter rabatt. Kategorifilter hjälper dig hitta till exempel utemöbler eller gardiner.",
      },
    ],
  },
  "Nelly SE": {
    keywords: [
      ...BASE_KEYWORDS("Nelly"),
      "nelly rea",
      "nelly rabattkod",
      "mode rea nelly",
    ],
    intro:
      "Nelly-deals på mode, skor och accessoarer. Vi visar rabatterade plagg med minst 20 % rabatt från Nellys sortiment.",
    faq: [
      {
        question: "Finns Nelly rabattkod?",
        answer:
          "Koder kommer och går. På Dealable ser du konkreta produkter med rabatt – ofta bättre än att gissa en generell kod.",
      },
    ],
  },
  "NLY Man SE": {
    keywords: [
      ...BASE_KEYWORDS("NLY Man"),
      "nly man rea",
      "herrmode rea",
      "nly man rabatt",
    ],
    intro:
      "NLY Man-erbjudanden på herrmode – jackor, byxor, skor och basics med tydlig rabatt.",
    faq: [
      {
        question: "Vad är skillnaden mellan Nelly och NLY Man på Dealable?",
        answer:
          "De är separata butiker i vårt flöde. Välj NLY Man för att bara se herrdeals.",
      },
    ],
  },
  "Outnorth SE": {
    keywords: [
      ...BASE_KEYWORDS("Outnorth"),
      "outnorth rea",
      "outnorth outdoor weeks",
      "outnorth rabatt",
      "friluftskläder rea",
    ],
    intro:
      "Outnorth deals på outdoor, friluft och sport. Filtrera på jackor, skor, tält och mer – perfekt inför säsongskampanjer.",
    faq: [
      {
        question: "När är Outnorth på rea?",
        answer:
          "Outdoor weeks och andra kampanjer dyker upp löpande. Vi listar produkter med aktiv rabatt från Outnorth.",
      },
    ],
  },
  "Padel Market": {
    keywords: [
      ...BASE_KEYWORDS("Padel Market"),
      "padel rea",
      "padel racket rabatt",
      "padel market kampanj",
    ],
    intro:
      "Padel Market-deals på racketar, bollar, väskor och padelutrustning med tydlig rabatt.",
    faq: [
      {
        question: "Finns padelutrustning på rea?",
        answer:
          "Ja – vi visar aktuella rabatterade produkter från Padel Market när de finns i feeden.",
      },
    ],
  },
  "SharkNinja SE": {
    keywords: [
      ...BASE_KEYWORDS("SharkNinja"),
      "shark ninja rea",
      "shark dammsugare rabatt",
      "ninja köksmaskin rea",
    ],
    intro:
      "SharkNinja-kampanjer på dammsugare, air fryers och köksmaskiner. Jämför rabatt och pris innan du klickar dig vidare.",
    faq: [
      {
        question: "Shark eller Ninja – var hittar jag deals?",
        answer:
          "Båda märkena säljs via SharkNinja SE. Filtrera på kategori för att hitta rätt typ av produkt.",
      },
    ],
  },
  "Rugvista SE": {
    keywords: [
      ...BASE_KEYWORDS("Rugvista"),
      "rugvista rea",
      "mattor rabatt",
      "rugvista kampanj",
    ],
    intro:
      "Rugvista-deals på mattor och heminredning – se vilka storlekar och stilar som har bäst rabatt just nu.",
    faq: [
      {
        question: "Finns Rugvista rabattkod?",
        answer:
          "Vi visar produkter med verifierad rabatt. Klicka vidare till Rugvista för eventuella kampanjkoder vid kassan.",
      },
    ],
  },
  "Samsung SE": {
    keywords: [
      ...BASE_KEYWORDS("Samsung"),
      "samsung rabattkod",
      "samsung galaxy rabatt",
      "samsung rea sverige",
      "samsung kampanj",
      "enterthegalaxy",
    ],
    intro:
      "Samsung-deals på telefoner, surfplattor, TV och vitvaror. Vi samlar produkter med rabatt från Samsung Sverige – inklusive kampanjer som Galaxy-erbjudanden.",
    faq: [
      {
        question: "Finns Samsung rabattkod?",
        answer:
          "Kampanjkoder som ENTERTHEGALAXY gäller ibland utvalda produkter. På Dealable ser du även direkta produktrabatter från feeden.",
      },
      {
        question: "Hur hittar jag Samsung Galaxy på rea?",
        answer:
          "Välj Samsung som butik och sortera efter rabatt, eller sök på modell i sökfältet.",
      },
    ],
  },
  "Xiaomi SE": {
    keywords: [
      ...BASE_KEYWORDS("Xiaomi"),
      "xiaomi rabatt",
      "xiaomi rea sverige",
      "xiaomi mobil kampanj",
    ],
    intro:
      "Xiaomi-erbjudanden på mobiler, wearables och smart home. Se aktuella deals med tydlig rabattprocent.",
    faq: [
      {
        question: "Finns Xiaomi rabattkod?",
        answer:
          "Produktrabatter visas direkt här. För kassakoder – kolla alltid villkoren på Xiaomis sajt via vår länk.",
      },
    ],
  },
};

export function getStoreSeoProfile(storeName: string): StoreSeoProfile | null {
  return STORE_SEO_PROFILES[storeName] ?? null;
}

export function buildStoreMetadata(storeName: string, storeSlug: string) {
  const label = formatStoreName(storeName);
  const profile = getStoreSeoProfile(storeName);
  const year = new Date().getFullYear();
  const title = `${label} rabattkod, rea & deals ${year}`;
  const description =
    profile?.intro ??
    `Hitta ${label} rabattkod, rea och deals. Jämför rabatterade produkter och filtrera på kategori. Uppdateras löpande på Dealable.`;

  const keywords = profile?.keywords ?? BASE_KEYWORDS(label);
  const canonical = `https://www.dealable.se/butik/${storeSlug}`;

  return { title, description, keywords, canonical, label };
}

export function buildCategoryMetadata(
  storeName: string,
  storeSlug: string,
  categoryLabel: string,
  categorySlug: string
) {
  const storeLabel = formatStoreName(storeName);
  const title = `${categoryLabel} – ${storeLabel} rea & rabatt ${new Date().getFullYear()}`;
  const description = `Se ${categoryLabel.toLowerCase()} på rea hos ${storeLabel}. Deals med rabatt, uppdaterade löpande. Filtrera och hitta bästa priset på Dealable.`;
  const keywords = [
    `${storeLabel} ${categoryLabel.toLowerCase()} rea`,
    `${storeLabel} ${categoryLabel.toLowerCase()} rabatt`,
    `${storeLabel} rea`,
    ...BASE_KEYWORDS(storeLabel),
  ];
  const canonical = `https://www.dealable.se/butik/${storeSlug}/${categorySlug}`;

  return { title, description, keywords, canonical, storeLabel, categoryLabel };
}

export function buildStoresIndexMetadata() {
  const brands = Object.keys(STORE_SLUGS).map(formatStoreName).join(", ");
  return {
    title: `Alla butiker – rabattkoder & rea (${new Date().getFullYear()})`,
    description: `Deals och rabattkoder från ${brands}. Välj butik och se aktuella erbjudanden med minst 20 % rabatt – uppdateras löpande.`,
    keywords: [
      "rabattkoder sverige",
      "rea online",
      "deals svenska butiker",
      "rabattkod butiker",
      ...Object.keys(STORE_SEO_PROFILES).flatMap((s) =>
        BASE_KEYWORDS(formatStoreName(s)).slice(0, 3)
      ),
    ],
    canonical: "https://www.dealable.se/butiker",
  };
}

export function getAllStoreEntries() {
  return Object.entries(STORE_SLUGS).map(([storeName, slug]) => ({
    storeName,
    slug,
    label: formatStoreName(storeName),
    profile: getStoreSeoProfile(storeName),
  }));
}

export { slugifyCategory };
