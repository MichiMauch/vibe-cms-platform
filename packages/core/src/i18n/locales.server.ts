import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

export const MESSAGES_DIR = path.join(process.cwd(), "messages");

export function messagesPath(locale: string): string {
  return path.join(MESSAGES_DIR, `${locale}.json`);
}

export async function listLocales(): Promise<string[]> {
  try {
    const files = await fs.readdir(MESSAGES_DIR);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""))
      .sort();
  } catch {
    return [];
  }
}

export async function localeExists(locale: string): Promise<boolean> {
  try {
    await fs.access(messagesPath(locale));
    return true;
  } catch {
    return false;
  }
}
