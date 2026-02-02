import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generateReportInsights, generateRecommendations, analyzePsychologicalInsights, type CampaignMetrics } from "@/lib/report-analysis"

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

    const { dateRange = "last7days", platforms } = await request.json()

    console.log("[v0] Generating AI-powered report for user:", user.id)

    // Calculate date range
    const endDate = new Date()
    let startDate = new Date()

    switch (dateRange) {
      case "last7days":
        startDate.setDate(startDate.getDate() - 7)
        break
      case "last30days":
        startDate.setDate(startDate.getDate() - 30)
        break
      case "last90days":
        startDate.setDate(startDate.getDate() - 90)
        break
      case "thisMonth":
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
        break
      case "lastMonth":
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1)
        endDate.setDate(0)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    // Get campaigns data
    let query = supabase
      .from("campaigns")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())

    if (platforms && platforms.length > 0) {
      query = query.in("platform", platforms)
    }

    const { data: campaigns, error: campaignError } = await query

    if (campaignError) throw campaignError

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json(
        { error: "No campaign data found for the selected period" },
        { status: 400 },
      )
    }

    // Calculate metrics
    const totalSpend = campaigns.reduce((sum: number, c: any) => sum + (c.spend || 0), 0)
    const totalRevenue = campaigns.reduce((sum: number, c: any) => sum + (c.revenue || 0), 0)
    const totalImpressions = campaigns.reduce((sum: number, c: any) => sum + (c.impressions || 0), 0)
    const totalClicks = campaigns.reduce((sum: number, c: any) => sum + (c.clicks || 0), 0)
    const totalConversions = campaigns.reduce((sum: number, c: any) => sum + (c.conversions || 0), 0)

    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0

    // Group by platform
    const platformBreakdown = campaigns.reduce(
      (acc: any, c: any) => {
        if (!acc[c.platform]) {
          acc[c.platform] = { spend: 0, revenue: 0, count: 0, roas: 0 }
        }
        acc[c.platform].spend += c.spend || 0
        acc[c.platform].revenue += c.revenue || 0
        acc[c.platform].count += 1
        return acc
      },
      {},
    )

    // Calculate platform ROAS
    Object.keys(platformBreakdown).forEach((platform) => {
      const platformData = platformBreakdown[platform]
      platformData.roas = platformData.spend > 0 ? platformData.revenue / platformData.spend : 0
    })

    const metrics: CampaignMetrics = {
      totalSpend,
      totalRevenue,
      roas,
      totalImpressions,
      totalClicks,
      totalConversions,
      ctr,
      cpc,
      campaigns: campaigns.map((c: any) => ({
        id: c.id,
        name: c.name,
        platform: c.platform,
        spend: c.spend || 0,
        revenue: c.revenue || 0,
        roas: c.spend > 0 ? c.revenue / c.spend : 0,
        conversions: c.conversions || 0,
      })),
      platformBreakdown,
    }

    console.log("[v0] Metrics calculated:", { totalSpend, totalRevenue, roas: roas.toFixed(2) })

    // Generate AI insights using Claude
    console.log("[v0] Generating structured AI insights...")
    const insights = await generateReportInsights(metrics)

    // Generate recommendations
    const recommendations = await generateRecommendations(metrics, insights)

    // Analyze psychological insights
    const psychInsights = await analyzePsychologicalInsights(metrics)

    // Save report to database
    const reportTitle =
      dateRange === "last7days"
        ? "Weekly Report"
        : dateRange === "last30days"
          ? "Monthly Report"
          : "Performance Report"

    const { data: report, error } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        title: `${reportTitle} - ${new Date().toLocaleDateString()}`,
        type: "ai_analysis",
        platform: platforms?.join(",") || "all",
        period_start: startDate.toISOString().split("T")[0],
        period_end: endDate.toISOString().split("T")[0],
        metrics: JSON.stringify(metrics),
        insights: JSON.stringify(insights),
        recommendations,
        status: "completed",
        generated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    console.log("[v0] Report saved:", report.id)

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        title: report.title,
        metrics,
        insights,
        recommendations,
        psychologicalInsights: psychInsights,
        generatedAt: report.generated_at,
      },
    })
  } catch (error: any) {
    console.error("[v0] Error generating AI report:", error)
    return NextResponse.json({ error: error.message || "Failed to generate report" }, { status: 500 })
  }
}
