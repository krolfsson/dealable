import Link from "next/link";
import type { Metadata } from "next";
import { getAllStoreEntries } from "@/lib/store-seo";
import { formatStoreName, STORE_SLUGS } from "@/lib/seo";

const year = new Date().getFullYear();
const BASE = "https://www.dealable.se";

export const metadata: Metadata = {
  title: `Rea online ${year} – Bästa rean från svenska nätbutiker`,
  description: `Hitta bästa rean online ${year}. Aktuella reor från Samsung, Jotex, Outnorth, Nelly, Dyson och fler svenska butiker – produkter med minst 20 % rabatt, uppdateras löpande.`,
  keywords: [
    "rea online",
    "rea",
    `rea ${year}`,
    "bästa rea",
    "nätbutiker rea",
    "rea sverige",
    "online rea",
    "sommarrea",
    "vinterrea",
    "reor online",
    ...Object.keys(STORE_SLUGS).flatMap((s) => [
      `${formatStoreName(s)} rea`,
      `${formatStoreName(s)} rea ${year}`,
    ]),
  ],
  alternates: { canonical: `${BASE}/rea` },
  openGraph: {
    title: `Rea online ${year} – Bästa rean från svenska nätbutiker`,
    description: `Aktuell rea från Samsung, Jotex, Outnorth, Nelly, Dyson och fler – produkter med minst 20 % rabatt, uppdateras löpande.`,
    url: `${BASE}/rea`,
    locale: "sv_SE",
    type: "website",
  },
};

const FAQ = [
  {
    question: "Var hittar jag bästa rean online?",
    answer:
      "På Dealable samlar vi aktuell rea från ledande svenska nätbutiker som Samsung, Jotex, Outnorth, Nelly och Dyson. Alla produkter har minst 20 % rabatt och feeden uppdateras löpande.",
  },
  {
    question: "Vilka butiker har rea just nu?",
    answer:
      `Vi listar rea från ${Object.keys(STORE_SLUGS).map(formatStoreName).join(", ")} och fler. Välj en butik nedan eller använd filtret på startsidan för att hitta rätt kategori.`,
  },
  {
    question: "Vad är skillnaden på rea och rabattkod?",
    answer:
      "Rea är ett fast sänkt pris på en specifik produkt – du behöver ingen kod. En rabattkod ger dig rabatt vid kassan och kräver att du klistrar in koden. På Dealable visar vi båda typerna.",
  },
  {
    question: "Hur aktuell är rean på Dealable?",
    answer:
      "Vi hämtar produkter direkt från butikernas Awin-flöden som uppdateras regelbundet. Produkter märkta '✓ Verifierad idag' bekräftades den aktuella dagen. Klicka alltid vidare till butiken för aktuellt pris.",
  },
  {
    question: "Kan jag filtrera rea på kategori?",
    answer:
      "Ja. Välj en butik och sedan en kategori – till exempel jackor hos Outnorth eller dammsugare hos Dyson. Du kan också sortera efter högst rabatt eller lägsta pris.",
  },
];

export default function ReaPage() {
  const stores = getAllStoreEntries().sort((a, b) =>
    a.label.localeCompare(b.label, "sv")
  );

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Dealable", item: BASE },
      { "@type": "ListItem", position: 2, name: `Rea online ${year}`, item: `${BASE}/rea` },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Rea online ${year} – Svenska butiker`,
    numberOfItems: stores.length,
    itemListElement: stores.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${s.label} rea ${year}`,
      url: `${BASE}/butik/${s.slug}`,
    })),
  };

  return (
    <div style={{ minHeight: "100vh", background: "#faf8ff", fontFamily: "Quicksand, sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />

      <header style={{ borderBottom: "1px solid #ede9fe", background: "#fff", padding: "16px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/" style={{ fontSize: 22, fontWeight: 800, color: "#7c3aed", textDecoration: "none", letterSpacing: "-0.5px" }}>
            dealable
          </Link>
          <nav style={{ display: "flex", gap: 16, fontSize: 14, fontWeight: 600 }}>
            <Link href="/rabattkoder" style={{ color: "#6b7280", textDecoration: "none" }}>Rabattkoder</Link>
            <Link href="/butiker" style={{ color: "#6b7280", textDecoration: "none" }}>Alla butiker</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px 72px" }}>
        <nav aria-label="Brödsmulor" style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>
          <Link href="/" style={{ color: "#7c3aed" }}>Dealable</Link>
          {" › "}
          <span>Rea online {year}</span>
        </nav>

        <h1 style={{ margin: "0 0 12px", fontSize: 32, fontWeight: 800, color: "#1e1b4b", lineHeight: 1.2 }}>
          Rea online {year} – bästa rean från svenska nätbutiker
        </h1>
        <p style={{ margin: "0 0 32px", fontSize: 16, lineHeight: 1.7, color: "#4b5563", maxWidth: 760 }}>
          Dealable samlar den bästa <strong>rean online</strong> från svenska nätbutiker på ett ställe.
          Alla produkter har minst 20&nbsp;% rabatt och hämtas direkt från butikernas produktflöden.
          Filtrera på butik och kategori för att snabbt hitta rean du letar efter – oavsett om det är
          kläder, elektronik, inredning eller sport.
        </p>

        <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 800, color: "#1e1b4b" }}>
          Aktuell rea per butik
        </h2>
        <ul style={{ margin: "0 0 48px", padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {stores.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/butik/${s.slug}`}
                style={{
                  display: "block", padding: "16px 18px", borderRadius: 14,
                  background: "#fff", border: "1px solid #e9d5ff",
                  textDecoration: "none", boxShadow: "0 2px 10px rgba(168,85,247,0.07)",
                }}
              >
                <span style={{ display: "block", fontSize: 16, fontWeight: 800, color: "#1e1b4b", marginBottom: 4 }}>
                  {s.label} rea
                </span>
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  {s.label} erbjudanden &amp; deals {year}
                </span>
                <span style={{ display: "block", marginTop: 10, fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>
                  Se {s.label} rea →
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <section aria-labelledby="faq-rea-heading">
          <h2 id="faq-rea-heading" style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 800, color: "#1e1b4b" }}>
            Vanliga frågor om rea online
          </h2>
          <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 18, maxWidth: 760 }}>
            {FAQ.map((f) => (
              <div key={f.question} style={{ background: "#fff", border: "1px solid #e9d5ff", borderRadius: 12, padding: "16px 20px" }}>
                <dt style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e1b4b" }}>{f.question}</dt>
                <dd style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.65, color: "#4b5563" }}>{f.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p style={{ marginTop: 32, fontSize: 13, color: "#9ca3af" }}>
          <Link href="/rabattkoder" style={{ color: "#7c3aed", fontWeight: 600 }}>Rabattkoder</Link>
          {" · "}
          <Link href="/butiker" style={{ color: "#7c3aed", fontWeight: 600 }}>Alla butiker</Link>
          {" · "}
          <Link href="/" style={{ color: "#7c3aed", fontWeight: 600 }}>Alla deals</Link>
        </p>
      </main>
    </div>
  );
}
