export default function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Dealable",
    url: "https://dealable.se",
    description:
      "Hitta de bästa erbjudandena och rabatterna från svenska nätbutiker.",
    inLanguage: "sv-SE",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://dealable.se/?q={search_term_string}",
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