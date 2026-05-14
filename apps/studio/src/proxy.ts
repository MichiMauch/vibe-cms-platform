import { NextResponse, type NextRequest } from "next/server";

const DEFAULT_LOCALE = "de";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const first = pathname.split("/")[1] ?? "";

  if (/^[a-z]{2}(-[A-Z]{2})?$/.test(first)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next|admin|.*\\.[\\w]+).*)"],
};
