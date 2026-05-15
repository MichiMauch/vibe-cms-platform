import type { Metadata } from "next";
import { LogIn } from "lucide-react";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Login",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  "missing-token": "Login-Link unvollständig — bitte erneut anfordern.",
  "invalid-token": "Login-Link ist ungültig oder abgelaufen — bitte erneut anfordern.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const error = sp.error ? ERRORS[sp.error] ?? "Login fehlgeschlagen." : undefined;

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl ring-1 ring-slate-900/5 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <LogIn className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Vibe-CMS Login</h1>
              <p className="text-xs text-slate-500">Magic-Link an deine E-Mail</p>
            </div>
          </div>
          <LoginForm initialError={error} />
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">
          Keine Passwörter. Du erhältst einen Link per E-Mail, der dich einloggt.
        </p>
      </div>
    </main>
  );
}
