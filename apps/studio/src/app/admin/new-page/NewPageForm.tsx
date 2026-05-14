"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code2,
} from "lucide-react";

type TemplateOption = { id: string; label: string; description: string };

const TEMPLATES: TemplateOption[] = [
  { id: "saas", label: "SaaS / Produkt", description: "Hero, Features, Pricing, CTA, Footer." },
  { id: "agentur", label: "Agentur / Studio", description: "Hero, Features, Team, Testimonial, CTA, Footer." },
  { id: "event", label: "Event / Launch", description: "Hero, Highlights, CTA, Footer." },
  { id: "blank", label: "Blank", description: "Minimal: nur Hero + Footer." },
];

type Step = { step: string; label: string };

export function NewPageForm() {
  const [slug, setSlug] = useState("");
  const [brand, setBrand] = useState("");
  const [template, setTemplate] = useState<string>("saas");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [done, setDone] = useState<{
    slug: string;
    repo: string;
    previewUrl: string;
    customDomain: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSteps([]);
    setDone(null);
    setError(null);

    try {
      const res = await fetch("/api/pages/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, brand, template, description, audience, primaryGoal }),
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
            Repo-Name + Subdomain. Klein, Bindestriche erlaubt.
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
            placeholder="z. B. Solo-Designer in der Schweiz"
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
            placeholder="z. B. Mailing-Liste aufbauen"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:bg-slate-300 transition"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {busy ? "Erstelle …" : "Landingpage anlegen"}
      </button>

      {steps.length > 0 && (
        <ol className="space-y-2 text-sm">
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {s.label}
            </li>
          ))}
        </ol>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {done && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <h3 className="text-base font-semibold text-emerald-900">
            🎉 „{done.slug}" wurde angelegt
          </h3>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>
              <a
                href={done.customDomain}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-emerald-900 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" /> {done.customDomain}
              </a>{" "}
              <span className="text-emerald-700">(SSL bereitet sich ggf. noch vor)</span>
            </li>
            <li>
              <a
                href={done.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-emerald-900 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" /> {done.previewUrl}
              </a>
            </li>
            <li>
              <a
                href={done.repo}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-emerald-900 hover:underline"
              >
                <Code2 className="h-3.5 w-3.5" /> Repo öffnen
              </a>
            </li>
          </ul>
          <p className="mt-3 text-xs text-emerald-700">
            Die erste Build-Pipeline auf Cloudflare Pages läuft jetzt im Hintergrund. In ~1–2
            Minuten ist die Seite live.{" "}
            <Link href="/admin/pages" className="font-medium underline">
              Alle Pages ansehen
            </Link>
            .
          </p>
        </div>
      )}
    </form>
  );
}
