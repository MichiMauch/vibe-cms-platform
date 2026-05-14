import "server-only";
import OpenAI from "openai";
import fs from "node:fs/promises";
import path from "node:path";

export type TemplateId = "blank" | "saas" | "agentur" | "event";

export type Brief = {
  brand: string;
  template: TemplateId;
  description: string;
  audience?: string;
  primaryGoal?: string;
};

const SYSTEM_PROMPT = `You scaffold a Vibe-CMS landing page from a JSON template.

Rules:
- Input is a template JSON skeleton with placeholders like {{BRAND}}, {{HERO_TITLE}}, {{F1_TITLE}}.
- Replace every placeholder with concrete copy that fits the user's brief.
- Keep the JSON structure exactly. Do NOT add/remove keys. Do NOT change "id" or "type" fields.
- Keep HTML inside subtitle/description/bio fields valid (<p>, <strong>, <em>, <a href>).
- Use Swiss German conventions (ä/ö/ü, ss — never ß) for German output.
- Keep brand names, technical names, and product nouns unchanged.
- Return strictly JSON. No commentary, no markdown.`;

export async function scaffoldContent(opts: {
  apiKey: string;
  model: string;
  brief: Brief;
  templatesDir: string;
}): Promise<string> {
  const templatePath = path.join(opts.templatesDir, `${opts.brief.template}.json`);
  const skeleton = await fs.readFile(templatePath, "utf-8");

  const openai = new OpenAI({ apiKey: opts.apiKey });
  const completion = await openai.chat.completions.create({
    model: opts.model,
    response_format: { type: "json_object" },
    temperature: 0.4,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          brief: opts.brief,
          template: JSON.parse(skeleton),
        }),
      },
    ],
  });
  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned empty response");
  // Validate JSON-parses; we return the raw string so the caller can commit it verbatim.
  JSON.parse(raw);
  return raw;
}
