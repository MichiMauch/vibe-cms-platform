import "server-only";
// Re-export handler factories for the four standard Vibe-CMS routes.
// Each landingpage repo wires these as thin route.ts files, e.g.:
//   export { POST, maxDuration } from "@vibe-cms/core/api/save-content";
export * as saveContent from "./save-content";
export * as aiRewrite from "./ai-rewrite";
export * as chat from "./chat";
export * as addLanguage from "./add-language";
