import "server-only";
import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { setByPath } from "@vibe-cms-platform/core/lib";
import { LOCALE_REGEX } from "@vibe-cms-platform/core/i18n";
import { readSession, canEditSlug } from "@/lib/auth";
import { siteMessagePath, siteLocaleExists } from "@/lib/platform/site-content";
import { createGitHubClient } from "@/lib/platform/github";
import { readEnv } from "@/lib/platform/env";
import { clearDomainCache } from "@/lib/platform/registry";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SLUG_RE = /^[a-z][a-z0-9-]{1,38}[a-z0-9]$/;

function isValidValue(v: unknown): boolean {
  if (v === null) return true;
  const t = typeof v;
  return t === "string" || t === "number" || t === "boolean" || t === "object";
}

export async function POST(req: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as {
    slug?: unknown;
    locale?: unknown;
    path?: unknown;
    value?: unknown;
  };

  if (typeof b.slug !== "string" || !SLUG_RE.test(b.slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  if (typeof b.locale !== "string" || !LOCALE_REGEX.test(b.locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }
  if (typeof b.path !== "string" || b.path.length === 0) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  if (!("value" in b) || !isValidValue(b.value)) {
    return NextResponse.json({ error: "Invalid value" }, { status: 400 });
  }

  const { slug, locale, path: dotPath, value } = b as {
    slug: string;
    locale: string;
    path: string;
    value: unknown;
  };

  if (!canEditSlug(session, slug)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!(await siteLocaleExists(slug, locale))) {
    return NextResponse.json({ error: `Locale not found: ${slug}/${locale}` }, { status: 404 });
  }

  // Load → mutate → serialize
  const filePath = siteMessagePath(slug, locale);
  const raw = await fs.readFile(filePath, "utf-8");
  const content = JSON.parse(raw) as Record<string, unknown>;
  setByPath(content, dotPath, value);
  const nextRaw = JSON.stringify(content, null, 2) + "\n";

  const isDev = process.env.NODE_ENV !== "production";

  // 1) Local FS write — gives immediate feedback during local dev and means the
  //    next read sees the change. In production this only matters for the
  //    current process; the next CF build will pull the GitHub-committed copy.
  try {
    await fs.writeFile(filePath, nextRaw, "utf-8");
  } catch {
    // If running in a read-only environment (e.g., CF Pages runtime) skip the
    // local write; the GitHub commit below is the source of truth.
  }

  // 2) GitHub commit — async, so the user sees the save complete and the
  //    rebuild kicks off in parallel.
  let commitError: string | null = null;
  if (!isDev || process.env.COMMIT_FROM_DEV === "true") {
    try {
      const env = readEnv();
      const gh = createGitHubClient({
        token: env.github.token,
        owner: env.github.owner,
        repo: env.github.repo,
        branch: env.github.branch,
      });
      const repoRelative = `sites/${slug}/messages/${locale}.json`;
      const commitMessage = `chore(content): edit ${slug}/${locale} via ${session.sub}`;
      await gh.putFile(repoRelative, nextRaw, commitMessage);
    } catch (err) {
      commitError = err instanceof Error ? err.message : "GitHub commit failed";
    }
  }

  // Domain map could change if config.json edits in the future — clear cache.
  clearDomainCache();

  return NextResponse.json({
    ok: true,
    committed: !commitError,
    commitError,
    devMode: isDev,
  });
}
