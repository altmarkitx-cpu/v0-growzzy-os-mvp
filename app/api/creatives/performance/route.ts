import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet: any[]) => {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options)
            )
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

    const { searchParams } = new URL(req.url)
    const timeRange = searchParams.get("timeRange") || "7d"

    // Mock performance data - replace with actual database query
    const creatives = [
      {
        id: "1",
        name: "Summer Sale Banner",
        platform: "facebook",
        status: "active",
        performance: {
          impressions: 15420,
          clicks: 892,
          ctr: "5.78%",
          conversions: 45,
          spend: 234.50,
          trend: "up"
        },
        createdAt: new Date().toISOString()
      },
      {
        id: "2",
        name: "Product Launch Video",
        platform: "instagram",
        status: "active",
        performance: {
          impressions: 8750,
          clicks: 412,
          ctr: "4.71%",
          conversions: 28,
          spend: 156.75,
          trend: "up"
        },
        createdAt: new Date().toISOString()
      },
      {
        id: "3",
        name: "Google Search Ad",
        platform: "google",
        status: "paused",
        performance: {
          impressions: 23100,
          clicks: 1155,
          ctr: "5.00%",
          conversions: 67,
          spend: 445.25,
          trend: "down"
        },
        createdAt: new Date().toISOString()
      }
    ]

    return NextResponse.json({ creatives })
  } catch (error) {
    console.error("[v0] Get creative performance error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
