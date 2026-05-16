"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { clearCloudinaryCallback, isCloudinaryConfigured, openCloudinary } from "./cloudinary-singleton";

type Props = {
  value: string;
  onChange: (next: string) => void;
};

/** Puck custom field for Cloudinary-hosted images. The Cloudinary widget is
 * a global singleton; this field only owns the open/close trigger and the
 * preview thumbnail. */
export function ImageField({ value, onChange }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const callbackRef = useRef<((asset: { secure_url: string }) => void) | null>(null);

  // Clean up the singleton's callback when this field unmounts so a stale
  // closure doesn't fire a later insert into a no-longer-mounted block.
  useEffect(() => {
    return () => {
      if (callbackRef.current) clearCloudinaryCallback(callbackRef.current);
    };
  }, []);

  function handleOpen() {
    if (!isCloudinaryConfigured()) {
      setError("NEXT_PUBLIC_CLOUDINARY_* fehlt in .env.local");
      return;
    }
    setError(null);
    setOpening(true);

    const cb = (asset: { secure_url: string }) => {
      setOpening(false);
      onChange(asset.secure_url);
    };
    callbackRef.current = cb;

    const { ok, error: e } = openCloudinary(cb);
    if (!ok) {
      setOpening(false);
      setError(e ?? "Cloudinary konnte nicht geöffnet werden");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-32 w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
          Kein Bild gewählt
        </div>
      )}

      <button
        type="button"
        onClick={handleOpen}
        disabled={opening}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 disabled:opacity-50 transition"
      >
        {opening ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ImageIcon className="h-3.5 w-3.5" />
        )}
        {value ? "Bild ersetzen" : "Bild wählen"}
      </button>

      {error && (
        <div className="flex items-start gap-1.5 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
