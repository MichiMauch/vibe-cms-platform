import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import { readSession } from "@/lib/auth";
import { sendMagicLink } from "@/lib/auth";
import { readEnv } from "@/lib/platform/env";
import { createGitHubClient } from "@/lib/platform/github";
import { createCloudflareClient } from "@/lib/platform/cloudflare";
import { scaffoldContent, type Brief, type TemplateId } from "@/lib/platform/scaffold";
import { sitesDir, clearDomainCache, getSite } from "@/lib/platform/registry";
import { isValidPresetId, DEFAULT_PRESET_ID, type SiteThemeChoice } from "@vibe-cms-platform/core/theme";
import {
  pagePathToFileSlug,
  normalisePagePath,
  type PageEntry,
} from "@vibe-cms-platform/core/site";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const VALID_TEMPLATES: TemplateId[] = ["blank", "saas", "agentur", "event"];
const SLUG_RE = /^[a-z][a-z0-9-]{1,38}[a-z0-9]$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_RE = /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const VALID_LANGUAGES = new Set(["de", "en", "fr", "it"]);

type PreScaffoldedPage = {
  path: string;
  title: string;
  parent?: string;
  contentJson: string;
};

/** Apply the chosen theme to a Puck-tree string and return the new string.
 * Tolerant: if the tree is unparseable, returns the input unchanged. */
function injectThemeIntoTree(raw: string, theme: SiteThemeChoice): string {
  try {
    const parsed = JSON.parse(raw) as {
      root?: { props?: Record<string, unknown> };
      [k: string]: unknown;
    };
    parsed.root = parsed.root ?? {};
    parsed.root.props = parsed.root.props ?? {};
    parsed.root.props.theme = {
      preset: theme.preset,
      accentOverride: theme.accentOverride ?? "",
      inkOverride: theme.inkOverride ?? "",
    };
    return JSON.stringify(parsed, null, 2);
  } catch {
    return raw;
  }
}

function parsePreScaffolded(raw: unknown): PreScaffoldedPage[] | null {
  if (!Array.isArray(raw)) return null;
  const out: PreScaffoldedPage[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const pageP = typeof o.path === "string" ? normalisePagePath(o.path) : "";
    const title = typeof o.title === "string" ? o.title.trim() : "";
    const contentJson = typeof o.contentJson === "string" ? o.contentJson : "";
    if (!title || !contentJson) continue;
    if (seen.has(pageP)) continue;
    seen.add(pageP);
    const parent =
      typeof o.parent === "string" && o.parent.trim()
        ? normalisePagePath(o.parent)
        : undefined;
    out.push({ path: pageP, title, parent, contentJson });
  }
  if (out.length === 0) return null;
  if (!out.some((p) => p.path === "")) return null;
  return out;
}

export async function POST(req: Request) {
  const session = await readSession();
  if (!session?.master) {
    return new Response("Forbidden", { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const b = body as Partial<
    Brief & {
      slug: string;
      customerEmail: string;
      customDomain?: string;
      theme?: { preset?: string; accentOverride?: string; inkOverride?: string };
      /** Pre-generated single-page content tree from `/api/sites/scaffold`.
       * Phase B of the legacy single-page flow. */
      contentJson?: string;
      /** Pre-generated multi-page bundle. Each entry has its own contentJson.
       * When present, `pages` takes precedence over `contentJson`. */
      pages?: PreScaffoldedPage[];
      /** Output language for the AI fallback path. */
      language?: "de" | "en" | "fr" | "it";
    }
  >;
  const slug = (b.slug ?? "").trim().toLowerCase();
  const brand = (b.brand ?? "").trim();
  const template = (b.template ?? "blank") as TemplateId;
  const description = (b.description ?? "").trim();
  const customerEmail = (b.customerEmail ?? "").trim().toLowerCase();
  const customDomain = b.customDomain?.trim().toLowerCase() || null;
  const language =
    typeof b.language === "string" && VALID_LANGUAGES.has(b.language)
      ? (b.language as "de" | "en" | "fr" | "it")
      : "de";
  const preGeneratedContent =
    typeof b.contentJson === "string" && b.contentJson.length > 0 ? b.contentJson : null;
  const preGeneratedPages = parsePreScaffolded(b.pages);

  const themePresetCandidate = b.theme?.preset;
  const theme: SiteThemeChoice = {
    preset: isValidPresetId(themePresetCandidate) ? themePresetCandidate : DEFAULT_PRESET_ID,
  };
  const accent = b.theme?.accentOverride?.trim();
  if (accent && HEX_RE.test(accent)) theme.accentOverride = accent;
  const ink = b.theme?.inkOverride?.trim();
  if (ink && HEX_RE.test(ink)) theme.inkOverride = ink;

  if (!SLUG_RE.test(slug)) {
    return new Response("Slug must be 3-40 chars, lowercase, alphanumeric + dashes.", { status: 400 });
  }
  if (brand.length < 2) return new Response("Brand name too short.", { status: 400 });
  if (description.length < 10) return new Response("Description too short.", { status: 400 });
  if (!VALID_TEMPLATES.includes(template)) {
    return new Response(`Unknown template: ${template}`, { status: 400 });
  }
  if (!EMAIL_RE.test(customerEmail)) {
    return new Response("Invalid customer email.", { status: 400 });
  }
  if (customDomain && !DOMAIN_RE.test(customDomain)) {
    return new Response("Invalid custom domain (e.g. kundenmarke.ch).", { status: 400 });
  }
  if (await getSite(slug)) {
    return new Response(`Slug "${slug}" already exists.`, { status: 409 });
  }

  let env;
  try {
    env = readEnv();
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "env missing", { status: 500 });
  }

  const subdomainHost = `${slug}.${env.cloudflare.rootDomain}`;
  const allDomains = [subdomainHost, ...(customDomain ? [customDomain] : [])];

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      const fail = (message: string) => {
        send("error", { message });
        controller.close();
      };

      try {
        // 1. Resolve the content set we'll write: either pre-generated pages
        // (multi-page flow), a pre-generated single tree (legacy), or a
        // fresh AI scaffold of the homepage.
        type WritePage = { path: string; title: string; parent?: string; contentJson: string };
        let writePages: WritePage[];

        if (preGeneratedPages) {
          send("progress", {
            step: "scaffold",
            label: `Inhalte aus Vorschau übernehmen (${preGeneratedPages.length} Seiten)`,
          });
          writePages = preGeneratedPages;
        } else if (preGeneratedContent) {
          send("progress", { step: "scaffold", label: "Inhalte aus Vorschau übernehmen" });
          writePages = [
            { path: "", title: brand, contentJson: preGeneratedContent },
          ];
        } else {
          send("progress", { step: "scaffold", label: "Generiere Inhalte mit AI" });
          const result = await scaffoldContent({
            apiKey: env.openai.apiKey,
            model: env.openai.model,
            brief: {
              brand,
              template,
              description,
              audience: b.audience,
              primaryGoal: b.primaryGoal,
              pinnedVibe: theme.preset,
              language,
            },
          });
          writePages = [{ path: "", title: brand, contentJson: result.contentJson }];
        }

        // Inject the chosen theme into every page's root.props.theme so the
        // editor's root widget is pre-populated and stays in sync with config.json.
        writePages = writePages.map((p) => ({
          ...p,
          contentJson: injectThemeIntoTree(p.contentJson, theme),
        }));

        // Build the PageEntry list for config.json — single source of truth
        // for nav + routing.
        const pageEntries: PageEntry[] = writePages.map((p, idx) => ({
          slug: pagePathToFileSlug(p.path),
          path: p.path,
          title: { [language]: p.title },
          parent: p.parent,
          navOrder: idx,
        }));

        // 2. Local FS write
        send("progress", { step: "fs", label: "Lege Site-Dateien lokal an" });
        const siteDir = path.join(sitesDir(), slug);
        const localeDir = path.join(siteDir, "messages", language);
        const config = {
          brand,
          template,
          domains: allDomains,
          createdAt: new Date().toISOString(),
          theme,
          pages: pageEntries,
        };
        const access = { users: [customerEmail] };
        await fs.mkdir(localeDir, { recursive: true });
        for (const p of writePages) {
          const fileSlug = pagePathToFileSlug(p.path);
          await fs.writeFile(
            path.join(localeDir, `${fileSlug}.json`),
            p.contentJson,
            "utf-8",
          );
        }
        await fs.writeFile(
          path.join(siteDir, "config.json"),
          JSON.stringify(config, null, 2) + "\n",
          "utf-8",
        );
        await fs.writeFile(
          path.join(siteDir, "access.json"),
          JSON.stringify(access, null, 2) + "\n",
          "utf-8",
        );

        // 3. GitHub commits — one per file. Per-page commit so the history
        // reads like a sitemap.
        send("progress", { step: "github", label: "Committe Site ins Monorepo" });
        const gh = createGitHubClient({
          token: env.github.token,
          owner: env.github.owner,
          repo: env.github.repo,
          branch: env.github.branch,
        });
        for (const p of writePages) {
          const fileSlug = pagePathToFileSlug(p.path);
          await gh.putFile(
            `sites/${slug}/messages/${language}/${fileSlug}.json`,
            p.contentJson,
            `feat(site): add ${slug}/${language}/${fileSlug}`,
          );
          send("progress", {
            step: "github",
            label: `Page committed: ${p.path || "/"} (${p.title})`,
          });
        }
        await gh.putFile(
          `sites/${slug}/config.json`,
          JSON.stringify(config, null, 2) + "\n",
          `feat(site): add ${slug} config`,
        );
        await gh.putFile(
          `sites/${slug}/access.json`,
          JSON.stringify(access, null, 2) + "\n",
          `feat(site): add ${slug} access`,
        );

        // 4. Cloudflare — DNS + Pages domain attach.
        send("progress", { step: "cloudflare", label: "DNS + Pages-Domain konfigurieren" });
        const cf = createCloudflareClient({
          accountId: env.cloudflare.accountId,
          apiToken: env.cloudflare.apiToken,
          zoneId: env.cloudflare.zoneId,
        });

        try {
          await cf.upsertCname(subdomainHost, `${env.cloudflare.projectName}.pages.dev`);
        } catch (err) {
          send("warning", {
            step: "dns",
            message: `CNAME ${subdomainHost}: ${err instanceof Error ? err.message : "failed"}`,
          });
        }

        for (const fqdn of allDomains) {
          try {
            await cf.addPagesDomain(env.cloudflare.projectName, fqdn);
          } catch (err) {
            const msg = err instanceof Error ? err.message : "domain attach failed";
            if (!/already|exists/i.test(msg)) {
              send("warning", { step: "domain", message: `${fqdn}: ${msg}` });
            }
          }
        }

        // 5. Magic-link to customer
        let magicSent = false;
        try {
          await sendMagicLink(customerEmail);
          magicSent = true;
        } catch (err) {
          send("warning", {
            step: "mail",
            message: `Magic-Link senden fehlgeschlagen: ${err instanceof Error ? err.message : "unknown"}`,
          });
        }

        clearDomainCache();

        send("done", {
          slug,
          previewUrl: `https://${subdomainHost}`,
          customDomainUrl: customDomain ? `https://${customDomain}` : null,
          magicLinkSent: magicSent,
          pages: writePages.map((p) => ({ path: p.path, title: p.title })),
        });
        controller.close();
      } catch (err) {
        fail(err instanceof Error ? err.message : "Unknown error");
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    },
  });
}
