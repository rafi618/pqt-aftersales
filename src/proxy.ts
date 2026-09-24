import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, expectedToken } from "@/lib/auth";

// Public paths: share-link pages and their APIs, and the login page itself.
const PUBLIC = [/^\/s\//, /^\/api\/s\//, /^\/login/, /^\/api\/login/];

export async function proxy(request: NextRequest) {
  const expected = await expectedToken();
  if (!expected) return NextResponse.next(); // no password set → open (demo mode)
  const { pathname } = request.nextUrl;
  if (PUBLIC.some((re) => re.test(pathname))) return NextResponse.next();
  if (request.cookies.get(AUTH_COOKIE)?.value === expected) return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
