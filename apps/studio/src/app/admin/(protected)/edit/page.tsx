import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, ArrowRight, AlertCircle } from "lucide-react";
import { readSession } from "@/lib/auth";
import { listSites } from "@/lib/platform/registry";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit",
  robots: { index: false, follow: false },
};

export default async function EditIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>;
}) {
  const session = await readSession();
  if (!session) return null; // layout already redirects, satisfies TS
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
              Deine Email <code className="font-mono">{session.sub}</code> ist aktuell für keine Landingpage hinterlegt.
              Wende dich an den Administrator.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // If they only edit one site OR have explicitly picked one → coming soon.
  // Phase 6 wires in the real BlockManager-based editor.
  if (sp.site || editable.length === 1) {
    const slug = sp.site ?? editable[0].slug;
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <Pencil className="h-5 w-5 text-blue-600" /> Editor: {slug}
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Der Inline-Editor wird in der nächsten Phase verkabelt. Aktuell ist die Auth + Tenant-Auflösung fertig.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-lg font-semibold text-slate-900 mb-4">Wähle eine Site zum Editieren</h1>
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
