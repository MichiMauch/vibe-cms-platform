"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  X,
} from "lucide-react";

export type ProgressStep = { step: string; label: string };

export type SuccessPayload = {
  slug: string;
  previewUrl: string;
  customDomainUrl: string | null;
  magicLinkSent: boolean;
};

type Props = {
  open: boolean;
  busy: boolean;
  steps: ProgressStep[];
  done: SuccessPayload | null;
  error: string | null;
  /** Disabled while busy — the create stream isn't cancellable. */
  onClose: () => void;
};

export function CreateProgressModal({ open, busy, steps, done, error, onClose }: Props) {
  useEffect(() => {
    if (!open || busy) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const title = done
    ? `🎉 „${done.slug}" angelegt`
    : error
      ? "Fehler beim Anlegen"
      : "Site wird angelegt …";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-busy={busy}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Schliessen"
            className="-mr-1 -mt-1 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition disabled:opacity-30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {steps.length > 0 && (
          <ol className="mt-4 space-y-1.5 text-sm">
            {steps.map((s, i) => {
              const isLast = i === steps.length - 1;
              const isWarning = s.label.startsWith("⚠");
              const showSpinner = busy && isLast && !isWarning;
              return (
                <li
                  key={i}
                  className={`flex items-start gap-2 ${
                    isWarning ? "text-amber-700" : "text-slate-700"
                  }`}
                >
                  {showSpinner ? (
                    <Loader2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 animate-spin text-blue-500" />
                  ) : isWarning ? (
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                  )}
                  <span>{s.label}</span>
                </li>
              );
            })}
          </ol>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {done && (
          <div className="mt-4 space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
            <ul className="space-y-1.5">
              <li>
                <a
                  href={done.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-emerald-900 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> {done.previewUrl}
                </a>
              </li>
              {done.customDomainUrl && (
                <li>
                  <a
                    href={done.customDomainUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-900 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> {done.customDomainUrl}
                  </a>{" "}
                  <span className="text-emerald-700">(SSL provisioniert sich)</span>
                </li>
              )}
              {done.magicLinkSent && (
                <li className="inline-flex items-center gap-1.5 text-emerald-900">
                  <Mail className="h-3.5 w-3.5" /> Magic-Link an Kunden gesendet
                </li>
              )}
            </ul>
            <p className="pt-1 text-xs text-emerald-700">
              Cloudflare baut die Site jetzt im Hintergrund (~1–2 Min).
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          {done && (
            <Link
              href="/admin/master/sites"
              className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Alle Sites
            </Link>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50"
          >
            {busy ? "Bitte warten …" : done ? "Schliessen" : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
