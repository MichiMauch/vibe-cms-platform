"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, AlertCircle, MessageCircle } from "lucide-react";
import type { Chatbot } from "../../types/content";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function ChatbotForm({ initial, locale }: { initial: Chatbot; locale: string }) {
  const [values, setValues] = useState<Chatbot>(initial);
  const savedRef = useRef<Chatbot>(initial);
  const [status, setStatus] = useState<Record<keyof Chatbot, SaveStatus>>({
    isEnabled: "idle",
    botName: "idle",
    welcomeMessage: "idle",
  });
  const [errors, setErrors] = useState<Record<keyof Chatbot, string | null>>({
    isEnabled: null,
    botName: null,
    welcomeMessage: null,
  });

  useEffect(() => {
    const timers = (Object.keys(status) as Array<keyof Chatbot>)
      .filter((k) => status[k] === "saved")
      .map((k) => setTimeout(() => setStatus((s) => ({ ...s, [k]: "idle" })), 1500));
    return () => timers.forEach(clearTimeout);
  }, [status]);

  async function save<K extends keyof Chatbot>(key: K, value: Chatbot[K]) {
    if (value === savedRef.current[key]) return;
    setStatus((s) => ({ ...s, [key]: "saving" }));
    setErrors((e) => ({ ...e, [key]: null }));
    try {
      const res = await fetch("/api/save-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: `chatbot.${key}`, value, locale }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        savedRef.current = { ...savedRef.current, [key]: value };
        setStatus((s) => ({ ...s, [key]: "saved" }));
      } else {
        setStatus((s) => ({ ...s, [key]: "error" }));
        setErrors((e) => ({ ...e, [key]: json.error ?? "Fehler" }));
      }
    } catch (err) {
      setStatus((s) => ({ ...s, [key]: "error" }));
      setErrors((e) => ({ ...e, [key]: err instanceof Error ? err.message : "Fehler" }));
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Chatbot aktiv</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Wenn aktiv, erscheint die Sprechblase unten rechts auf der Seite.
              </p>
            </div>
          </div>
          <Toggle
            checked={values.isEnabled}
            onChange={(v) => {
              setValues((s) => ({ ...s, isEnabled: v }));
              save("isEnabled", v);
            }}
          />
        </div>
        <StatusLine status={status.isEnabled} error={errors.isEnabled} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="botName" className="text-sm font-medium text-slate-900">
              Name des Bots
            </label>
            <StatusBadge status={status.botName} error={errors.botName} length={values.botName.length} max={40} />
          </div>
          <input
            id="botName"
            type="text"
            value={values.botName}
            onChange={(e) => setValues((s) => ({ ...s, botName: e.target.value }))}
            onBlur={() => save("botName", values.botName)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
            maxLength={50}
          />
          <p className="text-xs text-slate-500">
            Erscheint im Chat-Header und als Absender.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="welcomeMessage" className="text-sm font-medium text-slate-900">
              Begrüssung
            </label>
            <StatusBadge
              status={status.welcomeMessage}
              error={errors.welcomeMessage}
              length={values.welcomeMessage.length}
              max={200}
            />
          </div>
          <textarea
            id="welcomeMessage"
            rows={3}
            value={values.welcomeMessage}
            onChange={(e) => setValues((s) => ({ ...s, welcomeMessage: e.target.value }))}
            onBlur={() => save("welcomeMessage", values.welcomeMessage)}
            className="w-full resize-y min-h-[84px] rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
            maxLength={240}
          />
          <p className="text-xs text-slate-500">
            Erste Nachricht, die der Bot beim Öffnen anzeigt.
          </p>
        </div>
      </section>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition ${
        checked ? "bg-blue-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function StatusLine({ status, error }: { status: SaveStatus; error: string | null }) {
  if (status === "idle") return null;
  return (
    <div className="mt-3 text-xs">
      {status === "saving" && (
        <span className="inline-flex items-center gap-1 text-slate-500">
          <Loader2 className="h-3 w-3 animate-spin" /> Speichert
        </span>
      )}
      {status === "saved" && (
        <span className="inline-flex items-center gap-1 text-emerald-600">
          <CheckCircle2 className="h-3 w-3" /> Gespeichert
        </span>
      )}
      {status === "error" && (
        <span className="inline-flex items-center gap-1 text-red-600">
          <AlertCircle className="h-3 w-3" /> {error ?? "Fehler"}
        </span>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  error,
  length,
  max,
}: {
  status: SaveStatus;
  error: string | null;
  length: number;
  max: number;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {status === "saving" && (
        <span className="inline-flex items-center gap-1 text-slate-500">
          <Loader2 className="h-3 w-3 animate-spin" /> Speichert
        </span>
      )}
      {status === "saved" && (
        <span className="inline-flex items-center gap-1 text-emerald-600">
          <CheckCircle2 className="h-3 w-3" /> Gespeichert
        </span>
      )}
      {status === "error" && (
        <span className="inline-flex items-center gap-1 text-red-600">
          <AlertCircle className="h-3 w-3" /> {error ?? "Fehler"}
        </span>
      )}
      <span className={`tabular-nums ${length > max ? "text-red-600" : "text-slate-400"}`}>
        {length} / {max}
      </span>
    </div>
  );
}
