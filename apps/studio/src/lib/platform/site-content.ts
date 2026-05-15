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

export async function readSiteContent(slug: string, locale: string): Promise<Content> {
  const raw = await fs.readFile(siteMessagePath(slug, locale), "utf-8");
  return JSON.parse(raw) as Content;
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

export async function siteLocaleExists(slug: string, locale: string): Promise<boolean> {
  try {
    await fs.access(siteMessagePath(slug, locale));
    return true;
  } catch {
    return false;
  }
}
