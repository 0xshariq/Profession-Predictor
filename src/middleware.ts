import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  // Check for guest cookie if no token exists
  const guestId = request.cookies.get("guestId")?.value
  const isGuest = !!guestId

  // Check if user is already logged in (via NextAuth or as guest)
  if (token || isGuest) {
    const isOAuthUser = token && ((token.provider as string) === "google" || (token.provider as string) === "github")
    const isNormalUser = token && !isOAuthUser && !isGuest

    // Log the user type for debugging
    console.log({
      isGuest,
      isOAuthUser,
      isNormalUser,
      provider: token?.provider,
    })

    // Prevent multiple logins
    if (pathname === "/signIn" || pathname === "/signUp" || pathname === "/guest") {
      // Redirect all authenticated users to homepage
      return NextResponse.redirect(new URL("/", request.url))
    } 

    // You can add specific redirects based on user type if needed
    // For example:
    if (isNormalUser && pathname === "/signIn") {
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

