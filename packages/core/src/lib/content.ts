import fs from "node:fs/promises";
import { DEFAULT_LOCALE } from "../i18n/locales";
import { messagesPath } from "../i18n/locales.server";
import type { Content } from "../types/content";

export async function readContent(locale: string = DEFAULT_LOCALE): Promise<Content> {
  const raw = await fs.readFile(messagesPath(locale), "utf-8");
  return JSON.parse(raw) as Content;
}

export function contentPath(locale: string = DEFAULT_LOCALE): string {
  return messagesPath(locale);
}
