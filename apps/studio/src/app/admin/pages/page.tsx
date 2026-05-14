import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Globe, ExternalLink, Plus, Code2 } from "lucide-react";
import { listPages } from "@/lib/platform/registry";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pages",
  robots: { index: false, follow: false },
};

export default async function PagesAdminPage() {
  const pages = await listPages();
  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">Landingpages</h1>
              <p className="text-xs text-slate-500">
                Alle vom Studio orchestrierten Pages auf einen Blick.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/new-page"
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Neue Page
            </Link>
            <Link
              href="/de"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Demo-Page
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-10">
        {pages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-sm text-slate-600">
              Noch keine Pages.{" "}
              <Link href="/admin/new-page" className="font-medium text-blue-700 hover:underline">
                Erstelle die erste
              </Link>
              .
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {pages
              .slice()
              .reverse()
              .map((p) => (
                <li
                  key={p.slug}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-slate-900 truncate">
                        {p.slug}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-600">
                        {p.template}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {p.brand} · erstellt {new Date(p.createdAt).toLocaleString("de-CH")}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <a
                      href={`https://${p.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-slate-400 transition"
                    >
                      <ExternalLink className="h-3 w-3" /> {p.domain}
                    </a>
                    <a
                      href={p.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:border-slate-400 transition"
                    >
                      <Code2 className="h-3 w-3" /> Repo
                    </a>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </main>
  );
}
