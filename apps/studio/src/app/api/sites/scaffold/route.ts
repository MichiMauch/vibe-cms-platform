import "server-only";
import { readSession } from "@/lib/auth";
import { readEnv } from "@/lib/platform/env";
import { scaffoldContent, type Brief, type TemplateId } from "@/lib/platform/scaffold";
import { isValidPresetId } from "@vibe-cms-platform/core/theme";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VALID_TEMPLATES: TemplateId[] = ["blank", "saas", "agentur", "event"];

/** Phase-A endpoint of the two-phase create flow. Runs the AI scaffold and
 * returns `{ contentJson, vibeSuggestion }` so the modal can present the
 * vibe suggestion BEFORE any filesystem mutation. The user reviews/overrides,
 * then `/api/sites/create` finishes the job in Phase B. */
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

  const b = body as Partial<Brief>;
  const brand = (b.brand ?? "").trim();
  const template = (b.template ?? "blank") as TemplateId;
  const description = (b.description ?? "").trim();
  const pinnedVibe =
    b.pinnedVibe && isValidPresetId(b.pinnedVibe) ? b.pinnedVibe : null;

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

  try {
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
