import fs from "node:fs";
import path from "node:path";
import type { PuckData } from "@vibe-cms-platform/core/puck";
import type { SiteThemeChoice } from "@vibe-cms-platform/core/theme";
import {
  pagePathToFileSlug,
  fileSlugToPagePath,
  type PageEntry,
} from "@vibe-cms-platform/core/site";

export type SiteConfig = {
  brand: string;
  domains: string[];
  template?: string;
  createdAt?: string;
  theme?: SiteThemeChoice;
  pages?: PageEntry[];
};

export type SiteData = {
  slug: string;
  locale: string;
  pagePath: string;
  config: SiteConfig;
  content: PuckData;
  locales: string[];
  pages: PageEntry[];
};

/** Repo root resolved once. apps/tenant lives two levels deep; the sites/
 * folder sits at the repo root. `next build` runs with cwd = apps/tenant.
 * Override with SITES_DIR for tests or non-standard layouts. */
function sitesRoot(): string {
  if (process.env.SITES_DIR) return path.resolve(process.env.SITES_DIR);
  return path.resolve(process.cwd(), "..", "..", "sites");
}

function readJson<T>(p: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
  } catch {
    return null;
  }
}

function listSlugs(): string[] {
  const root = sitesRoot();
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root)
    .filter((slug) => {
      if (slug.startsWith(".")) return false;
      const cfg = path.join(root, slug, "config.json");
      return fs.existsSync(cfg);
    })
    .sort();
}

function localesFor(slug: string): string[] {
  const dir = path.join(sitesRoot(), slug, "messages");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((loc) => fs.existsSync(path.join(dir, loc, "index.json")))
    .sort();
}

function pagePathsFor(slug: string, locale: string): string[] {
  const dir = path.join(sitesRoot(), slug, "messages", locale);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => fileSlugToPagePath(f.replace(/\.json$/, "")))
    .sort();
}

/** Resolve the page list for a site: config.pages if present, else inferred
 * from disk (every <fileSlug>.json under messages/<locale>/). The disk
 * fallback keeps the dev loop working before a config is written. */
function pagesFor(slug: string, locale: string, config: SiteConfig | null): PageEntry[] {
  if (config?.pages && config.pages.length > 0) return config.pages;
  return pagePathsFor(slug, locale).map((p) => ({
    slug: pagePathToFileSlug(p),
    path: p,
    title: { [locale]: p === "" ? config?.brand || "Home" : p.split("/").pop() || p },
  }));
}

/** All (slug, locale, pagePath) tuples for generateStaticParams of the
 * catch-all route. Returns one entry per addressable page per locale. */
export function getAllPageRoutes(): { slug: string; locale: string; path: string[] }[] {
  const out: { slug: string; locale: string; path: string[] }[] = [];
  for (const slug of listSlugs()) {
    const cfg = readJson<SiteConfig>(path.join(sitesRoot(), slug, "config.json"));
    for (const locale of localesFor(slug)) {
      const pages = pagesFor(slug, locale, cfg);
      for (const page of pages) {
        out.push({
          slug,
          locale,
          path: page.path === "" ? [] : page.path.split("/"),
        });
      }
    }
  }
  return out;
}

/** Legacy: one route per slug/locale (homepage only). Still used by the
 * locale-stub route. */
export function getAllRoutes(): { slug: string; locale: string }[] {
  const out: { slug: string; locale: string }[] = [];
  for (const slug of listSlugs()) {
    for (const locale of localesFor(slug)) {
      out.push({ slug, locale });
    }
  }
  return out;
}

/** All slugs (one route per slug for the default-locale redirect page). */
export function getAllSlugs(): { slug: string }[] {
  return listSlugs().map((slug) => ({ slug }));
}

/** Read one site's locale + page snapshot. Throws if the file doesn't
 * exist — generateStaticParams already prunes those. */
export function getSiteData(slug: string, locale: string, pagePath = ""): SiteData {
  const root = sitesRoot();
  const config = readJson<SiteConfig>(path.join(root, slug, "config.json"));
  const fileSlug = pagePathToFileSlug(pagePath);
  const content = readJson<PuckData>(
    path.join(root, slug, "messages", locale, `${fileSlug}.json`),
  );
  if (!config || !content) {
    throw new Error(
      `Site "${slug}" locale "${locale}" page "${pagePath}" not found at ${root}`,
    );
  }
  return {
    slug,
    locale,
    pagePath,
    config,
    content,
    locales: localesFor(slug),
    pages: pagesFor(slug, locale, config),
  };
}

export function getDefaultLocale(slug: string): string {
  const locales = localesFor(slug);
  if (locales.includes("de")) return "de";
  return locales[0] ?? "de";
}

/** Build-time mapping of host → slug. Inlined into the Pages Worker so it
 * can rewrite subdomain/custom-domain requests to `/[slug]/[locale]/...`. */
export function getDomainMap(): Record<string, string> {
  const root = sitesRoot();
  const map: Record<string, string> = {};
  for (const slug of listSlugs()) {
    const cfg = readJson<SiteConfig>(path.join(root, slug, "config.json"));
    if (!cfg) continue;
    for (const d of cfg.domains ?? []) {
      map[d.toLowerCase()] = slug;
    }
  }
  return map;
}
