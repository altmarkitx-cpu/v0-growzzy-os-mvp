import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(req: Request, { params }: { params: { sessionId: string } }) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options) {
          cookieStore.delete(name)
        },
      },
    },
  )

  try {
    const { data: connection } = await supabase
      .from("platform_connections")
      .select("*")
      .eq("session_id", params.sessionId)
      .single()

    if (connection && connection.access_token) {
      return NextResponse.json({
        connected: true,
        platform: connection.platform,
        accountName: connection.account_info?.name || "Unknown Account",
      })
    }

    return NextResponse.json({
      connected: false,
      error: "Connection not yet established",
    })
  } catch (error) {
    console.error("[v0] Error checking OAuth status:", error)
    return NextResponse.json({
      connected: false,
      error: "Failed to check connection status",
    })
  }
}
