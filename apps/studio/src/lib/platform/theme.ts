import "server-only";

// Pure renderer lives in `@vibe-cms-platform/core/theme`. Re-exported here so
// server callers stay on a single import path, and the client editor can
// import the same function from the core package.
export { renderTheme } from "@vibe-cms-platform/core/theme";
export type { ThemeRenderResult, SiteThemeChoice } from "@vibe-cms-platform/core/theme";

import { renderTheme as _renderTheme } from "@vibe-cms-platform/core/theme";
import type { SiteThemeChoice } from "@vibe-cms-platform/core/theme";

/** Legacy single-string accessor kept for callers that only need CSS. */
export function renderThemeStyle(theme?: SiteThemeChoice | null): string {
  return _renderTheme(theme).themeCss;
}
