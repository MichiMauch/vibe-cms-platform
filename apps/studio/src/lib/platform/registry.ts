import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

export type RegisteredPage = {
  slug: string;
  brand: string;
  template: string;
  repo: string;
  htmlUrl: string;
  domain: string;
  createdAt: string;
};

const REGISTRY_PATH = path.join(process.cwd(), "data", "pages.json");

async function ensureFile() {
  await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
  try {
    await fs.access(REGISTRY_PATH);
  } catch {
    await fs.writeFile(REGISTRY_PATH, "[]\n", "utf-8");
  }
}

export async function listPages(): Promise<RegisteredPage[]> {
  await ensureFile();
  const raw = await fs.readFile(REGISTRY_PATH, "utf-8");
  return JSON.parse(raw) as RegisteredPage[];
}

export async function addPage(entry: RegisteredPage): Promise<void> {
  const pages = await listPages();
  pages.push(entry);
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(pages, null, 2) + "\n", "utf-8");
}
