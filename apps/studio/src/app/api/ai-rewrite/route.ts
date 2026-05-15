import "server-only";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { LOCALE_REGEX, localeName } from "@vibe-cms-platform/core/i18n";
import { setByPath } from "@vibe-cms-platform/core/lib";
import { readSession, canEditSlug } from "@/lib/auth";
import {
  readSiteContentWithDrafts,
  siteLocaleExists,
  writeSiteDraft,
} from "@/lib/platform/site-content";
import { readEnv } from "@/lib/platform/env";
import type { Content } from "@vibe-cms-platform/core/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SLUG_RE = /^[a-z][a-z0-9-]{1,38}[a-z0-9]$/;

const ACTIONS = {
  improve: "Rewrite the text for clarity, flow, and impact. Keep approximately the same length and meaning.",
  shorter: "Compress the text to about half its current length while keeping the core message.",
  longer: "Expand the text to about 1.5x its current length with concrete specifics, examples, or details. Do not invent facts.",
  formal: "Rewrite the text in a more professional, formal register.",
  casual: "Rewrite the text in a friendlier, more casual register.",
} as const;

type Action = keyof typeof ACTIONS;

const SYSTEM_PROMPT = `You are a website-copy editor.

The text you receive is in {{LANGUAGE}}. Action: {{ACTION_DESCRIPTION}}

Rules:
- If the text contains HTML tags (<p>, <strong>, <em>, <a href="...">), preserve them exactly. Only edit the text content between tags. Do NOT translate href attributes.
- Stay in the SAME language as the input. Do not translate to a different language.
- Keep brand names, proper nouns, and technical identifiers unchanged.
- Keep the tone modern and natural.
- For German output, use Swiss conventions: ä/ö/ü and ss (never ß).
- Return strictly JSON: {"text": "<result>"}. No commentary, no Markdown.`;

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
    path?: unknown;
    action?: unknown;
    locale?: unknown;
    text?: unknown;
  };

  if (typeof b.slug !== "string" || !SLUG_RE.test(b.slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  if (typeof b.path !== "string" || b.path.length === 0) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  if (typeof b.action !== "string" || !(b.action in ACTIONS)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (typeof b.locale !== "string" || !LOCALE_REGEX.test(b.locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }
  if (typeof b.text !== "string") {
    return NextResponse.json({ error: "Invalid text" }, { status: 400 });
  }

  const { slug, path: dotPath, action: rawAction, locale, text: inputText } = b as {
    slug: string;
    path: string;
    action: Action;
    locale: string;
    text: string;
  };

  if (!canEditSlug(session, slug)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(await siteLocaleExists(slug, locale))) {
    return NextResponse.json({ error: `Locale not found: ${slug}/${locale}` }, { status: 404 });
  }

  const stripped = inputText.replace(/<[^>]+>/g, "").trim();
  if (stripped.length === 0) {
    return NextResponse.json({ error: "Kein Text vorhanden zum Umschreiben." }, { status: 400 });
  }

  let env;
  try {
    env = readEnv();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "env missing" },
      { status: 500 },
    );
  }

  const languageName = localeName(locale, "en");
  const systemMessage = SYSTEM_PROMPT.replace("{{LANGUAGE}}", languageName).replace(
    "{{ACTION_DESCRIPTION}}",
    ACTIONS[rawAction],
  );

  let newText: string;
  try {
    const openai = new OpenAI({ apiKey: env.openai.apiKey });
    const completion = await openai.chat.completions.create({
      model: env.openai.model,
      response_format: { type: "json_object" },
      temperature: 0.6,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: JSON.stringify({ text: inputText, path: dotPath }) },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("OpenAI returned empty response");
    const parsed = JSON.parse(raw) as { text?: unknown };
    if (typeof parsed.text !== "string") {
      throw new Error("OpenAI response missing 'text' string");
    }
    newText = parsed.text;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI rewrite failed" },
      { status: 500 },
    );
  }

  // Persist to draft (no GitHub commit — Publish does that).
  try {
    const content = (await readSiteContentWithDrafts(slug, locale)) as unknown as Record<string, unknown>;
    setByPath(content, dotPath, newText);
    await writeSiteDraft(slug, locale, content as unknown as Content);
    return NextResponse.json({ ok: true, draft: true, text: newText });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Save failed" },
      { status: 500 },
    );
  }
}
