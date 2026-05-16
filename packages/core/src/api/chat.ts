import "server-only";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, LOCALE_REGEX, localeName } from "../i18n/locales";
import { localeExists } from "../i18n/locales.server";
import { readContent } from "../lib/content";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Msg = { role: "user" | "assistant" | "system"; content: string };

function buildSystemPrompt(content: unknown, locale: string, botName: string): string {
  const languageName = localeName(locale, "en");
  return `You are "${botName}", a friendly support assistant for a website.

# OUTPUT LANGUAGE (NON-NEGOTIABLE)
Reply ONLY in ${languageName}. Even if the user writes in a different language, your response MUST be in ${languageName}. Do NOT translate, do NOT explain — just respond in ${languageName}.

# KNOWLEDGE BASE
Use EXCLUSIVELY the following JSON content. Do not invent information that is not present.

\`\`\`json
${JSON.stringify(content, null, 2)}
\`\`\`

# RULES
- Be concise. 2–4 short sentences per answer is usually plenty.
- If the answer is not in the JSON, politely say you don't know in ${languageName} and suggest contacting support.
- Never mention or reveal that you are reading from a JSON; answer like a knowledgeable team member.
- Strip HTML tags when quoting (source includes some <strong>, <em>, <p>, <a> markup).
- If asked about pricing, list the plans from the Pricing section verbatim (prices, plan names, features).
- For German output, use Swiss conventions: ä/ö/ü and ss (never ß).`;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages: rawMessages, locale: rawLocale } = body as {
    messages?: unknown;
    locale?: unknown;
  };

  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return NextResponse.json({ error: "messages array required" }, { status: 400 });
  }

  const messages: Msg[] = [];
  for (const m of rawMessages) {
    if (!m || typeof m !== "object") continue;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if (
      (role === "user" || role === "assistant" || role === "system") &&
      typeof content === "string" &&
      content.trim().length > 0
    ) {
      messages.push({ role, content });
    }
  }
  if (messages.length === 0) {
    return NextResponse.json({ error: "no valid messages" }, { status: 400 });
  }

  const locale =
    typeof rawLocale === "string" && rawLocale.length > 0 ? rawLocale : DEFAULT_LOCALE;
  if (!LOCALE_REGEX.test(locale) || !(await localeExists(locale))) {
    return NextResponse.json({ error: `Invalid locale: ${locale}` }, { status: 400 });
  }

  let content: Record<string, unknown>;
  try {
    content = (await readContent(locale)) as Record<string, unknown>;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "content read failed" },
      { status: 500 },
    );
  }

  const chatbot = (content.chatbot ?? {}) as { isEnabled?: boolean; botName?: string };
  if (chatbot.isEnabled === false) {
    return NextResponse.json({ error: "Chatbot is disabled" }, { status: 403 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY missing in .env.local" },
      { status: 500 },
    );
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const botName = chatbot.botName?.trim() || "Assistant";

  const system: Msg = { role: "system", content: buildSystemPrompt(content, locale, botName) };
  const trimmed = messages.filter((m) => m.role !== "system").slice(-12);

  try {
    const openai = new OpenAI({ apiKey });
    const stream = await openai.chat.completions.create({
      model,
      stream: true,
      temperature: 0.5,
      messages: [system, ...trimmed],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) controller.enqueue(encoder.encode(delta));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chat request failed" },
      { status: 500 },
    );
  }
}
