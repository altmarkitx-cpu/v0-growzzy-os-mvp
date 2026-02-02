import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const platform = searchParams.get("platform")

    let query = supabase
      .from("campaigns")
      .select(`
        id,
        name,
        status,
        platform,
        budget,
        spend,
        impressions,
        clicks,
        conversions,
        ctr,
        created_at,
        updated_at
      `)
      .eq("user_id", user.id)

    if (status) query = query.eq("status", status)
    if (platform) query = query.eq("platform", platform)

    const { data: campaigns, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Failed to fetch campaigns:", error)
      return NextResponse.json({ campaigns: [] })
    }

    return NextResponse.json({
      campaigns: campaigns || [],
      total: campaigns?.length || 0,
    })
  } catch (error) {
    console.error("[v0] Get campaigns error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
