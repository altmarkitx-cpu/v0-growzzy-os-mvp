import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    // Create response object that we'll attach cookies to
    let response = NextResponse.json({})

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
          setAll(cookiesToSet) {
            // Let Supabase set the cookies on our response
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
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

    // Create final response with user data
    const finalResponse = NextResponse.json({
      success: true,
      message: "Signed in successfully",
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    })

    // Copy all cookies from the Supabase response to the final response
    response.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        path: cookie.path,
        maxAge: cookie.maxAge,
        sameSite: cookie.sameSite,
        secure: cookie.secure,
        domain: cookie.domain,
        expires: cookie.expires,
      })
    })

    console.log("[v0] Signin - Supabase set cookies:", response.cookies.getAll().map(c => c.name))

    return finalResponse
  } catch (error: any) {
    console.error("[v0] Signin error:", error)
    return NextResponse.json({ error: error.message || "Sign in failed" }, { status: 500 })
  }
}
