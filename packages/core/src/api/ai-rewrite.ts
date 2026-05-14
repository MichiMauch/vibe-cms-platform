import "server-only";
import fs from "node:fs/promises";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, LOCALE_REGEX, localeName } from "../i18n/locales";
import { messagesPath, localeExists } from "../i18n/locales.server";
import { setByPath } from "../lib/dot-path";
import { propagateChange, type PropagationResult } from "../lib/propagate";

export const maxDuration = 60;

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
- Keep brand names ("Vibe-CMS"), proper nouns, and technical identifiers unchanged.
- Keep the tone modern and natural.
- For German output, use Swiss conventions: ä/ö/ü and ss (never ß).
- Return strictly JSON: {"text": "<result>"}. No commentary, no Markdown.`;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as { path?: unknown }).path !== "string" ||
    typeof (body as { action?: unknown }).action !== "string" ||
    typeof (body as { text?: unknown }).text !== "string"
  ) {
    return NextResponse.json(
      { error: "Expected { path: string, action: string, locale?: string, text: string }" },
      { status: 400 },
    );
  }

  const {
    path: dotPath,
    action: rawAction,
    locale: rawLocale,
    text: inputText,
  } = body as {
    path: string;
    action: string;
    locale?: unknown;
    text: string;
  };

  const action = rawAction as Action;
  if (!(action in ACTIONS)) {
    return NextResponse.json(
      { error: `Unknown action: ${rawAction}. Expected one of: ${Object.keys(ACTIONS).join(", ")}` },
      { status: 400 },
    );
  }

  const locale =
    typeof rawLocale === "string" && rawLocale.length > 0 ? rawLocale : DEFAULT_LOCALE;
  if (!LOCALE_REGEX.test(locale)) {
    return NextResponse.json({ error: `Invalid locale: ${locale}` }, { status: 400 });
  }
  if (!(await localeExists(locale))) {
    return NextResponse.json({ error: `Locale not found: ${locale}` }, { status: 404 });
  }

  const stripped = inputText.replace(/<[^>]+>/g, "").trim();
  if (stripped.length === 0) {
    return NextResponse.json(
      { error: "Kein Text vorhanden zum Umschreiben." },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY missing. Set it in .env.local." },
      { status: 500 },
    );
  }
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const languageName = localeName(locale, "en");
  const systemMessage = SYSTEM_PROMPT.replace("{{LANGUAGE}}", languageName).replace(
    "{{ACTION_DESCRIPTION}}",
    ACTIONS[action],
  );

  let newText: string;
  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model,
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
    const message = err instanceof Error ? err.message : "AI rewrite failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  let propagation: PropagationResult | null = null;
  try {
    const filePath = messagesPath(locale);
    const raw = await fs.readFile(filePath, "utf-8");
    const content = JSON.parse(raw);
    setByPath(content, dotPath, newText);
    await fs.writeFile(filePath, JSON.stringify(content, null, 2) + "\n", "utf-8");

    if (locale === DEFAULT_LOCALE) {
      try {
        propagation = await propagateChange(dotPath, newText, locale);
      } catch (err) {
        propagation = {
          translated: [],
          copied: [],
          skipped: [],
          errors: [
            { locale: "*", error: err instanceof Error ? err.message : "Propagation failed" },
          ],
        };
      }
    }

    return NextResponse.json({ ok: true, text: newText, propagation });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
