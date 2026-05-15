import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Layers, Plus, ExternalLink, Pencil } from "lucide-react";
import { readSession } from "@/lib/auth";
import { listSites } from "@/lib/platform/registry";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sites",
  robots: { index: false, follow: false },
};

export default async function MasterSitesPage() {
  const session = await readSession();
  if (!session?.master) redirect("/admin/edit");

  const sites = await listSites();

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
          {sites.map((s) => (
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
                  {s.config.domains.length} Domain{s.config.domains.length === 1 ? "" : "s"} ·{" "}
                  {s.access.users.length} Editor{s.access.users.length === 1 ? "" : "en"}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {s.config.domains.map((d) => (
                  <a
                    key={d}
                    href={`https://${d.split(":")[0]}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-slate-400 transition"
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
