import type { ColorToken, FontPair, RadiusScale, PresetStyle } from "./tokens";

export type ThemePresetId = "studio" | "aurora" | "forest" | "sunset" | "mono";

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
