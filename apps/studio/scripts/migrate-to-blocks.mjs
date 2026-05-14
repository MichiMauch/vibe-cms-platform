#!/usr/bin/env node
/**
 * One-shot migration: convert messages/*.json from fixed-key shape
 * (hero, features, team, testimonial, footer) to sections[] array.
 * Same UUIDs across all locales for id-matching.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";

const MESSAGES_DIR = path.join(process.cwd(), "messages");
const SECTION_TYPES = ["hero", "features", "team", "testimonial", "footer"];
const TYPE_MAP = {
  hero: "Hero",
  features: "Features",
  team: "Team",
  testimonial: "Testimonial",
  footer: "Footer",
};

function buildIds() {
  const ids = {};
  for (const key of SECTION_TYPES) ids[key] = randomUUID();
  ids.callToAction = randomUUID();
  return ids;
}

function migrate(content, ids) {
  const sections = [];
  for (const key of SECTION_TYPES) {
    if (content[key]) {
      sections.push({ id: ids[key], type: TYPE_MAP[key], data: content[key] });
    }
  }
  // Add a CallToAction block between Testimonial and Footer as a sensible default
  const cta = {
    id: ids.callToAction,
    type: "CallToAction",
    data: {
      title: "Bereit, deine Seite zu vibe-en?",
      subtitle: "Schnapp dir dein content.json und leg los.",
      ctaPrimary: "Jetzt starten",
      ctaSecondary: "Demo ansehen",
    },
  };
  const footerIdx = sections.findIndex((s) => s.type === "Footer");
  if (footerIdx >= 0) sections.splice(footerIdx, 0, cta);
  else sections.push(cta);

  const next = { seo: content.seo, sections };
  return next;
}

function isAlreadyMigrated(content) {
  return Array.isArray(content.sections);
}

const files = readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".json"));
if (files.length === 0) {
  console.error("No .json files in messages/");
  process.exit(1);
}

// Build IDs from de.json (or first file) — same set used for every locale.
const sourceLocale = files.includes("de.json") ? "de" : files[0].replace(".json", "");
const ids = buildIds();

console.log(`Source locale: ${sourceLocale}`);
console.log(`Generated IDs:`, ids);

let migratedCount = 0;
for (const file of files) {
  const filePath = path.join(MESSAGES_DIR, file);
  const raw = readFileSync(filePath, "utf-8");
  const content = JSON.parse(raw);

  if (isAlreadyMigrated(content)) {
    console.log(`  ✓ ${file} already has sections[], skipping`);
    continue;
  }

  const migrated = migrate(content, ids);
  writeFileSync(filePath, JSON.stringify(migrated, null, 2) + "\n", "utf-8");
  console.log(`  ✓ ${file} migrated (${migrated.sections.length} sections)`);
  migratedCount++;
}

console.log(`\nDone. ${migratedCount} files migrated.`);
