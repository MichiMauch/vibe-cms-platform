#!/usr/bin/env node
/**
 * Migrates packages/core/templates/*.json from the legacy shape (sections
 * + seo + chatbot at top level) into the Puck-native shape (content +
 * root.props + zones). Mirrors scripts/migrate-to-puck.mjs but targets the
 * templates dir; idempotent.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const templatesDir = join(repoRoot, "packages", "core", "templates");

function transformSectionDataToProps(type, data) {
  if (type === "Pricing" && Array.isArray(data.plans)) {
    return {
      ...data,
      plans: data.plans.map((plan) => ({
        ...plan,
        features: Array.isArray(plan.features)
          ? plan.features.map((f) => (typeof f === "string" ? { value: f } : f))
          : plan.features,
      })),
    };
  }
  return data;
}

function migrate(legacy) {
  if (!legacy || typeof legacy !== "object") return null;
  if (Array.isArray(legacy.content) && legacy.root) {
    return { migrated: false, data: legacy };
  }
  if (!Array.isArray(legacy.sections)) return null;
  const content = legacy.sections.map((s) => ({
    type: s.type,
    props: transformSectionDataToProps(s.type, s.data ?? {}),
  }));
  const rootProps = {};
  if (legacy.seo) rootProps.seo = legacy.seo;
  if (legacy.chatbot) rootProps.chatbot = legacy.chatbot;
  return { migrated: true, data: { content, root: { props: rootProps }, zones: {} } };
}

const entries = await readdir(templatesDir);
for (const f of entries) {
  if (!f.endsWith(".json") || f === "index.json") continue;
  const p = join(templatesDir, f);
  const raw = await readFile(p, "utf-8");
  const json = JSON.parse(raw);
  const result = migrate(json);
  if (!result) {
    console.log(`  skip   ${f}`);
    continue;
  }
  if (!result.migrated) {
    console.log(`  ok     ${f}: already migrated`);
    continue;
  }
  await writeFile(p, JSON.stringify(result.data, null, 2) + "\n", "utf-8");
  console.log(`  write  ${f}`);
}
