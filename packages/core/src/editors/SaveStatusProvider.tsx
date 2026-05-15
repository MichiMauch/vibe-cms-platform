"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";

type State = "idle" | "saving" | "saved" | "error";
type Warning = "github-sync-failed" | "unpublished" | null;

type SaveStatus = {
  state: State;
  error: string | null;
  warning: Warning;
  lastSavedAt: number | null;
  inFlight: number;
};

type InternalState = SaveStatus & { lastCompletedId: number };

type Action =
  | { type: "begin"; id: number }
  | { type: "succeed"; id: number; warning: Warning; at: number }
  | { type: "fail"; id: number; error: string }
  | { type: "clear" }
  | { type: "dismiss-error" }
  | { type: "clear-warning" };

const initialState: InternalState = {
  state: "idle",
  error: null,
  warning: null,
  lastSavedAt: null,
  inFlight: 0,
  lastCompletedId: 0,
};

function reducer(s: InternalState, a: Action): InternalState {
  switch (a.type) {
    case "begin":
      return { ...s, state: "saving", error: null, inFlight: s.inFlight + 1 };

    case "succeed": {
      const remaining = Math.max(0, s.inFlight - 1);
      // Out-of-order: an older save resolved after a newer completion — just
      // decrement the counter, leave state alone.
      if (a.id < s.lastCompletedId) return { ...s, inFlight: remaining };
      return {
        ...s,
        state: remaining > 0 ? "saving" : "saved",
        error: null,
        warning: a.warning,
        lastSavedAt: a.at,
        inFlight: remaining,
        lastCompletedId: a.id,
      };
    }

    case "fail": {
      const remaining = Math.max(0, s.inFlight - 1);
      // Ignore stale failure if a newer save already succeeded.
      if (a.id < s.lastCompletedId) return { ...s, inFlight: remaining };
      return {
        ...s,
        state: "error",
        error: a.error,
        inFlight: remaining,
        lastCompletedId: a.id,
      };
    }

    case "clear":
      if (s.state !== "saved") return s;
      return { ...s, state: "idle" };

    case "dismiss-error":
      if (s.state !== "error") return s;
      return { ...s, state: "idle", error: null };

    case "clear-warning":
      if (s.warning === null) return s;
      return { ...s, warning: null };

    default:
      return s;
  }
}

type Api = {
  status: SaveStatus;
  wrap: <T extends Response>(p: Promise<T>) => Promise<T>;
  dismissError: () => void;
  /** Called after a successful Publish — clears the "unpublished" warning so
   * the indicator no longer flags the now-published draft. */
  clearWarning: () => void;
};

const SaveStatusCtx = createContext<Api | null>(null);

export function SaveStatusProvider({ children }: { children: React.ReactNode }) {
  const [s, dispatch] = useReducer(reducer, initialState);
  const idRef = useRef(0);

  useEffect(() => {
    if (s.state !== "saved") return;
    const t = setTimeout(() => dispatch({ type: "clear" }), 1500);
    return () => clearTimeout(t);
  }, [s.state, s.lastSavedAt]);

  const wrap = useCallback(async <T extends Response>(p: Promise<T>): Promise<T> => {
    const id = ++idRef.current;
    dispatch({ type: "begin", id });
    try {
      const res = await p;
      let warning: Warning = null;
      try {
        const j = await res.clone().json();
        if (j && j.draft === true) {
          warning = "unpublished";
        } else if (j && typeof j.committed === "boolean" && j.committed === false) {
          warning = "github-sync-failed";
        }
        if (!res.ok || (j && j.ok === false)) {
          const msg =
            (j && typeof j.error === "string" && j.error) ||
            `Speichern fehlgeschlagen (${res.status})`;
          dispatch({ type: "fail", id, error: msg });
          return res;
        }
      } catch {
        if (!res.ok) {
          dispatch({
            type: "fail",
            id,
            error: `Speichern fehlgeschlagen (${res.status})`,
          });
          return res;
        }
      }
      dispatch({ type: "succeed", id, warning, at: Date.now() });
      return res;
    } catch (err) {
      dispatch({
        type: "fail",
        id,
        error: err instanceof Error ? err.message : "Netzwerkfehler",
      });
      throw err;
    }
  }, []);

  const dismissError = useCallback(() => dispatch({ type: "dismiss-error" }), []);
  const clearWarning = useCallback(() => dispatch({ type: "clear-warning" }), []);

  const api = useMemo<Api>(
    () => ({
      status: {
        state: s.state,
        error: s.error,
        warning: s.warning,
        lastSavedAt: s.lastSavedAt,
        inFlight: s.inFlight,
      },
      wrap,
      dismissError,
      clearWarning,
    }),
    [s.state, s.error, s.warning, s.lastSavedAt, s.inFlight, wrap, dismissError, clearWarning],
  );

  return <SaveStatusCtx.Provider value={api}>{children}</SaveStatusCtx.Provider>;
}

export function useSaveStatus(): Api | null {
  return useContext(SaveStatusCtx);
}

const REL =
  typeof Intl !== "undefined" && typeof Intl.RelativeTimeFormat === "function"
    ? new Intl.RelativeTimeFormat("de", { numeric: "auto" })
    : null;

function formatAgo(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 5) return "gerade eben";
  if (s < 60) return REL ? REL.format(-s, "second") : `vor ${s} Sek.`;
  const m = Math.floor(s / 60);
  if (m < 60) return REL ? REL.format(-m, "minute") : `vor ${m} Min.`;
  const h = Math.floor(m / 60);
  return REL ? REL.format(-h, "hour") : `vor ${h} Std.`;
}

const VARIANTS = {
  light: {
    saving: "text-blue-700",
    saved: "text-emerald-700",
    savedIcon: "text-emerald-600",
    idle: "text-slate-600",
    error: "text-red-600",
    errorIcon: "text-red-500",
    errorBtnHover: "hover:bg-red-100",
    warningIcon: "text-amber-500",
  },
  dark: {
    saving: "text-blue-300",
    saved: "text-emerald-300",
    savedIcon: "text-emerald-400",
    idle: "text-slate-300",
    error: "text-red-300",
    errorIcon: "text-red-200",
    errorBtnHover: "hover:bg-white/10",
    warningIcon: "text-amber-300",
  },
} as const;

export function SaveStatusIndicator({ variant = "light" }: { variant?: "light" | "dark" } = {}) {
  const api = useSaveStatus();
  const [now, setNow] = useState(() => Date.now());
  const colors = VARIANTS[variant];

  const lastSavedAt = api?.status.lastSavedAt ?? null;
  const state = api?.status.state ?? "idle";

  useEffect(() => {
    if (state !== "idle" || lastSavedAt === null) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, [state, lastSavedAt]);

  if (!api) return null;
  const { error, warning } = api.status;

  if (state === "idle" && lastSavedAt === null) return null;

  if (state === "saving") {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs ${colors.saving}`}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Speichert…
      </span>
    );
  }

  if (state === "error") {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs ${colors.error}`}>
        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="truncate max-w-[180px]" title={error ?? ""}>
          {error ?? "Fehler"}
        </span>
        <button
          type="button"
          onClick={api.dismissError}
          className={`inline-flex h-4 w-4 items-center justify-center rounded ${colors.errorIcon} ${colors.errorBtnHover}`}
          aria-label="Fehler ausblenden"
          title="Fehler ausblenden"
        >
          <X className="h-3 w-3" />
        </button>
      </span>
    );
  }

  // saved or idle (with lastSavedAt)
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <CheckCircle2 className={`h-3.5 w-3.5 ${colors.savedIcon}`} />
      {state === "saved" ? (
        <span className={colors.saved}>Gespeichert</span>
      ) : (
        <span className={colors.idle}>
          Gespeichert · {lastSavedAt ? formatAgo(now - lastSavedAt) : ""}
        </span>
      )}
      {warning === "unpublished" && (
        <span
          title="Lokal als Entwurf gespeichert. Klick auf 'Publish', um zu veröffentlichen."
          className="inline-flex items-center"
        >
          <AlertTriangle
            className={`h-3.5 w-3.5 ${colors.warningIcon}`}
            aria-label="Unveröffentlicht"
          />
        </span>
      )}
      {warning === "github-sync-failed" && (
        <span
          title="Lokal gespeichert, aber Sync zu GitHub fehlgeschlagen. Änderung überlebt den nächsten Redeploy nicht."
          className="inline-flex items-center"
        >
          <AlertTriangle
            className={`h-3.5 w-3.5 ${colors.warningIcon}`}
            aria-label="Sync zu GitHub fehlgeschlagen"
          />
        </span>
      )}
    </span>
  );
}
