"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Puck, type Data } from "@puckeditor/core";
import "@puckeditor/core/dist/index.css";
import { buildPuckConfig, type PuckData } from "@vibe-cms-platform/core/puck";
import { LocaleProvider, SmartActionButton } from "@vibe-cms-platform/core/components";

type Props = {
  slug: string;
  brand: string;
  locale: string;
  locales: string[];
  liveUrl: string | null;
  data: PuckData;
  email: string;
};

export function EditorClient({ slug, brand, locale, locales, liveUrl, data, email }: Props) {
  const router = useRouter();
  const config = useMemo(() => buildPuckConfig(slug), [slug]);

  // Keep the source of truth for Publish here so the floating toolbar can
  // post the latest tree without hopping through Puck's internal state API.
  const [currentData, setCurrentData] = useState<PuckData>(data);

  function switchLocale(target: string) {
    if (target === locale) return;
    const url = new URL(window.location.href);
    url.searchParams.set("locale", target);
    router.push(url.pathname + url.search);
  }

  async function publish(): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, locale, data: currentData }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        return { ok: false, error: typeof json.error === "string" ? json.error : "Publish fehlgeschlagen" };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Publish fehlgeschlagen" };
    }
  }

  return (
    <LocaleProvider value={locale}>
      <Puck
        config={config}
        data={data as unknown as Data}
        onChange={(d) => setCurrentData(d as unknown as PuckData)}
        onPublish={() => {
          // Publish is driven by the SmartActionButton; ignore Puck's own
          // header publish action. (Puck still emits this when the user
          // clicks its built-in Publish button — harmless no-op.)
        }}
      />
      <SmartActionButton
        email={email}
        editMode={{
          publishSlug: slug,
          currentLocale: locale,
          locales,
          onSwitchLocale: switchLocale,
          liveUrl,
          siteLabel: `${brand} · ${slug}`,
          publish,
          initialPendingLocales: [],
        }}
      />
    </LocaleProvider>
  );
}
