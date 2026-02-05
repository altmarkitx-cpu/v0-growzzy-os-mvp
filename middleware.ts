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

  // Check for Supabase session cookie (sb-<project>-access-token)
  const hasSession = request.cookies.getAll().some(({ name }: { name: string }) =>
    name.startsWith("sb-") && name.endsWith("-access-token")
  )

  if (!hasSession) {
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
