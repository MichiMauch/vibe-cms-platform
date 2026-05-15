import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { LocaleProvider, LanguageSwitcher, Chatbot } from "@vibe-cms-platform/core/components";
import { resolveTenant, isAdminHost } from "@/lib/platform/registry";
import { listSiteLocales, readSiteContent, siteLocaleExists } from "@/lib/platform/site-content";

export const dynamic = "force-dynamic";

type Params = { locale: string };
type SearchParams = { site?: string };

export default async function LocaleLayout({
  children,
  params,
  searchParams,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
  searchParams?: Promise<SearchParams>;
}) {
  const h = await headers();
  const host = h.get("host") ?? "";
  if (isAdminHost(host)) {
    return <>{children}</>;
  }

  const sp = (await searchParams) ?? {};
  const slug = await resolveTenant({ host, override: sp.site });
  if (!slug) notFound();

  const { locale } = await params;
  if (!(await siteLocaleExists(slug, locale))) notFound();

  const locales = await listSiteLocales(slug);
  const content = await readSiteContent(slug, locale);

  return (
    <LocaleProvider value={locale}>
      <LanguageSwitcher locales={locales} current={locale} />
      {children}
      <Chatbot config={content.chatbot} locale={locale} />
    </LocaleProvider>
  );
}
