"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { useEditMode } from "./EditModeProvider";
import { useSaveContent } from "./EditScopeProvider";
import { useLocale } from "../components/LocaleProvider";

type Props = {
  path: string;
  src: string;
  alt: string;
  className?: string;
  rounded?: "full" | "lg" | "none";
};

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

export function EditableImage({ path, src, alt, className, rounded = "full" }: Props) {
  const { editMode } = useEditMode();
  const locale = useLocale();
  const save = useSaveContent();
  const [currentSrc, setCurrentSrc] = useState(src);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const widgetRef = useRef<ReturnType<NonNullable<Window["cloudinary"]>["createMediaLibrary"]> | null>(null);

  const radius =
    rounded === "full" ? "rounded-full" : rounded === "lg" ? "rounded-2xl" : "rounded-none";

  function ensureWidget() {
    if (widgetRef.current) return widgetRef.current;
    if (typeof window === "undefined" || !window.cloudinary) return null;
    if (!CLOUD_NAME || !API_KEY) return null;

    widgetRef.current = window.cloudinary.createMediaLibrary(
      {
        cloud_name: CLOUD_NAME,
        api_key: API_KEY,
        multiple: false,
        max_files: 1,
        insert_caption: "Auswählen",
      },
      {
        insertHandler: async (data) => {
          const asset = data.assets[0];
          if (!asset) return;
          setSaving(true);
          setError(null);
          // Save errors are surfaced by SaveStatusProvider via the wrapper
          // around useSaveContent — we only need the local overlay spinner
          // while the upload+save runs.
          let res: Response | null = null;
          try {
            res = await save({ path, value: asset.secure_url, locale });
          } catch {
            // wrapper already dispatched a fail event
          }
          if (res?.ok) {
            try {
              const json = await res.json();
              if (json && json.ok) setCurrentSrc(asset.secure_url);
            } catch {
              // ignore — wrapper has parsed and dispatched already
            }
          }
          setSaving(false);
        },
      },
    );
    return widgetRef.current;
  }

  function handleClick() {
    if (!editMode || saving) return;
    if (!CLOUD_NAME || !API_KEY) {
      setError("NEXT_PUBLIC_CLOUDINARY_* fehlt in .env.local");
      return;
    }
    const widget = ensureWidget();
    if (!widget) {
      setError("Cloudinary-Widget lädt noch — kurz warten und nochmal klicken.");
      return;
    }
    setError(null);
    widget.show();
  }

  const editClasses = editMode
    ? "outline outline-2 outline-blue-400/60 outline-offset-2 cursor-pointer group"
    : "";

  return (
    <div
      className={`relative inline-block ${radius} ${editClasses}`.trim()}
      onClick={handleClick}
      role={editMode ? "button" : undefined}
      aria-label={editMode ? `Bild ersetzen: ${alt}` : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={currentSrc} alt={alt} className={`${className ?? ""} ${radius}`.trim()} />

      {editMode && !saving && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 transition ${radius}`}
        >
          <div className="flex flex-col items-center gap-1 text-white">
            <ImageIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Media-Galerie</span>
          </div>
        </div>
      )}

      {saving && (
        <div className={`absolute inset-0 flex items-center justify-center bg-white/70 ${radius}`}>
          <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
        </div>
      )}

      {error && (
        <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-red-600 text-white text-xs px-2 py-1 shadow">
          {error}
        </div>
      )}
    </div>
  );
}
