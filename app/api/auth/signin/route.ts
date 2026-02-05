import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

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
            return req.headers.get("cookie")?.split("; ").map((c) => {
              const [name, ...value] = c.split("=")
              return { name, value: value.join("=") }
            }) || []
          },
          setAll() {
            // We handle cookies manually below
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

    // Extract project ref from Supabase URL
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] || ""
    
    // Create response with cookies
    const response = NextResponse.json({
      success: true,
      message: "Signed in successfully",
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    })
    
    // Set Supabase auth cookies with proper names
    const cookieOptions = {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax" as const,
    }
    
    response.cookies.set(`sb-${projectRef}-access-token`, data.session.access_token, cookieOptions)
    response.cookies.set(`sb-${projectRef}-refresh-token`, data.session.refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    })
    
    return response
  } catch (error: any) {
    console.error("[v0] Signin error:", error)
    return NextResponse.json({ error: error.message || "Sign in failed" }, { status: 500 })
  }
}
