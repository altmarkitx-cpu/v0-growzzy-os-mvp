import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Not admin" }, { status: 403 })
    }

    // Return current environment variables (for display only)
    return NextResponse.json({
      META_APP_ID: process.env.META_APP_ID || "",
      META_APP_SECRET: process.env.META_APP_SECRET ? "••••••••" : "",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "••••••••" : "",
      LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID || "",
      LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET ? "••••••••" : "",
      TIKTOK_CLIENT_ID: process.env.TIKTOK_CLIENT_ID || "",
      TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET ? "••••••••" : "",
    })
  } catch (error) {
    console.error("[v0] Get credentials error:", error)
    return NextResponse.json({ error: "Failed to get credentials" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Not admin" }, { status: 403 })
    }

    const credentials = await request.json()

    // Note: In production, credentials should be stored securely in a vault/KMS
    // For now, we'll store them in a secure database table
    const { error } = await supabase.from("oauth_credentials").upsert(
      {
        platform: "global",
        credentials: credentials,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "platform" },
    )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Save credentials error:", error)
    return NextResponse.json({ error: "Failed to save credentials" }, { status: 500 })
  }
}
