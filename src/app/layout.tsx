import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dealable – Alla bästa deals från svenska butiker online",
  description: "Uppdateras varannan timme.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}