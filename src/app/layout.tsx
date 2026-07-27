import type { Metadata } from "next";
import { Cormorant_Garamond, Nunito_Sans } from "next/font/google";
import { getSettings } from "@/lib/settings";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
});
const body = Nunito_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Nosso Casamento · Lista de Presentes",
  description:
    "Celebre conosco. Escolha um presente e contribua via PIX com todo o carinho.",
  openGraph: {
    title: "Nosso Casamento · Lista de Presentes",
    description: "Escolha um presente e contribua via PIX.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getSettings();
  const themeVars = {
    "--color-primary": s.primaryColor,
    "--color-secondary": s.secondaryColor,
  } as React.CSSProperties;
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <body className="font-body antialiased" style={themeVars}>
        {children}
      </body>
    </html>
  );
}
