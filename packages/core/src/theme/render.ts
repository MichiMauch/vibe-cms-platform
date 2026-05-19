/** Pure (no `server-only` / no fs) theme renderer. Reused by both the
 * public site renderer (`apps/studio/src/lib/platform/theme.ts`) and the
 * Puck editor preview (`EditorClient`) so the editor matches the live look
 * as the customer tweaks the Theme settings. */

import {
  CSS_VAR_NAMES,
  RADIUS_VALUES,
  RADIUS_X_VALUES,
  FONT_PAIR_VARS,
  TRACKING_VALUES,
  CARD_RADIUS_VALUES,
  BUTTON_RADIUS_VALUES,
  SPACING_MULTIPLIER,
  type ColorToken,
  type CardStyle,
} from "./tokens";
import { BG_PATTERN_URLS } from "./patterns";
import { resolvePreset, type SiteThemeChoice } from "./presets";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function sanitizeHex(v: string | undefined | null): string | null {
  if (!v) return null;
  return HEX_RE.test(v) ? v : null;
}

function cardShadowFor(style: CardStyle): string {
  switch (style) {
    case "soft":
      return "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)";
    case "soft-lg":
      return [
        "0 25px 50px -12px color-mix(in oklab, var(--color-brand-accent) 22%, transparent)",
        "0 8px 24px -8px rgba(0,0,0,0.10)",
      ].join(", ");
    case "outline":
      return "none";
    case "hard-offset":
      return "6px 6px 0 0 var(--color-brand-ink)";
    case "brutal":
      return "4px 4px 0 0 var(--color-brand-ink)";
    case "glass":
      return "0 8px 24px -8px rgba(0,0,0,0.08)";
    case "sticker":
      return "6px 6px 0 0 var(--color-brand-accent)";
  }
}

function cardBorderFor(style: CardStyle): string {
  switch (style) {
    case "soft":
    case "soft-lg":
    case "hard-offset":
    case "outline":
      return "1px solid var(--color-brand-border)";
    case "brutal":
      return "2px solid var(--color-brand-ink)";
    case "glass":
      return "1px solid color-mix(in oklab, var(--color-brand-ink) 12%, transparent)";
    case "sticker":
      return "2px solid var(--color-brand-ink)";
  }
}

export type ThemeRenderResult = {
  themeCss: string;
  bodyAttrs: Record<string, string>;
};

/** Returns CSS body to be injected into a `<style>` tag plus a set of
 * `data-*` attributes for the wrapper element. Pure — safe to call from
 * client components. */
export function renderTheme(theme?: SiteThemeChoice | null): ThemeRenderResult {
  const preset = resolvePreset(theme?.preset);
  const colors: Record<ColorToken, string> = { ...preset.colors };
  const accentOverride = sanitizeHex(theme?.accentOverride);
  const inkOverride = sanitizeHex(theme?.inkOverride);
  if (accentOverride) {
    colors["accent"] = accentOverride;
    colors["accent-hover"] = accentOverride;
  }
  if (inkOverride) {
    colors["ink"] = inkOverride;
  }

  const fonts = FONT_PAIR_VARS[preset.fontPair];
  const radius = RADIUS_VALUES[preset.radius];
  const s = preset.style;
  const radiusX = RADIUS_X_VALUES[s.radiusX];

  const lines: string[] = [];
  for (const [token, value] of Object.entries(colors) as [ColorToken, string][]) {
    lines.push(`${CSS_VAR_NAMES[token]}:${value}`);
  }
  lines.push(`--brand-heading-font:${fonts.heading}`);
  lines.push(`--brand-body-font:${fonts.body}`);
  lines.push(`--brand-radius:${radius.card}`);
  lines.push(`--brand-radius-pill:${radius.pill}`);
  lines.push(`--brand-h-weight:${s.headingWeight}`);
  lines.push(`--brand-h-tracking:${TRACKING_VALUES[s.headingTracking]}`);
  lines.push(`--brand-h-transform:${s.headingTransform}`);
  // radiusX overrides the cardStyle-derived card radius so presets get a single
  // source of truth (e.g. `brutal` cardStyle would yield 0, but radiusX="md"
  // would lift it to 1rem). Default falls back to CARD_RADIUS_VALUES.
  lines.push(`--brand-radius-card:${radiusX.card || CARD_RADIUS_VALUES[s.cardStyle]}`);
  lines.push(`--brand-radius-button:${BUTTON_RADIUS_VALUES[s.buttonShape]}`);
  lines.push(`--brand-radius-x:${radiusX.card}`);
  lines.push(`--brand-pill:${radiusX.pill}`);
  lines.push(`--brand-spacing-multiplier:${SPACING_MULTIPLIER[s.spacing]}`);
  lines.push(`--brand-shadow-card:${cardShadowFor(s.cardStyle)}`);
  lines.push(`--brand-card-border:${cardBorderFor(s.cardStyle)}`);
  lines.push(`--brand-bg-pattern-url:${BG_PATTERN_URLS[s.bgPattern]}`);

  const themeCss = `:root{${lines.join(";")}}`;

  const bodyAttrs: Record<string, string> = {
    "data-divider": s.divider,
    "data-bg-pattern": s.bgPattern,
    "data-card-style": s.cardStyle,
    "data-spacing": s.spacing,
  };

  return { themeCss, bodyAttrs };
}
