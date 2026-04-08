import CookieBanner from './components/CookieBanner';
import type { Metadata } from "next";
import "./globals.css";
import JsonLd from './components/JsonLd';

export const metadata: Metadata = {
  title: {
    default: "Dealable.se – Alla bästa deals från svenska butiker online",
    template: "%s | Dealable.se",
  },
  description:
    "Hitta de bästa erbjudandena och rabatterna från svenska nätbutiker. Uppdateras varannan timme med nya deals från hundratals butiker.",
  keywords: [
    "deals", "erbjudanden", "rabatter", "rea", "kampanjer",
    "svenska butiker", "online shopping", "prisvärt", "billigt",
  ],
  metadataBase: new URL("https://dealable.se"),
  openGraph: {
    title: "Dealable.se – Alla bästa deals från svenska butiker",
    description:
      "Hitta de bästa erbjudandena och rabatterna från svenska nätbutiker. Uppdateras varannan timme.",
    url: "https://dealable.se",
    siteName: "Dealable",
    locale: "sv_SE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dealable.se – Alla bästa deals från svenska butiker",
    description:
      "Hitta de bästa erbjudandena och rabatterna från svenska nätbutiker.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://dealable.se",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body>
        <JsonLd />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}