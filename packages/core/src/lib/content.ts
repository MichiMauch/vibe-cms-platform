import fs from "node:fs/promises";
import { DEFAULT_LOCALE } from "../i18n/locales";
import { messagesPath } from "../i18n/locales.server";

/** Read the single-tenant content JSON for a locale. The shape is whatever
 * the host repo stores — chat / add-language only need to walk the object
 * generically, so we don't constrain it here. After the Puck migration the
 * studio uses readSiteContent (per-tenant) for its admin / public flows;
 * this helper stays for the legacy single-tenant chat / add-language API
 * helpers, which the studio re-exports unchanged. */
export async function readContent(locale: string = DEFAULT_LOCALE): Promise<unknown> {
  const raw = await fs.readFile(messagesPath(locale), "utf-8");
  return JSON.parse(raw);
}

export function contentPath(locale: string = DEFAULT_LOCALE): string {
  return messagesPath(locale);
}
