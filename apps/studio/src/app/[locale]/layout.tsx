import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  LocaleProvider,
  LanguageSwitcher,
  Chatbot,
  SmartActionButton,
} from "@vibe-cms-platform/core/components";
import { resolveTenant, isAdminHost } from "@/lib/platform/registry";
import { listSiteLocales, readSiteContent, siteLocaleExists } from "@/lib/platform/site-content";
import { readSession, canEditSlug } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Params = { locale: string };

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  const h = await headers();
  const host = h.get("host") ?? "";
  if (isAdminHost(host)) {
    return <>{children}</>;
  }

  // Layouts can't read searchParams (Next.js caveat: layouts don't rerender
  // on navigation). Middleware mirrors ?site=<slug> into the x-vibe-site
  // header in dev so we can resolve the tenant here.
  const override = h.get("x-vibe-site") ?? undefined;
  const slug = await resolveTenant({ host, override });
  if (!slug) notFound();

  const { locale } = await params;
  if (!(await siteLocaleExists(slug, locale))) notFound();

  const locales = await listSiteLocales(slug);
  const content = await readSiteContent(slug, locale);

  // Show the floating admin toolbar only when the visitor is logged in and
  // authorised to edit this tenant. Session cookie is scoped to the parent
  // domain (.mauch.rocks) so it travels from studio.mauch.rocks here.
  const session = await readSession();
  const canEdit = !!session && canEditSlug(session, slug);
  const adminBase = (process.env.PUBLIC_URL ?? "").replace(/\/$/, "");
  const editUrl = adminBase
    ? `${adminBase}/admin/edit?site=${encodeURIComponent(slug)}&locale=${encodeURIComponent(locale)}`
    : `/admin/edit?site=${encodeURIComponent(slug)}&locale=${encodeURIComponent(locale)}`;

  return (
    <LocaleProvider value={locale}>
      <LanguageSwitcher locales={locales} current={locale} />
      {children}
      <Chatbot config={content.chatbot} locale={locale} />
      {canEdit && session && <SmartActionButton editUrl={editUrl} email={session.sub} />}
    </LocaleProvider>
  );
}
