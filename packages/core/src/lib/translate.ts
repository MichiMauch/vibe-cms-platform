import OpenAI from "openai";
import { localeName } from "../i18n/locales";

type FlatDict = Record<string, string>;

const NON_TRANSLATABLE = /^(https?:\/\/|\/|data:|#[0-9a-f]{3,8}$)/i;
const SKIP_PATHS = [/(^|\.)image$/, /(^|\.)icon$/, /(^|\.)ogImage$/];

export function isTranslatable(path: string, value: string): boolean {
  if (!value || value.trim() === "") return false;
  if (NON_TRANSLATABLE.test(value.trim())) return false;
  if (SKIP_PATHS.some((re) => re.test(path))) return false;
  return true;
}

function flatten(obj: unknown, prefix = "", out: Array<{ path: string; value: string; translatable: boolean }> = []): typeof out {
  if (obj === null || obj === undefined) return out;
  if (typeof obj === "string") {
    out.push({ path: prefix, value: obj, translatable: isTranslatable(prefix, obj) });
    return out;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => flatten(item, prefix ? `${prefix}.${i}` : String(i), out));
    return out;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      flatten(v, prefix ? `${prefix}.${k}` : k, out);
    }
    return out;
  }
  return out;
}

function setDeep(obj: Record<string, unknown> | unknown[], dotPath: string, value: string): void {
  const keys = dotPath.split(".");
  let cur: Record<string, unknown> | unknown[] = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    const idx: string | number = /^\d+$/.test(k) ? Number(k) : k;
    cur = (cur as Record<string | number, unknown>)[idx as keyof typeof cur] as Record<string, unknown> | unknown[];
  }
  const last = keys[keys.length - 1];
  const lastKey: string | number = /^\d+$/.test(last) ? Number(last) : last;
  (cur as Record<string | number, unknown>)[lastKey] = value;
}

const SYSTEM_PROMPT = `You are a professional website-copy translator.
Translate every value from {{SOURCE_LANGUAGE}} to {{TARGET_LANGUAGE}}.

Rules:
- Output must be a JSON object with EXACTLY the same keys as the input.
- Translate ONLY the values. Keep the keys verbatim.
- Preserve HTML tags exactly: <p>, <strong>, <em>, <a href="..."> — only translate the text content between tags. Do NOT translate href attributes.
- Keep brand names ("Vibe-CMS"), proper nouns, technical identifiers, and code untouched.
- Keep the tone friendly and modern. Avoid awkward literal translations.
- For German output, use Swiss conventions: ä/ö/ü and ss (never ß).
- Return ONLY the JSON object. No commentary, no Markdown.`;

export async function translateContent(
  source: unknown,
  targetLocale: string,
  sourceLocale: string = "de",
): Promise<unknown> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY missing. Set it in .env.local.");
  }
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const flat = flatten(source);
  const translatable = flat.filter((f) => f.translatable);
  if (translatable.length === 0) {
    return JSON.parse(JSON.stringify(source));
  }

  const payload: FlatDict = {};
  for (const { path, value } of translatable) payload[path] = value;

  const sourceName = localeName(sourceLocale, "en");
  const targetName = localeName(targetLocale, "en");

  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT.replace("{{SOURCE_LANGUAGE}}", sourceName).replace(
          "{{TARGET_LANGUAGE}}",
          targetName,
        ),
      },
      {
        role: "user",
        content: JSON.stringify(payload),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned empty response");

  let translated: FlatDict;
  try {
    translated = JSON.parse(raw);
  } catch {
    throw new Error("OpenAI returned non-JSON response");
  }

  const out = JSON.parse(JSON.stringify(source));
  for (const [path, value] of Object.entries(translated)) {
    if (typeof value !== "string") continue;
    setDeep(out, path, value);
  }
  return out;
}

const VALUE_SYSTEM_PROMPT = `You translate a single string value from {{SOURCE_LANGUAGE}} to {{TARGET_LANGUAGE}}.

Rules:
- Output strictly JSON: {"value": "<translation>"}.
- Preserve HTML tags exactly: <p>, <strong>, <em>, <a href="..."> — only translate the text content between tags. Do NOT translate href attributes.
- Keep brand names ("Vibe-CMS"), proper nouns, technical identifiers, code untouched.
- Keep tone friendly and modern. Avoid awkward literal translations.
- For German output, use Swiss conventions: ä/ö/ü and ss (never ß).
- Return ONLY the JSON object.`;

export async function translateValue(
  value: string,
  targetLocale: string,
  sourceLocale: string = "de",
  contextPath?: string,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing. Set it in .env.local.");
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const sourceName = localeName(sourceLocale, "en");
  const targetName = localeName(targetLocale, "en");

  const systemMessage =
    VALUE_SYSTEM_PROMPT.replace("{{SOURCE_LANGUAGE}}", sourceName).replace(
      "{{TARGET_LANGUAGE}}",
      targetName,
    ) + (contextPath ? `\n\nContext path of the value: ${contextPath}` : "");

  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    temperature: 0.3,
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: JSON.stringify({ value }) },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned empty response");

  let parsed: { value?: unknown };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("OpenAI returned non-JSON response");
  }
  if (typeof parsed.value !== "string") {
    throw new Error("OpenAI response missing 'value' string");
  }
  return parsed.value;
}
