import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const protectedPaths = ["/rooms", "/messages", "/ai-assistant", "/profile"];
const guestOnlyPaths = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname, search } = request.nextUrl;

  if (protectedPaths.some((path) => pathname.startsWith(path)) && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (guestOnlyPaths.some((path) => pathname.startsWith(path)) && token) {
    return NextResponse.redirect(new URL("/rooms", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/signup", "/rooms/:path*", "/messages/:path*", "/ai-assistant/:path*", "/profile/:path*"],
};
