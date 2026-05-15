import "server-only";
import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { readSession, canEditSlug } from "@/lib/auth";
import {
  clearSiteDrafts,
  listSitePendingLocales,
  readSiteDraft,
  siteDraftPath,
  siteMessagePath,
} from "@/lib/platform/site-content";
import { createGitHubClient, type PutFile } from "@/lib/platform/github";
import { readEnv } from "@/lib/platform/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SLUG_RE = /^[a-z][a-z0-9-]{1,38}[a-z0-9]$/;

export async function POST(req: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    /* empty body is fine */
  }

  const b = body as { slug?: unknown };
  if (typeof b.slug !== "string" || !SLUG_RE.test(b.slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  const slug = b.slug;

  if (!canEditSlug(session, slug)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pendingLocales = await listSitePendingLocales(slug);
  if (pendingLocales.length === 0) {
    return NextResponse.json({ ok: true, locales: [], commitSha: null, count: 0 });
  }

  // Read every draft as text once; we both (a) ship it to GitHub and
  // (b) move it to the local messages/ file. Stash the raw strings so the
  // local move is identical to what we commit.
  const files: PutFile[] = [];
  const localContents: Array<{ locale: string; raw: string }> = [];
  for (const locale of pendingLocales) {
    const content = await readSiteDraft(slug, locale);
    if (!content) continue;
    const raw = JSON.stringify(content, null, 2) + "\n";
    files.push({
      path: `sites/${slug}/messages/${locale}.json`,
      content: raw,
    });
    localContents.push({ locale, raw });
  }

  const env = readEnv();
  const isDev = process.env.NODE_ENV !== "production";

  // In dev we can still write locally but only commit when COMMIT_FROM_DEV=true.
  let commitSha: string | null = null;
  if (!isDev || process.env.COMMIT_FROM_DEV === "true") {
    try {
      const gh = createGitHubClient({
        token: env.github.token,
        owner: env.github.owner,
        repo: env.github.repo,
        branch: env.github.branch,
      });
      const localeList = pendingLocales.join(", ");
      const commitMessage = `chore(content): publish ${slug} (${pendingLocales.length} Sprache${pendingLocales.length === 1 ? "" : "n"}: ${localeList}) via ${session.sub}`;
      commitSha = await gh.putFiles(files, commitMessage);
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

  // Commit succeeded (or we are in dev without COMMIT_FROM_DEV). Move drafts
  // → published locally and wipe the .drafts/ directory.
  for (const { locale, raw } of localContents) {
    try {
      await fs.writeFile(siteMessagePath(slug, locale), raw, "utf-8");
    } catch {
      // read-only FS (CF Pages runtime) — git is the source of truth, ignore.
    }
    try {
      await fs.unlink(siteDraftPath(slug, locale));
    } catch {
      // best-effort
    }
  }
  await clearSiteDrafts(slug);

  return NextResponse.json({
    ok: true,
    locales: pendingLocales,
    commitSha,
    count: pendingLocales.length,
    at: Date.now(),
  });
}
