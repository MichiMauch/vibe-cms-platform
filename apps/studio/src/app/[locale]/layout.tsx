import { notFound } from "next/navigation";
import { LocaleProvider } from "@vibe-cms/core/components";
import { LanguageSwitcher } from "@vibe-cms/core/components";
import { Chatbot } from "@vibe-cms/core/components";
import { listLocales, localeExists } from "@vibe-cms/core/i18n/server";
import { readContent } from "@vibe-cms/core/lib/server";

export const dynamic = "force-dynamic";

type Params = { locale: string };

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  const { locale } = await params;
  if (!(await localeExists(locale))) notFound();

  const locales = await listLocales();
  const content = await readContent(locale);

  return (
    <LocaleProvider value={locale}>
      <LanguageSwitcher locales={locales} current={locale} />
      {children}
      <Chatbot config={content.chatbot} locale={locale} />
    </LocaleProvider>
  );
}
