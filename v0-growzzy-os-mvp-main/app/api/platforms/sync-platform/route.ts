import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  try {
    const { platform, userId } = await request.json()

    if (!platform || !userId) {
      return NextResponse.json({ error: "Platform and userId required" }, { status: 400 })
    }

    // Get platform credentials
    const { data: creds } = await supabaseAdmin
      .from("platform_credentials")
      .select("*")
      .eq("user_id", userId)
      .eq("platform", platform)
      .single()

    if (!creds) {
      return NextResponse.json({ error: "Platform not connected" }, { status: 400 })
    }

    let campaignData: any[] = []

    if (platform === "meta") {
      // Fetch campaigns from Meta
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${creds.account_id}/campaigns?fields=id,name,status,insights.date_preset(last_30d){spend,impressions,clicks,actions}&access_token=${creds.access_token}`,
      )
      const data = await response.json()

      campaignData = (data.data || []).map((campaign: any) => ({
        platform: "meta",
        platform_campaign_id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        spend: Number.parseFloat(campaign.insights?.data?.[0]?.spend || "0"),
        impressions: Number.parseInt(campaign.insights?.data?.[0]?.impressions || "0"),
        clicks: Number.parseInt(campaign.insights?.data?.[0]?.clicks || "0"),
        conversions: Number.parseInt(
          campaign.insights?.data?.[0]?.actions?.find(
            (a: any) => a.action_type === "offsite_conversion.fb_pixel_purchase",
          )?.value || "0",
        ),
      }))
    } else if (platform === "google") {
      // Fetch campaigns from Google Ads
      const response = await fetch(
        `https://googleads.googleapis.com/v14/customers/${creds.account_id}/campaigns?access_token=${creds.access_token}`,
      )
      const data = await response.json()
      campaignData = data.results || []
    }

    // Sync campaigns to database
    for (const campaign of campaignData) {
      // Calculate ROAS
      const roas = campaign.spend > 0 ? campaign.revenue / campaign.spend : 0
      const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0
      const cpm = campaign.impressions > 0 ? campaign.spend / (campaign.impressions / 1000) : 0

      const { error } = await supabaseAdmin.from("campaigns").upsert(
        {
          user_id: userId,
          platform: campaign.platform || platform,
          platform_campaign_id: campaign.platform_campaign_id || campaign.id,
          name: campaign.name,
          status: campaign.status,
          spend: campaign.spend,
          revenue: campaign.revenue || 0,
          roas: roas,
          conversions: campaign.conversions || 0,
          ctr: ctr,
          cpm: cpm,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "platform_campaign_id",
        },
      )

      if (error) console.error("[v0] Sync error:", error)
    }

    // Update last sync time
    await supabaseAdmin
      .from("platform_credentials")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", creds.id)

    return NextResponse.json({
      success: true,
      campaignsSync: campaignData.length,
      platform,
    })
  } catch (error) {
    console.error("[v0] Sync error:", error)
    return NextResponse.json({ error: "Sync failed" }, { status: 500 })
  }
}
