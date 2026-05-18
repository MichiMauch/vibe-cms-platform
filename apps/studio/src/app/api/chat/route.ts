import { POST as chatPost } from "@vibe-cms-platform/core/api/chat";
import { corsHeaders, corsPreflight } from "@/lib/cors";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function POST(req: Request) {
  const res = await chatPost(req);
  const headers = await corsHeaders(req.headers.get("origin"));
  // Streamed response — clone headers, leave the body untouched.
  const merged = new Headers(res.headers);
  for (const [k, v] of Object.entries(headers)) merged.set(k, v);
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: merged,
  });
}
