import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FilePlus } from "lucide-react";
import { readSession } from "@/lib/auth";
import { NewSiteForm } from "./NewSiteForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Neue Site",
  robots: { index: false, follow: false },
};

export default async function NewSitePage() {
  const session = await readSession();
  if (!session?.master) redirect("/admin/edit");

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
          <FilePlus className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Neue Landingpage</h1>
          <p className="text-xs text-slate-500">
            AI scaffolded → Git committed → Cloudflare attached → Magic-Link an Kunden
          </p>
        </div>
      </div>
      <NewSiteForm />
    </main>
  );
}
