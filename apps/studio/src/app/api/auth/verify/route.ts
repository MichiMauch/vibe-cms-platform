import { NextResponse } from "next/server";
import { consumeMagicToken, issueSessionCookie, deriveCookieDomain } from "@/lib/auth";

export const dynamic = "force-dynamic";

// In Next.js standalone, `new URL(req.url).origin` derives the host from the
// HOSTNAME env (typically 0.0.0.0 in Docker), not from the actual Host header.
// Build the origin from headers so redirects land on the URL the browser used.
function requestOrigin(req: Request): string {
  const host = req.headers.get("host");
  const fwdProto = req.headers.get("x-forwarded-proto");
  const proto = fwdProto || (req.url.startsWith("https://") ? "https" : "http");
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = requestOrigin(req);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login?error=missing-token", origin));
  }
  const payload = await consumeMagicToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid-token", origin));
  }
  const hostname = new URL(origin).hostname;
  await issueSessionCookie(payload, {
    secure: origin.startsWith("https://"),
    domain: deriveCookieDomain(hostname),
  });
  // Master users land in master overview, regular customers in their editor.
  const dest = payload.master ? "/admin/master/sites" : "/admin/edit";
  return NextResponse.redirect(new URL(dest, origin));
}
