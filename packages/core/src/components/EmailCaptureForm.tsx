"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

type Props = {
  placeholder: string;
  submitLabel: string;
  /** URL the form POSTs `{ email }` to. Empty → demo mode (no network call). */
  endpoint: string;
  /** Theme `accent` and `image` Hero backgrounds need light-on-dark form
   * styling. The Hero passes this so the form picks the right palette. */
  invertOnDark?: boolean;
};

type State = "idle" | "submitting" | "success" | "error";

export function EmailCaptureForm({
  placeholder,
  submitLabel,
  endpoint,
  invertOnDark = false,
}: Props) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "submitting" || state === "success") return;
    setState("submitting");
    setErrorMsg(null);
    try {
      if (endpoint.trim()) {
        const res = await fetch(endpoint.trim(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else {
        await new Promise((r) => setTimeout(r, 600));
      }
      setState("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unbekannter Fehler");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-[var(--brand-radius-button)] px-5 py-3 text-sm font-medium ${
          invertOnDark
            ? "bg-white/15 text-brand-ink-inverse"
            : "bg-brand-surface text-brand-ink"
        }`}
      >
        <Check className="h-4 w-4" />
        <span>Eingetragen — danke!</span>
      </div>
    );
  }

  const inputClass = invertOnDark
    ? "bg-transparent text-brand-ink-inverse placeholder:text-brand-ink-inverse/60"
    : "bg-transparent text-brand-ink placeholder:text-brand-ink-subtle";
  const shellClass = invertOnDark
    ? "ring-1 ring-white/30 bg-white/10"
    : "ring-1 ring-brand-border bg-brand-bg";

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-md flex-col items-stretch gap-2">
      <div
        className={`flex items-center gap-2 rounded-[var(--brand-radius-button)] p-1.5 ${shellClass}`}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          disabled={state === "submitting"}
          className={`min-w-0 flex-1 border-0 px-3 py-2 text-sm outline-none ${inputClass}`}
        />
        <button
          type="submit"
          disabled={state === "submitting"}
          className="inline-flex items-center gap-1.5 rounded-[var(--brand-radius-button)] bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-accent-fg shadow-md shadow-brand-accent/20 hover:bg-brand-accent-hover transition disabled:opacity-60"
        >
          <span>{state === "submitting" ? "Sende…" : submitLabel}</span>
          {state !== "submitting" && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
      {state === "error" && errorMsg && (
        <p className={`text-xs ${invertOnDark ? "text-brand-ink-inverse/80" : "text-brand-ink-muted"}`}>
          Hat nicht geklappt: {errorMsg}
        </p>
      )}
    </form>
  );
}
