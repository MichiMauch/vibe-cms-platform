import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, AlertCircle } from "lucide-react";
import { readSession, canEditSlug } from "@/lib/auth";
import { listSites, getSite } from "@/lib/platform/registry";
import {
  listSiteLocales,
  readSiteContent,
  siteLocaleExists,
} from "@/lib/platform/site-content";
import { EditorClient } from "./EditorClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit",
  robots: { index: false, follow: false },
};

const DEFAULT_LOCALE = "de";

export default async function EditPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string; locale?: string }>;
}) {
  const session = await readSession();
  if (!session) return null;
  const sp = await searchParams;

  const allSites = await listSites();
  const editable = session.master
    ? allSites
    : allSites.filter((s) => session.slugs.includes(s.slug));

  if (editable.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Noch keine Site freigeschaltet</p>
            <p className="mt-1">
              Deine Email <code className="font-mono">{session.sub}</code> ist aktuell für keine
              Landingpage hinterlegt. Wende dich an den Administrator.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Site picker when no site selected and user has multiple
  if (!sp.site && editable.length > 1) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-lg font-semibold text-slate-900 mb-4">
          Wähle eine Site zum Editieren
        </h1>
        <ul className="space-y-2">
          {editable.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/admin/edit?site=${encodeURIComponent(s.slug)}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-blue-300 transition"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{s.config.brand}</p>
                  <p className="text-xs text-slate-500 font-mono">{s.slug}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            </li>
          ))}
        </ul>
      </main>
    );
  }

  // Resolve site (explicit or single editable)
  const slug = sp.site ?? editable[0].slug;
  if (!canEditSlug(session, slug)) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Zugriff verweigert</p>
            <p className="mt-1">Du hast keine Berechtigung, „{slug}" zu editieren.</p>
          </div>
        </div>
      </main>
    );
  }

  const site = await getSite(slug);
  if (!site) notFound();

  const locales = await listSiteLocales(slug);
  if (locales.length === 0) notFound();
  const locale = sp.locale && (await siteLocaleExists(slug, sp.locale))
    ? sp.locale
    : locales.includes(DEFAULT_LOCALE)
      ? DEFAULT_LOCALE
      : locales[0];

  const content = await readSiteContent(slug, locale);
  const isDev = process.env.NODE_ENV !== "production";
  const liveDomain = site.config.domains.find((d) => !d.startsWith("localhost"));
  const liveUrl = isDev
    ? `/${locale}?site=${encodeURIComponent(slug)}`
    : liveDomain
      ? `https://${liveDomain.split(":")[0]}/${locale}`
      : null;

  return (
    <EditorClient
      slug={slug}
      brand={site.config.brand}
      locale={locale}
      locales={locales}
      liveUrl={liveUrl}
      data={content}
      email={session.sub}
    />
  );
}
