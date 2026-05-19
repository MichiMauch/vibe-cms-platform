import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { readEnv } from "@/lib/platform/env";
import { createCloudflareClient } from "@/lib/platform/cloudflare";
import { createGitHubClient } from "@/lib/platform/github";
import { clearDomainCache, getSite, sitesDir } from "@/lib/platform/registry";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

const SLUG_RE = /^[a-z][a-z0-9-]{1,38}[a-z0-9]$/;

type Params = { slug: string };

/** Hard-delete a site: drops DNS, removes Pages custom-domains, removes the
 * sites/<slug>/ directory both locally and in the repo. Each step is
 * idempotent and tolerant of "already gone" so a retry after a partial
 * failure cleans up the rest. */
export async function DELETE(_req: Request, ctx: { params: Promise<Params> }) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!session.master) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = await ctx.params;
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const site = await getSite(slug);
  if (!site) {
    return NextResponse.json({ error: `Site '${slug}' not found` }, { status: 404 });
  }

  let env;
  try {
    env = readEnv();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "env missing" },
      { status: 500 },
    );
  }

  const warnings: string[] = [];
  const domains = site.config.domains ?? [];

  // 1. Local FS — remove first so the running container stops serving the
  // site immediately (matters for the dev-preview path).
  try {
    await fs.rm(path.join(sitesDir(), slug), { recursive: true, force: true });
  } catch (err) {
    warnings.push(`fs: ${err instanceof Error ? err.message : "rm failed"}`);
  }

  // 2. Cloudflare — Pages custom-domains + zone CNAMEs.
  const cf = createCloudflareClient({
    accountId: env.cloudflare.accountId,
    apiToken: env.cloudflare.apiToken,
    zoneId: env.cloudflare.zoneId,
  });
  for (const fqdn of domains) {
    try {
      await cf.removePagesDomain(env.cloudflare.projectName, fqdn);
    } catch (err) {
      warnings.push(`pages-domain ${fqdn}: ${err instanceof Error ? err.message : "failed"}`);
    }
    try {
      await cf.deleteCname(fqdn);
    } catch (err) {
      warnings.push(`dns ${fqdn}: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  // 3. GitHub — one commit that deletes every file under sites/<slug>/.
  // Triggers a Pages rebuild so the static export drops this slug too.
  try {
    const gh = createGitHubClient({
      token: env.github.token,
      owner: env.github.owner,
      repo: env.github.repo,
      branch: env.github.branch,
    });
    await gh.deleteDir(`sites/${slug}`, `chore(site): delete ${slug} via ${session.sub}`);
  } catch (err) {
    warnings.push(`github: ${err instanceof Error ? err.message : "delete failed"}`);
  }

  clearDomainCache();

  return NextResponse.json({ ok: true, slug, warnings });
}
