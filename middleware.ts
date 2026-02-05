import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // List of protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/connections", "/reports", "/automations", "/campaigns"]

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Get auth cookie - check for Supabase session
  const sessionCookie = request.cookies.get("sb-access-token")?.value || 
                         request.cookies.get("sb-refresh-token")?.value

  if (!sessionCookie) {
    // Redirect to signin if not authenticated
    const loginUrl = new URL("/auth", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/connections/:path*", "/reports/:path*", "/automations/:path*", "/campaigns/:path*"],
}
