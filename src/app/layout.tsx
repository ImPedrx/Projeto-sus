import type { Metadata } from "next";
import { headers } from "next/headers";
import { Archivo, Archivo_Black, DM_Mono } from "next/font/google";
import "./globals.css";
import { localeFromPathname } from "@/lib/i18n";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-sans" });
const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "SusProd",
  description: "Beats e projetos exclusivos por SusProd.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The admin area is Portuguese only; the storefront serves English under
  // /en, and the document language has to follow it.
  const pathname = (await headers()).get("x-pathname") ?? "/";
  const locale = localeFromPathname(pathname);

  return (
    <html
      lang={locale === "en" ? "en" : "pt-BR"}
      className={`${archivo.variable} ${archivoBlack.variable} ${dmMono.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
