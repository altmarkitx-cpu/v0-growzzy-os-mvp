import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  if (!url || !key) {
    return null
  }
  
  return createClient(url, key)
}

export class PlatformAPI {
  // Meta (Facebook/Instagram) Ads API
  static async metaCreateCampaign(accessToken: string, adAccountId: string, campaignData: any) {
    const response = await fetch(`https://graph.instagram.com/v18.0/${adAccountId}/campaigns`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: campaignData.name,
        objective: campaignData.objective,
        status: "PAUSED",
        special_ad_categories: [],
        daily_budget: Math.round(campaignData.budget * 100), // in cents
      }),
    })
    if (!response.ok) throw new Error(`Meta API error: ${response.statusText}`)
    return response.json()
  }

  static async metaGetCampaigns(accessToken: string, adAccountId: string) {
    const response = await fetch(
      `https://graph.instagram.com/v18.0/${adAccountId}/campaigns?fields=id,name,status,daily_budget,spent,insights.date_preset(last_30d){spend,impressions,clicks,actions},effective_status`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
    if (!response.ok) throw new Error(`Meta API error: ${response.statusText}`)
    return response.json()
  }

  // Google Ads API
  static async googleCreateCampaign(developerToken: string, customerId: string, campaignData: any) {
    const response = await fetch("https://googleads.googleapis.com/v14/customers/" + customerId + "/campaigns:mutate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${developerToken}`,
        "developer-token": developerToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mutateOperations: [
          {
            createOperation: {
              resource: {
                name: campaignData.name,
                advertisingChannelType: "SEARCH",
                status: "PAUSED",
                campaignBudget: {
                  amountMicros: Math.round(campaignData.budget * 1000000),
                },
                biddingStrategyConfiguration: {
                  biddingStrategyType: "MAXIMIZE_CONVERSIONS",
                },
              },
            },
          },
        ],
      }),
    })
    if (!response.ok) throw new Error(`Google Ads API error: ${response.statusText}`)
    return response.json()
  }

  static async googleGetCampaigns(developerToken: string, customerId: string) {
    const response = await fetch("https://googleads.googleapis.com/v14/customers/" + customerId + "/googleAds:search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${developerToken}`,
        "developer-token": developerToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `SELECT campaign.id, campaign.name, campaign.status, campaign_budget.amount_micros FROM campaign WHERE campaign.status != REMOVED ORDER BY campaign.id DESC LIMIT 100`,
      }),
    })
    if (!response.ok) throw new Error(`Google Ads API error: ${response.statusText}`)
    return response.json()
  }

  // LinkedIn Ads API
  static async linkedInCreateCampaign(accessToken: string, campaignData: any) {
    const response = await fetch("https://api.linkedin.com/v2/adCampaignsV2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: campaignData.name,
        objective: campaignData.objective,
        status: "DRAFT",
        dailyBudget: { amount: Math.round(campaignData.budget * 100), currencyCode: "USD" },
      }),
    })
    if (!response.ok) throw new Error(`LinkedIn API error: ${response.statusText}`)
    return response.json()
  }

  static async linkedInGetCampaigns(accessToken: string) {
    const response = await fetch("https://api.linkedin.com/v2/adCampaignsV2?q=owner&projection=(*,elements*(*))", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) throw new Error(`LinkedIn API error: ${response.statusText}`)
    return response.json()
  }

  // Shopify API
  static async shopifyCreateCampaign(accessToken: string, shopDomain: string, campaignData: any) {
    const response = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `mutation { marketingActivityCreate(input: {title: "${campaignData.name}", budget: {total: ${campaignData.budget}, currencyCode: USD}, status: DRAFT}) { marketingActivity { id } } }`,
      }),
    })
    if (!response.ok) throw new Error(`Shopify API error: ${response.statusText}`)
    return response.json()
  }

  static async shopifyGetCampaigns(accessToken: string, shopDomain: string) {
    const response = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `{ marketingActivities(first: 10) { edges { node { id title budget { total currencyCode } status } } } }`,
      }),
    })
    if (!response.ok) throw new Error(`Shopify API error: ${response.statusText}`)
    return response.json()
  }
}
