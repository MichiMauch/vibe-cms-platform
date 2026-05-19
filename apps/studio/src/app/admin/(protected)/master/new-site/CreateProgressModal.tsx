"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  Sparkles,
  X,
} from "lucide-react";
import { THEME_PRESETS, type ThemePreset, type ThemePresetId } from "@vibe-cms-platform/core/theme";

export type ProgressStep = { step: string; label: string };

export type SuccessPayload = {
  slug: string;
  previewUrl: string;
  customDomainUrl: string | null;
  magicLinkSent: boolean;
};

export type VibeSuggestion = {
  preset: ThemePresetId;
  rationale: string;
  confidence: "high" | "medium" | "low";
};

export type Stage =
  | { kind: "scaffolding" }
  | {
      kind: "vibe-review";
      suggestion: VibeSuggestion;
      manualPreset: ThemePresetId;
      chosenPreset: ThemePresetId;
    }
  | { kind: "creating" }
  | { kind: "done" }
  | { kind: "error" };

type Props = {
  open: boolean;
  stage: Stage;
  busy: boolean;
  steps: ProgressStep[];
  done: SuccessPayload | null;
  error: string | null;
  onChoosePreset: (preset: ThemePresetId) => void;
  onApproveVibe: () => void;
  onClose: () => void;
};

function PresetSwatch({ preset, size = "md" }: { preset: ThemePreset; size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-7" : "h-10";
  return (
    <div
      className={`${h} w-full rounded overflow-hidden flex border border-slate-200`}
      style={{ background: preset.colors["bg"] }}
    >
      <span className="flex-1" style={{ background: preset.colors["surface"] }} />
      <span className="flex-1" style={{ background: preset.colors["accent"] }} />
      <span className="flex-1" style={{ background: preset.colors["accent-2"] }} />
      <span className="flex-1" style={{ background: preset.colors["surface-dark"] }} />
    </div>
  );
}

const CONFIDENCE_PILL: Record<VibeSuggestion["confidence"], string> = {
  high: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-rose-100 text-rose-800",
};

const CONFIDENCE_LABEL: Record<VibeSuggestion["confidence"], string> = {
  high: "Hohe Konfidenz",
  medium: "Mittlere Konfidenz",
  low: "Niedrige Konfidenz",
};

export function CreateProgressModal({
  open,
  stage,
  busy,
  steps,
  done,
  error,
  onChoosePreset,
  onApproveVibe,
  onClose,
}: Props) {
  // Allow ESC to close only when no work is in flight. Vibe-review counts as
  // "not busy" because nothing has been written to disk yet.
  const closable = !busy && stage.kind !== "creating" && stage.kind !== "scaffolding";

  useEffect(() => {
    if (!open || !closable) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closable, onClose]);

  if (!open) return null;

  const title =
    stage.kind === "done" && done
      ? `🎉 „${done.slug}" angelegt`
      : stage.kind === "error"
        ? "Fehler beim Anlegen"
        : stage.kind === "vibe-review"
          ? "Design-Vorschlag prüfen"
          : stage.kind === "scaffolding"
            ? "AI generiert Inhalte …"
            : "Site wird angelegt …";

  const isWide = stage.kind === "vibe-review";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-busy={busy}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={() => {
        if (closable) onClose();
      }}
    >
      <div
        className={`w-full ${isWide ? "max-w-3xl" : "max-w-lg"} rounded-2xl bg-white p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={!closable}
            aria-label="Schliessen"
            className="-mr-1 -mt-1 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition disabled:opacity-30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scaffolding (initial AI run, no steps yet) ───────────────── */}
        {stage.kind === "scaffolding" && (
          <div className="mt-6 flex items-center gap-3 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            Generiere Inhalte mit AI …
          </div>
        )}

        {/* ── Vibe review (AI vs user pick + override grid) ───────────── */}
        {stage.kind === "vibe-review" && (
          <VibeReview
            suggestion={stage.suggestion}
            manualPreset={stage.manualPreset}
            chosenPreset={stage.chosenPreset}
            onChoosePreset={onChoosePreset}
            onApprove={onApproveVibe}
            onCancel={onClose}
          />
        )}

        {/* ── Creating / done / error ─────────────────────────────────── */}
        {(stage.kind === "creating" || stage.kind === "done" || stage.kind === "error") && (
          <>
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

            {done && stage.kind === "done" && (
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
              {stage.kind === "done" && (
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
                disabled={!closable && stage.kind === "creating"}
                className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50"
              >
                {stage.kind === "creating"
                  ? "Bitte warten …"
                  : stage.kind === "done"
                    ? "Schliessen"
                    : "OK"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function VibeReview({
  suggestion,
  manualPreset,
  chosenPreset,
  onChoosePreset,
  onApprove,
  onCancel,
}: {
  suggestion: VibeSuggestion;
  manualPreset: ThemePresetId;
  chosenPreset: ThemePresetId;
  onChoosePreset: (preset: ThemePresetId) => void;
  onApprove: () => void;
  onCancel: () => void;
}) {
  const aiPreset = THEME_PRESETS.find((p) => p.id === suggestion.preset)!;
  const userPreset = THEME_PRESETS.find((p) => p.id === manualPreset)!;

  return (
    <div className="mt-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {/* AI suggestion card */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-700">
              AI-Vorschlag
            </span>
            <span
              className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${CONFIDENCE_PILL[suggestion.confidence]}`}
              title={CONFIDENCE_LABEL[suggestion.confidence]}
            >
              {suggestion.confidence}
            </span>
          </div>
          <div className="mb-2"><PresetSwatch preset={aiPreset} /></div>
          <div className="text-sm font-semibold text-slate-900">{aiPreset.name}</div>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            {suggestion.rationale || aiPreset.description}
          </p>
        </div>

        {/* User pick card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Deine Wahl im Formular
            </span>
          </div>
          <div className="mb-2"><PresetSwatch preset={userPreset} /></div>
          <div className="text-sm font-semibold text-slate-900">{userPreset.name}</div>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">{userPreset.description}</p>
        </div>
      </div>

      {/* Override grid */}
      <div className="mt-5">
        <div className="mb-2 text-xs font-medium text-slate-700">
          Final wählen (Klick zum Wechseln):
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {THEME_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChoosePreset(p.id)}
              title={p.description}
              className={`flex flex-col gap-1.5 rounded-lg border p-2 text-left transition ${
                chosenPreset === p.id
                  ? "border-blue-500 ring-2 ring-blue-200 bg-white"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <PresetSwatch preset={p} size="sm" />
              <span className="text-[11px] font-medium text-slate-900 truncate">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          Zurück
        </button>
        <button
          type="button"
          onClick={onApprove}
          className="rounded-full bg-slate-900 px-5 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
        >
          Übernehmen &amp; Site anlegen
        </button>
      </div>
    </div>
  );
}
