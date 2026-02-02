import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { PlatformAPI } from "@/lib/platform-apis"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { userId, platforms } = await request.json()

    console.log("[v0] Starting real data sync for platforms:", platforms)

    for (const platform of platforms) {
      // Get user's credentials
      const { data: credentials, error: credsError } = await supabase
        .from("platform_credentials")
        .select("*")
        .eq("user_id", userId)
        .eq("platform", platform)
        .single()

      if (credsError || !credentials) continue

      let campaigns: any[] = []

      // Fetch from platform
      switch (platform) {
        case "meta":
          const metaData = await PlatformAPI.metaGetCampaigns(
            credentials.access_token,
            credentials.account_data.ad_account_id,
          )
          campaigns = metaData.data || []
          break

        case "google_ads":
          const googleData = await PlatformAPI.googleGetCampaigns(
            credentials.account_data.developer_token,
            credentials.account_data.customer_id,
          )
          campaigns = googleData.results || []
          break

        case "linkedin":
          const linkedinData = await PlatformAPI.linkedInGetCampaigns(credentials.access_token)
          campaigns = linkedinData.elements || []
          break

        case "shopify":
          const shopifyData = await PlatformAPI.shopifyGetCampaigns(
            credentials.access_token,
            credentials.account_data.shop_domain,
          )
          campaigns = shopifyData.data?.marketingActivities?.edges?.map((e: any) => e.node) || []
          break
      }

      // Store/update in database
      for (const campaign of campaigns) {
        await supabase.from("campaigns").upsert({
          user_id: userId,
          platform,
          platform_campaign_id: campaign.id,
          name: campaign.name,
          status: campaign.status?.toLowerCase() || "unknown",
          budget: campaign.budget || campaign.dailyBudget?.amount || 0,
          spend: campaign.spent || 0,
          impressions: campaign.insights?.impressions || 0,
          clicks: campaign.insights?.clicks || 0,
          updated_at: new Date().toISOString(),
        })
      }

      console.log(`[v0] Synced ${campaigns.length} campaigns from ${platform}`)
    }

    return NextResponse.json({ success: true, message: "Data synced successfully" })
  } catch (error: any) {
    console.error("[v0] Sync error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
