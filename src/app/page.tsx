import DealsPage from "@/app/components/DealsPage";
import type { Metadata } from "next";
import { formatStoreName, KNOWN_STORES } from "@/lib/seo";

const brandList = KNOWN_STORES.map(formatStoreName).join(", ");

export const metadata: Metadata = {
  title: "Dealable.se – Rabattkoder & rea från svenska butiker",
  description: `Hitta deals och rabattkoder från ${brandList}. Jämför rabatter, filtrera på butik och kategori – uppdateras löpande.`,
  keywords: [
    "rabattkoder",
    "rea online",
    "deals sverige",
    "kampanjer",
    "rabatt butiker",
    ...KNOWN_STORES.flatMap((s) => [
      `${formatStoreName(s)} rabatt`,
      `${formatStoreName(s)} rabattkod`,
      `${formatStoreName(s)} rea`,
    ]),
  ],
  alternates: { canonical: "https://www.dealable.se" },
  openGraph: {
    title: "Dealable.se – Rabattkoder & rea från svenska butiker",
    description: `Deals från ${brandList}.`,
    url: "https://www.dealable.se",
    locale: "sv_SE",
    type: "website",
  },
};

export default function Home() {
  return <DealsPage />;
}
