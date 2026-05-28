import Link from "next/link";
import type { Metadata } from "next";
import { getAllStoreEntries } from "@/lib/store-seo";
import { formatStoreName, STORE_SLUGS } from "@/lib/seo";

const year = new Date().getFullYear();
const BASE = "https://www.dealable.se";

export const metadata: Metadata = {
  title: `Rabattkoder ${year} – Aktiva koder från Samsung, Jotex, Outnorth & fler`,
  description: `Hitta aktiva rabattkoder och kampanjkoder från svenska nätbutiker ${year}. Rabattkoder för Samsung, Jotex, Outnorth, Nelly, Dyson, SharkNinja och fler – uppdateras löpande.`,
  keywords: [
    "rabattkoder",
    "rabattkod",
    "kampanjkod",
    "kampanjkoder",
    `rabattkoder ${year}`,
    "aktiva rabattkoder",
    "rabattkoder sverige",
    "rabattkod online",
    ...Object.keys(STORE_SLUGS).flatMap((s) => [
      `${formatStoreName(s)} rabattkod`,
      `${formatStoreName(s)} kampanjkod`,
    ]),
  ],
  alternates: { canonical: `${BASE}/rabattkoder` },
  openGraph: {
    title: `Rabattkoder ${year} – Aktiva koder från svenska butiker`,
    description: `Aktiva rabattkoder och kampanjkoder från Samsung, Jotex, Outnorth, Nelly och fler svenska nätbutiker.`,
    url: `${BASE}/rabattkoder`,
    locale: "sv_SE",
    type: "website",
  },
};

const FAQ = [
  {
    question: "Vad är en rabattkod?",
    answer:
      "En rabattkod (även kallad kampanjkod eller kampanjerbjudande) är en kombination av bokstäver och/eller siffror som ger dig rabatt vid kassan i en nätbutik. Du klistrar in koden i ett fält vid checkout för att aktivera rabatten.",
  },
  {
    question: "Hur hittar jag aktiva rabattkoder?",
    answer:
      "På Dealable samlar vi aktuella deals och rabatter från svenska nätbutiker. Välj en butik i listan nedan för att se vilka produkter som har rabatt just nu. Kampanjkoder som ENTERTHEGALAXY för Samsung visas i våra banners.",
  },
  {
    question: "Är rabattkoderna på Dealable verifierade?",
    answer:
      "Vi hämtar produktrabatter direkt från butikernas Awin-flöden och verifierar att produkterna är i lager. Produkter märkta '✓ Verifierad idag' bekräftades samma dag.",
  },
  {
    question: "Vilka butiker har rabattkoder?",
    answer:
      `Vi listar deals från ${Object.keys(STORE_SLUGS).map(formatStoreName).join(", ")} och fler. Klicka på en butik för att se aktuella erbjudanden.`,
  },
  {
    question: "Hur kombinerar jag en rabattkod med rea?",
    answer:
      "Butikerna bestämmer om koder kan kombineras med befintlig rea. Kolla alltid butikens villkor vid kassan. På Dealable ser du de kombinerade rabatterna – vi väljer ut det lägsta priset från feeden.",
  },
];

export default function RabattkodePage() {
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
      { "@type": "ListItem", position: 2, name: `Rabattkoder ${year}`, item: `${BASE}/rabattkoder` },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Rabattkoder ${year} – Svenska butiker`,
    numberOfItems: stores.length,
    itemListElement: stores.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${s.label} rabattkod ${year}`,
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
            <Link href="/rea" style={{ color: "#6b7280", textDecoration: "none" }}>Rea</Link>
            <Link href="/butiker" style={{ color: "#6b7280", textDecoration: "none" }}>Alla butiker</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px 72px" }}>
        <nav aria-label="Brödsmulor" style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>
          <Link href="/" style={{ color: "#7c3aed" }}>Dealable</Link>
          {" › "}
          <span>Rabattkoder {year}</span>
        </nav>

        <h1 style={{ margin: "0 0 12px", fontSize: 32, fontWeight: 800, color: "#1e1b4b", lineHeight: 1.2 }}>
          Rabattkoder {year} – aktiva koder från svenska butiker
        </h1>
        <p style={{ margin: "0 0 32px", fontSize: 16, lineHeight: 1.7, color: "#4b5563", maxWidth: 760 }}>
          Hitta aktiva <strong>rabattkoder</strong> och <strong>kampanjkoder</strong> från ledande svenska nätbutiker.
          Vi hämtar alla erbjudanden direkt från butikernas produktflöden och uppdaterar löpande – så du alltid
          ser de senaste dealsen med minst 20&nbsp;% rabatt. Välj en butik nedan för att se aktuella erbjudanden.
        </p>

        <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 800, color: "#1e1b4b" }}>
          Rabattkoder per butik
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
                  {s.label} rabattkod
                </span>
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  {s.label} kampanjkod &amp; deals {year}
                </span>
                <span style={{ display: "block", marginTop: 10, fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>
                  Se {s.label} deals →
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 800, color: "#1e1b4b" }}>
            Vanliga frågor om rabattkoder
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
          <Link href="/rea" style={{ color: "#7c3aed", fontWeight: 600 }}>Rea online</Link>
          {" · "}
          <Link href="/butiker" style={{ color: "#7c3aed", fontWeight: 600 }}>Alla butiker</Link>
          {" · "}
          <Link href="/" style={{ color: "#7c3aed", fontWeight: 600 }}>Alla deals</Link>
        </p>
      </main>
    </div>
  );
}
