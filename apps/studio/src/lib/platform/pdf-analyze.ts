import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import { renderVibesForPrompt } from "@vibe-cms-platform/core/puck";
import {
  isValidPresetId,
  DEFAULT_PRESET_ID,
  type ThemePresetId,
} from "@vibe-cms-platform/core/theme";
import { normalisePagePath } from "@vibe-cms-platform/core/site";

export type PdfVibeSuggestion = {
  preset: ThemePresetId;
  rationale: string;
  confidence: "high" | "medium" | "low";
};

export type PdfSitemapEntry = {
  /** URL path under the locale. "" = homepage. May be nested ("standort/luzern"). */
  path: string;
  /** Display title in nav + browser tab. */
  title: string;
  /** Parent path that groups this page (must reference another entry's path). */
  parent?: string;
  /** 3–6 sentence brief used as input to the per-page scaffolder. */
  pageBrief: string;
  /** 1 = must-have, 2 = important, 3 = nice-to-have. */
  priority: 1 | 2 | 3;
};

export type PdfAnalysis = {
  brand: string;
  brief: string;
  audience: string;
  primaryGoal: string;
  language: "de" | "en" | "fr" | "it";
  vibeSuggestion: PdfVibeSuggestion;
  sitemap: PdfSitemapEntry[];
};

const PRIORITY_VALUES = ["1", "2", "3"] as const;
const LANG_VALUES = ["de", "en", "fr", "it"] as const;
const CONFIDENCE_VALUES = ["high", "medium", "low"] as const;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  required: [
    "brand",
    "brief",
    "audience",
    "primaryGoal",
    "language",
    "vibeSuggestion",
    "sitemap",
  ],
  properties: {
    brand: { type: Type.STRING },
    brief: { type: Type.STRING },
    audience: { type: Type.STRING },
    primaryGoal: { type: Type.STRING },
    language: { type: Type.STRING, enum: [...LANG_VALUES] },
    vibeSuggestion: {
      type: Type.OBJECT,
      required: ["preset", "rationale", "confidence"],
      properties: {
        preset: { type: Type.STRING },
        rationale: { type: Type.STRING },
        confidence: { type: Type.STRING, enum: [...CONFIDENCE_VALUES] },
      },
    },
    sitemap: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["path", "title", "pageBrief", "priority"],
        properties: {
          path: { type: Type.STRING },
          title: { type: Type.STRING },
          parent: { type: Type.STRING },
          pageBrief: { type: Type.STRING },
          priority: { type: Type.STRING, enum: [...PRIORITY_VALUES] },
        },
      },
    },
  },
};

const SYSTEM_PROMPT = `You analyse a website concept / requirements document (PDF, usually a slide deck) and produce a structured site plan for a multi-page website generator.

OUTPUT
Return valid JSON matching the provided schema. No prose around it.

FIELDS
- brand: the brand or organisation name shown in the deck.
- brief: 2–4 short sentences capturing the positioning / value proposition, in the SAME language as the deck.
- audience: 1 sentence describing the target audience.
- primaryGoal: 1 sentence describing the main conversion goal (e.g. "Termin anfragen", "Newsletter abonnieren").
- language: the deck's primary language: "de" (German, default for Swiss/DACH content), "en", "fr", or "it".

VIBE SELECTION
Pick exactly ONE vibe preset from this vocabulary that best matches the brand's industry, tone, and target audience:
${renderVibesForPrompt()}

Return:
- preset: the id
- rationale: one short sentence (≤140 chars) in the deck's language explaining WHY this vibe fits
- confidence: "high" if the deck gives clear signals, "medium" for plausible, "low" when guessing

SITEMAP
Extract the website's page architecture from the deck. The deck may show this as a sitemap diagram, a navigation list, sectioned wireframes, content categories, etc.

Rules:
- First entry MUST be the homepage with path = "" and priority = 1.
- Use kebab-case for paths. Nested pages use "/" (e.g. "standort/luzern", "behandlungen/zahnspange").
- For nested pages, set "parent" to the parent's path (must match another entry).
- Each page needs a 3–6 sentence pageBrief (in the deck's language) describing what content the page should contain. Be concrete: pull positioning statements, value props, FAQ topics, hero messages, social proof, CTAs from the deck.
- Mark priority:
  - "1" = must-have (homepage, top nav items, primary services/locations)
  - "2" = important secondary pages (sub-services, about, location detail)
  - "3" = nice-to-have (deep secondary content, legal-only pages)
- Cap at 12 entries. If the deck shows more, pick the 12 most strategic. Prefer breadth (top-level pages) over depth.
- Use realistic Swiss German conventions where applicable (ä/ö/ü, ss not ß) when language = "de".
- Do NOT include legal-only pages like "Impressum" or "Datenschutz" unless the deck explicitly emphasises them.
- Skip pages without enough information to write a meaningful brief.

If the deck only describes a single landingpage (not a multi-page site), return ONE sitemap entry: the homepage.`;

function clampPriority(value: unknown): 1 | 2 | 3 {
  const n = typeof value === "string" ? parseInt(value, 10) : Number(value);
  if (n === 1 || n === 2 || n === 3) return n;
  return 2;
}

function clampLanguage(value: unknown): PdfAnalysis["language"] {
  if (value === "de" || value === "en" || value === "fr" || value === "it") return value;
  return "de";
}

function clampConfidence(value: unknown): PdfVibeSuggestion["confidence"] {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "medium";
}

const PAGE_BUDGET = 12;

function normaliseSitemap(raw: unknown, language: string): PdfSitemapEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: PdfSitemapEntry[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const rawPath = typeof o.path === "string" ? o.path : "";
    const path = normalisePagePath(rawPath);
    const title = typeof o.title === "string" ? o.title.trim() : "";
    const pageBrief = typeof o.pageBrief === "string" ? o.pageBrief.trim() : "";
    if (!title || !pageBrief) continue;
    if (seen.has(path)) continue;
    seen.add(path);
    const entry: PdfSitemapEntry = {
      path,
      title,
      pageBrief,
      priority: clampPriority(o.priority),
    };
    const parent = typeof o.parent === "string" ? normalisePagePath(o.parent) : "";
    if (parent) entry.parent = parent;
    entries.push(entry);
  }
  // Guarantee a homepage entry. If the model omitted it, synthesize one.
  if (!entries.some((e) => e.path === "")) {
    entries.unshift({
      path: "",
      title: language === "de" ? "Startseite" : "Home",
      pageBrief: "Übersichtsseite des Brands — Positioning, Hauptangebot, Hero, Hauptnavigation und Top-CTA.",
      priority: 1,
    });
  }
  // Sort: homepage first, then by priority asc, then by path asc.
  entries.sort((a, b) => {
    if (a.path === "" && b.path !== "") return -1;
    if (b.path === "" && a.path !== "") return 1;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.path.localeCompare(b.path);
  });
  // Drop parents that don't exist.
  const allPaths = new Set(entries.map((e) => e.path));
  for (const e of entries) {
    if (e.parent && !allPaths.has(e.parent)) delete e.parent;
  }
  return entries.slice(0, PAGE_BUDGET);
}

export async function analyzePdf(opts: {
  apiKey: string;
  model: string;
  pdfBytes: Uint8Array;
  pdfName?: string;
}): Promise<PdfAnalysis> {
  if (!opts.apiKey) {
    throw new Error("GEMINI_API_KEY not configured. Set it in .env.local to use PDF analysis.");
  }
  const ai = new GoogleGenAI({ apiKey: opts.apiKey });
  const base64 = Buffer.from(opts.pdfBytes).toString("base64");

  const response = await ai.models.generateContent({
    model: opts.model,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64,
            },
          },
          {
            text:
              SYSTEM_PROMPT +
              (opts.pdfName ? `\n\nSource file: ${opts.pdfName}` : ""),
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.3,
    },
  });

  const raw = response.text;
  if (!raw) throw new Error("Gemini returned empty response");

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch (err) {
    throw new Error(
      `Gemini returned invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const language = clampLanguage(parsed.language);
  const vibeObj = (parsed.vibeSuggestion ?? {}) as Record<string, unknown>;
  const presetRaw = vibeObj.preset;
  const preset: ThemePresetId = isValidPresetId(presetRaw) ? presetRaw : DEFAULT_PRESET_ID;
  const rationale = typeof vibeObj.rationale === "string" ? vibeObj.rationale.slice(0, 200) : "";
  const sitemap = normaliseSitemap(parsed.sitemap, language);

  return {
    brand: typeof parsed.brand === "string" ? parsed.brand.trim() : "",
    brief: typeof parsed.brief === "string" ? parsed.brief.trim() : "",
    audience: typeof parsed.audience === "string" ? parsed.audience.trim() : "",
    primaryGoal: typeof parsed.primaryGoal === "string" ? parsed.primaryGoal.trim() : "",
    language,
    vibeSuggestion: {
      preset,
      rationale,
      confidence: clampConfidence(vibeObj.confidence),
    },
    sitemap,
  };
}
