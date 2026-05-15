"use client";

import { useRouter } from "next/navigation";
import {
  ForceEditMode,
  EditScopeProvider,
  SaveStatusProvider,
} from "@vibe-cms-platform/core/editors";
import { LocaleProvider, SmartActionButton } from "@vibe-cms-platform/core/components";
import { BlockRenderer } from "@vibe-cms-platform/core/renderer";
import { BlockManager } from "@vibe-cms-platform/core/manager";
import type { Content } from "@vibe-cms-platform/core/types";

type Props = {
  slug: string;
  brand: string;
  locale: string;
  locales: string[];
  liveUrl: string | null;
  content: Content;
  pendingLocales: string[];
  email: string;
};

export function EditorClient({
  slug,
  brand,
  locale,
  locales,
  liveUrl,
  content,
  pendingLocales,
  email,
}: Props) {
  const router = useRouter();

  function switchLocale(target: string) {
    if (target === locale) return;
    const url = new URL(window.location.href);
    url.searchParams.set("locale", target);
    router.push(url.pathname + url.search);
  }

  return (
    <EditScopeProvider value={{ slug, saveEndpoint: "/api/save-content", aiRewriteEndpoint: "/api/ai-rewrite" }}>
      <SaveStatusProvider>
        <LocaleProvider value={locale}>
          <ForceEditMode>
            <BlockRenderer sections={content.sections} />
            <BlockManager sections={content.sections} locale={locale} />
            <SmartActionButton
              email={email}
              editMode={{
                publishSlug: slug,
                initialPendingLocales: pendingLocales,
                currentLocale: locale,
                locales,
                onSwitchLocale: switchLocale,
                liveUrl,
                siteLabel: `${brand} · ${slug}`,
              }}
            />
          </ForceEditMode>
        </LocaleProvider>
      </SaveStatusProvider>
    </EditScopeProvider>
  );
}
