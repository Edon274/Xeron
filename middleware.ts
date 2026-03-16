import { NextRequest, NextResponse } from "next/server";
const AUTH_COOKIE_NAME = "xeron_session";

const protectedPaths = [
  "/dashboard",
  "/contracts",
  "/subscriptions",
  "/invoices",
  "/documents",
  "/insights",
  "/settings",
  "/ai",
];

const authPages = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const hasSession = Boolean(token);

  const isProtected = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isAuthPage = authPages.includes(pathname);

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|branding).*)"],
};
