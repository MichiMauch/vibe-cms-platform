import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { readContent } from "@vibe-cms/core/lib/server";
import { listLocales, localeExists } from "@vibe-cms/core/i18n/server";
import { DEFAULT_LOCALE, LOCALE_REGEX } from "@vibe-cms/core/i18n";
import { ChatbotForm } from "@vibe-cms/core/components/chatbot";
import { SeoLocaleSwitcher } from "@vibe-cms/core/components/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chatbot",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ locale?: string }>;

export default async function ChatbotAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const requested = params.locale;
  const locale =
    requested && LOCALE_REGEX.test(requested) && (await localeExists(requested))
      ? requested
      : DEFAULT_LOCALE;
  const locales = await listLocales();
  const content = await readContent(locale);

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">Chatbot</h1>
              <p className="text-xs text-slate-500">Begrüssung und Schalter</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SeoLocaleSwitcher current={locale} locales={locales} />
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Zurück zur Seite
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <ChatbotForm key={locale} initial={content.chatbot} locale={locale} />
      </div>
    </main>
  );
}
