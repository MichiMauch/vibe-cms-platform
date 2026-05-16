"use client";

import { useState } from "react";
import {
  Sparkles,
  Wand2,
  Minus,
  Plus,
  Briefcase,
  Smile,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useLocale } from "../../components/LocaleProvider";

type Action = "improve" | "shorter" | "longer" | "formal" | "casual";

const ACTIONS: Array<{
  key: Action;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "improve", label: "Verbessern", hint: "Klarheit & Stil", icon: Wand2 },
  { key: "shorter", label: "Kürzer", hint: "~50%", icon: Minus },
  { key: "longer", label: "Länger", hint: "~150%", icon: Plus },
  { key: "formal", label: "Formeller", hint: "Professionell", icon: Briefcase },
  { key: "casual", label: "Lockerer", hint: "Friendlich", icon: Smile },
];

type Props = {
  value: string;
  onChange: (next: string) => void;
  /** Field name path (e.g. "title", "items.0.title"). Sent to /api/ai-rewrite
   * so the prompt sees the field semantics. */
  name: string;
  /** Tenant slug to scope the AI call. */
  slug: string;
};

/** Puck custom field: a plain text input plus AI-rewrite buttons that call
 * the existing /api/ai-rewrite endpoint. */
export function TextWithAIField({ value, onChange, name, slug }: Props) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stripped = value.replace(/<[^>]+>/g, "").trim();
  const empty = stripped.length === 0;

  async function run(action: Action) {
    if (busy || empty) return;
    setBusy(action);
    setError(null);
    try {
      const res = await fetch("/api/ai-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, path: name, action, locale, text: value }),
      });
      const json = await res.json();
      if (res.ok && json.ok && typeof json.text === "string") {
        onChange(json.text);
        setOpen(false);
      } else {
        setError(json.error ?? "AI-Aktion fehlgeschlagen");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI-Aktion fehlgeschlagen");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 pr-9 text-sm focus:border-blue-500 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setError(null);
        }}
        title={empty ? "Kein Text zum Bearbeiten" : "AI-Aktionen"}
        aria-label="AI-Aktionen"
        className={`absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full transition ${
          open ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white"
        }`}
      >
        <Sparkles className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-30 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              AI-Aktionen
            </p>
          </div>
          <ul className="py-1">
            {ACTIONS.map(({ key, label, hint, icon: Icon }) => {
              const isBusy = busy === key;
              const disabled = empty || (busy !== null && busy !== key);
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => run(key)}
                    disabled={disabled}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                      {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
                    </span>
                    <span className="flex-1">
                      <span className="block text-slate-900 font-medium">{label}</span>
                      <span className="block text-xs text-slate-500">{hint}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {empty && (
            <div className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
              Kein Text vorhanden — erst etwas schreiben.
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 border-t border-slate-100 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
