/**
 * Multi-page site model. One PageEntry per addressable page;
 * the tenant routes/navigation are derived from this list, so adding/renaming
 * a page means editing one place (config.json), not every Puck tree.
 */

export type LocalisedTitle = Record<string, string>;

export type PageEntry = {
  /** Filename slug (e.g. "index", "luzern", "zahnspange"). */
  slug: string;
  /** Public URL path under the locale. "" = homepage. May be nested ("standort/luzern"). */
  path: string;
  /** Human title per locale. The header reads `title[locale]` with a graceful fallback. */
  title: LocalisedTitle;
  /** Optional parent path → groups this page under another in the menu. */
  parent?: string;
  /** Hide from the auto-nav (e.g. legal/impressum, only linked from footer). Default true. */
  showInNav?: boolean;
  /** Custom sort order in the menu. Lower = earlier. Default 0. */
  navOrder?: number;
};

/** Resolve `title[locale]` with a graceful fallback chain. */
export function pageTitleFor(page: PageEntry, locale: string): string {
  return (
    page.title?.[locale] ||
    page.title?.["de"] ||
    Object.values(page.title ?? {})[0] ||
    page.slug
  );
}

/** Normalise a URL path/slug fragment into a safe, kebab-case form. */
export function normalisePagePath(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .map((seg) =>
      seg
        .replace(/[äÄ]/g, "ae")
        .replace(/[öÖ]/g, "oe")
        .replace(/[üÜ]/g, "ue")
        .replace(/ß/g, "ss")
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, ""),
    )
    .filter(Boolean)
    .join("/");
}

/** Derive the filesystem slug for a given path: "" → "index", "standort/luzern" → "standort__luzern". */
export function pagePathToFileSlug(path: string): string {
  const norm = normalisePagePath(path);
  if (norm === "") return "index";
  return norm.replace(/\//g, "__");
}

/** Inverse of pagePathToFileSlug. */
export function fileSlugToPagePath(fileSlug: string): string {
  if (fileSlug === "index") return "";
  return fileSlug.replace(/__/g, "/");
}
