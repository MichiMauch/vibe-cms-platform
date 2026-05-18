#!/usr/bin/env node
/**
 * Repoint all tenant subdomain CNAMEs at the Studio host (Coolify).
 * Previously they pointed at `<project>.pages.dev`, which was never deployed.
 *
 * Usage:
 *   node --env-file=apps/studio/.env.local apps/studio/scripts/repair-tenant-dns.mjs
 *
 * Reads:  sites/<slug>/config.json   (for every domain in `domains[]`)
 * Calls:  Cloudflare API → CNAME upsert (proxied) to env.STUDIO_HOST
 *
 * Idempotent: re-running is safe (PUT on the existing record).
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

const SITES_DIR = path.resolve(process.cwd(), "sites");
const CF_API = "https://api.cloudflare.com/client/v4";

const token = process.env.CLOUDFLARE_API_TOKEN;
const zoneId = process.env.CLOUDFLARE_ZONE_ID;
const target = (process.env.STUDIO_HOST || "studio.mauch.rocks").trim();

if (!token || !zoneId) {
  console.error("Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID.");
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

function collectDomains() {
  if (!existsSync(SITES_DIR)) {
    console.error(`sites/ not found at ${SITES_DIR}. Run from repo root.`);
    process.exit(1);
  }
  const domains = [];
  for (const slug of readdirSync(SITES_DIR).sort()) {
    if (slug.startsWith(".")) continue;
    const configPath = path.join(SITES_DIR, slug, "config.json");
    if (!existsSync(configPath)) continue;
    let config;
    try {
      config = JSON.parse(readFileSync(configPath, "utf-8"));
    } catch {
      console.warn(`! ${slug}: invalid config.json — skipping`);
      continue;
    }
    for (const d of config.domains ?? []) {
      domains.push({ slug, domain: d });
    }
  }
  return domains;
}

const domains = collectDomains();
console.log(`Repointing ${domains.length} CNAME(s) → ${target}\n`);

let ok = 0;
let failed = 0;
for (const { slug, domain } of domains) {
  try {
    const action = await upsertCname(domain);
    console.log(`  ✓ ${domain.padEnd(40)} (${slug}) — ${action}`);
    ok++;
  } catch (err) {
    console.error(`  ✗ ${domain.padEnd(40)} (${slug}) — ${err.message}`);
    failed++;
  }
}

console.log(`\nDone. ${ok} succeeded, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
