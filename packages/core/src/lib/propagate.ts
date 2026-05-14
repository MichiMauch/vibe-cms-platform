import "server-only";
import fs from "node:fs/promises";
import { DEFAULT_LOCALE } from "../i18n/locales";
import { messagesPath, listLocales } from "../i18n/locales.server";
import { setByPath } from "./dot-path";
import { isTranslatable, translateValue, translateContent } from "./translate";

type RawSection = { id: string; type: string; data: unknown };

export type PropagationResult = {
  translated: string[];
  copied: string[];
  skipped: string[];
  errors: Array<{ locale: string; error: string }>;
};

export async function propagateChange(
  dotPath: string,
  value: string,
  sourceLocale: string = DEFAULT_LOCALE,
): Promise<PropagationResult> {
  const all = await listLocales();
  const targets = all.filter((l) => l !== sourceLocale);
  const result: PropagationResult = {
    translated: [],
    copied: [],
    skipped: [],
    errors: [],
  };
  if (targets.length === 0) return result;

  const translatable = isTranslatable(dotPath, value);
  const hasApiKey = Boolean(process.env.OPENAI_API_KEY);

  await Promise.all(
    targets.map(async (target) => {
      try {
        let nextValue = value;
        if (translatable) {
          if (!hasApiKey) {
            result.skipped.push(target);
            return;
          }
          nextValue = await translateValue(value, target, sourceLocale, dotPath);
        }
        const filePath = messagesPath(target);
        const raw = await fs.readFile(filePath, "utf-8");
        const content = JSON.parse(raw);
        setByPath(content, dotPath, nextValue);
        await fs.writeFile(filePath, JSON.stringify(content, null, 2) + "\n", "utf-8");
        if (translatable) result.translated.push(target);
        else result.copied.push(target);
      } catch (err) {
        result.errors.push({
          locale: target,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }),
  );

  return result;
}

/**
 * Smart by-id propagation for the sections array.
 * - Sections that already exist in the target (by id) keep their translated data, only reorder.
 * - Sections new to the source get translated and inserted.
 * - Sections that disappeared in the source are removed from the target.
 */
export async function propagateSections(
  sourceSections: RawSection[],
  sourceLocale: string = DEFAULT_LOCALE,
): Promise<PropagationResult> {
  const all = await listLocales();
  const targets = all.filter((l) => l !== sourceLocale);
  const result: PropagationResult = {
    translated: [],
    copied: [],
    skipped: [],
    errors: [],
  };
  if (targets.length === 0) return result;

  const hasApiKey = Boolean(process.env.OPENAI_API_KEY);

  await Promise.all(
    targets.map(async (target) => {
      try {
        const filePath = messagesPath(target);
        const raw = await fs.readFile(filePath, "utf-8");
        const targetContent = JSON.parse(raw);
        const existing: RawSection[] = Array.isArray(targetContent.sections)
          ? (targetContent.sections as RawSection[])
          : [];
        const byId = new Map(existing.map((s) => [s.id, s]));

        const nextSections: RawSection[] = [];
        let hadNewBlock = false;
        for (const sourceSection of sourceSections) {
          const found = byId.get(sourceSection.id);
          if (found && found.type === sourceSection.type) {
            nextSections.push(found);
          } else {
            hadNewBlock = true;
            let translatedData: unknown = sourceSection.data;
            if (hasApiKey) {
              try {
                translatedData = await translateContent(
                  sourceSection.data,
                  target,
                  sourceLocale,
                );
              } catch {
                translatedData = JSON.parse(JSON.stringify(sourceSection.data));
              }
            } else {
              translatedData = JSON.parse(JSON.stringify(sourceSection.data));
            }
            nextSections.push({
              id: sourceSection.id,
              type: sourceSection.type,
              data: translatedData,
            });
          }
        }

        targetContent.sections = nextSections;
        await fs.writeFile(filePath, JSON.stringify(targetContent, null, 2) + "\n", "utf-8");
        if (hadNewBlock && hasApiKey) result.translated.push(target);
        else result.copied.push(target);
      } catch (err) {
        result.errors.push({
          locale: target,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }),
  );

  return result;
}
