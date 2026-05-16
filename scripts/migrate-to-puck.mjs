#!/usr/bin/env node
/**
 * One-shot migration: transform each sites/<slug>/messages/<locale>.json from
 * our legacy shape (sections + seo + chatbot at top level) into the Puck
 * native shape (content + root.props + zones). Idempotent.
 *
 * Legacy (in):
 *   { seo, chatbot, sections: [ { id, type, data } ] }
 *
 * Puck-native (out):
 *   {
 *     content: [ { type, props } ],
 *     root: { props: { seo, chatbot } },
 *     zones: {}
 *   }
 *
 * Edge transforms:
 *   - Section.data → Puck props (drop legacy `id`, Puck generates its own).
 *   - Pricing.plans[].features: string[]  →  features: { value: string }[]
 *     (Puck array fields require object-typed entries).
 *
 * Usage:
 *   node scripts/migrate-to-puck.mjs            # writes files in place
 *   node scripts/migrate-to-puck.mjs --dry-run  # prints what would change
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const sitesDir = join(repoRoot, "sites");
const dryRun = process.argv.includes("--dry-run");

function transformSectionDataToProps(type, data) {
  if (type === "Pricing" && Array.isArray(data.plans)) {
    return {
      ...data,
      plans: data.plans.map((plan) => ({
        ...plan,
        features: Array.isArray(plan.features)
          ? plan.features.map((f) =>
              typeof f === "string" ? { value: f } : f,
            )
          : plan.features,
      })),
    };
  }
  return data;
}

function migrate(legacy) {
  if (!legacy || typeof legacy !== "object") return null;

  // Already migrated → no-op (idempotency).
  if (Array.isArray(legacy.content) && legacy.root && typeof legacy.root === "object") {
    return { migrated: false, data: legacy };
  }

  // Missing required key → skip (corrupt or empty file).
  if (!Array.isArray(legacy.sections)) {
    return null;
  }

  const content = legacy.sections.map((section) => {
    const { id: _drop, type, data } = section;
    return {
      type,
      props: transformSectionDataToProps(type, data ?? {}),
    };
  });

  const rootProps = {};
  if (legacy.seo) rootProps.seo = legacy.seo;
  if (legacy.chatbot) rootProps.chatbot = legacy.chatbot;

  return {
    migrated: true,
    data: {
      content,
      root: { props: rootProps },
      zones: {},
    },
  };
}

async function listSiteSlugs() {
  try {
    const entries = await readdir(sitesDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

async function listLocaleFiles(slug) {
  const dir = join(sitesDir, slug, "messages");
  try {
    const entries = await readdir(dir);
    return entries
      .filter((f) => f.endsWith(".json"))
      .map((f) => join(dir, f));
  } catch {
    return [];
  }
}

async function main() {
  const slugs = await listSiteSlugs();
  if (slugs.length === 0) {
    console.error(`No sites found under ${sitesDir}`);
    process.exit(1);
  }

  let touched = 0;
  let already = 0;
  let skipped = 0;
  let failed = 0;

  for (const slug of slugs) {
    const files = await listLocaleFiles(slug);
    for (const filePath of files) {
      const rel = filePath.replace(`${repoRoot}/`, "");
      let raw;
      try {
        raw = await readFile(filePath, "utf-8");
      } catch (err) {
        console.error(`  fail   ${rel}: ${err.message}`);
        failed++;
        continue;
      }
      let json;
      try {
        json = JSON.parse(raw);
      } catch (err) {
        console.error(`  fail   ${rel}: invalid JSON (${err.message})`);
        failed++;
        continue;
      }

      const result = migrate(json);
      if (!result) {
        console.warn(`  skip   ${rel}: no sections + not already migrated`);
        skipped++;
        continue;
      }
      if (!result.migrated) {
        console.log(`  ok     ${rel}: already in Puck shape`);
        already++;
        continue;
      }

      const out = JSON.stringify(result.data, null, 2) + "\n";
      if (dryRun) {
        console.log(`  DRYRUN ${rel}: would migrate ${json.sections.length} sections`);
      } else {
        await writeFile(filePath, out, "utf-8");
        console.log(`  write  ${rel}: migrated ${json.sections.length} sections`);
      }
      touched++;
    }
  }

  console.log("");
  console.log(
    `Done. migrated=${touched}  already=${already}  skipped=${skipped}  failed=${failed}${
      dryRun ? "  (dry-run, no files written)" : ""
    }`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
