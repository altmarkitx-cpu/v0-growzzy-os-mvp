import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
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

    const { dateFrom, dateTo } = await request.json()

    console.log("[v0] Generating PDF report for", user.id)

    // Get campaigns data
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo)

    // Get leads data
    const { data: leads } = await supabase.from("leads").select("*").eq("user_id", user.id)

    // Calculate metrics
    const totalSpend = campaigns?.reduce((sum, c) => sum + (c.spend || 0), 0) || 0
    const totalRevenue = campaigns?.reduce((sum, c) => sum + (c.revenue || 0), 0) || 0
    const roas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "0"

    // Create report data
    const reportData = {
      title: `Marketing Performance Report`,
      dateRange: `${dateFrom} to ${dateTo}`,
      generatedAt: new Date().toISOString(),
      metrics: {
        totalSpend: totalSpend.toFixed(2),
        totalRevenue: totalRevenue.toFixed(2),
        roas,
        campaigns: campaigns?.length || 0,
        leads: leads?.length || 0,
      },
      campaigns: campaigns || [],
      topPerformers: (campaigns || []).sort((a, b) => (b.roas || 0) - (a.roas || 0)).slice(0, 5),
    }

    console.log("[v0] Report data prepared:", reportData.metrics)

    // Save report
    await supabase.from("reports").insert({
      user_id: user.id,
      title: reportData.title,
      type: "performance",
      metrics: reportData.metrics,
      generated_at: new Date().toISOString(),
      status: "completed",
    })

    return NextResponse.json({
      success: true,
      report: reportData,
      downloadUrl: `/api/reports/${reportData.dateRange}/download`,
    })
  } catch (error: any) {
    console.error("[v0] Error generating report:", error)
    return NextResponse.json({ error: error.message || "Failed to generate report" }, { status: 500 })
  }
}
