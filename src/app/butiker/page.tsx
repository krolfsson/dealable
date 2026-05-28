import Link from "next/link";
import type { Metadata } from "next";
import { buildStoresIndexMetadata, getAllStoreEntries } from "@/lib/store-seo";

const meta = buildStoresIndexMetadata();

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  keywords: meta.keywords,
  alternates: { canonical: meta.canonical },
  openGraph: {
    title: meta.title,
    description: meta.description,
    url: meta.canonical,
    locale: "sv_SE",
    type: "website",
  },
};

export default function ButikerPage() {
  const stores = getAllStoreEntries().sort((a, b) =>
    a.label.localeCompare(b.label, "sv")
  );

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Butiker på Dealable",
    description: meta.description,
    numberOfItems: stores.length,
    itemListElement: stores.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${s.label} rabattkod & rea`,
      url: `https://www.dealable.se/butik/${s.slug}`,
    })),
  };

  return (
    <div style={{ minHeight: "100vh", background: "#faf8ff", fontFamily: "Quicksand, sans-serif" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />

      <header
        style={{
          borderBottom: "1px solid #ede9fe",
          background: "#fff",
          padding: "16px 20px",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Link
            href="/"
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#7c3aed",
              textDecoration: "none",
              letterSpacing: "-0.5px",
            }}
          >
            dealable
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 64px" }}>
        <h1
          style={{
            margin: "0 0 10px",
            fontSize: 28,
            fontWeight: 800,
            color: "#1e1b4b",
          }}
        >
          Alla butiker – rabattkoder &amp; rea
        </h1>
        <p
          style={{
            margin: "0 0 28px",
            fontSize: 15,
            lineHeight: 1.6,
            color: "#4b5563",
            maxWidth: 720,
          }}
        >
          Välj en butik för att se aktuella deals med rabatt. Vi samlar erbjudanden från
          svenska nätbutiker och uppdaterar sortimentet löpande – sök efter{" "}
          <strong>rabattkod</strong>, <strong>rea</strong> eller <strong>kampanj</strong> per
          varumärke.
        </p>

        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {stores.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/butik/${s.slug}`}
                style={{
                  display: "block",
                  padding: "16px 18px",
                  borderRadius: 14,
                  background: "#fff",
                  border: "1px solid #e9d5ff",
                  textDecoration: "none",
                  boxShadow: "0 2px 12px rgba(168, 85, 247, 0.08)",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: 17,
                    fontWeight: 800,
                    color: "#1e1b4b",
                    marginBottom: 6,
                  }}
                >
                  {s.label}
                </span>
                <span style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.45 }}>
                  {s.profile?.intro ?
                    `${s.profile.intro.slice(0, 120)}${s.profile.intro.length > 120 ? "…" : ""}`
                  : `${s.label} rabattkod, rea och deals – uppdateras löpande.`}
                </span>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#7c3aed",
                  }}
                >
                  Se {s.label} deals →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
