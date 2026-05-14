"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Search, Share2, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Seo } from "../../types/content";
import { FieldWithCounter, type SaveStatus } from "./FieldWithCounter";
import { SeoPreview } from "./SeoPreview";

type FieldKey = keyof Seo;

type Props = { initial: Seo; locale: string };

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

export function SeoForm({ initial, locale }: Props) {
  const [values, setValues] = useState<Seo>(initial);
  const savedRef = useRef<Seo>(initial);
  const [status, setStatus] = useState<Record<FieldKey, SaveStatus>>({
    title: "idle",
    description: "idle",
    ogTitle: "idle",
    ogDescription: "idle",
    ogImage: "idle",
    keywords: "idle",
  });
  const [errors, setErrors] = useState<Record<FieldKey, string | null>>({
    title: null,
    description: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    keywords: null,
  });

  useEffect(() => {
    const timers = (Object.keys(status) as FieldKey[])
      .filter((k) => status[k] === "saved")
      .map((k) => setTimeout(() => setStatus((s) => ({ ...s, [k]: "idle" })), 1500));
    return () => timers.forEach(clearTimeout);
  }, [status]);

  const update = useCallback((key: FieldKey, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
  }, []);

  const save = useCallback(async (key: FieldKey) => {
    const value = values[key];
    if (value === savedRef.current[key]) return;
    setStatus((s) => ({ ...s, [key]: "saving" }));
    setErrors((e) => ({ ...e, [key]: null }));
    try {
      const res = await fetch("/api/save-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: `seo.${key}`, value, locale }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        savedRef.current = { ...savedRef.current, [key]: value };
        setStatus((s) => ({ ...s, [key]: "saved" }));
      } else {
        setStatus((s) => ({ ...s, [key]: "error" }));
        setErrors((e) => ({ ...e, [key]: json.error ?? "Fehler" }));
      }
    } catch (err) {
      setStatus((s) => ({ ...s, [key]: "error" }));
      setErrors((e) => ({ ...e, [key]: err instanceof Error ? err.message : "Fehler" }));
    }
  }, [values, locale]);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-10">
        <Section icon={<Search className="h-4 w-4" />} title="Suchmaschinen" subtitle="Wie deine Seite bei Google erscheint.">
          <FieldWithCounter
            id="seo-title"
            label="Meta-Titel"
            helper="Erscheint als blauer Link in den Suchergebnissen."
            value={values.title}
            onChange={(v) => update("title", v)}
            onBlur={() => save("title")}
            status={status.title}
            errorMsg={errors.title}
            recommended={{ min: 30, max: 60 }}
            max={70}
          />
          <FieldWithCounter
            id="seo-description"
            label="Meta-Description"
            helper="Wird unter dem Titel angezeigt. Google kürzt nach ~160 Zeichen."
            value={values.description}
            onChange={(v) => update("description", v)}
            onBlur={() => save("description")}
            status={status.description}
            errorMsg={errors.description}
            multiline
            rows={3}
            recommended={{ min: 110, max: 160 }}
            max={180}
          />
          <FieldWithCounter
            id="seo-keywords"
            label="Keywords"
            helper="Komma-getrennt. Google ignoriert das Tag heute, aber Bing & manche Tools nutzen es."
            value={values.keywords}
            onChange={(v) => update("keywords", v)}
            onBlur={() => save("keywords")}
            status={status.keywords}
            errorMsg={errors.keywords}
            placeholder="next.js, cms, inline-editing"
          />
        </Section>

        <Section icon={<Share2 className="h-4 w-4" />} title="Social Media (Open Graph)" subtitle="Wie deine Seite auf Facebook, LinkedIn & Co. erscheint.">
          <FieldWithCounter
            id="seo-ogtitle"
            label="OG-Titel"
            helper="Leer lassen, um den Meta-Titel zu übernehmen."
            value={values.ogTitle}
            onChange={(v) => update("ogTitle", v)}
            onBlur={() => save("ogTitle")}
            status={status.ogTitle}
            errorMsg={errors.ogTitle}
            recommended={{ min: 30, max: 70 }}
            max={90}
          />
          <FieldWithCounter
            id="seo-ogdescription"
            label="OG-Description"
            helper="Leer lassen, um die Meta-Description zu übernehmen."
            value={values.ogDescription}
            onChange={(v) => update("ogDescription", v)}
            onBlur={() => save("ogDescription")}
            status={status.ogDescription}
            errorMsg={errors.ogDescription}
            multiline
            rows={3}
            recommended={{ min: 60, max: 200 }}
            max={220}
          />

          <OgImageField
            locale={locale}
            value={values.ogImage}
            onChange={(v) => {
              update("ogImage", v);
              savedRef.current = { ...savedRef.current, ogImage: v };
              setStatus((s) => ({ ...s, ogImage: "saved" }));
            }}
            onError={(msg) => {
              setStatus((s) => ({ ...s, ogImage: "error" }));
              setErrors((e) => ({ ...e, ogImage: msg }));
            }}
            status={status.ogImage}
            errorMsg={errors.ogImage}
          />
        </Section>
      </div>

      <div className="lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-600 mb-6">Live-Vorschau</h2>
          <SeoPreview
            title={values.title}
            description={values.description}
            ogTitle={values.ogTitle || values.title}
            ogDescription={values.ogDescription || values.description}
            ogImage={values.ogImage}
          />
        </div>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div>
        <div className="flex items-center gap-2 text-blue-600">
          {icon}
          <h2 className="text-sm font-semibold uppercase tracking-widest">{title}</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function OgImageField({
  locale,
  value,
  onChange,
  onError,
  status,
  errorMsg,
}: {
  locale: string;
  value: string;
  onChange: (url: string) => void;
  onError: (msg: string) => void;
  status: SaveStatus;
  errorMsg: string | null;
}) {
  const [saving, setSaving] = useState(false);
  const widgetRef = useRef<ReturnType<NonNullable<Window["cloudinary"]>["createMediaLibrary"]> | null>(null);

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
          try {
            const res = await fetch("/api/save-content", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path: "seo.ogImage", value: asset.secure_url, locale }),
            });
            const json = await res.json();
            if (res.ok && json.ok) {
              onChange(asset.secure_url);
            } else {
              onError(json.error ?? "Speichern fehlgeschlagen");
            }
          } catch (err) {
            onError(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
          } finally {
            setSaving(false);
          }
        },
      },
    );
    return widgetRef.current;
  }

  function openPicker() {
    if (!CLOUD_NAME || !API_KEY) {
      onError("NEXT_PUBLIC_CLOUDINARY_* fehlt in .env.local");
      return;
    }
    const w = ensureWidget();
    if (!w) {
      onError("Cloudinary-Widget lädt noch — kurz warten.");
      return;
    }
    w.show();
  }

  async function clear() {
    setSaving(true);
    try {
      const res = await fetch("/api/save-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "seo.ogImage", value: "", locale }),
      });
      const json = await res.json();
      if (res.ok && json.ok) onChange("");
      else onError(json.error ?? "Fehler");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium text-slate-900">OG-Image</label>
        <div className="flex items-center gap-2 text-xs">
          {(saving || status === "saving") && (
            <span className="inline-flex items-center gap-1 text-slate-500">
              <Loader2 className="w-3 h-3 animate-spin" /> Speichert
            </span>
          )}
          {status === "saved" && !saving && (
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="w-3 h-3" /> Gespeichert
            </span>
          )}
          {status === "error" && errorMsg && (
            <span className="inline-flex items-center gap-1 text-red-600">
              <AlertCircle className="w-3 h-3" />
              {errorMsg}
            </span>
          )}
        </div>
      </div>

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-300 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="OG Image" className="aspect-[1.91/1] w-full object-cover" />
          {saving && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
            </div>
          )}
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2">
            <button
              type="button"
              onClick={openPicker}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Ersetzen
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={clear}
              className="text-xs font-medium text-slate-500 hover:text-red-600"
            >
              Entfernen
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className="group flex aspect-[1.91/1] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white text-slate-500 hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-700 transition"
        >
          {saving ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <ImageIcon className="h-7 w-7" />
              <span className="text-sm font-medium">Aus Media-Galerie wählen</span>
              <span className="text-xs text-slate-400 group-hover:text-blue-600">Empfohlen: 1200×630 px</span>
            </>
          )}
        </button>
      )}
      <p className="text-xs text-slate-500">
        Das Bild wird auf Facebook, LinkedIn, Twitter & Co. angezeigt, wenn jemand die Seite teilt.
      </p>
    </div>
  );
}
