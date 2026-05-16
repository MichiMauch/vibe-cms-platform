import "server-only";
import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { LOCALE_REGEX } from "@vibe-cms-platform/core/i18n";
import { readSession, canEditSlug } from "@/lib/auth";
import { siteLocaleExists, siteMessagePath } from "@/lib/platform/site-content";
import { createGitHubClient } from "@/lib/platform/github";
import { readEnv } from "@/lib/platform/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SLUG_RE = /^[a-z][a-z0-9-]{1,38}[a-z0-9]$/;

/** Publish takes the full Puck data tree for a single locale, writes it to
 * sites/<slug>/messages/<locale>.json, and commits the change to GitHub
 * (one file = one commit). The editor (Puck) keeps dirty state in-memory
 * until the user clicks Publish, so there are no per-blur commits. */
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

  const b = body as { slug?: unknown; locale?: unknown; data?: unknown };

  if (typeof b.slug !== "string" || !SLUG_RE.test(b.slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  if (typeof b.locale !== "string" || !LOCALE_REGEX.test(b.locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }
  if (!b.data || typeof b.data !== "object") {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { slug, locale, data } = b as { slug: string; locale: string; data: object };

  if (!canEditSlug(session, slug)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(await siteLocaleExists(slug, locale))) {
    return NextResponse.json({ error: `Locale not found: ${slug}/${locale}` }, { status: 404 });
  }

  const nextRaw = JSON.stringify(data, null, 2) + "\n";
  const filePath = siteMessagePath(slug, locale);

  // Local write — gives the running container an immediate fresh copy so
  // the next admin / public render sees the published state without waiting
  // for a redeploy.
  try {
    await fs.writeFile(filePath, nextRaw, "utf-8");
  } catch {
    // read-only FS (CF Pages runtime style) — git remains the source of truth.
  }

  const isDev = process.env.NODE_ENV !== "production";
  let commitSha: string | null = null;
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
      const commitMessage = `chore(content): publish ${slug}/${locale} via ${session.sub}`;
      await gh.putFile(repoRelative, nextRaw, commitMessage);
      // putFile doesn't return the SHA; not exposing for now.
      commitSha = null;
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error: err instanceof Error ? err.message : "GitHub commit failed",
        },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    slug,
    locale,
    commitSha,
    at: Date.now(),
  });
}
