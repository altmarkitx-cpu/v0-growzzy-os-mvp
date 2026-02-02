import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { syncAllPlatforms } from "@/lib/platform-sync"

export async function POST(request: NextRequest) {
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

    // Trigger sync
    const result = await syncAllPlatforms(user.id)

    return NextResponse.json({
      success: true,
      synced: result.synced,
      campaigns: result.campaigns,
    })
  } catch (error: any) {
    console.error("[v0] Sync error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
