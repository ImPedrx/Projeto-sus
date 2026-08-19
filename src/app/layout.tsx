import type { Metadata } from "next";
import { Archivo, Archivo_Black, DM_Mono } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${archivoBlack.variable} ${dmMono.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
