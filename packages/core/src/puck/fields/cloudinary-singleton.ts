"use client";

/**
 * `cloudinary.createMediaLibrary` is expensive and not meant to be
 * recreated on every component mount. Puck mounts / unmounts custom
 * fields whenever the user selects a different block, which would
 * thrash the widget. We hold a single instance per page (module-level)
 * and route insertHandler callbacks through a mutable ref the singleton
 * calls into.
 */

type AssetInsert = { secure_url: string };
type InsertCallback = (asset: AssetInsert) => void;

type Widget = {
  show: () => void;
};

let widget: Widget | null = null;
let activeCallback: InsertCallback | null = null;

function getEnv() {
  const cloudName =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME : undefined;
  const apiKey =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY : undefined;
  return { cloudName, apiKey };
}

export function isCloudinaryConfigured(): boolean {
  const { cloudName, apiKey } = getEnv();
  return Boolean(cloudName && apiKey);
}

export function openCloudinary(onInsert: InsertCallback): { ok: boolean; error?: string } {
  if (typeof window === "undefined") return { ok: false, error: "Server-side" };
  if (!window.cloudinary) return { ok: false, error: "Cloudinary-Widget lädt noch — kurz warten und nochmal klicken." };
  const { cloudName, apiKey } = getEnv();
  if (!cloudName || !apiKey) {
    return { ok: false, error: "NEXT_PUBLIC_CLOUDINARY_* fehlt in .env.local" };
  }

  activeCallback = onInsert;

  if (!widget) {
    widget = window.cloudinary.createMediaLibrary(
      {
        cloud_name: cloudName,
        api_key: apiKey,
        multiple: false,
        max_files: 1,
        insert_caption: "Auswählen",
      },
      {
        insertHandler: (data) => {
          const asset = data.assets?.[0];
          if (!asset) return;
          // Route to whoever is currently active.
          activeCallback?.({ secure_url: asset.secure_url });
        },
      },
    );
  }

  widget?.show();
  return { ok: true };
}

export function clearCloudinaryCallback(callback: InsertCallback) {
  if (activeCallback === callback) activeCallback = null;
}
