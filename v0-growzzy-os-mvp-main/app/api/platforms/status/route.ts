import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: connections, error } = await supabase
      .from("platform_connections")
      .select("platform, account_info")
      .eq("user_id", user?.id || "demo-user")

    if (error && error.code !== "PGRST116") throw error

    const connected = (connections || []).map((conn: any) => ({
      platform: conn.platform,
      accountName: conn.account_info?.name || "Connected",
    }))

    return NextResponse.json({
      connected,
    })
  } catch (error: any) {
    console.error("[v0] Error checking platform status:", error)
    return NextResponse.json({ connected: [] }, { status: 500 })
  }
}
