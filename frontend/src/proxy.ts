import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Spring session cookie set by the backend on localhost:8080.
  // Cookies are domain-scoped (not port-scoped), so the browser sends
  // the session cookie to localhost:3000 as well, making it visible here.
  const hasSession =
    request.cookies.has("BDSPM_SESSION") || request.cookies.has("JSESSIONID");

  if (!PUBLIC_PATHS.includes(pathname) && !hasSession) {
    const loginUrl = new URL("/", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
