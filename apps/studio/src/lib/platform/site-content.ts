import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import type { Content } from "@vibe-cms-platform/core/types";
import { sitesDir } from "./registry";

export function siteMessagesDir(slug: string): string {
  return path.join(sitesDir(), slug, "messages");
}

export function siteMessagePath(slug: string, locale: string): string {
  return path.join(siteMessagesDir(slug), `${locale}.json`);
}

/** Drafts live next to messages/ as `.drafts/` and are never committed to git
 * (see .gitignore). They survive across requests inside a single container
 * run but get wiped on rebuild / restart — Publish moves them into messages/.
 */
export function siteDraftDir(slug: string): string {
  return path.join(sitesDir(), slug, ".drafts");
}

export function siteDraftPath(slug: string, locale: string): string {
  return path.join(siteDraftDir(slug), `${locale}.json`);
}

export async function readSiteContent(slug: string, locale: string): Promise<Content> {
  const raw = await fs.readFile(siteMessagePath(slug, locale), "utf-8");
  return JSON.parse(raw) as Content;
}

/** Like readSiteContent, but reads .drafts/<locale>.json first and falls back
 * to the published file when no draft exists. Used by the admin editor so
 * authors see their unpublished changes. */
export async function readSiteContentWithDrafts(slug: string, locale: string): Promise<Content> {
  try {
    const raw = await fs.readFile(siteDraftPath(slug, locale), "utf-8");
    return JSON.parse(raw) as Content;
  } catch {
    return readSiteContent(slug, locale);
  }
}

export async function readSiteDraft(slug: string, locale: string): Promise<Content | null> {
  try {
    const raw = await fs.readFile(siteDraftPath(slug, locale), "utf-8");
    return JSON.parse(raw) as Content;
  } catch {
    return null;
  }
}

export async function writeSiteDraft(slug: string, locale: string, content: Content): Promise<void> {
  const dir = siteDraftDir(slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(siteDraftPath(slug, locale), JSON.stringify(content, null, 2) + "\n", "utf-8");
}

export async function listSiteLocales(slug: string): Promise<string[]> {
  try {
    const files = await fs.readdir(siteMessagesDir(slug));
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""))
      .sort();
  } catch {
    return [];
  }
}

/** Locales that have a pending draft. The Publish button shows this count. */
export async function listSitePendingLocales(slug: string): Promise<string[]> {
  try {
    const files = await fs.readdir(siteDraftDir(slug));
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""))
      .sort();
  } catch {
    return [];
  }
}

/** Remove all draft files for a site (called after a successful publish). */
export async function clearSiteDrafts(slug: string): Promise<void> {
  try {
    await fs.rm(siteDraftDir(slug), { recursive: true, force: true });
  } catch {
    // best-effort
  }
}

export async function siteLocaleExists(slug: string, locale: string): Promise<boolean> {
  try {
    await fs.access(siteMessagePath(slug, locale));
    return true;
  } catch {
    return false;
  }
}
