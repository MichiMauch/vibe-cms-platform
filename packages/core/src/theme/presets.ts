import type { ColorToken, FontPair, RadiusScale, PresetStyle } from "./tokens";

export type ThemePresetId =
  | "studio"
  | "aurora"
  | "forest"
  | "sunset"
  | "mono"
  | "tech"
  | "brutal"
  | "organic"
  | "editorial"
  | "playful";

export type ThemePreset = {
  id: ThemePresetId;
  name: string;
  description: string;
  colors: Record<ColorToken, string>;
  fontPair: FontPair;
  radius: RadiusScale;
  style: PresetStyle;
};

/** Resolved per-site theme stored in `config.json`. */
export type SiteThemeChoice = {
  preset: ThemePresetId;
  /** Hex override for `--brand-accent`. Leaves preset otherwise. */
  accentOverride?: string;
  /** Hex override for `--brand-ink` (rare). */
  inkOverride?: string;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "studio",
    name: "Studio",
    description: "Klares Blau, neutrale Slate-Töne, Geist. Sicherer Default.",
    colors: {
      "bg": "#ffffff",
      "surface": "#f8fafc",
      "surface-dark": "#0f172a",
      "ink": "#0f172a",
      "ink-muted": "#475569",
      "ink-subtle": "#94a3b8",
      "ink-inverse": "#f1f5f9",
      "border": "#e2e8f0",
      "accent": "#2563eb",
      "accent-hover": "#1d4ed8",
      "accent-fg": "#ffffff",
      "accent-soft": "#60a5fa",
      "accent-2": "#4f46e5",
    },
    fontPair: "geist",
    radius: "md",
    style: {
      divider: "none",
      bgPattern: "none",
      cardStyle: "soft",
      buttonShape: "pill",
      headingWeight: 700,
      headingTracking: "tight",
      headingTransform: "none",
      spacing: "normal",
      radiusX: "md",
    },
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Violett-Cyan-Gradient, helle Surfaces, Manrope.",
    colors: {
      "bg": "#fdfcff",
      "surface": "#f5f1ff",
      "surface-dark": "#1a1130",
      "ink": "#1a1130",
      "ink-muted": "#5b4d7a",
      "ink-subtle": "#a89ec2",
      "ink-inverse": "#f4ecff",
      "border": "#e6dfff",
      "accent": "#8b5cf6",
      "accent-hover": "#7c3aed",
      "accent-fg": "#ffffff",
      "accent-soft": "#c4b5fd",
      "accent-2": "#06b6d4",
    },
    fontPair: "manrope",
    radius: "lg",
    style: {
      divider: "wave",
      bgPattern: "blob",
      cardStyle: "soft-lg",
      buttonShape: "pill",
      headingWeight: 600,
      headingTracking: "tighter",
      headingTransform: "none",
      spacing: "normal",
      radiusX: "lg",
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Tiefes Grün, warme Surfaces, Fraunces Serif Headings.",
    colors: {
      "bg": "#fbfaf6",
      "surface": "#f1efe6",
      "surface-dark": "#1c2a23",
      "ink": "#1c2a23",
      "ink-muted": "#556b5e",
      "ink-subtle": "#9aa89d",
      "ink-inverse": "#eef4ed",
      "border": "#dcd7c8",
      "accent": "#15803d",
      "accent-hover": "#166534",
      "accent-fg": "#ffffff",
      "accent-soft": "#86efac",
      "accent-2": "#a16207",
    },
    fontPair: "fraunces",
    radius: "md",
    style: {
      divider: "dotted",
      bgPattern: "noise",
      cardStyle: "outline",
      buttonShape: "rounded",
      headingWeight: 400,
      headingTracking: "normal",
      headingTransform: "none",
      spacing: "normal",
      radiusX: "md",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Korall-Amber, weiche Surfaces, Inter.",
    colors: {
      "bg": "#fffaf5",
      "surface": "#fff1e6",
      "surface-dark": "#3a1d10",
      "ink": "#3a1d10",
      "ink-muted": "#8a4a2f",
      "ink-subtle": "#c69079",
      "ink-inverse": "#ffe9d6",
      "border": "#f5d9c2",
      "accent": "#ea580c",
      "accent-hover": "#c2410c",
      "accent-fg": "#ffffff",
      "accent-soft": "#fdba74",
      "accent-2": "#db2777",
    },
    fontPair: "inter",
    radius: "lg",
    style: {
      divider: "tilt",
      bgPattern: "rays",
      cardStyle: "hard-offset",
      buttonShape: "pill",
      headingWeight: 900,
      headingTracking: "tightest",
      headingTransform: "uppercase",
      spacing: "normal",
      radiusX: "lg",
    },
  },
  {
    id: "mono",
    name: "Mono",
    description: "Schwarz-Weiß, kontrastreich, JetBrains Mono Headings.",
    colors: {
      "bg": "#ffffff",
      "surface": "#f4f4f4",
      "surface-dark": "#0a0a0a",
      "ink": "#0a0a0a",
      "ink-muted": "#525252",
      "ink-subtle": "#a3a3a3",
      "ink-inverse": "#fafafa",
      "border": "#d4d4d4",
      "accent": "#0a0a0a",
      "accent-hover": "#262626",
      "accent-fg": "#ffffff",
      "accent-soft": "#737373",
      "accent-2": "#404040",
    },
    fontPair: "jetbrains",
    radius: "sm",
    style: {
      divider: "solid",
      bgPattern: "dot-grid",
      cardStyle: "brutal",
      buttonShape: "sharp",
      headingWeight: 500,
      headingTracking: "tightest",
      headingTransform: "uppercase",
      spacing: "normal",
      radiusX: "sm",
    },
  },
  {
    id: "tech",
    name: "Tech Corporate",
    description: "Crisp Sky-Blue + Indigo, CAD-Grid-Hintergrund, Space Grotesk.",
    colors: {
      "bg": "#ffffff",
      "surface": "#f8fafc",
      "surface-dark": "#0b1220",
      "ink": "#0b1220",
      "ink-muted": "#475569",
      "ink-subtle": "#94a3b8",
      "ink-inverse": "#e0f2fe",
      "border": "#dbeafe",
      "accent": "#0ea5e9",
      "accent-hover": "#0284c7",
      "accent-fg": "#ffffff",
      "accent-soft": "#bae6fd",
      "accent-2": "#6366f1",
    },
    fontPair: "space-grotesk",
    radius: "sm",
    style: {
      divider: "solid",
      bgPattern: "grid",
      cardStyle: "outline",
      buttonShape: "rounded",
      headingWeight: 600,
      headingTracking: "tight",
      headingTransform: "none",
      spacing: "comfortable",
      radiusX: "sm",
    },
  },
  {
    id: "brutal",
    name: "Brutalism",
    description: "Gelb + Schwarz, harte Borders, Mono. Gen-Z-Indie.",
    colors: {
      "bg": "#fef3c7",
      "surface": "#fde68a",
      "surface-dark": "#0a0a0a",
      "ink": "#0a0a0a",
      "ink-muted": "#1f1f1f",
      "ink-subtle": "#525252",
      "ink-inverse": "#fef3c7",
      "border": "#0a0a0a",
      "accent": "#facc15",
      "accent-hover": "#eab308",
      "accent-fg": "#0a0a0a",
      "accent-soft": "#fef08a",
      "accent-2": "#ef4444",
    },
    fontPair: "jetbrains",
    radius: "sm",
    style: {
      divider: "zigzag",
      bgPattern: "diagonal",
      cardStyle: "brutal",
      buttonShape: "sharp",
      headingWeight: 900,
      headingTracking: "normal",
      headingTransform: "uppercase",
      spacing: "tight",
      radiusX: "none",
    },
  },
  {
    id: "organic",
    name: "Minimal Organic",
    description: "Olive + Apricot, scribbly Background, Fraunces Serif.",
    colors: {
      "bg": "#fafaf6",
      "surface": "#f1ede1",
      "surface-dark": "#2a2e22",
      "ink": "#2a2e22",
      "ink-muted": "#5a614f",
      "ink-subtle": "#9aa18d",
      "ink-inverse": "#f1ede1",
      "border": "#d8d2bf",
      "accent": "#65a30d",
      "accent-hover": "#4d7c0f",
      "accent-fg": "#ffffff",
      "accent-soft": "#bef264",
      "accent-2": "#fb923c",
    },
    fontPair: "fraunces",
    radius: "lg",
    style: {
      divider: "none",
      bgPattern: "scribble",
      cardStyle: "soft-lg",
      buttonShape: "pill",
      headingWeight: 400,
      headingTracking: "tight",
      headingTransform: "none",
      spacing: "airy",
      radiusX: "2xl",
    },
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Playfair Serif, Halftone-Punkte, Double-Rule-Divider.",
    colors: {
      "bg": "#fffdf8",
      "surface": "#f5f1ea",
      "surface-dark": "#171717",
      "ink": "#171717",
      "ink-muted": "#525252",
      "ink-subtle": "#a3a3a3",
      "ink-inverse": "#fffdf8",
      "border": "#d4cfc4",
      "accent": "#1f2937",
      "accent-hover": "#0f172a",
      "accent-fg": "#fffdf8",
      "accent-soft": "#9ca3af",
      "accent-2": "#b91c1c",
    },
    fontPair: "playfair",
    radius: "sm",
    style: {
      divider: "double-line",
      bgPattern: "halftone",
      cardStyle: "outline",
      buttonShape: "sharp",
      headingWeight: 500,
      headingTracking: "normal",
      headingTransform: "none",
      spacing: "airy",
      radiusX: "xs",
    },
  },
  {
    id: "playful",
    name: "Playful",
    description: "Hot Pink + Cyan, Sticker-Cards, Manrope.",
    colors: {
      "bg": "#fff7f5",
      "surface": "#ffe4f1",
      "surface-dark": "#1f1147",
      "ink": "#1f1147",
      "ink-muted": "#6b4f8a",
      "ink-subtle": "#a89ec2",
      "ink-inverse": "#fff7f5",
      "border": "#fbcfe8",
      "accent": "#ec4899",
      "accent-hover": "#db2777",
      "accent-fg": "#ffffff",
      "accent-soft": "#fbcfe8",
      "accent-2": "#06b6d4",
    },
    fontPair: "manrope",
    radius: "lg",
    style: {
      divider: "wave",
      bgPattern: "scribble",
      cardStyle: "sticker",
      buttonShape: "pill",
      headingWeight: 800,
      headingTracking: "tighter",
      headingTransform: "none",
      spacing: "comfortable",
      radiusX: "xl",
    },
  },
];

const PRESET_MAP: Record<ThemePresetId, ThemePreset> = THEME_PRESETS.reduce(
  (acc, p) => {
    acc[p.id] = p;
    return acc;
  },
  {} as Record<ThemePresetId, ThemePreset>,
);

export const DEFAULT_PRESET_ID: ThemePresetId = "studio";

export function resolvePreset(id?: string | null): ThemePreset {
  if (id && id in PRESET_MAP) return PRESET_MAP[id as ThemePresetId];
  return PRESET_MAP[DEFAULT_PRESET_ID];
}

export function isValidPresetId(id: unknown): id is ThemePresetId {
  return typeof id === "string" && id in PRESET_MAP;
}
