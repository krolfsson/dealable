import CookieBanner from "./components/CookieBanner";
import type { Metadata } from "next";
import "./globals.css";
import JsonLd from "./components/JsonLd";
import { Analytics } from "@vercel/analytics/react";
import { KNOWN_STORES, formatStoreName } from "@/lib/seo";

const year = new Date().getFullYear();
const brandList = KNOWN_STORES.map(formatStoreName).join(", ");

export const metadata: Metadata = {
  title: {
    default: `Dealable – Rabattkoder & rea från svenska butiker ${year}`,
    template: "%s | Dealable",
  },
  description: `Hitta rabattkoder, kampanjkoder och rea från ${brandList}. Produkter med minst 20 % rabatt – uppdateras löpande.`,
  keywords: [
    "rabattkoder",
    "rabattkod",
    "kampanjkod",
    "rea online",
    "rea",
    "deals",
    "erbjudanden",
    "rabatter",
    `rabattkoder ${year}`,
    "svenska butiker rabatt",
    "nätbutiker rea",
    ...KNOWN_STORES.flatMap((s) => [
      `${formatStoreName(s)} rabattkod`,
      `${formatStoreName(s)} rea`,
    ]),
  ],
  metadataBase: new URL("https://www.dealable.se"),
  openGraph: {
    title: `Dealable – Rabattkoder & rea från svenska butiker`,
    description: `Rabattkoder och rea från ${brandList}. Uppdateras löpande.`,
    url: "https://www.dealable.se",
    siteName: "Dealable",
    locale: "sv_SE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Dealable – Rabattkoder & rea från svenska butiker`,
    description: `Rabattkoder och rea från ${brandList}.`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "https://www.dealable.se",
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
        <Analytics />
      </body>
    </html>
  );
}
