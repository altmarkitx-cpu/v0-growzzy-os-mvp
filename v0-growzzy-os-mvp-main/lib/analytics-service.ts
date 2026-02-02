import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface MetricData {
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
}

// Fetch real data from Meta Graph API
export async function fetchMetaCampaignMetrics(accessToken: string, accountId: string): Promise<MetricData> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}?fields=insights.date_preset(last_30d){spend,impressions,clicks,actions}&access_token=${accessToken}`,
    )
    const data = await response.json()
    const insights = data.insights?.data?.[0] || {}

    return {
      spend: Number.parseFloat(insights.spend || "0"),
      impressions: Number.parseInt(insights.impressions || "0"),
      clicks: Number.parseInt(insights.clicks || "0"),
      conversions: Number.parseInt(
        insights.actions?.filter((a: any) => a.action_type === "offsite_conversion.fb_pixel_purchase")[0]?.value || "0",
      ),
      revenue: 0, // Would need pixel tracking for this
    }
  } catch (error) {
    console.error("[v0] Error fetching Meta metrics:", error)
    return { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
  }
}

// Fetch real data from Google Ads API
export async function fetchGoogleCampaignMetrics(accessToken: string, customerId: string): Promise<MetricData> {
  try {
    const response = await fetch(
      `https://googleads.googleapis.com/v14/customers/${customerId}/googleAdsService:searchStream`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        },
        body: JSON.stringify({
          query: `
          SELECT campaign.name, metrics.cost_micros, metrics.impressions, 
                 metrics.clicks, metrics.conversions, metrics.conversions_value
          FROM campaign
          WHERE segments.date DURING LAST_30_DAYS
        `,
        }),
      },
    )

    const results = await response.json()
    let totalSpend = 0
    let totalImpressions = 0
    let totalClicks = 0
    let totalConversions = 0
    let totalRevenue = 0

    results.results?.forEach((result: any) => {
      const metrics = result.campaign?.metrics || {}
      totalSpend += (metrics.cost_micros || 0) / 1000000
      totalImpressions += metrics.impressions || 0
      totalClicks += metrics.clicks || 0
      totalConversions += metrics.conversions || 0
      totalRevenue += metrics.conversions_value || 0
    })

    return {
      spend: totalSpend,
      impressions: totalImpressions,
      clicks: totalClicks,
      conversions: totalConversions,
      revenue: totalRevenue,
    }
  } catch (error) {
    console.error("[v0] Error fetching Google metrics:", error)
    return { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
  }
}

// Aggregate metrics from all platforms
export async function aggregateAllMetrics(userId: string) {
  try {
    // Get all platform credentials
    const { data: credentials } = await supabaseAdmin
      .from("platform_credentials")
      .select("*")
      .eq("user_id", userId)
      .eq("is_connected", true)

    if (!credentials || credentials.length === 0) {
      return { totalSpend: 0, totalRevenue: 0, roas: 0, totalConversions: 0, ctr: 0, cpm: 0, cpc: 0 }
    }

    const aggregated = {
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
    }

    // Fetch metrics from each connected platform
    for (const cred of credentials) {
      let platformMetrics: MetricData

      if (cred.platform === "meta") {
        platformMetrics = await fetchMetaCampaignMetrics(cred.access_token, cred.account_id)
      } else if (cred.platform === "google") {
        platformMetrics = await fetchGoogleCampaignMetrics(cred.access_token, cred.account_id)
      } else {
        continue
      }

      aggregated.spend += platformMetrics.spend
      aggregated.impressions += platformMetrics.impressions
      aggregated.clicks += platformMetrics.clicks
      aggregated.conversions += platformMetrics.conversions
      aggregated.revenue += platformMetrics.revenue
    }

    // Calculate derived metrics
    const ctr = aggregated.impressions > 0 ? ((aggregated.clicks / aggregated.impressions) * 100).toFixed(2) : "0"
    const cpm = aggregated.impressions > 0 ? (aggregated.spend / (aggregated.impressions / 1000)).toFixed(2) : "0"
    const cpc = aggregated.clicks > 0 ? (aggregated.spend / aggregated.clicks).toFixed(2) : "0"
    const roas = aggregated.spend > 0 ? (aggregated.revenue / aggregated.spend).toFixed(2) : "0"

    return {
      totalSpend: aggregated.spend.toFixed(2),
      totalRevenue: aggregated.revenue.toFixed(2),
      totalConversions: aggregated.conversions,
      ctr: Number.parseFloat(ctr),
      cpm: Number.parseFloat(cpm),
      cpc: Number.parseFloat(cpc),
      roas: Number.parseFloat(roas),
    }
  } catch (error) {
    console.error("[v0] Error aggregating metrics:", error)
    return { totalSpend: 0, totalRevenue: 0, roas: 0, totalConversions: 0, ctr: 0, cpm: 0, cpc: 0 }
  }
}
