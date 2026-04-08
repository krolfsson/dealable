import CookieBanner from './components/CookieBanner';
import Script from 'next/script'
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
<Script
  src="https://www.googletagmanager.com/gtag/js?id=G-CG97GM2S4L"
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    if (localStorage.getItem('cookie-consent') === 'accepted') {
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-CG97GM2S4L');
    }
  `}
</Script>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}