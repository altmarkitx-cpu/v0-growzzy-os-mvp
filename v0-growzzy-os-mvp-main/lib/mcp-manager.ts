// MCP Manager for connecting to real platform APIs
import { createClient } from "@supabase/supabase-js"

export type Platform = "meta" | "google_ads" | "linkedin" | "shopify"

interface PlatformCredentials {
  platform: Platform
  access_token: string
  refresh_token?: string
  expires_at?: number
}

export class MCPManager {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  async connectPlatform(platform: Platform, userId: string, credentials: any) {
    try {
      // Validate connection by making test API call
      const testData = await this.fetchPlatformData(platform, credentials, "test")

      // Store credentials in database
      const { data, error } = await this.supabase.from("platform_credentials").upsert({
        user_id: userId,
        platform,
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token,
        expires_at: credentials.expires_at,
        account_data: credentials.account_data,
        status: "active",
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      console.error(`[v0] MCP connection error for ${platform}:`, error)
      throw error
    }
  }

  async fetchPlatformData(platform: Platform, credentials: any, endpoint: string) {
    const apiEndpoints: Record<Platform, string> = {
      meta: "https://graph.instagram.com/v18.0",
      google_ads: "https://googleads.googleapis.com/v14",
      linkedin: "https://api.linkedin.com/v2",
      shopify: `https://${credentials.store_url}/admin/api/2024-01`,
    }

    const baseUrl = apiEndpoints[platform]
    const headers = this.getAuthHeaders(platform, credentials)

    try {
      const response = await fetch(`${baseUrl}/${endpoint}`, { headers })
      return response.json()
    } catch (error) {
      console.error(`[v0] Failed to fetch ${endpoint} from ${platform}:`, error)
      throw error
    }
  }

  private getAuthHeaders(platform: Platform, credentials: any): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" }

    switch (platform) {
      case "meta":
        headers["Authorization"] = `Bearer ${credentials.access_token}`
        break
      case "google_ads":
        headers["Authorization"] = `Bearer ${credentials.access_token}`
        headers["developer-token"] = credentials.developer_token!
        break
      case "linkedin":
        headers["Authorization"] = `Bearer ${credentials.access_token}`
        break
      case "shopify":
        headers["X-Shopify-Access-Token"] = credentials.access_token
        break
    }

    return headers
  }

  async createCampaign(platform: Platform, userId: string, campaignData: any) {
    try {
      // Get user's credentials
      const { data: creds, error: credsError } = await this.supabase
        .from("platform_credentials")
        .select("*")
        .eq("user_id", userId)
        .eq("platform", platform)
        .single()

      if (credsError || !creds) throw new Error("Platform not connected")

      // Make API call to create campaign
      const result = await this.createCampaignOnPlatform(platform, creds, campaignData)

      // Store in database
      await this.supabase.from("campaigns").insert({
        user_id: userId,
        platform,
        platform_campaign_id: result.id,
        name: campaignData.name,
        status: "paused",
        budget: campaignData.budget,
        metadata: campaignData,
      })

      return result
    } catch (error) {
      console.error(`[v0] Campaign creation failed on ${platform}:`, error)
      throw error
    }
  }

  private async createCampaignOnPlatform(platform: Platform, credentials: any, data: any) {
    const headers = this.getAuthHeaders(platform, credentials)

    const payloads: Record<Platform, any> = {
      meta: {
        name: data.name,
        objective: data.objective,
        special_ad_categories: [],
        status: "PAUSED",
        daily_budget: Math.round(data.budget * 100),
      },
      google_ads: {
        campaignName: data.name,
        advertisingChannelType: "SEARCH",
        status: "PAUSED",
        biddingStrategyType: "MAXIMIZE_CONVERSIONS",
        dailyBudgetMicros: Math.round(data.budget * 1000000),
      },
      linkedin: {
        name: data.name,
        objective: data.objective,
        costModel: "CPC",
        status: "PAUSED",
        dailyBudget: { amount: Math.round(data.budget), currencyCode: "USD" },
      },
      shopify: {
        title: data.name,
        budget: data.budget,
        status: "active",
      },
    }

    const response = await fetch(`${this.getApiUrl(platform)}/campaigns`, {
      method: "POST",
      headers,
      body: JSON.stringify(payloads[platform]),
    })

    if (!response.ok) throw new Error(`Failed to create campaign: ${response.statusText}`)
    return response.json()
  }

  private getApiUrl(platform: Platform): string {
    const urls: Record<Platform, string> = {
      meta: "https://graph.instagram.com/v18.0",
      google_ads: "https://googleads.googleapis.com/v14",
      linkedin: "https://api.linkedin.com/v2",
      shopify: "https://shopify.com/admin/api/2024-01",
    }
    return urls[platform]
  }
}

export const mcpManager = new MCPManager()
