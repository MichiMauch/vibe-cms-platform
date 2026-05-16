"use client";

import { useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, LogOut, Pencil, Upload } from "lucide-react";

type EditMode = {
  /** Tenant slug — passed through for telemetry / labelling. */
  publishSlug: string;
  /** Locale currently being edited. */
  currentLocale: string;
  /** All available locales for the locale picker. */
  locales: string[];
  /** Called when the user picks another locale from the dropdown. */
  onSwitchLocale: (target: string) => void;
  /** Absolute URL to the public version of the current page, or null. */
  liveUrl: string | null;
  /** Site slug shown as a small label so master users know which site they edit. */
  siteLabel?: string;
  /** Async publish action. The editor owns the data tree and decides what to send. */
  publish: () => Promise<{ ok: boolean; error?: string }>;
  /** Reserved for future use — kept for backward-compat with older callers. */
  initialPendingLocales?: string[];
};

type Props = {
  email: string;
  /** Public-mode (visitor logged in, viewing tenant page): jumps to the editor. */
  editUrl?: string;
  /** Edit-mode (inside /admin/edit): show publish, locale, live, logout. */
  editMode?: EditMode;
};

export function SmartActionButton({ email, editUrl, editMode }: Props) {
  const isEdit = !!editMode;
  return (
    <div
      role="toolbar"
      aria-label={isEdit ? "Editor actions" : "Admin actions"}
      className="fixed bottom-6 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/95 px-2 py-1.5 shadow-xl shadow-black/30 backdrop-blur"
    >
      <span
        title={email}
        className="ml-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white"
      >
        {(email[0] ?? "?").toUpperCase()}
      </span>

      {isEdit && editMode ? (
        <EditModeContents editMode={editMode} />
      ) : (
        <>
          {editUrl && (
            <a
              href={editUrl}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10"
              title="Diese Seite bearbeiten"
              aria-label="Bearbeiten"
            >
              <Pencil className="h-4 w-4" />
            </a>
          )}
          <form action="/api/auth/logout" method="POST" className="inline-flex">
            <button
              type="submit"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10"
              title="Abmelden"
              aria-label="Abmelden"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}

function EditModeContents({ editMode }: { editMode: EditMode }) {
  const { currentLocale, locales, onSwitchLocale, liveUrl, siteLabel, publish } = editMode;
  return (
    <>
      {siteLabel && (
        <span className="hidden sm:inline-flex items-center gap-1 px-1 text-[11px] font-mono text-slate-300">
          {siteLabel}
        </span>
      )}
      <span className="h-5 w-px bg-white/15" aria-hidden />
      <PublishPill publish={publish} />
      {locales.length > 1 && (
        <select
          value={currentLocale}
          onChange={(e) => onSwitchLocale(e.target.value)}
          aria-label="Sprache"
          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium text-white outline-none hover:bg-white/10 focus:border-white/30"
        >
          {locales.map((l) => (
            <option key={l} value={l} className="bg-slate-900 text-white">
              {l.toUpperCase()}
            </option>
          ))}
        </select>
      )}
      {liveUrl && (
        <a
          href={liveUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10"
          title="Live ansehen"
          aria-label="Live ansehen"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
      <form action="/api/auth/logout" method="POST" className="inline-flex">
        <button
          type="submit"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10"
          title="Abmelden"
          aria-label="Abmelden"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </form>
    </>
  );
}

type PublishState = "idle" | "publishing" | "done" | "error";

function PublishPill({ publish }: { publish: () => Promise<{ ok: boolean; error?: string }> }) {
  const [state, setState] = useState<PublishState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setState("publishing");
    setError(null);
    const { ok, error } = await publish();
    if (!ok) {
      setState("error");
      setError(error ?? "Publish fehlgeschlagen");
      return;
    }
    setState("done");
    setTimeout(() => setState("idle"), 1500);
  }

  if (state === "publishing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Publish…
      </span>
    );
  }

  if (state === "done") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-medium text-white">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Publiziert
      </span>
    );
  }

  if (state === "error") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-500"
        title={error ?? "Fehler"}
      >
        <Upload className="h-3.5 w-3.5" />
        Erneut publizieren
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-400 transition"
      title="Aktuelle Änderungen veröffentlichen"
    >
      <Upload className="h-3.5 w-3.5" />
      Publish
    </button>
  );
}
