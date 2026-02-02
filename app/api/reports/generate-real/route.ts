import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
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

  try {
    const { startDate, endDate, title } = await request.json()

    // Fetch campaigns
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startDate)
      .lte("created_at", endDate)

    // Calculate aggregated metrics
    let totalSpend = 0
    let totalRevenue = 0
    let totalConversions = 0

    campaigns?.forEach((campaign) => {
      totalSpend += campaign.spend || 0
      totalRevenue += campaign.revenue || 0
      totalConversions += campaign.conversions || 0
    })

    const roas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "0"

    // Sort campaigns by ROAS
    const topCampaigns = (campaigns || []).sort((a, b) => (b.roas || 0) - (a.roas || 0)).slice(0, 5)

    const reportData = {
      title: title || `Performance Report ${startDate} to ${endDate}`,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      totalSpend: totalSpend.toFixed(2),
      totalRevenue: totalRevenue.toFixed(2),
      totalConversions,
      roas,
      ctr:
        campaigns?.length > 0
          ? ((campaigns.reduce((a, b) => a + (b.ctr || 0), 0) / campaigns.length) * 100).toFixed(2)
          : "0",
      cpm:
        campaigns?.length > 0 ? (campaigns.reduce((a, b) => a + (b.cpm || 0), 0) / campaigns.length).toFixed(2) : "0",
      platforms: [...new Set(campaigns?.map((c) => c.platform) || [])].map((platform) => {
        const platformCampaigns = campaigns?.filter((c) => c.platform === platform) || []
        return {
          name: platform?.toUpperCase(),
          campaigns: platformCampaigns.length,
          spend: platformCampaigns.reduce((a, b) => a + (b.spend || 0), 0).toFixed(2),
          roas: (
            platformCampaigns.reduce((a, b) => a + (b.revenue || 0), 0) /
              platformCampaigns.reduce((a, b) => a + (b.spend || 0), 0) || 0
          ).toFixed(2),
        }
      }),
      topCampaigns: topCampaigns.map((c) => ({
        name: c.name,
        platform: c.platform,
        spend: c.spend?.toFixed(2),
        revenue: c.revenue?.toFixed(2),
        roas: c.roas?.toFixed(2),
        conversions: c.conversions,
      })),
      generatedAt: new Date().toISOString(),
    }

    // Save report to database
    const { data: savedReport, error: saveError } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        title: reportData.title,
        type: "performance",
        metrics: reportData,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (saveError) {
      console.error("[v0] Error saving report:", saveError)
      return NextResponse.json({ error: "Failed to save report" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      report: reportData,
      reportId: savedReport?.id,
    })
  } catch (error) {
    console.error("[v0] Report generation error:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
