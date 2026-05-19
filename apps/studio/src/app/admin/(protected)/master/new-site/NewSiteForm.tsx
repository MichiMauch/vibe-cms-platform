"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { THEME_PRESETS, DEFAULT_PRESET_ID, type ThemePresetId } from "@vibe-cms-platform/core/theme";
import { CreateProgressModal, type ProgressStep, type SuccessPayload } from "./CreateProgressModal";

const TEMPLATES = [
  { id: "saas", label: "SaaS / Produkt", description: "Hero, Features, Pricing, CTA, Footer." },
  { id: "agentur", label: "Agentur / Studio", description: "Hero, Features, Team, Testimonial, CTA, Footer." },
  { id: "event", label: "Event / Launch", description: "Hero, Highlights, CTA, Footer." },
  { id: "blank", label: "Blank", description: "Minimal: nur Hero + Footer." },
];

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
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [done, setDone] = useState<SuccessPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function closeModal() {
    setModalOpen(false);
    setSteps([]);
    setDone(null);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSteps([]);
    setDone(null);
    setError(null);
    setModalOpen(true);

    try {
      const res = await fetch("/api/sites/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          brand,
          template,
          description,
          audience,
          primaryGoal,
          customerEmail,
          customDomain: customDomain.trim() || undefined,
          theme: {
            preset: themePreset,
            accentOverride: accentOverride.trim() || undefined,
          },
        }),
      });
      if (!res.ok || !res.body) {
        const text = await res.text();
        setError(text || `HTTP ${res.status}`);
        setBusy(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
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
          else if (name === "done") setDone(parsed);
          else if (name === "error") setError(parsed.message);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
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
        <legend className="text-sm font-medium text-slate-700">Look (Theme)</legend>
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
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:bg-slate-300 transition"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {busy ? "Erstelle …" : "Site anlegen"}
      </button>

      <CreateProgressModal
        open={modalOpen}
        busy={busy}
        steps={steps}
        done={done}
        error={error}
        onClose={closeModal}
      />
    </form>
  );
}
