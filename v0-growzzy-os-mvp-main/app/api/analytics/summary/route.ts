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
    const startDate =
      searchParams.get("start_date") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    const endDate = searchParams.get("end_date") || new Date().toISOString().split("T")[0]

    // Get analytics summary
    const { data: analytics, error } = await supabase
      .from("analytics")
      .select("impressions, clicks, conversions, spend, revenue")
      .eq("user_id", user.id)
      .gte("metric_date", startDate)
      .lte("metric_date", endDate)

    if (error) {
      console.error("[v0] Failed to fetch analytics:", error)
      return NextResponse.json({
        summary: {
          totalImpressions: 0,
          totalClicks: 0,
          totalConversions: 0,
          totalSpend: 0,
          totalRevenue: 0,
          ctr: 0,
          cpc: 0,
          roas: 0,
        },
      })
    }

    const totalImpressions = analytics?.reduce((sum, a) => sum + (a.impressions || 0), 0) || 0
    const totalClicks = analytics?.reduce((sum, a) => sum + (a.clicks || 0), 0) || 0
    const totalConversions = analytics?.reduce((sum, a) => sum + (a.conversions || 0), 0) || 0
    const totalSpend = analytics?.reduce((sum, a) => sum + (a.spend || 0), 0) || 0
    const totalRevenue = analytics?.reduce((sum, a) => sum + (a.revenue || 0), 0) || 0

    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0"
    const cpc = totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : "0"
    const roas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "0"

    return NextResponse.json({
      summary: {
        totalImpressions,
        totalClicks,
        totalConversions,
        totalSpend: totalSpend.toFixed(2),
        totalRevenue: totalRevenue.toFixed(2),
        ctr: Number.parseFloat(ctr),
        cpc: Number.parseFloat(cpc),
        roas: Number.parseFloat(roas),
      },
    })
  } catch (error) {
    console.error("[v0] Get analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
