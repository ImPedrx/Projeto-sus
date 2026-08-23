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
  title: "Sus",
  description: "Exclusive beats and custom projects by Sus.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The storefront serves English at the root and Portuguese under /pt, and the
  // document language has to follow it. The admin area is Portuguese only, so it
  // is pinned regardless of where the default locale sits.
  const pathname = (await headers()).get("x-pathname") ?? "/";
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin");
  const locale = localeFromPathname(pathname);

  return (
    <html
      lang={isAdmin || locale === "pt" ? "pt-BR" : "en"}
      className={`${archivo.variable} ${archivoBlack.variable} ${dmMono.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
