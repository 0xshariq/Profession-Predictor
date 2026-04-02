import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  // Check for guest cookie if no token exists
  const guestId = request.cookies.get("guestId")?.value
  const isGuest = !!guestId

  // Prevent already-authenticated users from accessing auth pages
  if (token || isGuest) {
    if (pathname === "/signIn" || pathname === "/signUp" || pathname === "/guest") {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }
  // else {
  //   // If user is not logged in (neither NextAuth nor guest), protect the home route
  //   if (pathname === "/") {
  //     return NextResponse.redirect(new URL("/signIn", request.url))
  //   }
  // }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/signIn", "/signUp", "/verify/:path*", "/guest"],
}

