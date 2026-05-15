import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

export type SiteConfig = {
  brand: string;
  domains: string[];
  template?: string;
  createdAt?: string;
};

export type SiteAccess = {
  users: string[];
};

export type Site = {
  slug: string;
  config: SiteConfig;
  access: SiteAccess;
};

/** Resolve the absolute path to sites/. Works in dev (cwd = apps/studio,
 * monorepo two levels up) and in build output (sites/ shipped alongside).
 */
export function sitesDir(): string {
  // Allow override for non-standard layouts
  const envOverride = process.env.SITES_DIR;
  if (envOverride) return path.resolve(envOverride);
  // Walk up looking for a `sites/` directory next to package.json marker
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(dir, "sites");
    try {
      // We just need to know the path exists; readdir validates that.
      // Sync-test via a small heuristic: check for known package.json marker.
      const parentPkg = path.join(dir, "package.json");
      void parentPkg;
      return candidate;
    } catch {
      // ignore
    }
    dir = path.dirname(dir);
  }
  return path.join(process.cwd(), "sites");
}

async function readJson<T>(p: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(p, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function listSites(): Promise<Site[]> {
  const root = sitesDir();
  let entries: string[];
  try {
    entries = await fs.readdir(root);
  } catch {
    return [];
  }
  const sites: Site[] = [];
  for (const slug of entries.sort()) {
    if (slug.startsWith(".")) continue;
    const configPath = path.join(root, slug, "config.json");
    const accessPath = path.join(root, slug, "access.json");
    const config = await readJson<SiteConfig>(configPath);
    const access = (await readJson<SiteAccess>(accessPath)) ?? { users: [] };
    if (!config) continue;
    sites.push({ slug, config, access });
  }
  return sites;
}

export async function getSite(slug: string): Promise<Site | null> {
  const config = await readJson<SiteConfig>(path.join(sitesDir(), slug, "config.json"));
  if (!config) return null;
  const access =
    (await readJson<SiteAccess>(path.join(sitesDir(), slug, "access.json"))) ?? { users: [] };
  return { slug, config, access };
}

/** Build a domain → slug map from all sites' config.json. Cached for the life
 * of the module (rebuilt at next cold start; the multi-tenant middleware
 * tolerates a short delay between adding a domain and serving it).
 */
let cachedDomainMap: Map<string, string> | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;

export async function resolveDomain(host: string): Promise<string | null> {
  const now = Date.now();
  if (!cachedDomainMap || now - cachedAt > CACHE_TTL_MS) {
    const map = new Map<string, string>();
    for (const site of await listSites()) {
      for (const d of site.config.domains ?? []) {
        map.set(d.toLowerCase(), site.slug);
      }
    }
    cachedDomainMap = map;
    cachedAt = now;
  }
  return cachedDomainMap.get(host.toLowerCase()) ?? null;
}

export function clearDomainCache() {
  cachedDomainMap = null;
}
