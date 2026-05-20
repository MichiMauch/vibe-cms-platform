"use client";

import { useRef, useState } from "react";
import { Sparkles, Loader2, FileText, X } from "lucide-react";
import { THEME_PRESETS, DEFAULT_PRESET_ID, type ThemePresetId } from "@vibe-cms-platform/core/theme";
import { useToast } from "@/components/Feedback";
import {
  CreateProgressModal,
  type ProgressStep,
  type Stage,
  type SuccessPayload,
  type VibeSuggestion,
} from "./CreateProgressModal";

const TEMPLATES = [
  { id: "saas", label: "SaaS / Produkt", description: "Hero, Features, Pricing, CTA, Footer." },
  { id: "agentur", label: "Agentur / Studio", description: "Hero, Features, Team, Testimonial, CTA, Footer." },
  { id: "event", label: "Event / Launch", description: "Hero, Highlights, CTA, Footer." },
  { id: "blank", label: "Blank", description: "Minimal: nur Hero + Footer." },
];

type Language = "de" | "en" | "fr" | "it";

/** Single sitemap row in the editable preview. The `selected` flag controls
 * whether the page is fed to the scaffolder. */
type SitemapRow = {
  path: string;
  title: string;
  parent?: string;
  pageBrief: string;
  priority: 1 | 2 | 3;
  selected: boolean;
};

type ScaffoldedPage = {
  path: string;
  title: string;
  parent?: string;
  contentJson: string;
};

const MAX_SELECTED_PAGES = 12;

export function NewSiteForm() {
  const [slug, setSlug] = useState("");
  const [brand, setBrand] = useState("");
  const [template, setTemplate] = useState("saas");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [themePreset, setThemePreset] = useState<ThemePresetId>(DEFAULT_PRESET_ID);
  const [accentOverride, setAccentOverride] = useState("");
  const [language, setLanguage] = useState<Language>("de");

  // PDF-driven flow
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfAnalyzing, setPdfAnalyzing] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [sitemap, setSitemap] = useState<SitemapRow[] | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [stage, setStage] = useState<Stage>({ kind: "scaffolding" });
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [done, setDone] = useState<SuccessPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Phase-A → Phase-B carriers. For single-page: contentJson. For multi-page: pages.
  const [contentJson, setContentJson] = useState<string | null>(null);
  const [scaffoldedPages, setScaffoldedPages] = useState<ScaffoldedPage[] | null>(null);

  const toast = useToast();

  function closeModal() {
    setModalOpen(false);
    setSteps([]);
    setDone(null);
    setError(null);
    setContentJson(null);
    setScaffoldedPages(null);
    setStage({ kind: "scaffolding" });
  }

  async function onPdfChosen(file: File) {
    setPdfFile(file);
    setPdfError(null);
    setSitemap(null);
    setPdfAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append("pdf", file);
      const res = await fetch("/api/sites/pdf-analyze", { method: "POST", body: fd });
      if (!res.ok) {
        const text = await res.text();
        setPdfError(text || `HTTP ${res.status}`);
        return;
      }
      const data = (await res.json()) as {
        brand: string;
        brief: string;
        audience: string;
        primaryGoal: string;
        language: Language;
        vibeSuggestion: { preset: ThemePresetId; rationale: string; confidence: "high" | "medium" | "low" };
        sitemap: Array<{
          path: string;
          title: string;
          parent?: string;
          pageBrief: string;
          priority: 1 | 2 | 3;
        }>;
      };
      // Pre-fill form fields that the user usually types manually.
      if (data.brand) setBrand(data.brand);
      if (data.brief) setDescription(data.brief);
      if (data.audience) setAudience(data.audience);
      if (data.primaryGoal) setPrimaryGoal(data.primaryGoal);
      if (data.vibeSuggestion?.preset) setThemePreset(data.vibeSuggestion.preset);
      if (data.language) setLanguage(data.language);
      // Default-select priority 1 and 2 pages, leave priority 3 unchecked.
      const rows: SitemapRow[] = data.sitemap.map((p) => ({
        path: p.path,
        title: p.title,
        parent: p.parent,
        pageBrief: p.pageBrief,
        priority: p.priority,
        selected: p.priority <= 2,
      }));
      setSitemap(rows);
      toast.info(`PDF analysiert — ${rows.length} Seiten erkannt.`);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "Analyse fehlgeschlagen");
    } finally {
      setPdfAnalyzing(false);
    }
  }

  function clearPdf() {
    setPdfFile(null);
    setPdfError(null);
    setSitemap(null);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  }

  function updateSitemapRow(index: number, patch: Partial<SitemapRow>) {
    if (!sitemap) return;
    const next = [...sitemap];
    next[index] = { ...next[index], ...patch };
    setSitemap(next);
  }

  function selectedPages(): SitemapRow[] {
    if (!sitemap) return [];
    // Homepage is always required: force-select it if the user unchecked it.
    const rows = sitemap.map((r) =>
      r.path === "" ? { ...r, selected: true } : r,
    );
    return rows.filter((r) => r.selected).slice(0, MAX_SELECTED_PAGES);
  }

  /** Phase B — POST to /api/sites/create with the pre-generated content and
   * the user's final preset. Streams SSE progress. */
  async function runCreate(finalPreset: ThemePresetId) {
    setBusy(true);
    setStage({ kind: "creating" });
    setSteps([]);
    setDone(null);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        slug,
        brand,
        template,
        description,
        audience,
        primaryGoal,
        customerEmail,
        customDomain: customDomain.trim() || undefined,
        language,
        theme: {
          preset: finalPreset,
          accentOverride: accentOverride.trim() || undefined,
        },
      };
      if (scaffoldedPages) {
        payload.pages = scaffoldedPages;
      } else if (contentJson) {
        payload.contentJson = contentJson;
      }

      const res = await fetch("/api/sites/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok || !res.body) {
        const text = await res.text();
        setError(text || `HTTP ${res.status}`);
        setStage({ kind: "error" });
        setBusy(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let sawDone = false;
      while (true) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const evt of events) {
          const lines = evt.split("\n");
          const name = lines.find((l) => l.startsWith("event:"))?.slice(6).trim();
          const data = lines.find((l) => l.startsWith("data:"))?.slice(5).trim();
          if (!name || !data) continue;
          const parsed = JSON.parse(data);
          if (name === "progress") setSteps((s) => [...s, parsed]);
          else if (name === "warning") setSteps((s) => [...s, { step: parsed.step, label: `⚠ ${parsed.message}` }]);
          else if (name === "done") {
            setDone(parsed);
            setStage({ kind: "done" });
            sawDone = true;
          } else if (name === "error") {
            setError(parsed.message);
            setStage({ kind: "error" });
          }
        }
      }
      if (!sawDone && !error) {
        setError("Stream ended unexpectedly");
        setStage({ kind: "error" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setStage({ kind: "error" });
    } finally {
      setBusy(false);
    }
  }

  /** Phase A — call /api/sites/scaffold. With a sitemap, the response holds
   * one Puck tree per page; otherwise it's the single-page payload. */
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSteps([]);
    setDone(null);
    setError(null);
    setStage({ kind: "scaffolding" });
    setModalOpen(true);

    const pages = selectedPages();
    const isMultiPage = pages.length > 0;

    try {
      const body: Record<string, unknown> = {
        brand,
        template,
        description,
        audience,
        primaryGoal,
        language,
      };
      if (isMultiPage) {
        body.pages = pages.map((p) => ({
          path: p.path,
          title: p.title,
          parent: p.parent,
          pageBrief: p.pageBrief,
        }));
      }
      const res = await fetch("/api/sites/scaffold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text || `HTTP ${res.status}`);
        setStage({ kind: "error" });
        setBusy(false);
        return;
      }
      const data = (await res.json()) as {
        contentJson?: string;
        pages?: ScaffoldedPage[];
        vibeSuggestion: VibeSuggestion;
      };
      if (data.pages) {
        setScaffoldedPages(data.pages);
      } else if (data.contentJson) {
        setContentJson(data.contentJson);
      }

      const suggestion = data.vibeSuggestion;
      const matches = suggestion.preset === themePreset;
      const skipReview = matches && suggestion.confidence !== "low";

      if (skipReview) {
        toast.info("AI hat deine Auswahl bestätigt.");
        setBusy(false);
        runCreate(themePreset);
        return;
      }

      setBusy(false);
      setStage({
        kind: "vibe-review",
        suggestion,
        manualPreset: themePreset,
        chosenPreset: suggestion.preset,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setStage({ kind: "error" });
      setBusy(false);
    }
  }

  function onChoosePreset(p: ThemePresetId) {
    if (stage.kind !== "vibe-review") return;
    setStage({ ...stage, chosenPreset: p });
  }

  function onApproveVibe() {
    if (stage.kind !== "vibe-review") return;
    if (!scaffoldedPages && !contentJson) return;
    runCreate(stage.chosenPreset);
  }

  const selectedCount = sitemap?.filter((r) => r.selected || r.path === "").length ?? 0;

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* ── PDF upload (optional kick-starter) ─────────────────────────── */}
      <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-slate-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Konzept-PDF (optional)
              </p>
              <p className="text-xs text-slate-500">
                Wireframes, Sitemap oder Brief als PDF → AI füllt das Formular und
                schlägt eine Multi-Page-Site vor.
              </p>
            </div>
          </div>
          {pdfFile && !pdfAnalyzing && (
            <button
              type="button"
              onClick={clearPdf}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
              style={{ cursor: "pointer" }}
            >
              <X className="h-3 w-3" /> Entfernen
            </button>
          )}
        </div>
        <div className="mt-3">
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf,.pdf"
            disabled={busy || pdfAnalyzing}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPdfChosen(f);
            }}
            className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white file:text-xs file:font-semibold hover:file:bg-slate-800 file:cursor-pointer"
          />
        </div>
        {pdfAnalyzing && (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span>PDF wird mit Gemini Flash analysiert (kann ~30–60s dauern) …</span>
          </div>
        )}
        {pdfError && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
            {pdfError}
          </div>
        )}
        {pdfFile && !pdfAnalyzing && !pdfError && (
          <div className="mt-2 text-xs text-slate-600">
            <span className="font-mono">{pdfFile.name}</span> ({Math.round(pdfFile.size / 1024)} KB)
          </div>
        )}
      </div>

      {/* ── Standard form fields ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Slug</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            pattern="[a-z][a-z0-9\-]{1,38}[a-z0-9]"
            placeholder="meine-marke"
            disabled={busy}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
          />
          <span className="mt-1 block text-xs text-slate-500">
            Wird zu <code>{slug || "<slug>"}.pages.mauch.rocks</code>
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Brand</span>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            required
            disabled={busy}
            placeholder="Meine Marke"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700">Template</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TEMPLATES.map((t) => (
            <label
              key={t.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                template === t.id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="template"
                value={t.id}
                checked={template === t.id}
                onChange={() => setTemplate(t.id)}
                disabled={busy}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-slate-900">{t.label}</span>
                <span className="block text-xs text-slate-500">{t.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700">Look (Vibe)</legend>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {THEME_PRESETS.map((p) => (
            <label
              key={p.id}
              title={p.description}
              className={`relative flex cursor-pointer flex-col gap-2 rounded-lg border p-3 transition ${
                themePreset === p.id
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="theme-preset"
                value={p.id}
                checked={themePreset === p.id}
                onChange={() => setThemePreset(p.id)}
                disabled={busy}
                className="sr-only"
              />
              <div
                className="h-10 w-full rounded overflow-hidden flex border border-slate-200"
                style={{
                  background: p.colors["bg"],
                }}
              >
                <span className="flex-1" style={{ background: p.colors["surface"] }} />
                <span className="flex-1" style={{ background: p.colors["accent"] }} />
                <span className="flex-1" style={{ background: p.colors["accent-2"] }} />
                <span className="flex-1" style={{ background: p.colors["surface-dark"] }} />
              </div>
              <span className="text-xs font-medium text-slate-900">{p.name}</span>
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Die AI schlägt nach dem Submit zusätzlich einen Vibe basierend auf Brief & Branche vor — du kannst ihn übernehmen oder bei deiner Wahl bleiben.
        </p>
        <label className="mt-2 block">
          <span className="text-xs text-slate-500">
            Akzentfarbe überschreiben (optional, Hex z.B. <code>#ff3366</code>)
          </span>
          <input
            type="text"
            value={accentOverride}
            onChange={(e) => setAccentOverride(e.target.value)}
            disabled={busy}
            placeholder="#"
            pattern="#[0-9a-fA-F]{6}"
            className="mt-1 w-40 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono focus:border-blue-500 focus:outline-none"
          />
        </label>
      </fieldset>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Beschreibung / Brief</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          disabled={busy}
          placeholder="Was bietet das Produkt? Welches Problem löst es? Welcher Ton?"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Zielgruppe (optional)</span>
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            disabled={busy}
            placeholder="z.B. Solo-Designer in der Schweiz"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Primäres Ziel (optional)</span>
          <input
            type="text"
            value={primaryGoal}
            onChange={(e) => setPrimaryGoal(e.target.value)}
            disabled={busy}
            placeholder="z.B. Mailing-Liste aufbauen"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </label>
      </div>

      {/* ── Sitemap preview (only when PDF analysis produced one) ──────── */}
      {sitemap && sitemap.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold text-blue-900">
              Erkannte Sitemap ({sitemap.length} Seiten, ausgewählt: {selectedCount})
            </h3>
            <span className="text-xs text-blue-700">
              Sprache: <strong>{language.toUpperCase()}</strong> · max. {MAX_SELECTED_PAGES} Seiten
            </span>
          </div>
          <p className="mt-1 text-xs text-blue-700">
            Jede ausgewählte Seite wird per AI generiert (1 Call pro Seite). Häkchen entfernen
            spart Kosten. Die Homepage ist immer Pflicht.
          </p>
          <ul className="mt-3 divide-y divide-blue-100 rounded-lg bg-white">
            {sitemap.map((row, i) => {
              const isHome = row.path === "";
              return (
                <li key={`${row.path}-${i}`} className="p-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isHome ? true : row.selected}
                      onChange={(e) => updateSitemapRow(i, { selected: e.target.checked })}
                      disabled={busy || isHome}
                      className="mt-1"
                      style={{ cursor: isHome ? "not-allowed" : "pointer" }}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={row.title}
                          onChange={(e) => updateSitemapRow(i, { title: e.target.value })}
                          disabled={busy}
                          className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm font-medium focus:border-blue-500 focus:outline-none"
                        />
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-mono text-slate-600">
                          /{row.path || ""}
                        </code>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                            row.priority === 1
                              ? "bg-emerald-100 text-emerald-800"
                              : row.priority === 2
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-200 text-slate-700"
                          }`}
                          title="AI-Priorität: 1=Pflicht, 2=Wichtig, 3=Nice-to-have"
                        >
                          P{row.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{row.pageBrief}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {selectedCount > MAX_SELECTED_PAGES && (
            <p className="mt-2 text-xs text-amber-700">
              ⚠ Mehr als {MAX_SELECTED_PAGES} Seiten ausgewählt — nur die ersten {MAX_SELECTED_PAGES} werden generiert.
            </p>
          )}
        </div>
      )}

      <div className="border-t border-slate-200 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Kunden-E-Mail</span>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
            disabled={busy}
            placeholder="kunde@kundenmarke.ch"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <span className="mt-1 block text-xs text-slate-500">
            Bekommt Magic-Link für /admin/edit
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Custom-Domain (optional)</span>
          <input
            type="text"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            disabled={busy}
            placeholder="kundenmarke.ch"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <span className="mt-1 block text-xs text-slate-500">
            Kunde setzt CNAME auf pages.dev
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={busy || pdfAnalyzing}
        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:bg-slate-300 transition"
        style={{ cursor: busy ? "not-allowed" : "pointer" }}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {busy
          ? "Erstelle …"
          : sitemap && selectedCount > 1
            ? `Site mit ${selectedCount} Seiten anlegen`
            : "Site anlegen"}
      </button>

      <CreateProgressModal
        open={modalOpen}
        stage={stage}
        busy={busy}
        steps={steps}
        done={done}
        error={error}
        onChoosePreset={onChoosePreset}
        onApproveVibe={onApproveVibe}
        onClose={closeModal}
      />
    </form>
  );
}
