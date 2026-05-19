#!/usr/bin/env node
/**
 * One-shot: repoint every tenant CNAME at the Pages project and attach
 * each domain as a Pages custom domain. Idempotent — PUT on existing
 * DNS records, "already exists" errors swallowed for Pages domains.
 *
 * Usage:
 *   node --env-file=apps/studio/.env.local apps/studio/scripts/repair-tenant-dns.mjs
 *
 * Reads:  sites/<slug>/config.json   (every domain in `domains[]`)
 * Calls:  Cloudflare API → CNAME → <project>.pages.dev + Pages domain attach
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

const SITES_DIR = path.resolve(process.cwd(), "sites");
const CF_API = "https://api.cloudflare.com/client/v4";

const token = process.env.CLOUDFLARE_API_TOKEN;
const zoneId = process.env.CLOUDFLARE_ZONE_ID;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const project = (process.env.CLOUDFLARE_PAGES_PROJECT || "").trim();
const target = `${project}.pages.dev`;

if (!token || !zoneId || !accountId || !project) {
  console.error("Missing one of CLOUDFLARE_API_TOKEN / CLOUDFLARE_ZONE_ID / CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_PAGES_PROJECT.");
  console.error("Run with: node --env-file=apps/studio/.env.local apps/studio/scripts/repair-tenant-dns.mjs");
  process.exit(1);
}

async function cf(p, init) {
  const res = await fetch(`${CF_API}${p}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const data = await res.json();
  if (!data.success) {
    const msg = data.errors?.map((e) => e.message).join("; ") || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data.result;
}

async function upsertCname(name) {
  const existing = await cf(
    `/zones/${zoneId}/dns_records?name=${encodeURIComponent(name)}&type=CNAME`,
  );
  const body = JSON.stringify({ type: "CNAME", name, content: target, proxied: true, ttl: 1 });
  if (existing && existing.length > 0) {
    await cf(`/zones/${zoneId}/dns_records/${existing[0].id}`, { method: "PUT", body });
    return "updated";
  }
  await cf(`/zones/${zoneId}/dns_records`, { method: "POST", body });
  return "created";
}

async function attachPagesDomain(fqdn) {
  try {
    await cf(`/accounts/${accountId}/pages/projects/${project}/domains`, {
      method: "POST",
      body: JSON.stringify({ name: fqdn }),
    });
    return "attached";
  } catch (err) {
    if (/already|exists/i.test(err.message)) return "already attached";
    throw err;
  }
}

function collect() {
  if (!existsSync(SITES_DIR)) {
    console.error(`sites/ not found at ${SITES_DIR}. Run from repo root.`);
    process.exit(1);
  }
  const out = [];
  for (const slug of readdirSync(SITES_DIR).sort()) {
    if (slug.startsWith(".")) continue;
    const cfgPath = path.join(SITES_DIR, slug, "config.json");
    if (!existsSync(cfgPath)) continue;
    let cfg;
    try {
      cfg = JSON.parse(readFileSync(cfgPath, "utf-8"));
    } catch {
      continue;
    }
    for (const d of cfg.domains ?? []) out.push({ slug, domain: d });
  }
  return out;
}

const entries = collect();
console.log(`Pages project: ${project} (target ${target})`);
console.log(`Repointing ${entries.length} domain(s)\n`);

let ok = 0;
let failed = 0;
for (const { slug, domain } of entries) {
  try {
    const dns = await upsertCname(domain);
    const attach = await attachPagesDomain(domain);
    console.log(`  ✓ ${domain.padEnd(40)} (${slug}) — dns:${dns}, pages:${attach}`);
    ok++;
  } catch (err) {
    console.error(`  ✗ ${domain.padEnd(40)} (${slug}) — ${err.message}`);
    failed++;
  }
}

console.log(`\nDone. ${ok} succeeded, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
