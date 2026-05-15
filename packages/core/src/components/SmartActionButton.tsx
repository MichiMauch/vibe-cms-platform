"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, LogOut, Pencil, Upload } from "lucide-react";
import { SaveStatusIndicator, useSaveStatus } from "../editors/SaveStatusProvider";

type EditMode = {
  /** Tenant slug used by the publish endpoint. */
  publishSlug: string;
  /** Locales already pending at page load (server-side seed). */
  initialPendingLocales: string[];
  /** Locale currently being edited — every new draft save is attributed here. */
  currentLocale: string;
  /** All available locales for the locale picker. */
  locales: string[];
  /** Called when the user picks another locale from the dropdown. */
  onSwitchLocale: (target: string) => void;
  /** Absolute URL to the public version of the current page, or null. */
  liveUrl: string | null;
  /** Site slug shown as a small label so master users know which site they edit. */
  siteLabel?: string;
};

type Props = {
  email: string;
  /** Public-mode (visitor logged in, viewing tenant page): jumps to the editor. */
  editUrl?: string;
  /** Edit-mode (inside /admin/edit): show save status, publish, locale, live. */
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
  const { publishSlug, initialPendingLocales, currentLocale, locales, onSwitchLocale, liveUrl, siteLabel } = editMode;
  return (
    <>
      {siteLabel && (
        <span className="hidden sm:inline-flex items-center gap-1 px-1 text-[11px] font-mono text-slate-300">
          {siteLabel}
        </span>
      )}
      <span className="h-5 w-px bg-white/15" aria-hidden />
      <div className="px-1">
        <SaveStatusIndicator variant="dark" />
      </div>
      <PublishPill
        slug={publishSlug}
        initialPendingLocales={initialPendingLocales}
        currentLocale={currentLocale}
      />
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

function PublishPill({
  slug,
  initialPendingLocales,
  currentLocale,
}: {
  slug: string;
  initialPendingLocales: string[];
  currentLocale: string;
}) {
  const saveStatus = useSaveStatus();
  const [state, setState] = useState<PublishState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pendingSet, setPendingSet] = useState<Set<string>>(() => new Set(initialPendingLocales));
  const lastSeenSavedAt = useRef<number | null>(null);

  const lastSavedAt = saveStatus?.status.lastSavedAt ?? null;
  const warning = saveStatus?.status.warning ?? null;

  useEffect(() => {
    if (!lastSavedAt) return;
    if (lastSavedAt === lastSeenSavedAt.current) return;
    lastSeenSavedAt.current = lastSavedAt;
    if (warning === "unpublished") {
      setPendingSet((s) => (s.has(currentLocale) ? s : new Set([...s, currentLocale])));
    }
  }, [lastSavedAt, warning, currentLocale]);

  if (state === "idle" && pendingSet.size === 0) return null;

  async function onPublish() {
    setState("publishing");
    setError(null);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setState("error");
        setError(typeof json.error === "string" ? json.error : "Publish fehlgeschlagen");
        return;
      }
      setState("done");
      setPendingSet(new Set());
      saveStatus?.clearWarning();
      setTimeout(() => setState("idle"), 1500);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Publish fehlgeschlagen");
    }
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
        onClick={onPublish}
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
      onClick={onPublish}
      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-400 transition"
      title={`Unveröffentlichte Sprachen: ${[...pendingSet].join(", ")}`}
    >
      <Upload className="h-3.5 w-3.5" />
      Publish · {pendingSet.size}
    </button>
  );
}
