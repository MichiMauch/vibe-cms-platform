"use client";

import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ForceEditMode, EditScopeProvider } from "@vibe-cms-platform/core/editors";
import { LocaleProvider } from "@vibe-cms-platform/core/components";
import { BlockRenderer } from "@vibe-cms-platform/core/renderer";
import { BlockManager } from "@vibe-cms-platform/core/manager";
import type { Content } from "@vibe-cms-platform/core/types";

type Props = {
  slug: string;
  brand: string;
  locale: string;
  locales: string[];
  liveUrl: string | null;
  content: Content;
};

export function EditorClient({ slug, brand, locale, locales, liveUrl, content }: Props) {
  const router = useRouter();

  function switchLocale(target: string) {
    if (target === locale) return;
    const url = new URL(window.location.href);
    url.searchParams.set("locale", target);
    router.push(url.pathname + url.search);
  }

  return (
    <EditScopeProvider value={{ slug, saveEndpoint: "/api/save-content", aiRewriteEndpoint: "/api/ai-rewrite" }}>
      <LocaleProvider value={locale}>
        <ForceEditMode>
          <div className="bg-blue-50 border-b border-blue-200">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-blue-900">Editor: {brand}</span>
                <span className="font-mono text-blue-700">{slug}</span>
                {locales.length > 1 && (
                  <select
                    value={locale}
                    onChange={(e) => switchLocale(e.target.value)}
                    className="rounded border border-blue-300 bg-white px-2 py-0.5 text-blue-900 text-xs"
                    aria-label="Sprache"
                  >
                    {locales.map((l) => (
                      <option key={l} value={l}>
                        {l.toUpperCase()}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex items-center gap-2">
                {liveUrl && (
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-white px-2.5 py-1 text-blue-800 hover:border-blue-400 transition"
                  >
                    <ExternalLink className="h-3 w-3" /> Live ansehen
                  </a>
                )}
              </div>
            </div>
          </div>
          <BlockRenderer sections={content.sections} />
          <BlockManager sections={content.sections} locale={locale} />
        </ForceEditMode>
      </LocaleProvider>
    </EditScopeProvider>
  );
}
