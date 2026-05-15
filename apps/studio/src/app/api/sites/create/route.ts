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

export const dynamic = "force-dynamic";
export const maxDuration = 90;

const VALID_TEMPLATES: TemplateId[] = ["blank", "saas", "agentur", "event"];
const SLUG_RE = /^[a-z][a-z0-9-]{1,38}[a-z0-9]$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_RE = /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

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

  const b = body as Partial<Brief & { slug: string; customerEmail: string; customDomain?: string }>;
  const slug = (b.slug ?? "").trim().toLowerCase();
  const brand = (b.brand ?? "").trim();
  const template = (b.template ?? "blank") as TemplateId;
  const description = (b.description ?? "").trim();
  const customerEmail = (b.customerEmail ?? "").trim().toLowerCase();
  const customDomain = b.customDomain?.trim().toLowerCase() || null;

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

  // Reject if slug already exists
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
        // 1. AI scaffold
        send("progress", { step: "scaffold", label: "Generiere Inhalte mit AI" });
        const templatesDir = path.resolve(process.cwd(), "..", "..", "packages", "core", "templates");
        const contentJson = await scaffoldContent({
          apiKey: env.openai.apiKey,
          model: env.openai.model,
          brief: { brand, template, description, audience: b.audience, primaryGoal: b.primaryGoal },
          templatesDir,
        });

        // 2. Local FS write — gives the dev server an immediate copy.
        send("progress", { step: "fs", label: "Lege Site-Dateien lokal an" });
        const siteDir = path.join(sitesDir(), slug);
        const messagesDir = path.join(siteDir, "messages");
        const config = {
          brand,
          template,
          domains: allDomains,
          createdAt: new Date().toISOString(),
        };
        const access = { users: [customerEmail] };
        await fs.mkdir(messagesDir, { recursive: true });
        await fs.writeFile(path.join(messagesDir, "de.json"), contentJson, "utf-8");
        await fs.writeFile(path.join(siteDir, "config.json"), JSON.stringify(config, null, 2) + "\n", "utf-8");
        await fs.writeFile(path.join(siteDir, "access.json"), JSON.stringify(access, null, 2) + "\n", "utf-8");

        // 3. GitHub commits — three files, one after the other for clarity in history.
        send("progress", { step: "github", label: "Committe Site ins Monorepo" });
        const gh = createGitHubClient({
          token: env.github.token,
          owner: env.github.owner,
          repo: env.github.repo,
          branch: env.github.branch,
        });
        await gh.putFile(`sites/${slug}/messages/de.json`, contentJson, `feat(site): add ${slug} content`);
        await gh.putFile(`sites/${slug}/config.json`, JSON.stringify(config, null, 2) + "\n", `feat(site): add ${slug} config`);
        await gh.putFile(`sites/${slug}/access.json`, JSON.stringify(access, null, 2) + "\n", `feat(site): add ${slug} access`);

        // 4. Cloudflare DNS + Pages domain
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
            // Domain might already exist — that's fine; surface other errors.
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
