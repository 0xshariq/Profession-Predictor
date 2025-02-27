import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // If user is logged in as a guest, redirect to homepage
  if (token && token.isGuest) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Protect dashboard route - redirect to login if not authenticated
//  if (!token && pathname === "/") {
  //  return NextResponse.redirect(new URL("/signIn", request.url));
//  }

  // Redirect authenticated users away from auth pages
  if (token && (pathname === "/signIn" || pathname === "/signUp" || pathname.startsWith("/verify"))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/signIn", "/signUp", "/verify/:path*"],
};
