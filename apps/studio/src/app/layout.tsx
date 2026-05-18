import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Manrope, Fraunces, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Theme-preset fonts. Loaded once at the root so every per-site theme can
// reference them by CSS variable (see `packages/core/src/theme/tokens.ts`).
// `next/font/google` self-hosts and code-splits per used variable.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Vibe-CMS", template: "%s | Vibe-CMS" },
  description: "Bearbeite deine Seite direkt im Browser. Kein Backend, keine Datenbank.",
};

// EditModeProvider intentionally lives only inside the admin editor (see
// `/admin/edit/EditorClient`). Without a provider in scope, useEditMode()
// falls back to { editMode: false } — so Option+E on public tenant pages
// does nothing and the inline editor never appears.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${manrope.variable} ${fraunces.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-ink">
        {children}
        <Script
          src="https://media-library.cloudinary.com/global/all.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
