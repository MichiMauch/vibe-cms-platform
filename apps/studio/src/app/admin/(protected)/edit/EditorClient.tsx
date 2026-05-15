"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Loader2, Upload, CheckCircle2 } from "lucide-react";
import {
  ForceEditMode,
  EditScopeProvider,
  SaveStatusProvider,
  SaveStatusIndicator,
  useSaveStatus,
} from "@vibe-cms-platform/core/editors";
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
  pendingLocales: string[];
};

export function EditorClient({ slug, brand, locale, locales, liveUrl, content, pendingLocales }: Props) {
  const router = useRouter();

  function switchLocale(target: string) {
    if (target === locale) return;
    const url = new URL(window.location.href);
    url.searchParams.set("locale", target);
    router.push(url.pathname + url.search);
  }

  return (
    <EditScopeProvider value={{ slug, saveEndpoint: "/api/save-content", aiRewriteEndpoint: "/api/ai-rewrite" }}>
      <SaveStatusProvider>
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
                <div className="flex items-center gap-3">
                  <SaveStatusIndicator />
                  <PublishButton slug={slug} pendingLocales={pendingLocales} />
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
      </SaveStatusProvider>
    </EditScopeProvider>
  );
}

type PublishState = "idle" | "publishing" | "done" | "error";

function PublishButton({ slug, pendingLocales }: { slug: string; pendingLocales: string[] }) {
  const router = useRouter();
  const saveStatus = useSaveStatus();
  const [state, setState] = useState<PublishState>("idle");
  const [error, setError] = useState<string | null>(null);

  // Hide the button when there's nothing pending. After a successful publish
  // we keep the "done" badge visible for a moment, then router.refresh()
  // re-fetches pendingLocales=[] from the server and the parent re-renders
  // without the button.
  if (state === "idle" && pendingLocales.length === 0) return null;

  async function onPublish() {
    setState("publishing");
    setError(null);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setState("error");
        setError(typeof json.error === "string" ? json.error : "Publish fehlgeschlagen");
        return;
      }
      setState("done");
      saveStatus?.clearWarning();
      router.refresh();
      setTimeout(() => setState("idle"), 1500);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Publish fehlgeschlagen");
    }
  }

  if (state === "publishing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs text-white">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Publish…
      </span>
    );
  }

  if (state === "done") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs text-white">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Publiziert
      </span>
    );
  }

  if (state === "error") {
    return (
      <button
        type="button"
        onClick={onPublish}
        className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
        title={error ?? "Fehler"}
      >
        <Upload className="h-3.5 w-3.5" />
        Erneut publizieren
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onPublish}
      className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800 transition"
      title={`Unveröffentlichte Sprachen: ${pendingLocales.join(", ")}`}
    >
      <Upload className="h-3.5 w-3.5" />
      Publish · {pendingLocales.length}
    </button>
  );
}
