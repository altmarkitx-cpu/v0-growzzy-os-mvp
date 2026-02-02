import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { campaignData, platform } = await request.json()

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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user settings from request headers
    const settings = request.headers.get("x-user-settings")
    if (!settings) {
      return NextResponse.json({ error: "No integration data found" }, { status: 401 })
    }

    const integrations = JSON.parse(settings)
    const platformIntegration = integrations[platform]

    if (!platformIntegration || !platformIntegration.connected || !platformIntegration.accessToken) {
      return NextResponse.json({ error: `${platform} not connected` }, { status: 401 })
    }

    // Create campaign based on platform
    let result
    switch (platform) {
      case "meta":
        result = await createMetaCampaign(campaignData, platformIntegration.accessToken)
        break
      case "google":
        result = await createGoogleCampaign(campaignData, platformIntegration.accessToken)
        break
      case "linkedin":
        result = await createLinkedInCampaign(campaignData, platformIntegration.accessToken)
        break
      case "shopify":
        result = await createShopifyCampaign(campaignData, platformIntegration.accessToken, platformIntegration.shop)
        break
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    const { data: savedCampaign, error: dbError } = await supabase
      .from("campaigns")
      .insert([
        {
          user_id: user.id,
          platform: platform,
          platform_campaign_id: result.id,
          name: campaignData.name,
          status: result.status || "paused",
          objective: campaignData.objective,
          daily_budget: campaignData.dailyBudget || campaignData.budget,
          total_budget: campaignData.totalBudget,
          start_date: campaignData.startDate,
          end_date: campaignData.endDate,
        },
      ])
      .select()

    if (dbError) {
      console.error("[v0] Error saving campaign to database:", dbError)
      // Don't fail the entire operation if database save fails
    }

    return NextResponse.json({
      success: true,
      campaign: result,
      message: `Campaign created successfully on ${platform}`,
    })
  } catch (error: any) {
    console.error("[v0] Campaign creation error:", error)
    return NextResponse.json({ error: error.message || "Failed to create campaign" }, { status: 500 })
  }
}

async function createMetaCampaign(campaignData: any, accessToken: string) {
  try {
    // Create Meta campaign using Graph API
    const response = await fetch(`https://graph.facebook.com/v19.0/act_${campaignData.adAccountId}/adcampaigns`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: campaignData.name,
        objective: campaignData.objective || "OUTCOME_TRAFFIC",
        status: campaignData.status || "PAUSED",
        special_ad_categories: [],
        access_token: accessToken,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Meta API error: ${error}`)
    }

    const campaign = await response.json()

    // Create ad sets if provided
    if (campaignData.adSets) {
      for (const adSet of campaignData.adSets) {
        await createMetaAdSet(campaign.id, adSet, accessToken)
      }
    }

    // Create ads if provided
    if (campaignData.ads) {
      for (const ad of campaignData.ads) {
        await createMetaAd(campaign.id, ad, accessToken)
      }
    }

    return {
      id: campaign.id,
      name: campaignData.name,
      platform: "meta",
      status: campaign.status,
      objective: campaignData.objective,
      createdAt: new Date().toISOString(),
    }
  } catch (error: any) {
    throw new Error(`Meta campaign creation failed: ${error.message}`)
  }
}

async function createGoogleCampaign(campaignData: any, accessToken: string) {
  try {
    // Get customer ID from integration data
    const customerId = campaignData.customerId

    const response = await fetch(`https://googleads.googleapis.com/v16/customers/${customerId}:createCampaign`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        campaign: {
          name: campaignData.name,
          advertising_channel_type: "SEARCH",
          status: campaignData.status === "active" ? "ENABLED" : "PAUSED",
          manual_cpc: {
            enhanced_cpc_enabled: true,
          },
          campaign_budget: campaignData.budgetId,
          targeting_setting: {
            target_restrictions: [
              {
                geo_target_type_setting: {
                  positive_geo_target_type: "INCLUDE",
                  negative_geo_target_type: "EXCLUDE",
                },
              },
            ],
          },
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google Ads API error: ${error}`)
    }

    const result = await response.json()

    return {
      id: result.resourceName?.split("/").pop() || "unknown",
      name: campaignData.name,
      platform: "google",
      status: campaignData.status,
      createdAt: new Date().toISOString(),
    }
  } catch (error: any) {
    throw new Error(`Google campaign creation failed: ${error.message}`)
  }
}

async function createLinkedInCampaign(campaignData: any, accessToken: string) {
  try {
    const response = await fetch("https://api.linkedin.com/v2/adCampaigns", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: campaignData.name,
        status: campaignData.status || "DRAFT",
        type: campaignData.type || "SPONSORED_CONTENTS",
        account: campaignData.accountId,
        locale: {
          country: campaignData.country || "US",
          language: campaignData.language || "en",
        },
        budget: campaignData.budget,
        schedule: {
          start: campaignData.startDate,
          end: campaignData.endDate,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`LinkedIn API error: ${error}`)
    }

    const campaign = await response.json()

    return {
      id: campaign.id,
      name: campaignData.name,
      platform: "linkedin",
      status: campaign.status,
      createdAt: new Date().toISOString(),
    }
  } catch (error: any) {
    throw new Error(`LinkedIn campaign creation failed: ${error.message}`)
  }
}

async function createShopifyCampaign(campaignData: any, accessToken: string, shop: string) {
  try {
    // For Shopify, we create a marketing campaign
    const response = await fetch(`https://${shop}/admin/api/2024-01/marketing_campaigns.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        marketing_campaign: {
          name: campaignData.name,
          status: campaignData.status || "ACTIVE",
          budget: campaignData.budget,
          budget_type: campaignData.budgetType || "TOTAL",
          currency: campaignData.currency || "USD",
          started_at: campaignData.startDate,
          ended_at: campaignData.endDate,
          market_ids: campaignData.marketIds || [],
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Shopify API error: ${error}`)
    }

    const result = await response.json()

    return {
      id: result.marketing_campaign.id,
      name: campaignData.name,
      platform: "shopify",
      status: result.marketing_campaign.status,
      createdAt: result.marketing_campaign.created_at,
    }
  } catch (error: any) {
    throw new Error(`Shopify campaign creation failed: ${error.message}`)
  }
}

async function createMetaAdSet(campaignId: string, adSetData: any, accessToken: string) {
  const response = await fetch(`https://graph.facebook.com/v19.0/${campaignId}/adsets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: adSetData.name,
      optimization_goal: adSetData.optimizationGoal || "REACH",
      billing_event: adSetData.billingEvent || "IMPRESSIONS",
      bid_amount: adSetData.bidAmount,
      daily_budget: adSetData.dailyBudget,
      targeting: adSetData.targeting || {},
      status: adSetData.status || "PAUSED",
    }),
  })

  return await response.json()
}

async function createMetaAd(campaignId: string, adData: any, accessToken: string) {
  // First create creative
  const creativeResponse = await fetch(`https://graph.facebook.com/v19.0/act_${adData.adAccountId}/adcreatives`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: adData.name,
      object_story_spec: {
        page_id: adData.pageId,
        link_data: {
          link: adData.link,
          message: adData.message,
          image_hash: adData.imageHash,
        },
      },
    }),
  })

  const creative = await creativeResponse.json()

  // Then create ad
  const adResponse = await fetch(`https://graph.facebook.com/v19.0/${campaignId}/ads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: adData.name,
      adset_id: adData.adSetId,
      creative: { creative_id: creative.id },
      status: adData.status || "PAUSED",
    }),
  })

  return await adResponse.json()
}
