import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Languages } from "lucide-react";
import { DEFAULT_LOCALE } from "@vibe-cms/core/i18n";
import { listLocales } from "@vibe-cms/core/i18n/server";
import { LanguagesAdmin } from "@vibe-cms/core/components";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sprachen",
  robots: { index: false, follow: false },
};

export default async function LanguagesAdminPage() {
  const locales = await listLocales();
  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);
  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Languages className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">Sprachen verwalten</h1>
              <p className="text-xs text-slate-500">
                Übersetzt deine Inhalte automatisch über OpenAI in eine neue Sprache.
              </p>
            </div>
          </div>
          <Link
            href={`/${DEFAULT_LOCALE}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zurück zur Seite
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <LanguagesAdmin initialLocales={locales} hasOpenAiKey={hasOpenAiKey} />
      </div>
    </main>
  );
}
