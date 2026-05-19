"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { ConfirmDialog, useToast } from "@/components/Feedback";

type Props = {
  slug: string;
  brand: string;
};

/** Trash button with an in-app confirm dialog. Server-side delete is
 * idempotent, so a retry-on-failure is safe. */
export function DeleteSiteButton({ slug, brand }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [askOpen, setAskOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function runDelete() {
    setAskOpen(false);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/sites/${encodeURIComponent(slug)}`, { method: "DELETE" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(typeof json.error === "string" ? json.error : `Löschen fehlgeschlagen (HTTP ${res.status})`);
          return;
        }
        if (Array.isArray(json.warnings) && json.warnings.length > 0) {
          toast.info(`Site gelöscht — mit ${json.warnings.length} Warnung(en). Details: Konsole.`);
          console.warn(`Delete warnings for ${slug}:`, json.warnings);
        } else {
          toast.success(`Site "${brand}" gelöscht.`);
        }
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Löschen fehlgeschlagen");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAskOpen(true)}
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
      <ConfirmDialog
        open={askOpen}
        title={`Site "${brand}" wirklich löschen?`}
        body={
          `Slug: ${slug}\n\n` +
          `Das entfernt DNS, Pages-Domains und alle sites/${slug}/-Dateien aus dem Repo. ` +
          `Kann nicht rückgängig gemacht werden.`
        }
        confirmLabel="Löschen"
        danger
        onConfirm={runDelete}
        onCancel={() => setAskOpen(false)}
      />
    </>
  );
}
