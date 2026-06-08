import { type NextRequest, NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase-env";
import { updateSession } from "@/lib/supabase-middleware";

const protectedPrefixes = [
  "/dashboard",
  "/discussion",
  "/insights",
  "/workspace",
  "/archive",
];

const authRoutes = ["/login", "/signup"];

function isProtected(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAuthRoute(pathname: string) {
  return authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isSupabaseConfigured()) {
    // Allow login/signup when env is not set; only block protected app routes
    if (isProtected(pathname)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);

  if (!user && isProtected(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/discussion",
    "/discussion/:path*",
    "/insights",
    "/insights/:path*",
    "/workspace",
    "/workspace/:path*",
    "/archive",
    "/archive/:path*",
    "/login",
    "/signup",
  ],
};
