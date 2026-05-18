import fs from "node:fs";
import path from "node:path";
import type { PuckData } from "@vibe-cms-platform/core/puck";
import type { SiteThemeChoice } from "@vibe-cms-platform/core/theme";

export type SiteConfig = {
  brand: string;
  domains: string[];
  template?: string;
  createdAt?: string;
  theme?: SiteThemeChoice;
};

export type SiteData = {
  slug: string;
  locale: string;
  config: SiteConfig;
  content: PuckData;
  locales: string[];
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
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
}

/** All (slug, locale) tuples for generateStaticParams. */
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

/** Read one site's locale snapshot. Throws if the file doesn't exist —
 * generateStaticParams already prunes those, so this is safe by construction. */
export function getSiteData(slug: string, locale: string): SiteData {
  const root = sitesRoot();
  const config = readJson<SiteConfig>(path.join(root, slug, "config.json"));
  const content = readJson<PuckData>(path.join(root, slug, "messages", `${locale}.json`));
  if (!config || !content) {
    throw new Error(`Site "${slug}" locale "${locale}" not found at ${root}`);
  }
  return { slug, locale, config, content, locales: localesFor(slug) };
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
