import "server-only";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { SiteThemeChoice } from "@vibe-cms-platform/core/theme";

export type SiteConfig = {
  brand: string;
  domains: string[];
  template?: string;
  createdAt?: string;
  /** Optional per-site visual identity. Missing → preset 'studio' (default). */
  theme?: SiteThemeChoice;
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
let cachedSitesDir: string | null = null;

export function sitesDir(): string {
  if (cachedSitesDir) return cachedSitesDir;
  const envOverride = process.env.SITES_DIR;
  if (envOverride) {
    cachedSitesDir = path.resolve(envOverride);
    return cachedSitesDir;
  }
  // Walk up from cwd looking for an existing `sites/` directory.
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, "sites");
    if (existsSync(candidate)) {
      cachedSitesDir = candidate;
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback: cwd/sites (caller will get an empty list if it doesn't exist)
  cachedSitesDir = path.join(process.cwd(), "sites");
  return cachedSitesDir;
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

/** Full tenant resolver: dev override → host lookup → DEV_DEFAULT_SITE fallback.
 * Returns null if no tenant could be determined and we're in production.
 */
export async function resolveTenant(opts: {
  host: string;
  override?: string;
}): Promise<string | null> {
  const dev = process.env.NODE_ENV !== "production";
  if (dev && opts.override) return opts.override;

  const fromHost = await resolveDomain(opts.host);
  if (fromHost) return fromHost;

  if (dev) {
    return process.env.DEV_DEFAULT_SITE?.trim() || null;
  }
  return null;
}

/** True when the request hits the admin/master domain.
 * Multiple admin hosts (comma-separated) supported via PUBLIC_URL/ADMIN_HOSTS env.
 */
export function isAdminHost(host: string): boolean {
  const adminHosts = (process.env.ADMIN_HOSTS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (adminHosts.length > 0) {
    return adminHosts.includes(host.toLowerCase());
  }
  // Fallback: derive from PUBLIC_URL
  const publicUrl = process.env.PUBLIC_URL;
  if (publicUrl) {
    try {
      return new URL(publicUrl).host.toLowerCase() === host.toLowerCase();
    } catch {
      // ignore
    }
  }
  return false;
}
