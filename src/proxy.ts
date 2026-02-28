import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/auth", "/api/auth/login", "/api/auth/register", "/api/auth/me"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const hasSession = Boolean(req.cookies.get("st_session")?.value);

  if (!hasSession && !isPublic && !pathname.startsWith("/_next") && pathname !== "/favicon.ico") {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  if (hasSession && pathname === "/auth") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ["/((?!.*\\..*|_next).*)"] };
