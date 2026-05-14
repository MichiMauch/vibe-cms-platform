import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FilePlus } from "lucide-react";
import { NewPageForm } from "./NewPageForm";

export const metadata: Metadata = {
  title: "Neue Landingpage",
  robots: { index: false, follow: false },
};

export default function NewPagePage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <FilePlus className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">Neue Landingpage</h1>
              <p className="text-xs text-slate-500">
                GitHub + Cloudflare + AI — fertig in ~25 Sekunden.
              </p>
            </div>
          </div>
          <Link
            href="/admin/pages"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Übersicht
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <NewPageForm />
      </div>
    </main>
  );
}
