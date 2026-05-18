import { listSites } from "@/lib/platform/registry";

/** Built once per process: domains we accept browser CORS calls from.
 * Tenant pages live at <slug>.pages.mauch.rocks and at customer-owned
 * apex domains listed in sites/<slug>/config.json:domains[]. */
let cached: Set<string> | null = null;
let cachedAt = 0;
const TTL = 60_000;

async function allowList(): Promise<Set<string>> {
  const now = Date.now();
  if (cached && now - cachedAt < TTL) return cached;
  const set = new Set<string>();
  for (const site of await listSites()) {
    for (const d of site.config.domains ?? []) {
      set.add(d.toLowerCase());
    }
  }
  cached = set;
  cachedAt = now;
  return set;
}

/** True for `<anything>.pages.mauch.rocks` (wildcard root-domain match) or any
 * exact custom domain attached to a site. */
async function isOriginAllowed(origin: string | null): Promise<{ ok: boolean; host: string | null }> {
  if (!origin) return { ok: false, host: null };
  let host: string;
  try {
    host = new URL(origin).host.toLowerCase();
  } catch {
    return { ok: false, host: null };
  }
  if (host.endsWith(".pages.mauch.rocks")) return { ok: true, host };
  const list = await allowList();
  return { ok: list.has(host), host };
}

/** Returns the CORS response headers for a request's Origin, or an empty
 * object when the origin isn't allowed (the browser will then block the
 * cross-site call — same-origin callers see no difference). */
export async function corsHeaders(origin: string | null): Promise<Record<string, string>> {
  const { ok, host } = await isOriginAllowed(origin);
  if (!ok || !host) return {};
  return {
    "Access-Control-Allow-Origin": `https://${host}`,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/** Preflight reply: 204 + CORS headers when origin is allowed, 403 otherwise. */
export async function corsPreflight(req: Request): Promise<Response> {
  const headers = await corsHeaders(req.headers.get("origin"));
  if (Object.keys(headers).length === 0) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, { status: 204, headers });
}
