import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Layers, Plus, ExternalLink, Pencil, Monitor } from "lucide-react";
import { readSession } from "@/lib/auth";
import { listSites } from "@/lib/platform/registry";
import { listSiteLocales } from "@/lib/platform/site-content";
import { DeleteSiteButton } from "./DeleteSiteButton";

const TENANT_PREVIEW_URL =
  process.env.NEXT_PUBLIC_TENANT_URL?.replace(/\/+$/, "") || "http://localhost:3031";
const IS_DEV = process.env.NODE_ENV !== "production";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sites",
  robots: { index: false, follow: false },
};

export default async function MasterSitesPage() {
  const session = await readSession();
  if (!session?.master) redirect("/admin/edit");

  const sites = await listSites();
  // For each site, pick a locale to deep-link the local preview to.
  // Prefer "de", else the first locale found on disk.
  const previewLocales = await Promise.all(
    sites.map(async (s) => {
      const locales = await listSiteLocales(s.slug);
      if (locales.includes("de")) return "de";
      return locales[0] ?? "de";
    }),
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Layers className="h-5 w-5 text-blue-600" /> Alle Sites ({sites.length})
        </h1>
        <Link
          href="/admin/master/new-site"
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
        >
          <Plus className="h-3.5 w-3.5" /> Neue Site
        </Link>
      </div>

      {sites.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-slate-600">
            Noch keine Sites.{" "}
            <Link href="/admin/master/new-site" className="font-medium text-blue-700 hover:underline">
              Erstelle die erste
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sites.map((s, idx) => {
            const previewLocale = previewLocales[idx];
            const pageCount = s.config.pages?.length ?? 1;
            const localPreviewHref = `${TENANT_PREVIEW_URL}/${s.slug}/${previewLocale}/`;
            return (
              <li
                key={s.slug}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 truncate">{s.config.brand}</span>
                    <span className="font-mono text-xs text-slate-500">{s.slug}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {pageCount} Seite{pageCount === 1 ? "" : "n"} ·{" "}
                    {s.config.domains.length} Domain{s.config.domains.length === 1 ? "" : "s"} ·{" "}
                    {s.access.users.length} Editor{s.access.users.length === 1 ? "" : "en"}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {IS_DEV && (
                    <a
                      href={localPreviewHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-emerald-800 hover:border-emerald-400 transition"
                      title="Lokale Tenant-Vorschau"
                      style={{ cursor: "pointer" }}
                    >
                      <Monitor className="h-3 w-3" /> Lokal
                    </a>
                  )}
                  {s.config.domains
                    .filter((d) => !d.startsWith("localhost"))
                    .map((d) => (
                      <a
                        key={d}
                        href={`https://${d.split(":")[0]}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-slate-400 transition"
                        style={{ cursor: "pointer" }}
                      >
                        <ExternalLink className="h-3 w-3" /> {d}
                      </a>
                    ))}
                  <Link
                    href={`/admin/edit?site=${encodeURIComponent(s.slug)}`}
                    className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-3 py-1.5 text-blue-800 hover:border-blue-400 transition"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </Link>
                  <DeleteSiteButton slug={s.slug} brand={s.config.brand} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
