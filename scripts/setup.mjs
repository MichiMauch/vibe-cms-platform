#!/usr/bin/env node
// One-shot setup: discovers GitHub + Cloudflare credentials, picks zone/domain,
// and writes apps/studio/.env.local. Idempotent — re-run safely.

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const ENV_PATH = path.join(ROOT, "apps", "studio", ".env.local");
const rl = readline.createInterface({ input, output });
const ask = (q) => rl.question(q);
const askDefault = async (q, d) => (await ask(`${q} [${d}]: `)).trim() || d;
// Plain readline — masking with asterisks conflicted with paste on macOS terminals.
// The token is visible only in your own terminal and goes straight into .env.local.
const askSecret = async (q) => (await ask(q)).trim();

function header(title) {
  output.write(`\n\x1b[1m━━ ${title}\x1b[0m\n`);
}

async function readExistingEnv() {
  try {
    const raw = await fs.readFile(ENV_PATH, "utf-8");
    const map = new Map();
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) map.set(m[1], m[2]);
    }
    return map;
  } catch {
    return new Map();
  }
}

async function writeEnv(map) {
  const order = [
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
    "NEXT_PUBLIC_CLOUDINARY_API_KEY",
    "GITHUB_TOKEN",
    "GITHUB_OWNER",
    "GITHUB_TEMPLATE_REPO",
    "CLOUDFLARE_API_TOKEN",
    "CLOUDFLARE_ACCOUNT_ID",
    "CLOUDFLARE_ZONE_ID",
    "CLOUDFLARE_ROOT_DOMAIN",
  ];
  const seen = new Set();
  const lines = [];
  for (const k of order) {
    if (map.has(k)) {
      lines.push(`${k}=${map.get(k)}`);
      seen.add(k);
    }
  }
  for (const [k, v] of map) if (!seen.has(k)) lines.push(`${k}=${v}`);
  await fs.mkdir(path.dirname(ENV_PATH), { recursive: true });
  await fs.writeFile(ENV_PATH, lines.join("\n") + "\n", "utf-8");
}

async function setupGitHub(env) {
  header("GitHub");

  // Auth status
  const status = spawnSync("gh", ["auth", "status"], { encoding: "utf-8" });
  if (status.status !== 0) {
    output.write("gh is not authenticated. Run `gh auth login` first.\n");
    process.exit(1);
  }

  // Token
  const tokenRes = spawnSync("gh", ["auth", "token"], { encoding: "utf-8" });
  const token = tokenRes.stdout.trim();
  if (!token) {
    output.write("gh did not return a token. Re-run `gh auth login`.\n");
    process.exit(1);
  }
  env.set("GITHUB_TOKEN", token);
  output.write(`✓ GitHub token from gh CLI\n`);

  // Owner (user login)
  const userRes = spawnSync("gh", ["api", "user", "--jq", ".login"], { encoding: "utf-8" });
  const defaultOwner = userRes.stdout.trim();
  const owner = await askDefault("GitHub owner (user or org)", env.get("GITHUB_OWNER") || defaultOwner);
  env.set("GITHUB_OWNER", owner);

  const template = await askDefault(
    "Template repo name",
    env.get("GITHUB_TEMPLATE_REPO") || "landingpage-template",
  );
  env.set("GITHUB_TEMPLATE_REPO", template);

  // Check that template repo exists; offer to create
  const repoCheck = spawnSync(
    "gh",
    ["api", `repos/${owner}/${template}`, "--silent"],
    { encoding: "utf-8" },
  );
  if (repoCheck.status !== 0) {
    output.write(`\n⚠ Repo ${owner}/${template} does not exist yet.\n`);
    const create = (await askDefault("Create it from landingpage-template/ now? (y/n)", "y")).toLowerCase();
    if (create === "y") {
      output.write(`Creating ${owner}/${template} ...\n`);
      const tplPath = path.join(ROOT, "landingpage-template");
      // Initialize git in landingpage-template/ if needed
      try {
        await fs.access(path.join(tplPath, ".git"));
      } catch {
        output.write("Initializing git in landingpage-template/ ...\n");
        execFileSync("git", ["init", "-b", "main"], { cwd: tplPath, stdio: "inherit" });
        execFileSync("git", ["add", "."], { cwd: tplPath, stdio: "inherit" });
        execFileSync("git", ["commit", "-m", "Initial landingpage template"], { cwd: tplPath, stdio: "inherit" });
      }
      execFileSync(
        "gh",
        ["repo", "create", `${owner}/${template}`, "--public", "--source", tplPath, "--push"],
        { stdio: "inherit" },
      );
      // Mark as template
      execFileSync(
        "gh",
        ["api", "-X", "PATCH", `repos/${owner}/${template}`, "-F", "is_template=true"],
        { stdio: "inherit" },
      );
      output.write(`✓ Repo created and marked as template\n`);
    } else {
      output.write("Skipping — you must create the template repo manually before /admin/new-page works.\n");
    }
  } else {
    output.write(`✓ Template repo ${owner}/${template} exists\n`);
  }
}

async function cf(token, path) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.errors?.map((e) => e.message).join("; ") || `HTTP ${res.status}`);
  }
  return data.result;
}

async function setupCloudflare(env) {
  header("Cloudflare");

  let token = env.get("CLOUDFLARE_API_TOKEN");
  for (let attempt = 0; attempt < 3; attempt++) {
    if (token && token.length > 10) {
      try {
        await cf(token, "/user/tokens/verify");
        output.write("✓ Cloudflare token verified\n");
        env.set("CLOUDFLARE_API_TOKEN", token);
        break;
      } catch (err) {
        output.write(`✗ Token rejected by Cloudflare: ${err.message}\n`);
        token = "";
      }
    }
    if (attempt === 0) {
      output.write(
        "\nCreate an API token at https://dash.cloudflare.com/profile/api-tokens with:\n" +
          "  • Account › Cloudflare Pages › Edit\n" +
          "  • Zone › DNS › Edit\n" +
          "  • Zone › Zone › Read  (so setup can list your zones)\n\n",
      );
    }
    token = (await askSecret("Paste CLOUDFLARE_API_TOKEN: ")).trim();
    if (!token) {
      output.write("No token provided — skipping Cloudflare setup.\n");
      return;
    }
  }
  if (!token) return;

  // Accounts — try to list; fall back to manual entry if the token lacks the scope
  let accountId;
  let accounts = [];
  try {
    accounts = await cf(token, "/accounts");
  } catch {
    accounts = [];
  }
  if (accounts && accounts.length === 1) {
    accountId = accounts[0].id;
    output.write(`✓ Account: ${accounts[0].name} (${accountId})\n`);
  } else if (accounts && accounts.length > 1) {
    output.write("\nAccounts:\n");
    accounts.forEach((a, i) => output.write(`  ${i + 1}. ${a.name} (${a.id})\n`));
    const idx = parseInt(await ask("Pick account # "), 10) - 1;
    accountId = accounts[idx]?.id;
  } else {
    output.write(
      "\n⚠ Token can't list accounts. Find your Account ID in the Cloudflare dashboard\n" +
        "  (right sidebar on any page, or in the URL: dash.cloudflare.com/<ACCOUNT-ID>).\n",
    );
    accountId = (await ask("Paste CLOUDFLARE_ACCOUNT_ID: ")).trim();
  }
  if (!accountId) {
    output.write("✗ No account id provided — aborting Cloudflare setup.\n");
    return;
  }
  env.set("CLOUDFLARE_ACCOUNT_ID", accountId);

  // Zones
  const zones = await cf(token, "/zones?per_page=50");
  if (!zones || zones.length === 0) {
    output.write("⚠ No zones found. Add a domain to Cloudflare first, then re-run setup.\n");
    return;
  }
  output.write("\nZones:\n");
  zones.forEach((z, i) => output.write(`  ${i + 1}. ${z.name} (${z.id})\n`));
  const zIdx = parseInt(await ask("Pick zone # "), 10) - 1;
  const zone = zones[zIdx];
  env.set("CLOUDFLARE_ZONE_ID", zone.id);

  const root = await askDefault(
    "Root domain for landingpages (subdomain.zone or just zone)",
    env.get("CLOUDFLARE_ROOT_DOMAIN") || `pages.${zone.name}`,
  );
  env.set("CLOUDFLARE_ROOT_DOMAIN", root);
  output.write(`✓ New pages will live at <slug>.${root}\n`);
}

async function setupOpenAI(env) {
  header("OpenAI");
  if (env.has("OPENAI_API_KEY") && env.get("OPENAI_API_KEY").startsWith("sk-")) {
    output.write(`✓ OPENAI_API_KEY already set\n`);
    return;
  }
  const key = (await askSecret("Paste OPENAI_API_KEY (or press Enter to skip): ")).trim();
  if (key) {
    env.set("OPENAI_API_KEY", key);
    env.set("OPENAI_MODEL", env.get("OPENAI_MODEL") || "gpt-4o-mini");
  }
}

async function main() {
  output.write("\n\x1b[1mVibe-CMS Platform — Setup\x1b[0m\n");
  const env = await readExistingEnv();
  await setupGitHub(env);
  await setupCloudflare(env);
  await setupOpenAI(env);
  await writeEnv(env);
  output.write(`\n✓ Wrote ${ENV_PATH}\n`);
  rl.close();
}

main().catch((err) => {
  output.write(`\n✗ ${err.message}\n`);
  process.exit(1);
});
