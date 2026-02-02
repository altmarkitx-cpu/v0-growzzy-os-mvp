interface PlatformCredentials {
  platform: string
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  accountData?: Record<string, any>
}

interface Campaign {
  id: string
  name: string
  platform: string
  status: "active" | "paused" | "archived"
  budget: number
  spend: number
  conversions: number
  impressions: number
  clicks: number
  revenue?: number
  roas?: number
  ctr?: number
  cpc?: number
}

interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  source: string
  status: string
  value: number
  createdAt: string
}

export class PlatformManager {
  private static instance: PlatformManager
  private credentials: Map<string, PlatformCredentials> = new Map()

  private constructor() {}

  static getInstance(): PlatformManager {
    if (!PlatformManager.instance) {
      PlatformManager.instance = new PlatformManager()
    }
    return PlatformManager.instance
  }

  // Set platform credentials
  setCredentials(platform: string, creds: PlatformCredentials) {
    this.credentials.set(platform, creds)
  }

  // Get platform credentials
  getCredentials(platform: string): PlatformCredentials | undefined {
    return this.credentials.get(platform)
  }

  // Fetch all campaigns from all connected platforms
  async getAllCampaigns(): Promise<Campaign[]> {
    const campaigns: Campaign[] = []

    for (const [platform, creds] of this.credentials.entries()) {
      if (!creds.accessToken) continue

      try {
        const platformCampaigns = await this.fetchPlatformCampaigns(platform, creds)
        campaigns.push(...platformCampaigns)
      } catch (error) {
        console.error(`Error fetching ${platform} campaigns:`, error)
      }
    }

    return campaigns
  }

  // Platform-specific campaign fetching
  private async fetchPlatformCampaigns(platform: string, creds: PlatformCredentials): Promise<Campaign[]> {
    switch (platform) {
      case "meta":
        return this.fetchMetaCampaigns(creds)
      case "google":
        return this.fetchGoogleCampaigns(creds)
      case "linkedin":
        return this.fetchLinkedInCampaigns(creds)
      case "shopify":
        return this.fetchShopifyCampaigns(creds)
      default:
        return []
    }
  }

  // Meta Ads API
  private async fetchMetaCampaigns(creds: PlatformCredentials): Promise<Campaign[]> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/me/adcampaigns?fields=id,name,status,spend,daily_budget,objective,created_time,insights.date_preset(last_30d){spend,impressions,clicks,conversions,cost_per_conversion,roas}&limit=100`,
        {
          headers: { Authorization: `Bearer ${creds.accessToken}` },
        },
      )

      if (!response.ok) throw new Error("Meta API error")

      const data = await response.json()

      return (
        data.data?.map((campaign: any) => ({
          id: campaign.id,
          name: campaign.name,
          platform: "meta",
          status: campaign.status === "ACTIVE" ? "active" : "paused",
          budget: campaign.daily_budget || 0,
          spend: campaign.insights?.data?.[0]?.spend || 0,
          conversions: campaign.insights?.data?.[0]?.conversions || 0,
          impressions: campaign.insights?.data?.[0]?.impressions || 0,
          clicks: campaign.insights?.data?.[0]?.clicks || 0,
          revenue: campaign.insights?.data?.[0]?.purchase_roas
            ? campaign.insights.data[0].spend * campaign.insights.data[0].purchase_roas
            : 0,
          roas: campaign.insights?.data?.[0]?.roas || 0,
          ctr: campaign.insights?.data?.[0]?.ctr || 0,
          cpc: campaign.insights?.data?.[0]?.cost_per_conversion || 0,
        })) || []
      )
    } catch (error) {
      console.error("Error fetching Meta campaigns:", error)
      return []
    }
  }

  // Google Ads API
  private async fetchGoogleCampaigns(creds: PlatformCredentials): Promise<Campaign[]> {
    try {
      const response = await fetch("https://googleads.googleapis.com/v15/customers/*/campaigns", {
        headers: { Authorization: `Bearer ${creds.accessToken}` },
      })

      if (!response.ok) throw new Error("Google Ads API error")

      const data = await response.json()

      return (
        data.results?.map((campaign: any) => ({
          id: campaign.id,
          name: campaign.name,
          platform: "google",
          status: campaign.status === "ENABLED" ? "active" : "paused",
          budget: campaign.budgetSpecification?.fixedBudget?.amountMicros
            ? campaign.budgetSpecification.fixedBudget.amountMicros / 1000000
            : 0,
          spend: campaign.spend || 0,
          conversions: campaign.conversions || 0,
          impressions: campaign.impressions || 0,
          clicks: campaign.clicks || 0,
          roas: campaign.roas || 0,
        })) || []
      )
    } catch (error) {
      console.error("Error fetching Google campaigns:", error)
      return []
    }
  }

  // LinkedIn Ads API
  private async fetchLinkedInCampaigns(creds: PlatformCredentials): Promise<Campaign[]> {
    try {
      const response = await fetch("https://api.linkedin.com/rest/adCampaigns", {
        headers: { Authorization: `Bearer ${creds.accessToken}` },
      })

      if (!response.ok) throw new Error("LinkedIn API error")

      const data = await response.json()

      return (
        data.elements?.map((campaign: any) => ({
          id: campaign.id,
          name: campaign.name,
          platform: "linkedin",
          status: campaign.status === "ACTIVE" ? "active" : "paused",
          budget: campaign.dailyBudget?.amount || 0,
          spend: campaign.spend || 0,
          conversions: campaign.conversions || 0,
          impressions: campaign.impressions || 0,
          clicks: campaign.clicks || 0,
        })) || []
      )
    } catch (error) {
      console.error("Error fetching LinkedIn campaigns:", error)
      return []
    }
  }

  // Shopify API
  private async fetchShopifyCampaigns(creds: PlatformCredentials): Promise<Campaign[]> {
    try {
      const shop = creds.accountData?.shop
      const response = await fetch(`https://${shop}/admin/api/2024-01/marketing_campaigns.json`, {
        headers: { "X-Shopify-Access-Token": creds.accessToken },
      })

      if (!response.ok) throw new Error("Shopify API error")

      const data = await response.json()

      return (
        data.marketing_campaigns?.map((campaign: any) => ({
          id: campaign.id,
          name: campaign.title,
          platform: "shopify",
          status: campaign.enabled ? "active" : "paused",
          budget: campaign.budget || 0,
          spend: campaign.total_spent || 0,
          conversions: campaign.conversions || 0,
          impressions: campaign.impressions || 0,
          clicks: campaign.clicks || 0,
        })) || []
      )
    } catch (error) {
      console.error("Error fetching Shopify campaigns:", error)
      return []
    }
  }

  // Create campaign on platform
  async createCampaign(platform: string, campaignData: any): Promise<string> {
    const creds = this.credentials.get(platform)
    if (!creds) throw new Error(`No credentials for ${platform}`)

    switch (platform) {
      case "meta":
        return this.createMetaCampaign(creds, campaignData)
      case "google":
        return this.createGoogleCampaign(creds, campaignData)
      case "linkedin":
        return this.createLinkedInCampaign(creds, campaignData)
      case "shopify":
        return this.createShopifyCampaign(creds, campaignData)
      default:
        throw new Error(`Unknown platform: ${platform}`)
    }
  }

  private async createMetaCampaign(creds: PlatformCredentials, data: any): Promise<string> {
    const response = await fetch("https://graph.facebook.com/v19.0/me/campaigns", {
      method: "POST",
      headers: { Authorization: `Bearer ${creds.accessToken}` },
      body: JSON.stringify({
        name: data.name,
        objective: data.objective || "LINK_CLICKS",
        status: "PAUSED",
        special_ad_categories: [],
      }),
    })

    if (!response.ok) throw new Error("Failed to create Meta campaign")
    const result = await response.json()
    return result.id
  }

  private async createGoogleCampaign(creds: PlatformCredentials, data: any): Promise<string> {
    // Implementation would use Google Ads API v15
    throw new Error("Google campaign creation coming soon")
  }

  private async createLinkedInCampaign(creds: PlatformCredentials, data: any): Promise<string> {
    // Implementation would use LinkedIn API
    throw new Error("LinkedIn campaign creation coming soon")
  }

  private async createShopifyCampaign(creds: PlatformCredentials, data: any): Promise<string> {
    // Implementation would use Shopify API
    throw new Error("Shopify campaign creation coming soon")
  }

  // Pause campaign on platform
  async pauseCampaign(platform: string, campaignId: string): Promise<boolean> {
    const creds = this.credentials.get(platform)
    if (!creds) throw new Error(`No credentials for ${platform}`)

    switch (platform) {
      case "meta":
        return this.pauseMetaCampaign(creds, campaignId)
      case "google":
        return this.pauseGoogleCampaign(creds, campaignId)
      case "linkedin":
        return this.pauseLinkedInCampaign(creds, campaignId)
      default:
        return false
    }
  }

  private async pauseMetaCampaign(creds: PlatformCredentials, campaignId: string): Promise<boolean> {
    const response = await fetch(`https://graph.facebook.com/v19.0/${campaignId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${creds.accessToken}` },
      body: JSON.stringify({ status: "PAUSED" }),
    })

    return response.ok
  }

  private async pauseGoogleCampaign(creds: PlatformCredentials, campaignId: string): Promise<boolean> {
    // Implementation would use Google Ads API
    return false
  }

  private async pauseLinkedInCampaign(creds: PlatformCredentials, campaignId: string): Promise<boolean> {
    // Implementation would use LinkedIn API
    return false
  }
}

export const platformManager = PlatformManager.getInstance()
