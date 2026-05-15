import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { Resend } from "resend";
import { cookies } from "next/headers";
import { listSites } from "./platform/registry";
import { readEnv } from "./platform/env";

const SESSION_COOKIE = "vcms_session";
const MAGIC_TTL_SEC = 15 * 60; // 15 minutes
const SESSION_TTL_SEC = 30 * 24 * 60 * 60; // 30 days

export type SessionPayload = {
  sub: string;
  slugs: string[];
  master: boolean;
};

type TokenType = "magic" | "session";

function getSecret(): Uint8Array {
  const env = readEnv();
  return new TextEncoder().encode(env.auth.jwtSecret);
}

async function signToken(payload: SessionPayload, type: TokenType, ttlSec: number): Promise<string> {
  return new SignJWT({ ...payload, type })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSec}s`)
    .sign(getSecret());
}

async function verifyToken(
  token: string,
  expectedType: TokenType,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    if (payload.type !== expectedType) return null;
    if (typeof payload.sub !== "string") return null;
    const slugs = Array.isArray(payload.slugs) ? (payload.slugs as string[]) : [];
    return {
      sub: payload.sub,
      slugs,
      master: Boolean(payload.master),
    };
  } catch {
    return null;
  }
}

/** Find which sites a given email may edit (across all access.json files). */
export async function siteSlugsForEmail(email: string): Promise<string[]> {
  const lower = email.trim().toLowerCase();
  const all = await listSites();
  return all
    .filter((s) => s.access.users.some((u) => u.toLowerCase() === lower))
    .map((s) => s.slug);
}

export function isMasterEmail(email: string): boolean {
  const env = readEnv();
  return env.auth.masterEmails.includes(email.trim().toLowerCase());
}

/** Build a magic-link URL pointing at our verify endpoint. */
export async function buildMagicLink(email: string): Promise<string | null> {
  const lower = email.trim().toLowerCase();
  const slugs = await siteSlugsForEmail(lower);
  const master = isMasterEmail(lower);
  if (slugs.length === 0 && !master) {
    // Email not authorised for any site — silently fail to avoid email enumeration
    return null;
  }
  const env = readEnv();
  const token = await signToken({ sub: lower, slugs, master }, "magic", MAGIC_TTL_SEC);
  return `${env.auth.publicUrl.replace(/\/$/, "")}/api/auth/verify?token=${encodeURIComponent(token)}`;
}

export async function sendMagicLink(email: string): Promise<{ sent: boolean }> {
  const link = await buildMagicLink(email);
  if (!link) {
    // Pretend success to avoid leaking whether the email is on file.
    return { sent: true };
  }
  const env = readEnv();
  const resend = new Resend(env.resend.apiKey);
  await resend.emails.send({
    from: env.resend.fromEmail,
    to: email,
    subject: "Dein Vibe-CMS Login-Link",
    html: `
      <p>Hi,</p>
      <p>Klick auf den Link, um dich einzuloggen:</p>
      <p><a href="${link}">${link}</a></p>
      <p>Der Link ist 15 Minuten gültig.</p>
      <p>Falls du keinen Login angefordert hast, kannst du diese Mail ignorieren.</p>
    `,
    text: `Login-Link (15 min gültig): ${link}`,
  });
  return { sent: true };
}

export async function consumeMagicToken(token: string): Promise<SessionPayload | null> {
  return verifyToken(token, "magic");
}

/** Pick a cookie Domain attribute so the session works across all subdomains
 * of the registrable parent (e.g. .mauch.rocks → studio.mauch.rocks AND
 * netnode.pages.mauch.rocks share the cookie). Returns undefined for
 * localhost / IPs, where browsers don't honor cross-subdomain cookies.
 */
export function deriveCookieDomain(hostname: string): string | undefined {
  if (!hostname || hostname === "localhost" || /^[\d.]+$/.test(hostname)) return undefined;
  // *.localhost (e.g. netnode.localhost) — keep scope to the current host.
  if (hostname.endsWith(".localhost")) return undefined;
  const parts = hostname.split(".");
  if (parts.length < 2) return undefined;
  return "." + parts.slice(-2).join(".");
}

export async function issueSessionCookie(
  payload: SessionPayload,
  opts: { secure?: boolean; domain?: string } = {},
): Promise<void> {
  const token = await signToken(payload, "session", SESSION_TTL_SEC);
  const c = await cookies();
  // Caller decides `secure` based on the actual request protocol — using
  // NODE_ENV here breaks local HTTPS-less Docker testing while the rest of
  // the app runs in production mode.
  const secure = opts.secure ?? process.env.NODE_ENV === "production";
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SEC,
    ...(opts.domain ? { domain: opts.domain } : {}),
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token, "session");
}

export async function clearSession(opts: { domain?: string } = {}): Promise<void> {
  const c = await cookies();
  // Browsers only delete a cookie when the clear-Set-Cookie matches the
  // original Domain attribute. Mirror what we set in issueSessionCookie.
  c.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    ...(opts.domain ? { domain: opts.domain } : {}),
  });
}

/** Authorisation helper: does this session payload allow editing the given slug? */
export function canEditSlug(session: SessionPayload | null, slug: string): boolean {
  if (!session) return false;
  if (session.master) return true;
  return session.slugs.includes(slug);
}
