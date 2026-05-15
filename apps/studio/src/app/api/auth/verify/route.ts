import { NextResponse } from "next/server";
import { consumeMagicToken, issueSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login?error=missing-token", url.origin));
  }
  const payload = await consumeMagicToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid-token", url.origin));
  }
  await issueSessionCookie(payload);
  // Master users land in master overview, regular customers in their editor.
  const dest = payload.master ? "/admin/master/sites" : "/admin/edit";
  return NextResponse.redirect(new URL(dest, url.origin));
}
