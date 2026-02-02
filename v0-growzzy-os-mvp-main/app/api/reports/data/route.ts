import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  try {
    const { dateFrom, dateTo } = await req.json()
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

    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select("*, campaign_metrics(*)")
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo)

    if (error) throw error

    let totalSpend = 0
    let totalRevenue = 0
    let totalConversions = 0
    let totalClicks = 0
    let totalImpressions = 0

    campaigns.forEach((campaign: any) => {
      if (campaign.campaign_metrics && Array.isArray(campaign.campaign_metrics)) {
        campaign.campaign_metrics.forEach((metric: any) => {
          totalSpend += metric.spend || 0
          totalRevenue += metric.revenue || 0
          totalConversions += metric.conversions || 0
          totalClicks += metric.clicks || 0
          totalImpressions += metric.impressions || 0
        })
      }
    })

    const roas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "0.00"
    const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00"

    const platformData: Record<string, any> = {}
    campaigns.forEach((campaign: any) => {
      const platform = campaign.platform || "Unknown"
      if (!platformData[platform]) {
        platformData[platform] = {
          name: platform,
          spend: 0,
          revenue: 0,
          conversions: 0,
        }
      }
      if (campaign.campaign_metrics && Array.isArray(campaign.campaign_metrics)) {
        campaign.campaign_metrics.forEach((metric: any) => {
          platformData[platform].spend += metric.spend || 0
          platformData[platform].revenue += metric.revenue || 0
          platformData[platform].conversions += metric.conversions || 0
        })
      }
    })

    const platforms = Object.values(platformData).map((p: any) => ({
      ...p,
      roas: p.spend > 0 ? (p.revenue / p.spend).toFixed(2) : "0.00",
    }))

    const topCampaigns = campaigns
      .map((c: any) => {
        let spend = 0
        let revenue = 0
        if (c.campaign_metrics && Array.isArray(c.campaign_metrics)) {
          c.campaign_metrics.forEach((m: any) => {
            spend += m.spend || 0
            revenue += m.revenue || 0
          })
        }
        return {
          name: c.name,
          spend,
          revenue,
          roas: spend > 0 ? (revenue / spend).toFixed(2) : "0.00",
        }
      })
      .sort((a, b) => Number.parseFloat(b.roas) - Number.parseFloat(a.roas))

    return NextResponse.json({
      dateFrom,
      dateTo,
      totalSpend: Number.parseFloat(totalSpend.toFixed(2)),
      totalRevenue: Number.parseFloat(totalRevenue.toFixed(2)),
      roas,
      conversions: totalConversions,
      avgCTR,
      platforms,
      topCampaigns,
    })
  } catch (error: any) {
    console.error("[v0] Error fetching report data:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
