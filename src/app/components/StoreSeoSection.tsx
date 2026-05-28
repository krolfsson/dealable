import Link from "next/link";
import { getTopCategoriesForStore } from "@/lib/cache-categories";
import { formatStoreName } from "@/lib/seo";
import { getStoreSeoProfile } from "@/lib/store-seo";

export default function StoreSeoSection({
  storeName,
  storeSlug,
}: {
  storeName: string;
  storeSlug: string;
}) {
  const label = formatStoreName(storeName);
  const profile = getStoreSeoProfile(storeName);
  const categories = getTopCategoriesForStore(storeName, 10);

  if (!profile && categories.length === 0) return null;

  return (
    <section
      className="store-seo-section"
      aria-label={`Mer om ${label}`}
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "8px 20px 48px",
        borderTop: "1px solid #ede9fe",
        background: "#faf8ff",
      }}
    >
      <div style={{ maxWidth: 720 }}>
        <h2
          style={{
            margin: "0 0 10px",
            fontSize: 18,
            fontWeight: 800,
            color: "#1e1b4b",
          }}
        >
          {label} rabattkod &amp; rea – så hittar du deals
        </h2>
        {profile?.intro && (
          <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.6, color: "#4b5563" }}>
            {profile.intro}
          </p>
        )}

        {categories.length > 0 && (
          <>
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: 15,
                fontWeight: 700,
                color: "#1e1b4b",
              }}
            >
              Populära kategorier hos {label}
            </h3>
            <ul
              style={{
                margin: "0 0 20px",
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/butik/${storeSlug}/${c.slug}`}
                    style={{
                      display: "inline-block",
                      padding: "6px 12px",
                      borderRadius: 100,
                      background: "#fff",
                      border: "1px solid #e9d5ff",
                      color: "#6b21a8",
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    {c.category}
                    <span style={{ color: "#a78bfa", fontWeight: 500 }}> ({c.count})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {profile?.faq && profile.faq.length > 0 && (
          <>
            <h3
              style={{
                margin: "0 0 10px",
                fontSize: 15,
                fontWeight: 700,
                color: "#1e1b4b",
              }}
            >
              Vanliga frågor om {label} rabatt
            </h3>
            <dl style={{ margin: 0 }}>
              {profile.faq.map((item) => (
                <div key={item.question} style={{ marginBottom: 14 }}>
                  <dt
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#1e1b4b",
                    }}
                  >
                    {item.question}
                  </dt>
                  <dd
                    style={{
                      margin: "4px 0 0",
                      fontSize: 14,
                      lineHeight: 1.55,
                      color: "#4b5563",
                    }}
                  >
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}

        <p style={{ margin: "20px 0 0", fontSize: 13, color: "#9ca3af" }}>
          <Link href="/butiker" style={{ color: "#7c3aed", fontWeight: 600 }}>
            Se alla butiker
          </Link>
          {" · "}
          <Link href="/" style={{ color: "#7c3aed", fontWeight: 600 }}>
            Till startsidan
          </Link>
        </p>
      </div>
    </section>
  );
}
