import "server-only";
// Re-export handler factories for the legacy single-tenant routes that
// are still consumed by the multi-tenant studio app.
export * as chat from "./chat";
export * as addLanguage from "./add-language";
