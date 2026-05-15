import "server-only";
import { NextResponse } from "next/server";
import { setByPath } from "@vibe-cms-platform/core/lib";
import { LOCALE_REGEX } from "@vibe-cms-platform/core/i18n";
import { readSession, canEditSlug } from "@/lib/auth";
import {
  readSiteContentWithDrafts,
  siteLocaleExists,
  writeSiteDraft,
} from "@/lib/platform/site-content";
import { clearDomainCache } from "@/lib/platform/registry";
import type { Content } from "@vibe-cms-platform/core/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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

  // Load (draft if exists, else published) → mutate → write back to draft.
  // No GitHub commit here — that happens on explicit Publish.
  const content = (await readSiteContentWithDrafts(slug, locale)) as unknown as Record<string, unknown>;
  setByPath(content, dotPath, value);
  await writeSiteDraft(slug, locale, content as unknown as Content);

  // config.json edits could change the domain map, but that's never reached
  // here in the draft flow (config is committed via /api/sites/create, not
  // touched via save-content). Keep the cache-clear as a safety net.
  clearDomainCache();

  return NextResponse.json({
    ok: true,
    draft: true,
    committed: false,
  });
}
