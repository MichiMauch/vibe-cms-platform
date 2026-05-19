/**
 * AI-facing summary of every block. Lives next to defaults.ts so server
 * scaffolders can hand the OpenAI prompt a compact picture of what's
 * available and what each block expects, without dragging in React/Puck
 * runtime. Field lists here are intentionally narrower than `config.tsx` —
 * only the props the model is asked to fill. Anything missing in the model
 * output is back-filled from BLOCK_DEFAULTS.
 */

import type { ThemePresetId } from "../theme";

export type Vibe = {
  id: ThemePresetId;
  label: string;
  oneLiner: string;
  bestFor: string;
  avoidFor: string;
};

/** Vibe vocabulary the AI picks from when suggesting a design archetype.
 * Order matches the THEME_PRESETS array. Keep both in sync. */
export const VIBES: Vibe[] = [
  { id: "studio",    label: "Studio",          oneLiner: "Safe modern blue + slate. Default.",            bestFor: "general business, dashboards",                  avoidFor: "brands wanting to stand out" },
  { id: "aurora",    label: "Aurora",          oneLiner: "Purple-cyan gradient, soft surfaces.",          bestFor: "AI / creative SaaS",                            avoidFor: "law, finance, healthcare" },
  { id: "forest",    label: "Forest",          oneLiner: "Deep green, warm paper, serif.",                bestFor: "sustainability, wellness, agencies",            avoidFor: "tech-bro startups" },
  { id: "sunset",    label: "Sunset",          oneLiner: "Coral-amber, bold uppercase.",                  bestFor: "events, lifestyle, food",                       avoidFor: "enterprise B2B" },
  { id: "mono",      label: "Mono",            oneLiner: "Black + white, mono headings.",                 bestFor: "designers, devtools, editorial",                avoidFor: "kid-friendly products" },
  { id: "tech",      label: "Tech Corporate",  oneLiner: "Crisp sky-blue + indigo, grid bg.",             bestFor: "infra, fintech, B2B SaaS",                      avoidFor: "creative agencies, artists" },
  { id: "brutal",    label: "Brutalism",       oneLiner: "Yellow + black, hard borders, mono.",           bestFor: "indie devs, gen-Z brands, art collectives",     avoidFor: "healthcare, banks" },
  { id: "organic",   label: "Minimal Organic", oneLiner: "Olive + apricot, scribbly, fraunces serif.",    bestFor: "skincare, wellness, slow-tech, food",           avoidFor: "fintech, infra" },
  { id: "editorial", label: "Editorial",       oneLiner: "Playfair serif, halftone, double rules.",       bestFor: "newsletters, publishers, longform",             avoidFor: "transactional SaaS" },
  { id: "playful",   label: "Playful",         oneLiner: "Hot pink + cyan, sticker cards.",               bestFor: "kids, consumer apps, edtech",                   avoidFor: "B2B finance" },
];

export function renderVibesForPrompt(): string {
  return VIBES.map(
    (v) => `- ${v.id}: ${v.oneLiner} Best for: ${v.bestFor}. Avoid for: ${v.avoidFor}.`,
  ).join("\n");
}

export type BlockFieldSpec = {
  name: string;
  type: "text" | "richHtml" | "url" | "enum" | "array";
  /** For enum: allowed values. For array: nested per-item field specs. */
  enum?: readonly string[];
  itemFields?: BlockFieldSpec[];
  /** True if the AI must produce it; false fields fall back to defaults. */
  required: boolean;
  hint?: string;
};

export type BlockSpec = {
  type: string;
  purpose: string;
  whenToUse: string;
  fields: BlockFieldSpec[];
};

export const SCAFFOLD_BLOCKS: BlockSpec[] = [
  {
    type: "Hero",
    purpose: "Opening section with eyebrow, headline, subtitle and a primary CTA.",
    whenToUse: "Always first. Every page needs one — sets the pitch in 1 screen.",
    fields: [
      { name: "eyebrow", type: "text", required: false, hint: "Short label above the title (2-4 words)." },
      { name: "title", type: "text", required: true, hint: "Main headline. Keep punchy, 4-9 words." },
      { name: "subtitle", type: "richHtml", required: true, hint: "1-2 sentences supporting the headline. Wrap in <p>." },
      { name: "ctaLabel", type: "text", required: true, hint: "Action verb on the button (e.g. 'Jetzt starten')." },
      { name: "ctaHref", type: "url", required: true, hint: "Use '#' or a section anchor like '#pricing'." },
      {
        name: "layout.layout",
        type: "enum",
        required: false,
        enum: ["centered", "left", "split-right", "split-left", "oversized"],
        hint: "Hero layout. Pick 'oversized' ONLY when there is no product screenshot and the brand wants pure-typography impact (Editorial, Tech, Brutal vibes). Default: 'centered'.",
      },
    ],
  },
  {
    type: "FeaturesGrid",
    purpose: "Grid of 3-6 feature cards with icon, title, short description.",
    whenToUse: "Right after the Hero, to break down the value proposition into bullets.",
    fields: [
      { name: "title", type: "text", required: true, hint: "Section headline." },
      { name: "subtitle", type: "richHtml", required: false },
      {
        name: "layout",
        type: "enum",
        required: false,
        enum: ["grid-3", "grid-4", "list-icon-left", "bento"],
        hint: "Layout. 'grid-3' is the safe default. Use 'grid-4' for ≥6 short features. Use 'bento' only for visual-heavy creative pages (Playful, Aurora). Use 'list-icon-left' for editorial or organic vibes.",
      },
      {
        name: "items",
        type: "array",
        required: true,
        hint: "3-6 features.",
        itemFields: [
          {
            name: "icon",
            type: "enum",
            required: true,
            enum: [
              "Sparkles", "Zap", "ShieldCheck", "Globe", "Heart", "Star",
              "TrendingUp", "Layers", "Settings", "Users", "Lock", "Lightbulb",
              "Rocket", "Award", "Target",
            ],
          },
          { name: "title", type: "text", required: true },
          { name: "description", type: "richHtml", required: true },
        ],
      },
    ],
  },
  {
    type: "Stats",
    purpose: "Strip of large numbers / KPIs to add credibility.",
    whenToUse: "Below Hero or Features when you have concrete metrics worth bragging about.",
    fields: [
      { name: "intro", type: "text", required: false, hint: "Optional caption above the numbers." },
      {
        name: "layout",
        type: "enum",
        required: false,
        enum: ["grid", "row", "oversized"],
        hint: "'grid' (default) for 4 stats. 'row' is good directly after a hero. 'oversized' only as a hero-replacement for editorial/playful brands.",
      },
      {
        name: "items",
        type: "array",
        required: true,
        hint: "3-4 stat entries.",
        itemFields: [
          { name: "value", type: "text", required: true, hint: "The big number, e.g. '+200%', '12 Mio'." },
          { name: "label", type: "text", required: true, hint: "Short label below the value." },
        ],
      },
    ],
  },
  {
    type: "Testimonial",
    purpose: "Single quote (centered) or a set of quotes (grid-3 / carousel).",
    whenToUse: "After Features or Pricing for social proof. Skip if no real quote exists.",
    fields: [
      { name: "quote", type: "richHtml", required: true, hint: "Wrap the quote in <p>." },
      { name: "author", type: "text", required: true },
      { name: "role", type: "text", required: true, hint: "Format: 'Rolle, Firma'." },
      {
        name: "layout",
        type: "enum",
        required: false,
        enum: ["centered", "grid-3", "carousel"],
        hint: "Default 'centered' for one quote. Use 'grid-3' when you have ≥3 quotes. Use 'carousel' for testimonial-heavy pages.",
      },
      {
        name: "items",
        type: "array",
        required: false,
        hint: "Extra quotes for grid-3 / carousel. If you set layout='grid-3' or 'carousel', include at least 2 entries here.",
        itemFields: [
          { name: "quote", type: "richHtml", required: true },
          { name: "author", type: "text", required: true },
          { name: "role", type: "text", required: true },
        ],
      },
    ],
  },
  {
    type: "ImageText",
    purpose: "Two-column section pairing prose with an image.",
    whenToUse: "Storytelling moments — process, story, hero feature deep-dive.",
    fields: [
      { name: "title", type: "text", required: true },
      { name: "content", type: "richHtml", required: true, hint: "Multiple <p> tags allowed; can use <strong>, <em>." },
      { name: "imageAlt", type: "text", required: false },
      {
        name: "layout",
        type: "enum",
        required: false,
        enum: ["image-left", "image-right", "stacked", "card-overlay"],
        hint: "Default 'image-right'. 'stacked' for mobile-first or text-heavy stories. 'card-overlay' for visual brands (Playful, Sunset).",
      },
    ],
  },
  {
    type: "CtaBanner",
    purpose: "Bold banner with a heading and 1-2 CTAs.",
    whenToUse: "Just above the Footer, to give one last conversion push.",
    fields: [
      { name: "title", type: "text", required: true },
      { name: "subtitle", type: "richHtml", required: false },
      { name: "ctaPrimaryLabel", type: "text", required: true },
      { name: "ctaPrimaryHref", type: "url", required: true },
      { name: "ctaSecondaryLabel", type: "text", required: false },
      { name: "ctaSecondaryHref", type: "url", required: false },
      { name: "theme", type: "enum", enum: ["blue", "dark", "gradient"], required: true },
    ],
  },
  {
    type: "LogoCloud",
    purpose: "Row of customer/partner logos (or just names).",
    whenToUse: "Near top of page if you have recognizable brand logos to flex.",
    fields: [
      { name: "intro", type: "text", required: true },
      {
        name: "items",
        type: "array",
        required: true,
        hint: "4-8 logo entries; leave `image` empty if no upload yet.",
        itemFields: [
          { name: "name", type: "text", required: true },
        ],
      },
    ],
  },
  {
    type: "Faq",
    purpose: "Accordion of frequently asked questions.",
    whenToUse: "Lower on the page, after Pricing or Features.",
    fields: [
      { name: "title", type: "text", required: true },
      { name: "subtitle", type: "richHtml", required: false },
      {
        name: "items",
        type: "array",
        required: true,
        hint: "4-8 Q&A pairs that pre-empt buyer doubts.",
        itemFields: [
          { name: "question", type: "text", required: true },
          { name: "answer", type: "richHtml", required: true },
        ],
      },
    ],
  },
  {
    type: "Team",
    purpose: "Grid of team members with name, role, bio.",
    whenToUse: "Agency / personal-brand sites. Skip for pure SaaS landing pages.",
    fields: [
      { name: "title", type: "text", required: true },
      { name: "subtitle", type: "richHtml", required: false },
      {
        name: "members",
        type: "array",
        required: true,
        hint: "2-6 members.",
        itemFields: [
          { name: "name", type: "text", required: true },
          { name: "role", type: "text", required: true },
          { name: "bio", type: "richHtml", required: true },
        ],
      },
    ],
  },
  {
    type: "Pricing",
    purpose: "Pricing-plan cards, comparison table, or single-card with toggle.",
    whenToUse: "SaaS / product sites with concrete price tiers.",
    fields: [
      { name: "title", type: "text", required: true },
      { name: "subtitle", type: "richHtml", required: false },
      {
        name: "layout",
        type: "enum",
        required: false,
        enum: ["cards-3", "comparison-table", "single-toggle"],
        hint: "'cards-3' (default) for 2-3 plans. 'comparison-table' for B2B SaaS with feature-rich tiers — also populate rowLabels and each plan's rowValues. 'single-toggle' when you have one product with monthly/yearly pricing.",
      },
      {
        name: "rowLabels",
        type: "array",
        required: false,
        hint: "Only for comparison-table. e.g. [{value:'Seats'},{value:'Storage'},{value:'Support'}].",
        itemFields: [{ name: "value", type: "text", required: true }],
      },
      {
        name: "plans",
        type: "array",
        required: true,
        hint: "2-4 plans. Mark exactly one with featured:true.",
        itemFields: [
          {
            name: "icon",
            type: "enum",
            required: true,
            enum: ["Sparkles", "Zap", "Rocket", "Crown", "Star"],
          },
          { name: "name", type: "text", required: true },
          { name: "price", type: "text", required: true, hint: "e.g. 'CHF 49', 'kostenlos'." },
          { name: "priceCaption", type: "text", required: false, hint: "e.g. 'pro Monat'." },
          { name: "ctaLabel", type: "text", required: true },
          { name: "ctaHref", type: "url", required: true },
          { name: "featured", type: "enum", enum: ["true", "false"], required: true, hint: "JSON boolean true or false — exactly one plan should be featured:true." },
          {
            name: "features",
            type: "array",
            required: true,
            hint: "3-6 bullet points.",
            itemFields: [{ name: "value", type: "text", required: true }],
          },
          { name: "priceMonthly", type: "text", required: false, hint: "Only for single-toggle layout." },
          { name: "priceYearly", type: "text", required: false, hint: "Only for single-toggle layout." },
          {
            name: "rowValues",
            type: "array",
            required: false,
            hint: "Only for comparison-table; parallel to rowLabels. Use '✓' / 'true' for ticks.",
            itemFields: [{ name: "value", type: "text", required: true }],
          },
        ],
      },
    ],
  },
  {
    type: "RichBlock",
    purpose: "Single HTML rich-text block. Multiple paragraphs, bold/italic/links allowed.",
    whenToUse: "Long-form prose: about, story, manifesto.",
    fields: [
      { name: "content", type: "richHtml", required: true, hint: "Wrap each paragraph in <p>. Use <strong>, <em>, <a href> as needed." },
    ],
  },
  {
    type: "Footer",
    purpose: "Site footer with copyright + optional link columns.",
    whenToUse: "Always last.",
    fields: [
      { name: "copyright", type: "text", required: true },
      { name: "tagline", type: "text", required: false },
      {
        name: "columns",
        type: "array",
        required: false,
        hint: "Optional 2-4 link groups (Produkt, Firma, Legal, etc.).",
        itemFields: [
          { name: "heading", type: "text", required: true },
          {
            name: "links",
            type: "array",
            required: true,
            itemFields: [
              { name: "label", type: "text", required: true },
              { name: "href", type: "url", required: true },
            ],
          },
        ],
      },
    ],
  },
];

/** Compact text rendering of the schema for an OpenAI system prompt. */
export function renderSchemaForPrompt(): string {
  const lines: string[] = [];
  for (const block of SCAFFOLD_BLOCKS) {
    lines.push(`## ${block.type}`);
    lines.push(`Purpose: ${block.purpose}`);
    lines.push(`When: ${block.whenToUse}`);
    lines.push("Fields:");
    for (const f of block.fields) {
      lines.push(`  - ${describeField(f, 2)}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function describeField(f: BlockFieldSpec, indent: number): string {
  const pad = " ".repeat(indent);
  const req = f.required ? "REQUIRED" : "optional";
  const head = `${f.name} (${f.type}, ${req})${f.hint ? ` — ${f.hint}` : ""}`;
  if (f.type === "enum" && f.enum) {
    return `${head}\n${pad}  one of: ${f.enum.join(", ")}`;
  }
  if (f.type === "array" && f.itemFields) {
    const nested = f.itemFields.map((x) => `${pad}    - ${describeField(x, indent + 4)}`).join("\n");
    return `${head}\n${pad}  item fields:\n${nested}`;
  }
  return head;
}
