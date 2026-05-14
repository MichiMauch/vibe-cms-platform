import "server-only";
import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { LOCALE_REGEX, DEFAULT_LOCALE } from "../i18n/locales";
import { messagesPath, localeExists, listLocales } from "../i18n/locales.server";
import { readContent } from "../lib/content";
import { translateContent } from "../lib/translate";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const locales = await listLocales();
  return NextResponse.json({ locales });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const locale = (body as { locale?: unknown })?.locale;
  const sourceLocale =
    typeof (body as { source?: unknown })?.source === "string"
      ? ((body as { source: string }).source as string)
      : DEFAULT_LOCALE;

  if (typeof locale !== "string" || !LOCALE_REGEX.test(locale)) {
    return NextResponse.json(
      { error: 'Invalid locale code. Expected e.g. "fr" or "pt-BR".' },
      { status: 400 },
    );
  }
  if (locale === sourceLocale) {
    return NextResponse.json(
      { error: `Source and target are identical (${locale})` },
      { status: 400 },
    );
  }
  if (await localeExists(locale)) {
    return NextResponse.json(
      { error: `Locale "${locale}" already exists` },
      { status: 409 },
    );
  }
  if (!(await localeExists(sourceLocale))) {
    return NextResponse.json(
      { error: `Source locale "${sourceLocale}" not found` },
      { status: 404 },
    );
  }

  try {
    const source = await readContent(sourceLocale);
    const translated = await translateContent(source, locale, sourceLocale);
    await fs.writeFile(
      messagesPath(locale),
      JSON.stringify(translated, null, 2) + "\n",
      "utf-8",
    );
    return NextResponse.json({ ok: true, locale, sourceLocale });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const locale = url.searchParams.get("locale");
  if (!locale || !LOCALE_REGEX.test(locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }
  if (locale === DEFAULT_LOCALE) {
    return NextResponse.json({ error: "Cannot delete default locale" }, { status: 400 });
  }
  if (!(await localeExists(locale))) {
    return NextResponse.json({ error: `Locale "${locale}" does not exist` }, { status: 404 });
  }
  try {
    await fs.unlink(messagesPath(locale));
    return NextResponse.json({ ok: true, locale });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
