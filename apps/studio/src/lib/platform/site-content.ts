import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import type { PuckData } from "@vibe-cms-platform/core/puck";
import { pagePathToFileSlug, fileSlugToPagePath } from "@vibe-cms-platform/core/site";
import { sitesDir } from "./registry";

export function siteMessagesDir(slug: string): string {
  return path.join(sitesDir(), slug, "messages");
}

export function siteLocaleDir(slug: string, locale: string): string {
  return path.join(siteMessagesDir(slug), locale);
}

export function siteMessagePath(slug: string, locale: string, pagePath = ""): string {
  return path.join(siteLocaleDir(slug, locale), `${pagePathToFileSlug(pagePath)}.json`);
}

/** Read one page's Puck tree. Default page (path="") is the homepage. */
export async function readSiteContent(
  slug: string,
  locale: string,
  pagePath = "",
): Promise<PuckData> {
  const raw = await fs.readFile(siteMessagePath(slug, locale, pagePath), "utf-8");
  return JSON.parse(raw) as PuckData;
}

export async function writeSiteContent(
  slug: string,
  locale: string,
  pagePath: string,
  contentJson: string,
): Promise<void> {
  const target = siteMessagePath(slug, locale, pagePath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, contentJson, "utf-8");
}

/** Locales available for a site = subdirectories of `messages/` that contain at least index.json. */
export async function listSiteLocales(slug: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(siteMessagesDir(slug), { withFileTypes: true });
    const locales: string[] = [];
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      try {
        await fs.access(path.join(siteMessagesDir(slug), e.name, "index.json"));
        locales.push(e.name);
      } catch {
        // ignore locale dirs without index.json
      }
    }
    return locales.sort();
  } catch {
    return [];
  }
}

export async function siteLocaleExists(slug: string, locale: string): Promise<boolean> {
  try {
    await fs.access(path.join(siteLocaleDir(slug, locale), "index.json"));
    return true;
  } catch {
    return false;
  }
}

export async function sitePageExists(
  slug: string,
  locale: string,
  pagePath: string,
): Promise<boolean> {
  try {
    await fs.access(siteMessagePath(slug, locale, pagePath));
    return true;
  } catch {
    return false;
  }
}

/** All page paths present on disk for a given locale (used as a fallback when
 * config.pages is missing or stale). */
export async function listSitePagePaths(slug: string, locale: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(siteLocaleDir(slug, locale));
    return entries
      .filter((f) => f.endsWith(".json"))
      .map((f) => fileSlugToPagePath(f.replace(/\.json$/, "")))
      .sort();
  } catch {
    return [];
  }
}
