import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

    // Check Supabase connection
    const { error } = await supabase.from("users").select("count", { count: "exact" }).limit(1)

    if (error) {
      console.error("[v0] Health check failed:", error)
      return NextResponse.json({ status: "unhealthy", error: error.message }, { status: 503 })
    }

    // Check required environment variables
    const requiredEnv = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "OPENAI_API_KEY"]

    const missingEnv = requiredEnv.filter((env) => !process.env[env])

    if (missingEnv.length > 0) {
      return NextResponse.json(
        { status: "unhealthy", error: `Missing environment variables: ${missingEnv.join(", ")}` },
        { status: 503 },
      )
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  } catch (error) {
    console.error("[v0] Health check error:", error)
    return NextResponse.json({ status: "unhealthy", error: "Internal error" }, { status: 503 })
  }
}
