import { NextResponse } from "next/server";
import { clearSession, deriveCookieDomain } from "@/lib/auth";

export const dynamic = "force-dynamic";

function requestOrigin(req: Request): string {
  const host = req.headers.get("host");
  const fwdProto = req.headers.get("x-forwarded-proto");
  const proto = fwdProto || (req.url.startsWith("https://") ? "https" : "http");
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}

export async function POST(req: Request) {
  const origin = requestOrigin(req);
  const hostname = new URL(origin).hostname;
  await clearSession({ domain: deriveCookieDomain(hostname) });
  // Send the user back to wherever they came from (the public tenant page
  // they were on) rather than always to /admin/login.
  const referer = req.headers.get("referer");
  const dest = referer && new URL(referer).origin === origin ? referer : `${origin}/admin/login`;
  return NextResponse.redirect(dest, { status: 303 });
}
