import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, Layers, FilePlus, Pencil } from "lucide-react";
import { readSession } from "@/lib/auth";
import { FeedbackProvider } from "@/components/Feedback";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <FeedbackProvider>
      <div className="min-h-screen bg-slate-100">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/admin/edit" className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 transition">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
              {session.master && (
                <>
                  <span className="mx-1 text-slate-300">|</span>
                  <Link href="/admin/master/sites" className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 transition">
                    <Layers className="h-3.5 w-3.5" /> Sites
                  </Link>
                  <Link href="/admin/master/new-site" className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 transition">
                    <FilePlus className="h-3.5 w-3.5" /> Neue Site
                  </Link>
                </>
              )}
            </nav>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500">{session.sub}</span>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 hover:border-slate-400 transition"
                >
                  <LogOut className="h-3 w-3" /> Logout
                </button>
              </form>
            </div>
          </div>
        </header>
        {children}
      </div>
    </FeedbackProvider>
  );
}
