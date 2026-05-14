import path from "node:path";
import { readEnv } from "@/lib/platform/env";
import { createGitHubClient } from "@/lib/platform/github";
import { createCloudflareClient } from "@/lib/platform/cloudflare";
import { scaffoldContent, type Brief, type TemplateId } from "@/lib/platform/scaffold";
import { addPage } from "@/lib/platform/registry";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

const VALID_TEMPLATES: TemplateId[] = ["blank", "saas", "agentur", "event"];
const SLUG_RE = /^[a-z][a-z0-9-]{1,38}[a-z0-9]$/;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const b = body as Partial<Brief & { slug: string }>;
  const slug = (b.slug ?? "").trim().toLowerCase();
  const brand = (b.brand ?? "").trim();
  const template = (b.template ?? "blank") as TemplateId;
  const description = (b.description ?? "").trim();

  if (!SLUG_RE.test(slug)) {
    return new Response(
      "Slug must be 3-40 chars, lowercase, alphanumeric + dashes, starting with a letter.",
      { status: 400 },
    );
  }
  if (brand.length < 2) return new Response("Brand name too short.", { status: 400 });
  if (description.length < 10) return new Response("Description too short.", { status: 400 });
  if (!VALID_TEMPLATES.includes(template)) {
    return new Response(`Unknown template: ${template}`, { status: 400 });
  }

  let env;
  try {
    env = readEnv();
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "env missing", { status: 500 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      function send(event: string, data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }
      function fail(message: string) {
        send("error", { message });
        controller.close();
      }

      try {
        // Step 1: AI scaffold
        send("progress", { step: "scaffold", label: "Generiere Inhalte mit AI" });
        const templatesDir = path.join(
          process.cwd(),
          "..",
          "..",
          "packages",
          "core",
          "templates",
        );
        const contentJson = await scaffoldContent({
          apiKey: env.openai.apiKey,
          model: env.openai.model,
          brief: { brand, template, description, audience: b.audience, primaryGoal: b.primaryGoal },
          templatesDir,
        });

        // Step 2: Create GitHub repo from template
        send("progress", { step: "github", label: "Erstelle GitHub-Repo" });
        const gh = createGitHubClient({
          token: env.github.token,
          owner: env.github.owner,
          templateRepo: env.github.templateRepo,
        });
        const repoInfo = await gh.createFromTemplate(slug, description);
        // GitHub returns the repo immediately but the initial commit may need a moment to settle.
        await new Promise((r) => setTimeout(r, 2500));

        // Step 3: Commit messages/de.json
        send("progress", { step: "content", label: "Schreibe Inhalte ins Repo" });
        await gh.putFile(repoInfo.repo, "messages/de.json", contentJson, "feat: initial content");

        // Step 4: Cloudflare Pages + Domain
        send("progress", { step: "cloudflare", label: "Verbinde Cloudflare Pages" });
        const cf = createCloudflareClient({
          accountId: env.cloudflare.accountId,
          apiToken: env.cloudflare.apiToken,
          zoneId: env.cloudflare.zoneId,
        });
        await cf.createPagesProject(slug, env.github.owner, repoInfo.repo);

        const fqdn = `${slug}.${env.cloudflare.rootDomain}`;
        try {
          await cf.upsertCname(fqdn, `${slug}.pages.dev`);
          await cf.addPagesDomain(slug, fqdn);
        } catch (err) {
          // Domain attach is best-effort; the .pages.dev URL always works.
          send("warning", {
            step: "domain",
            message: err instanceof Error ? err.message : "Domain attach failed",
          });
        }

        // Step 5: Registry
        await addPage({
          slug,
          brand,
          template,
          repo: repoInfo.repo,
          htmlUrl: repoInfo.htmlUrl,
          domain: fqdn,
          createdAt: new Date().toISOString(),
        });

        send("done", {
          slug,
          repo: repoInfo.htmlUrl,
          previewUrl: `https://${slug}.pages.dev`,
          customDomain: `https://${fqdn}`,
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
