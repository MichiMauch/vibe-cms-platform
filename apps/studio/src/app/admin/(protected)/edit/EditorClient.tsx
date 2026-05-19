"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Puck, usePuck, type Data, type Overrides } from "@puckeditor/core";
import "@puckeditor/core/dist/index.css";
import { CheckCircle2, Loader2, XCircle, Settings } from "lucide-react";
import { buildPuckConfig, type PuckData } from "@vibe-cms-platform/core/puck";
import { LocaleProvider, SmartActionButton } from "@vibe-cms-platform/core/components";
import {
  renderTheme,
  isValidPresetId,
  type SiteThemeChoice,
} from "@vibe-cms-platform/core/theme";

type Props = {
  slug: string;
  brand: string;
  locale: string;
  locales: string[];
  data: PuckData;
  email: string;
  /** Persisted theme from config.json — used as fallback when the Puck data
   * doesn't yet carry a `root.props.theme` (older sites). */
  initialTheme?: SiteThemeChoice | null;
};

type PublishState =
  | { kind: "idle" }
  | { kind: "publishing" }
  | { kind: "done" }
  | { kind: "error"; message: string };

/** Header-action button that deselects any selected component, which makes
 * Puck render the root.fields panel (Design / SEO / Chatbot) in the sidebar. */
function PageSettingsButton() {
  const { dispatch, appState } = usePuck();
  const isActive = appState.ui.itemSelector === null;
  return (
    <button
      type="button"
      title="Seiten-Einstellungen (Design / SEO / Chatbot)"
      onClick={() => {
        dispatch({ type: "setUi", ui: { itemSelector: null }, recordHistory: false });
      }}
      style={{ cursor: "pointer" }}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition border ${
        isActive
          ? "border-blue-300 bg-blue-50 text-blue-700"
          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
      }`}
    >
      <Settings className="h-3.5 w-3.5" />
      <span>Seiten-Einstellungen</span>
    </button>
  );
}

const PUCK_OVERRIDES: Partial<Overrides> = {
  headerActions: ({ children }) => (
    <>
      <div className="mr-3 pr-3 border-r border-slate-200">
        <PageSettingsButton />
      </div>
      {children}
    </>
  ),
};

function extractEditorTheme(
  data: PuckData,
  fallback?: SiteThemeChoice | null,
): SiteThemeChoice | null {
  const root = data?.root as { props?: { theme?: unknown } } | undefined;
  const t = root?.props?.theme as
    | { preset?: unknown; accentOverride?: unknown; inkOverride?: unknown }
    | undefined;
  if (t && isValidPresetId(t.preset)) {
    const out: SiteThemeChoice = { preset: t.preset };
    if (typeof t.accentOverride === "string" && t.accentOverride.trim()) {
      out.accentOverride = t.accentOverride.trim();
    }
    if (typeof t.inkOverride === "string" && t.inkOverride.trim()) {
      out.inkOverride = t.inkOverride.trim();
    }
    return out;
  }
  return fallback ?? null;
}

export function EditorClient({
  slug,
  brand,
  locale,
  locales,
  data,
  email,
  initialTheme,
}: Props) {
  const router = useRouter();
  const config = useMemo(() => buildPuckConfig(slug), [slug]);
  const [publishState, setPublishState] = useState<PublishState>({ kind: "idle" });
  const [activeTheme, setActiveTheme] = useState<SiteThemeChoice | null>(() =>
    extractEditorTheme(data, initialTheme),
  );
  const { themeCss, bodyAttrs } = useMemo(
    () => renderTheme(activeTheme),
    [activeTheme],
  );

  function switchLocale(target: string) {
    if (target === locale) return;
    const url = new URL(window.location.href);
    url.searchParams.set("locale", target);
    router.push(url.pathname + url.search);
  }

  async function publish(nextData: PuckData) {
    setPublishState({ kind: "publishing" });
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, locale, data: nextData }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        const message = typeof json.error === "string" ? json.error : "Publish fehlgeschlagen";
        setPublishState({ kind: "error", message });
        return;
      }
      setPublishState({ kind: "done" });
      window.setTimeout(() => {
        setPublishState((curr) => (curr.kind === "done" ? { kind: "idle" } : curr));
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Publish fehlgeschlagen";
      setPublishState({ kind: "error", message });
    }
  }

  return (
    <LocaleProvider value={locale}>
      <style id="site-theme" dangerouslySetInnerHTML={{ __html: themeCss }} />
      <div {...bodyAttrs} className="contents">
        <Puck
          config={config}
          data={data as unknown as Data}
          // Puck defaults to rendering the preview in an iframe for style
          // isolation. We disable it because our `<style id="site-theme">`
          // and `data-*` attrs (bg-pattern, divider, card-style, spacing)
          // live on a wrapper outside the iframe — the iframe would freeze
          // on the initial theme and ignore preset switches. Editor and
          // tenant share the same Tailwind config so isolation buys nothing.
          iframe={{ enabled: false }}
          overrides={PUCK_OVERRIDES}
          onChange={(d) => {
            const next = extractEditorTheme(d as unknown as PuckData, initialTheme);
            // Skip state churn on every keystroke unless theme actually changed.
            setActiveTheme((prev) => {
              if (
                prev?.preset === next?.preset &&
                prev?.accentOverride === next?.accentOverride &&
                prev?.inkOverride === next?.inkOverride
              ) {
                return prev;
              }
              return next;
            });
          }}
          onPublish={(d) => {
            void publish(d as unknown as PuckData);
          }}
        />
      </div>
      <SmartActionButton
        email={email}
        editMode={{
          publishSlug: slug,
          currentLocale: locale,
          locales,
          onSwitchLocale: switchLocale,
          siteLabel: `${brand} · ${slug}`,
        }}
      />
      <PublishToast
        state={publishState}
        onDismiss={() => setPublishState({ kind: "idle" })}
      />
    </LocaleProvider>
  );
}

function PublishToast({
  state,
  onDismiss,
}: {
  state: PublishState;
  onDismiss: () => void;
}) {
  if (state.kind === "idle") return null;

  const base =
    "fixed top-4 right-4 z-[100] inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg shadow-black/20";

  if (state.kind === "publishing") {
    return (
      <div role="status" aria-live="polite" className={`${base} bg-slate-900 text-white`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Publish…
      </div>
    );
  }

  if (state.kind === "done") {
    return (
      <div role="status" aria-live="polite" className={`${base} bg-emerald-500 text-white`}>
        <CheckCircle2 className="h-4 w-4" />
        Publiziert
      </div>
    );
  }

  return (
    <div role="alert" className={`${base} bg-red-600 text-white`}>
      <XCircle className="h-4 w-4" />
      <span className="max-w-[40ch] truncate" title={state.message}>
        {state.message}
      </span>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-1 rounded-full px-2 py-0.5 text-xs hover:bg-white/10"
      >
        OK
      </button>
    </div>
  );
}
