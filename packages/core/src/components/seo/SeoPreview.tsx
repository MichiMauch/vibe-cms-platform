"use client";

import { Globe, ImageOff } from "lucide-react";

type Props = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  url?: string;
};

export function SeoPreview({ title, description, ogTitle, ogDescription, ogImage, url = "https://vibe-cms.local" }: Props) {
  const host = safeHost(url);
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
          Google-Vorschau
        </h3>
        <GoogleSerp title={title} description={description} url={url} host={host} />
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
          Social-Media-Vorschau
        </h3>
        <OgCard title={ogTitle} description={ogDescription} image={ogImage} host={host} />
      </div>
    </div>
  );
}

function GoogleSerp({
  title,
  description,
  url,
  host,
}: {
  title: string;
  description: string;
  url: string;
  host: string;
}) {
  const t = truncate(title || "Titel der Seite", 60);
  const d = truncate(description || "Hier erscheint deine Meta-Description.", 160);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
          <Globe className="h-3.5 w-3.5 text-slate-500" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-slate-900 font-medium">{host}</span>
          <span className="text-slate-500">{url}</span>
        </div>
      </div>
      <a
        href="#"
        onClick={(e) => e.preventDefault()}
        className="mt-2 block text-xl text-[#1a0dab] hover:underline visited:text-[#681da8] font-normal"
      >
        {t}
      </a>
      <p className="mt-1 text-sm text-slate-700 leading-snug">{d}</p>
    </div>
  );
}

function OgCard({
  title,
  description,
  image,
  host,
}: {
  title: string;
  description: string;
  image: string;
  host: string;
}) {
  const t = truncate(title || "OG Titel der Seite", 70);
  const d = truncate(description || "Beschreibung, wie sie auf Facebook oder LinkedIn erscheint.", 200);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[1.91/1] w-full bg-slate-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="OG Preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
            <ImageOff className="h-8 w-8" />
            <span className="text-xs">Kein OG-Image gesetzt — empfohlen 1200×630 px</span>
          </div>
        )}
      </div>
      <div className="space-y-1 border-t border-slate-200 p-4">
        <p className="text-[11px] uppercase tracking-wider text-slate-500">{host}</p>
        <p className="text-sm font-semibold text-slate-900 leading-snug">{t}</p>
        <p className="text-xs text-slate-600 leading-snug line-clamp-2">{d}</p>
      </div>
    </div>
  );
}

function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}

function safeHost(u: string): string {
  try {
    return new URL(u).host;
  } catch {
    return u;
  }
}
