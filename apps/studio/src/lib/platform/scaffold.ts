import "server-only";
import OpenAI from "openai";
import { BLOCK_DEFAULTS, BLOCK_TYPES, ROOT_DEFAULTS } from "@vibe-cms-platform/core/puck";
import {
  renderSchemaForPrompt,
  renderVibesForPrompt,
  renderLayoutDefaultsForPrompt,
} from "@vibe-cms-platform/core/puck";
import { isValidPresetId, DEFAULT_PRESET_ID, type ThemePresetId } from "@vibe-cms-platform/core/theme";

export type TemplateId = "blank" | "saas" | "agentur" | "event";

export type Brief = {
  brand: string;
  template: TemplateId;
  description: string;
  audience?: string;
  primaryGoal?: string;
  /** If set, the AI is told to USE this vibe and skip suggestion. */
  pinnedVibe?: ThemePresetId | null;
  /** Output language. Default "de". Passed to the model so non-German briefs
   * yield non-German content. */
  language?: "de" | "en" | "fr" | "it";
  /** When generating a sub-page of a multi-page site: tells the model that
   * this is NOT a homepage, gives it the site-wide positioning, and asks it
   * to focus on this page's specific topic. Omit for single-page sites. */
  pageContext?: {
    /** URL path. "" = homepage, "standort/luzern" = sub-page. */
    pagePath: string;
    /** Human title (used in nav + as the Hero anchor for the page). */
    pageTitle: string;
    /** Whole-site positioning so all pages stay tonally coherent. */
    siteContext: string;
  };
};

/** Hard cap on how many pages a single multi-page scaffold will produce.
 * Each page costs ~1 OpenAI call. */
export const MAX_PAGES_PER_SITE = 12;

export type VibeSuggestion = {
  preset: ThemePresetId;
  rationale: string;
  confidence: "high" | "medium" | "low";
};

export type ScaffoldResult = {
  contentJson: string;
  vibeSuggestion: VibeSuggestion;
};

/** Stylistic hint per template — picks block bias without being prescriptive.
 * The AI still decides the final composition based on the brief. */
const TEMPLATE_HINT: Record<TemplateId, string> = {
  blank: "Neutral page. Pick whatever blocks make sense for the brief.",
  saas: "SaaS product landing — typically Hero · FeaturesGrid · Stats · Testimonial · Pricing · Faq · CtaBanner · Footer.",
  agentur: "Agency / studio site — typically Hero · ImageText · Team · LogoCloud · Testimonial · CtaBanner · Footer.",
  event: "Single-event page — typically Hero · ImageText · Stats · Faq · CtaBanner · Footer.",
};

const SYSTEM_PROMPT = `You compose a page content tree for the Vibe-CMS Puck editor.

OUTPUT FORMAT
Return strict JSON, no commentary, with exactly these top-level keys:
{
  "content": [ { "type": "<BlockType>", "props": { ... } }, ... ],
  "root": { "props": { "seo": {...}, "chatbot": {...} } },
  "zones": {},
  "vibeSuggestion": { "preset": "<id>", "rationale": "<≤140 chars, in the output language>", "confidence": "high|medium|low" }
}

CONTENT RULES
- The "content" array is the page, top to bottom. Pick the blocks that fit the brief; obey the user's explicit wishes (e.g. "use every block once").
- Always start with a Hero and end with a Footer.
- Only use block types listed in the schema below — anything else is silently dropped.
- For each block, populate the REQUIRED fields with realistic, brief-specific copy.
  Optional fields: include them when they add value, otherwise omit them — defaults will be applied.
- Field types:
    text     → plain string
    richHtml → HTML string; wrap paragraphs in <p>, use <strong>, <em>, <a href="…">
    url      → "#" or a section anchor like "#pricing"
    enum     → exactly one of the listed values
    array    → JSON array of objects matching the item-field schema
- Output language: see the "language" field in the user message; default is German.
- Swiss German conventions for German output: ä/ö/ü, ss — never ß.
- Brand names, technical terms, product nouns: keep them unchanged.

PAGE-CONTEXT (multi-page sites)
If the user message contains a "pageContext" object, you are composing ONE page of a multi-page site:
- "pageContext.pagePath" identifies the page ("" for the homepage, otherwise a kebab-case URL path).
- "pageContext.pageTitle" is the human title — use it for the Hero headline / page-specific framing.
- "pageContext.siteContext" gives the whole-site positioning — anchor tone, brand voice, and any cross-page references in it.
- For sub-pages (pagePath !== ""): focus the content on THIS specific topic. The Hero should reflect the page topic, NOT the whole brand pitch. Skip blocks that belong to the homepage (e.g. broad pricing comparisons on a single-location page).
- A Footer block is still required on every page.
- Do not output a SiteHeader / Nav block — site navigation is rendered automatically from the page list.

LAYOUT VARIANT SELECTION
- Each block whose schema lists a "layout" enum supports multiple visual layouts.
- Pick the layout that best fits the chosen vibe and the brief, following the per-block hints.
- Layouts are OPTIONAL — omit (or set to "auto") when the per-vibe default is best.

PER-VIBE LAYOUT DEFAULTS (applied at render time when "layout" is omitted or "auto"):
${renderLayoutDefaultsForPrompt()}

You SHOULD use the per-vibe defaults above unless the brief actively contradicts them. Setting "layout" to "auto" is the same as omitting it — the renderer will substitute the vibe-default. Use explicit layout values only when the brief calls for a specific structure that overrides the vibe's preference.

VIBE SELECTION
You MUST pick exactly ONE vibe preset that fits the brand's industry, tone, and target audience.
Vibe vocabulary:
${renderVibesForPrompt()}

Return your pick under top-level "vibeSuggestion":
- "preset": the id (e.g. "tech")
- "rationale": one short German sentence (≤140 chars) explaining WHY this vibe fits
- "confidence": "high" if the brief gives clear signals, "medium" for plausible-but-debatable, "low" when guessing

If the user pinned a vibe (look at brief.pinnedVibe), echo it back as preset, set rationale = "Vom Nutzer gewählt." and confidence = "high".

ROOT RULES
- root.props.seo: fill title (≤ 60 chars), description (≤ 160 chars), ogTitle, ogDescription, keywords (comma-separated, 5-10 keywords).
- root.props.chatbot: { "isEnabled": false, "botName": "<Brand>-Assistent", "welcomeMessage": "Kurze Begrüssung." }

AVAILABLE BLOCKS:

${renderSchemaForPrompt()}

Return only the JSON object. No prose around it.`;

/** Deep-merge plain objects. Arrays are overwritten wholesale by the override. */
function mergeDeep<T extends Record<string, unknown>>(base: T, override: Partial<T>): T {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v === undefined) continue;
    const b = (base as Record<string, unknown>)[k];
    if (
      v !== null &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      b !== null &&
      typeof b === "object" &&
      !Array.isArray(b)
    ) {
      out[k] = mergeDeep(b as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

type RawBlock = { type?: unknown; props?: unknown };
type RawTree = {
  content?: unknown;
  root?: { props?: unknown };
  zones?: unknown;
  vibeSuggestion?: unknown;
};

function normaliseVibeSuggestion(raw: unknown): VibeSuggestion {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const presetRaw = obj.preset;
  const preset: ThemePresetId = isValidPresetId(presetRaw) ? presetRaw : DEFAULT_PRESET_ID;
  const rationaleRaw = typeof obj.rationale === "string" ? obj.rationale : "";
  const rationale = rationaleRaw.slice(0, 200);
  const confRaw = obj.confidence;
  const confidence: VibeSuggestion["confidence"] =
    confRaw === "high" || confRaw === "low" ? confRaw : "medium";
  return { preset, rationale, confidence };
}

/** Validate AI output, drop unknown blocks, back-fill defaults, assign ids. */
function normaliseTree(raw: RawTree): {
  content: Array<{ type: string; props: Record<string, unknown> }>;
  root: { props: Record<string, unknown> };
  zones: Record<string, unknown>;
} {
  const validBlocks = new Set(BLOCK_TYPES);
  const inputContent = Array.isArray(raw.content) ? (raw.content as RawBlock[]) : [];
  const content: Array<{ type: string; props: Record<string, unknown> }> = [];
  const counter: Record<string, number> = {};

  for (const b of inputContent) {
    if (typeof b?.type !== "string" || !validBlocks.has(b.type)) continue;
    const props = (b.props && typeof b.props === "object" ? b.props : {}) as Record<string, unknown>;
    const defaults = BLOCK_DEFAULTS[b.type] ?? {};
    const merged = mergeDeep(defaults as Record<string, unknown>, props);
    counter[b.type] = (counter[b.type] ?? 0) + 1;
    merged.id = `${b.type}-${counter[b.type]}`;
    content.push({ type: b.type, props: merged });
  }

  const rawRootProps =
    raw.root && typeof raw.root === "object" && raw.root.props && typeof raw.root.props === "object"
      ? (raw.root.props as Record<string, unknown>)
      : {};
  const rootProps = mergeDeep(ROOT_DEFAULTS as unknown as Record<string, unknown>, rawRootProps);

  return { content, root: { props: rootProps }, zones: {} };
}

export async function scaffoldContent(opts: {
  apiKey: string;
  model: string;
  brief: Brief;
}): Promise<ScaffoldResult> {
  const openai = new OpenAI({ apiKey: opts.apiKey });
  const language = opts.brief.language ?? "de";
  const completion = await openai.chat.completions.create({
    model: opts.model,
    response_format: { type: "json_object" },
    temperature: 0.4,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          brief: opts.brief,
          templateHint: TEMPLATE_HINT[opts.brief.template],
          language,
          pageContext: opts.brief.pageContext,
        }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned empty response");

  let parsed: RawTree;
  try {
    parsed = JSON.parse(raw) as RawTree;
  } catch (err) {
    throw new Error(`OpenAI returned invalid JSON: ${err instanceof Error ? err.message : String(err)}`);
  }

  const normalised = normaliseTree(parsed);
  if (normalised.content.length === 0) {
    throw new Error("AI scaffolder produced no valid blocks");
  }

  // Vibe-suggestion lives outside the tree so callers can show it before save.
  // If the user pinned a vibe, force it through — never let the model override
  // an explicit user choice.
  let vibeSuggestion = normaliseVibeSuggestion(parsed.vibeSuggestion);
  if (opts.brief.pinnedVibe && isValidPresetId(opts.brief.pinnedVibe)) {
    vibeSuggestion = {
      preset: opts.brief.pinnedVibe,
      rationale: "Vom Nutzer gewählt.",
      confidence: "high",
    };
  }

  return {
    contentJson: JSON.stringify(normalised, null, 2),
    vibeSuggestion,
  };
}

/** Input page for a multi-page scaffold run. */
export type SitePage = {
  /** URL path ("" = homepage). */
  path: string;
  /** Human title. */
  title: string;
  /** Parent path (must reference another page in the list). */
  parent?: string;
  /** Page-specific brief (3–6 sentences) — what content this page should hold. */
  pageBrief: string;
};

export type ScaffoldedPage = {
  path: string;
  title: string;
  parent?: string;
  /** Puck JSON tree as a serialised string (same shape as scaffoldContent's output). */
  contentJson: string;
};

export type ScaffoldSiteResult = {
  pages: ScaffoldedPage[];
  vibeSuggestion: VibeSuggestion;
};

/** Generate one Puck tree per input page. The homepage runs first to settle
 * the vibe; subsequent pages are pinned to that vibe so the whole site stays
 * tonally coherent. Callers can stream progress via the `onPageDone` hook.
 *
 * Pages are capped to MAX_PAGES_PER_SITE — extras are dropped silently. */
export async function scaffoldSite(opts: {
  apiKey: string;
  model: string;
  brief: Omit<Brief, "pageContext">;
  pages: SitePage[];
  onPageDone?: (info: { index: number; total: number; page: ScaffoldedPage }) => void;
}): Promise<ScaffoldSiteResult> {
  // Ensure a homepage exists and is first.
  const sorted = [...opts.pages];
  const homeIdx = sorted.findIndex((p) => p.path === "");
  if (homeIdx === -1) {
    throw new Error("scaffoldSite: page list must include a homepage entry (path = \"\")");
  }
  if (homeIdx > 0) {
    const [home] = sorted.splice(homeIdx, 1);
    sorted.unshift(home);
  }
  const capped = sorted.slice(0, MAX_PAGES_PER_SITE);

  const siteContext = [
    `Brand: ${opts.brief.brand}`,
    `Brief: ${opts.brief.description}`,
    opts.brief.audience ? `Audience: ${opts.brief.audience}` : "",
    opts.brief.primaryGoal ? `Primary goal: ${opts.brief.primaryGoal}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const results: ScaffoldedPage[] = [];
  let resolvedVibe: VibeSuggestion | null = null;

  for (let i = 0; i < capped.length; i++) {
    const page = capped[i];
    const isHome = page.path === "";
    const brief: Brief = {
      ...opts.brief,
      // After the homepage, pin the vibe so all pages stay coherent.
      pinnedVibe: isHome ? opts.brief.pinnedVibe ?? null : resolvedVibe?.preset ?? null,
      // For sub-pages, replace the broad description with the page-specific
      // brief and pass site-wide context separately.
      description: isHome
        ? `${opts.brief.description}\n\nThis is the HOMEPAGE.`
        : page.pageBrief,
      pageContext: {
        pagePath: page.path,
        pageTitle: page.title,
        siteContext,
      },
    };
    const result = await scaffoldContent({
      apiKey: opts.apiKey,
      model: opts.model,
      brief,
    });
    if (isHome) resolvedVibe = result.vibeSuggestion;
    const scaffolded: ScaffoldedPage = {
      path: page.path,
      title: page.title,
      parent: page.parent,
      contentJson: result.contentJson,
    };
    results.push(scaffolded);
    opts.onPageDone?.({ index: i, total: capped.length, page: scaffolded });
  }

  return {
    pages: results,
    vibeSuggestion: resolvedVibe ?? {
      preset: DEFAULT_PRESET_ID,
      rationale: "Default vibe (no homepage processed).",
      confidence: "low",
    },
  };
}
