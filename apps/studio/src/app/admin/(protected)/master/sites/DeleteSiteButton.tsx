"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

type Props = {
  slug: string;
  brand: string;
};

/** Trash button with a window.confirm guard. Idempotent on the server, so
 * a retry-on-failure is safe. */
export function DeleteSiteButton({ slug, brand }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    const ok = window.confirm(
      `Site "${brand}" (${slug}) wirklich löschen?\n\n` +
        `Das entfernt DNS, Pages-Domains und alle sites/${slug}/-Dateien aus dem Repo. ` +
        `Kann nicht rückgängig gemacht werden.`,
    );
    if (!ok) return;

    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/sites/${encodeURIComponent(slug)}`, { method: "DELETE" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof json.error === "string" ? json.error : `HTTP ${res.status}`);
          return;
        }
        if (Array.isArray(json.warnings) && json.warnings.length > 0) {
          window.alert(
            `Site gelöscht, aber mit Warnungen:\n\n${(json.warnings as string[]).join("\n")}`,
          );
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        title="Site löschen"
        aria-label={`Site ${brand} löschen`}
        className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-3 py-1.5 text-red-800 hover:border-red-400 transition disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Trash2 className="h-3 w-3" />
        )}
        Löschen
      </button>
      {error && (
        <span className="text-xs text-red-600" role="alert" title={error}>
          {error}
        </span>
      )}
    </>
  );
}
