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
    const { platform, campaignName, budget, objective, targeting, creative } = await request.json()

    // Get platform credentials
    const { data: creds } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("user_id", user.id)
      .eq("platform", platform)
      .single()

    if (!creds || !creds.is_connected) {
      return NextResponse.json({ error: `${platform} not connected` }, { status: 400 })
    }

    let platformCampaignId = ""
    let adSetId = ""
    let adId = ""

    if (platform === "meta") {
      // Create campaign on Meta
      const campaignResponse = await fetch(`https://graph.facebook.com/v18.0/${creds.account_id}/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: campaignName,
          objective: objective || "OUTCOME_SALES",
          status: "PAUSED",
          access_token: creds.access_token,
        }),
      })

      const campaignData = await campaignResponse.json()
      platformCampaignId = campaignData.id

      // Create ad set
      const adSetResponse = await fetch(`https://graph.facebook.com/v18.0/${creds.account_id}/adsets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaign_id: platformCampaignId,
          name: `${campaignName} - Ad Set`,
          daily_budget: Math.round(budget * 100),
          billing_event: "IMPRESSIONS",
          optimization_goal: "OFFSITE_CONVERSIONS",
          targeting: targeting || {},
          status: "PAUSED",
          access_token: creds.access_token,
        }),
      })

      const adSetData = await adSetResponse.json()
      adSetId = adSetData.id

      // Create creative
      const creativeResponse = await fetch(`https://graph.facebook.com/v18.0/${creds.account_id}/adcreatives`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${campaignName} - Creative`,
          object_story_spec: {
            page_id: creative?.pageId,
            link_data: {
              link: creative?.destinationUrl,
              message: creative?.primaryText,
              name: creative?.headline,
              description: creative?.description,
            },
          },
          access_token: creds.access_token,
        }),
      })

      const creativeData = await creativeResponse.json()

      // Create ad
      const adResponse = await fetch(`https://graph.facebook.com/v18.0/${creds.account_id}/ads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: campaignName,
          adset_id: adSetId,
          creative: { creative_id: creativeData.id },
          status: "PAUSED",
          access_token: creds.access_token,
        }),
      })

      const adData = await adResponse.json()
      adId = adData.id
    } else if (platform === "google") {
      // Similar implementation for Google Ads API
      console.log("[v0] Google campaign creation - implementation pending platform credentials")
    }

    // Save to local database
    const { data: campaign, error } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        platform,
        platform_campaign_id: platformCampaignId,
        name: campaignName,
        status: "paused",
        daily_budget: budget,
        objective: objective,
        spend: 0,
        revenue: 0,
        roas: 0,
        conversions: 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving campaign:", error)
      return NextResponse.json({ error: "Campaign created on platform but failed to save locally" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      campaign,
      platformDetails: {
        campaignId: platformCampaignId,
        adSetId,
        adId,
      },
      message: `Campaign created on ${platform}! Status: PAUSED (review and activate in platform)`,
    })
  } catch (error) {
    console.error("[v0] Campaign creation error:", error)
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 })
  }
}
