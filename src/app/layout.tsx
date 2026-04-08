import Script from 'next/script'
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dealable 🏷 Alla bästa deals från svenska butiker online",
  description: "Uppdateras varannan timme.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-CG97GM2S4L"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-CG97GM2S4L');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}