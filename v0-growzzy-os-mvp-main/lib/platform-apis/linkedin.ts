export interface LinkedInAdAccount {
  id: string
  name: string
}

export interface LinkedInCampaignMetrics {
  campaignId: string
  name: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  cpm: number
  roas: number
}

export async function getLinkedInAdAccounts(accessToken: string): Promise<LinkedInAdAccount[]> {
  try {
    console.log("[v0] Fetching LinkedIn ad accounts...")
    const response = await fetch(
      "https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName)",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "LinkedIn-Version": "202401",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`LinkedIn API error: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] LinkedIn account fetched")
    return [
      {
        id: data.id,
        name: `${data.localizedFirstName} ${data.localizedLastName}`,
      },
    ]
  } catch (error) {
    console.log("[v0] Error fetching LinkedIn accounts:", error)
    throw error
  }
}

export async function getLinkedInCampaigns(accessToken: string, accountId: string): Promise<LinkedInCampaignMetrics[]> {
  try {
    console.log("[v0] Fetching LinkedIn campaigns...")
    return []
  } catch (error) {
    console.log("[v0] Error fetching LinkedIn campaigns:", error)
    throw error
  }
}
