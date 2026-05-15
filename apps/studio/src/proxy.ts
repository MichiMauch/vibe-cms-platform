import { NextResponse, type NextRequest } from "next/server";

const DEFAULT_LOCALE = "de";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const first = pathname.split("/")[1] ?? "";

  if (/^[a-z]{2}(-[A-Z]{2})?$/.test(first)) {
    // In dev, mirror ?site=<slug> into a request header so layouts can
    // resolve the tenant (layouts don't receive searchParams in App Router).
    if (process.env.NODE_ENV !== "production") {
      const site = req.nextUrl.searchParams.get("site");
      if (site) {
        const headers = new Headers(req.headers);
        headers.set("x-vibe-site", site);
        return NextResponse.next({ request: { headers } });
      }
    }
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next|admin|.*\\.[\\w]+).*)"],
};
