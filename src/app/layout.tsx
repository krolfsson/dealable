import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dealable – Bästa deals från svenska butiker",
  description: "Hitta de bästa erbjudandena från Elgiganten, Webhallen, CDON, Lyko och fler svenska e-handlare. Uppdateras varannan timme.",
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