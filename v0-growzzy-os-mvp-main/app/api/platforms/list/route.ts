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

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: connections, error } = await supabase
      .from("platform_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)

    if (error) {
      console.error("[v0] Failed to fetch connections:", error)
      return NextResponse.json({ connections: [] }, { status: 200 })
    }

    return NextResponse.json({
      connections: (connections || []).map((conn) => ({
        id: conn.id,
        platform: conn.platform,
        accountName: conn.account_name,
        accountId: conn.account_id,
        lastSynced: conn.last_synced_at,
        isActive: conn.is_active,
      })),
    })
  } catch (error) {
    console.error("[v0] List connections error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
