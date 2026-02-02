import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { PlatformAPI } from "@/lib/platform-apis"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { platform, campaignData, userId } = await request.json()

    console.log("[v0] Creating real campaign on", platform)

    // Get user's platform credentials
    const { data: credentials, error: credsError } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("user_id", userId)
      .eq("platform", platform)
      .single()

    if (credsError || !credentials) {
      return NextResponse.json({ error: "Platform not connected" }, { status: 400 })
    }

    // Create campaign on actual platform
    let campaignResult: any

    switch (platform) {
      case "meta":
        campaignResult = await PlatformAPI.metaCreateCampaign(
          credentials.access_token,
          credentials.account_data.ad_account_id,
          campaignData,
        )
        break

      case "google_ads":
        campaignResult = await PlatformAPI.googleCreateCampaign(
          credentials.account_data.developer_token,
          credentials.account_data.customer_id,
          campaignData,
        )
        break

      case "linkedin":
        campaignResult = await PlatformAPI.linkedInCreateCampaign(credentials.access_token, campaignData)
        break

      case "shopify":
        campaignResult = await PlatformAPI.shopifyCreateCampaign(
          credentials.access_token,
          credentials.account_data.shop_domain,
          campaignData,
        )
        break

      default:
        return NextResponse.json({ error: "Unknown platform" }, { status: 400 })
    }

    // Store in database
    await supabase.from("campaigns").insert({
      user_id: userId,
      platform,
      platform_campaign_id: campaignResult.id,
      name: campaignData.name,
      status: "paused",
      budget: campaignData.budget,
      metadata: campaignData,
      created_at: new Date().toISOString(),
    })

    console.log("[v0] Campaign created successfully on", platform, "with ID:", campaignResult.id)

    return NextResponse.json({
      success: true,
      campaignId: campaignResult.id,
      message: `Campaign created on ${platform} successfully`,
    })
  } catch (error: any) {
    console.error("[v0] Campaign creation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
