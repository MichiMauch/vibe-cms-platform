"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

// ─── Toast ──────────────────────────────────────────────────────────────────

type ToastKind = "success" | "error" | "info";
type Toast = { id: string; kind: ToastKind; message: string };

type ToastApi = {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
};

const ToastCtx = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    throw new Error("useToast must be used inside <FeedbackProvider>");
  }
  return ctx;
}

const TOAST_TTL = 4500;

/** Mount this once at the admin root. Wraps children, exposes useToast(),
 * and renders the toast stack + any confirm dialog above everything else. */
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    setToasts((curr) => [...curr, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((curr) => curr.filter((t) => t.id !== id));
    }, TOAST_TTL);
  }, []);

  const api: ToastApi = {
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-[100] flex flex-col items-end gap-2"
      >
        {toasts.map((t) => (
          <ToastBubble
            key={t.id}
            toast={t}
            onDismiss={() => setToasts((curr) => curr.filter((x) => x.id !== t.id))}
          />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastBubble({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const cls =
    toast.kind === "success"
      ? "bg-emerald-500 text-white"
      : toast.kind === "error"
        ? "bg-red-600 text-white"
        : "bg-slate-900 text-white";
  const Icon =
    toast.kind === "success" ? CheckCircle2 : toast.kind === "error" ? AlertCircle : Info;

  return (
    <div
      role="status"
      className={`inline-flex max-w-md items-start gap-2 rounded-2xl px-4 py-2.5 text-sm shadow-lg shadow-black/20 ${cls}`}
    >
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span className="break-words">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-1 -mr-1 rounded-full p-0.5 opacity-70 hover:opacity-100 transition"
        aria-label="Schliessen"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Confirm dialog ─────────────────────────────────────────────────────────

type ConfirmProps = {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red styling on the confirm button — use for destructive actions. */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Controlled modal — caller owns the open state. Escapes close it. */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Bestätigen",
  cancelLabel = "Abbrechen",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-base font-semibold text-slate-900">
          {title}
        </h2>
        {body && (
          <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{body}</p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold text-white transition ${
              danger ? "bg-red-600 hover:bg-red-500" : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Prompt dialog (one text input) ─────────────────────────────────────────

type PromptProps = {
  open: boolean;
  title: string;
  body?: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
};

/** Minimal single-input modal — replaces window.prompt. */
export function PromptDialog({
  open,
  title,
  body,
  initialValue = "",
  placeholder,
  confirmLabel = "OK",
  cancelLabel = "Abbrechen",
  onConfirm,
  onCancel,
}: PromptProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onConfirm(value);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-title"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="prompt-title" className="text-base font-semibold text-slate-900">
          {title}
        </h2>
        {body && <p className="mt-2 text-sm text-slate-600">{body}</p>}
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
