"use client";

import { useEffect, useRef, useState } from "react";
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
import { useEditMode } from "./EditModeProvider";
import { useLocale } from "../components/LocaleProvider";

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
  path: string;
  value: string;
  onUpdate: (next: string) => void;
};

export function AIActionsOverlay({ path, value, onUpdate }: Props) {
  const { editMode } = useEditMode();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!popoverRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setError(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  if (!editMode) return null;

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
        body: JSON.stringify({ path, action, locale, text: value }),
      });
      const json = await res.json();
      if (res.ok && json.ok && typeof json.text === "string") {
        onUpdate(json.text);
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
    <div ref={popoverRef} className="absolute top-1 right-1 z-30">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
          setError(null);
        }}
        title={empty ? "Kein Text zum Bearbeiten" : "AI-Aktionen"}
        aria-label="AI-Aktionen"
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/85 text-white shadow-md ring-1 ring-white/10 backdrop-blur transition opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-blue-600 ${
          open ? "opacity-100 bg-blue-600" : ""
        }`}
      >
        <Sparkles className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute top-9 right-0 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5">
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
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => run(key)}
                    disabled={disabled}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                      {isBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Icon className="h-3.5 w-3.5" />
                      )}
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
