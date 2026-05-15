import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-slate-900">
        {children}
        <Script
          src="https://media-library.cloudinary.com/global/all.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
