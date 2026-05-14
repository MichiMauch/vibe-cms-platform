"use client";

import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

type Props = {
  label: string;
  helper?: string;
  id: string;
  value: string;
  onChange: (next: string) => void;
  onBlur: () => void;
  status: SaveStatus;
  errorMsg?: string | null;
  max?: number;
  recommended?: { min: number; max: number };
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
};

export function FieldWithCounter({
  label,
  helper,
  id,
  value,
  onChange,
  onBlur,
  status,
  errorMsg,
  max,
  recommended,
  multiline = false,
  rows = 3,
  placeholder,
}: Props) {
  const len = value.length;

  let counterColor = "text-slate-500";
  if (max && len > max) counterColor = "text-red-600";
  else if (recommended && len > recommended.max) counterColor = "text-amber-600";
  else if (recommended && len > 0 && len < recommended.min) counterColor = "text-amber-600";
  else if (recommended && len >= recommended.min && len <= recommended.max) counterColor = "text-emerald-600";

  const inputBase =
    "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition";

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-slate-900">
          {label}
        </label>
        <div className="flex items-center gap-2 text-xs">
          {status === "saving" && (
            <span className="inline-flex items-center gap-1 text-slate-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              Speichert
            </span>
          )}
          {status === "saved" && (
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="w-3 h-3" />
              Gespeichert
            </span>
          )}
          {status === "error" && (
            <span className="inline-flex items-center gap-1 text-red-600">
              <AlertCircle className="w-3 h-3" />
              {errorMsg ?? "Fehler"}
            </span>
          )}
          {(max || recommended) && (
            <span className={`tabular-nums ${counterColor}`}>
              {len}
              {max ? ` / ${max}` : recommended ? ` / ${recommended.max}` : ""}
            </span>
          )}
        </div>
      </div>
      {multiline ? (
        <textarea
          id={id}
          rows={rows}
          className={`${inputBase} resize-y min-h-[84px]`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
        />
      ) : (
        <input
          id={id}
          type="text"
          className={inputBase}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
        />
      )}
      {helper && <p className="text-xs text-slate-500">{helper}</p>}
    </div>
  );
}
