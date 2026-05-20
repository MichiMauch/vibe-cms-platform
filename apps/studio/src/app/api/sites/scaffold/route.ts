import "server-only";
import { readSession } from "@/lib/auth";
import { readEnv } from "@/lib/platform/env";
import {
  scaffoldContent,
  scaffoldSite,
  type Brief,
  type TemplateId,
  type SitePage,
} from "@/lib/platform/scaffold";
import { isValidPresetId } from "@vibe-cms-platform/core/theme";
import { normalisePagePath } from "@vibe-cms-platform/core/site";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const VALID_TEMPLATES: TemplateId[] = ["blank", "saas", "agentur", "event"];
const VALID_LANGUAGES = new Set(["de", "en", "fr", "it"]);

type RawSitePage = {
  path?: unknown;
  title?: unknown;
  parent?: unknown;
  pageBrief?: unknown;
};

function parsePages(raw: unknown): SitePage[] | null {
  if (!Array.isArray(raw)) return null;
  const out: SitePage[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as RawSitePage;
    const path = typeof o.path === "string" ? normalisePagePath(o.path) : "";
    const title = typeof o.title === "string" ? o.title.trim() : "";
    const pageBrief = typeof o.pageBrief === "string" ? o.pageBrief.trim() : "";
    if (!title || !pageBrief) continue;
    if (seen.has(path)) continue;
    seen.add(path);
    const parent =
      typeof o.parent === "string" && o.parent.trim() ? normalisePagePath(o.parent) : undefined;
    out.push({ path, title, parent, pageBrief });
  }
  if (out.length === 0) return null;
  // Drop dangling parents.
  const paths = new Set(out.map((p) => p.path));
  for (const p of out) {
    if (p.parent && !paths.has(p.parent)) p.parent = undefined;
  }
  return out;
}

/** Phase-A endpoint. Two paths:
 *
 * - Single-page (legacy / default): returns `{ contentJson, vibeSuggestion }`.
 * - Multi-page: caller sends `pages: SitePage[]` (with a homepage entry).
 *   Returns `{ pages: ScaffoldedPage[], vibeSuggestion }`. */
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

  const b = body as Partial<Brief> & { pages?: unknown; language?: unknown };
  const brand = (b.brand ?? "").trim();
  const template = (b.template ?? "blank") as TemplateId;
  const description = (b.description ?? "").trim();
  const pinnedVibe =
    b.pinnedVibe && isValidPresetId(b.pinnedVibe) ? b.pinnedVibe : null;
  const language =
    typeof b.language === "string" && VALID_LANGUAGES.has(b.language)
      ? (b.language as Brief["language"])
      : "de";

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

  const pages = parsePages(b.pages);

  try {
    if (pages) {
      const result = await scaffoldSite({
        apiKey: env.openai.apiKey,
        model: env.openai.model,
        brief: {
          brand,
          template,
          description,
          audience: b.audience,
          primaryGoal: b.primaryGoal,
          pinnedVibe,
          language,
        },
        pages,
      });
      return Response.json({
        pages: result.pages,
        vibeSuggestion: result.vibeSuggestion,
      });
    }

    const result = await scaffoldContent({
      apiKey: env.openai.apiKey,
      model: env.openai.model,
      brief: {
        brand,
        template,
        description,
        audience: b.audience,
        primaryGoal: b.primaryGoal,
        pinnedVibe,
        language,
      },
    });
    return Response.json({
      contentJson: result.contentJson,
      vibeSuggestion: result.vibeSuggestion,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "scaffold failed";
    return new Response(msg, { status: 500 });
  }
}
