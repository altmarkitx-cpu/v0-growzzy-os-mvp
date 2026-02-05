import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookieHeader = req.headers.get("cookie")
            if (!cookieHeader) return []
            return cookieHeader.split("; ").map((c) => {
              const [name, ...value] = c.split("=")
              return { name, value: value.join("=") }
            })
          },
          setAll() {
            // We handle cookies manually after signin
          },
        },
      },
    )

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.session || !data.user) {
      return NextResponse.json({ error: "Invalid login credentials" }, { status: 401 })
    }

    console.log("[v0] Signin - Session data:", {
      hasSession: !!data.session,
      hasAccessToken: !!data.session?.access_token,
      hasRefreshToken: !!data.session?.refresh_token,
      accessTokenLength: data.session?.access_token?.length,
      refreshTokenLength: data.session?.refresh_token?.length
    })
    
    // Extract project ref from Supabase URL
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] || ""
    console.log("[v0] Signin - Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("[v0] Signin - Extracted project ref:", projectRef)
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Signed in successfully",
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    })
    
    // Manually set the Supabase session cookies
    const cookieOptions = {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
    }
    
    // Set the access token cookie
    response.cookies.set(`sb-${projectRef}-access-token`, data.session.access_token, cookieOptions)
    
    // Set the refresh token cookie with longer expiry
    response.cookies.set(`sb-${projectRef}-refresh-token`, data.session.refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    })
    
    console.log("[v0] Signin - Manually set cookies for project:", projectRef)
    console.log("[v0] Signin - Access token set:", !!data.session.access_token)
    console.log("[v0] Signin - Refresh token set:", !!data.session.refresh_token)

    return response
  } catch (error: any) {
    console.error("[v0] Signin error:", error)
    return NextResponse.json({ error: error.message || "Sign in failed" }, { status: 500 })
  }
}
