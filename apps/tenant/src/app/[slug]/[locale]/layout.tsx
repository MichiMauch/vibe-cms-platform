import { Suspense } from "react";
import { LocaleProvider, LanguageSwitcher, Chatbot } from "@vibe-cms-platform/core/components";
import { getSiteData } from "@/lib/sites";

type Params = { slug: string; locale: string };

const CHAT_API_URL = process.env.NEXT_PUBLIC_STUDIO_CHAT_URL || "https://studio.mauch.rocks/api/chat";

/** Site/locale shell. Loads homepage content for chatbot + language list; the
 * SiteHeader is rendered inside each page so it can mark the active path. */
export default async function TenantLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  const { slug, locale } = await params;
  const { content, locales } = getSiteData(slug, locale);
  const chatbot = content.root.props?.chatbot ?? {
    isEnabled: false,
    botName: "",
    welcomeMessage: "",
  };

  return (
    <LocaleProvider value={locale}>
      {/* LanguageSwitcher calls useSearchParams() to preserve ?site=… in dev.
       * Static export pre-renders need that wrapped in <Suspense>. */}
      <Suspense fallback={null}>
        <LanguageSwitcher locales={locales} current={locale} />
      </Suspense>
      {children}
      <Chatbot config={chatbot} locale={locale} apiUrl={CHAT_API_URL} />
    </LocaleProvider>
  );
}
