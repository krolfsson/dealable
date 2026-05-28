export default function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Dealable",
    url: "https://www.dealable.se",
    description:
      "Hitta rabattkoder, rea och deals från svenska nätbutiker som Samsung, Jotex, Outnorth och fler.",
    inLanguage: "sv-SE",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://www.dealable.se/?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}