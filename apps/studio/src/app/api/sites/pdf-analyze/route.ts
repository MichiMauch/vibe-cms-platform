import "server-only";
import { readSession } from "@/lib/auth";
import { readEnv } from "@/lib/platform/env";
import { analyzePdf } from "@/lib/platform/pdf-analyze";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(req: Request) {
  const session = await readSession();
  if (!session?.master) {
    return new Response("Forbidden", { status: 403 });
  }

  // multipart/form-data with a single `pdf` field
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return new Response("Expected multipart/form-data", { status: 400 });
  }

  const file = formData.get("pdf");
  if (!(file instanceof File)) {
    return new Response("Missing 'pdf' file field", { status: 400 });
  }
  if (file.type && file.type !== "application/pdf") {
    return new Response(`Unsupported type: ${file.type}. Only application/pdf.`, { status: 415 });
  }
  if (file.size === 0) {
    return new Response("Empty file", { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return new Response(`File too large (${file.size} bytes; max ${MAX_BYTES}).`, { status: 413 });
  }

  let env;
  try {
    env = readEnv();
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "env missing", { status: 500 });
  }
  if (!env.gemini.apiKey) {
    return new Response(
      "GEMINI_API_KEY not configured. Add it to apps/studio/.env.local.",
      { status: 503 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    const analysis = await analyzePdf({
      apiKey: env.gemini.apiKey,
      model: env.gemini.model,
      pdfBytes: bytes,
      pdfName: file.name,
    });
    return Response.json(analysis);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "PDF analysis failed";
    return new Response(msg, { status: 502 });
  }
}
