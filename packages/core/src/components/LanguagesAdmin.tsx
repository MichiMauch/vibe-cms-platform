"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { localeName, localeFlag, DEFAULT_LOCALE } from "../i18n/locales";

type Props = {
  initialLocales: string[];
  hasOpenAiKey: boolean;
};

export function LanguagesAdmin({ initialLocales, hasOpenAiKey }: Props) {
  const [locales, setLocales] = useState(initialLocales);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [progressText, setProgressText] = useState<string>("");
  const [askDelete, setAskDelete] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startProgress(targetName: string) {
    const stages = [
      `Liest ${localeName(DEFAULT_LOCALE, DEFAULT_LOCALE)}-Inhalte ein …`,
      `Sendet Texte an OpenAI für ${targetName} …`,
      `OpenAI übersetzt — das kann 10–30 Sekunden dauern …`,
      `Wartet auf Übersetzung von ${targetName} …`,
      `Fast fertig — schreibt messages/${code}.json …`,
    ];
    let i = 0;
    setProgressText(stages[0]);
    intervalRef.current = setInterval(() => {
      i = Math.min(i + 1, stages.length - 1);
      setProgressText(stages[i]);
    }, 4000);
  }

  function stopProgress() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setProgressText("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = code.trim().toLowerCase();
    if (!/^[a-z]{2}(-[a-z]{2})?$/i.test(cleaned)) {
      setStatus("error");
      setMessage("Ungültiger ISO-Code. Erwartet z.B. 'fr' oder 'pt-BR'.");
      return;
    }
    const normalized =
      cleaned.length === 5
        ? `${cleaned.slice(0, 2).toLowerCase()}-${cleaned.slice(3, 5).toUpperCase()}`
        : cleaned.toLowerCase();

    if (locales.includes(normalized)) {
      setStatus("error");
      setMessage(`Sprache "${normalized}" existiert bereits.`);
      return;
    }

    const targetName = localeName(normalized, DEFAULT_LOCALE);
    setStatus("generating");
    setMessage(`Sprache "${targetName}" wird generiert …`);
    startProgress(targetName);

    try {
      const res = await fetch("/api/add-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: normalized }),
      });
      const json = await res.json();
      stopProgress();
      if (res.ok && json.ok) {
        setLocales((l) => [...l, normalized].sort());
        setStatus("success");
        setMessage(`"${targetName}" ist jetzt unter /${normalized} erreichbar.`);
        setCode("");
      } else {
        setStatus("error");
        setMessage(json.error ?? "Generierung fehlgeschlagen");
      }
    } catch (err) {
      stopProgress();
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Generierung fehlgeschlagen");
    }
  }

  async function remove(target: string) {
    if (target === DEFAULT_LOCALE) return;
    const targetName = localeName(target, DEFAULT_LOCALE);
    try {
      const res = await fetch(`/api/add-language?locale=${encodeURIComponent(target)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setLocales((l) => l.filter((c) => c !== target));
        setStatus("success");
        setMessage(`"${targetName}" gelöscht.`);
      } else {
        setStatus("error");
        setMessage(json.error ?? "Löschen fehlgeschlagen");
      }
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Löschen fehlgeschlagen");
    }
  }

  const busy = status === "generating";

  return (
    <div className="space-y-8">
      {!hasOpenAiKey && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">OPENAI_API_KEY fehlt</p>
              <p className="mt-1 text-amber-800">
                Trag deinen OpenAI-API-Key in <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">.env.local</code> ein
                und starte den Dev-Server neu. Ohne den Key schlägt die Übersetzung fehl.
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-blue-600 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Neue Sprache hinzufügen
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Gib einen ISO-Sprachcode ein (z.B. <code className="font-mono text-xs">fr</code>,{" "}
          <code className="font-mono text-xs">it</code>, <code className="font-mono text-xs">pt-BR</code>).
          OpenAI übersetzt deine gesamte <code className="font-mono text-xs">messages/{DEFAULT_LOCALE}.json</code> in die neue Sprache.
        </p>

        <form onSubmit={submit} className="mt-5 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ISO-Code, z.B. it"
            disabled={busy}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500 transition sm:max-w-xs"
            autoFocus
          />
          <button
            type="submit"
            disabled={busy || code.trim().length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generiert …
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Sprache hinzufügen
              </>
            )}
          </button>
        </form>

        {message && (
          <div
            className={`mt-5 flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${
              status === "success"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                : status === "error"
                  ? "bg-red-50 text-red-900 border border-red-200"
                  : "bg-blue-50 text-blue-900 border border-blue-200"
            }`}
          >
            {status === "generating" ? (
              <Loader2 className="mt-0.5 h-4 w-4 flex-shrink-0 animate-spin text-blue-600" />
            ) : status === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
            )}
            <div className="flex-1">
              <p className="font-medium">{message}</p>
              {progressText && <p className="mt-0.5 text-xs opacity-75">{progressText}</p>}
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-600 mb-4">
          Aktuelle Sprachen ({locales.length})
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {locales.map((code) => (
            <li
              key={code}
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl leading-none">{localeFlag(code)}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {localeName(code, DEFAULT_LOCALE)}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">{code}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={`/${code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  aria-label={`/${code} öffnen`}
                  title={`/${code} öffnen`}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                {code !== DEFAULT_LOCALE && (
                  <button
                    type="button"
                    onClick={() => setAskDelete(code)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                    aria-label={`${code} löschen`}
                    title={`${code} löschen`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {askDelete && (
        <InlineConfirm
          title={`Sprache "${localeName(askDelete, DEFAULT_LOCALE)}" wirklich löschen?`}
          body={`Die Datei messages/${askDelete}.json wird gelöscht.`}
          onCancel={() => setAskDelete(null)}
          onConfirm={() => {
            const target = askDelete;
            setAskDelete(null);
            void remove(target);
          }}
        />
      )}
    </div>
  );
}

function InlineConfirm({
  title,
  body,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-500 transition"
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}
