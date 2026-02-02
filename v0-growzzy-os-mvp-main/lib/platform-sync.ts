/**
 * Real-time Platform Data Sync
 * Syncs actual data from connected platforms to the dashboard
 */

import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { decrypt } from "@/lib/crypto"

export async function syncPlatformData(userId: string, platforms: string[]): Promise<void> {
  try {
    console.log(`[v0] Starting platform sync for user ${userId}`)

    for (const platform of platforms) {
      await syncPlatformCampaigns(userId, platform)
      await syncPlatformLeads(userId, platform)
    }

    console.log(`[v0] Platform sync completed for user ${userId}`)
  } catch (error) {
    console.error("[v0] Platform sync error:", error)
    throw error
  }
}

export async function syncAllPlatforms(userId: string): Promise<{ synced: number; campaigns: any[] }> {
  try {
    console.log(`[v0] Starting platform sync for user ${userId}`)

    // Get all active platform connections for this user
    const { data: connections, error: connError } = await supabaseAdmin
      .from("platform_connections")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)

    if (connError) throw connError
    if (!connections || connections.length === 0) {
      return { synced: 0, campaigns: [] }
    }

    let totalSynced = 0
    const allCampaigns = []

    // Sync each platform
    for (const connection of connections) {
      try {
        const synced = await syncPlatformCampaigns(userId, connection)
        totalSynced += synced.count
        allCampaigns.push(...synced.campaigns)
      } catch (error) {
        console.error(`[v0] Error syncing ${connection.platform}:`, error)
      }
    }

    console.log(`[v0] Platform sync completed. Synced ${totalSynced} campaigns`)
    return { synced: totalSynced, campaigns: allCampaigns }
  } catch (error) {
    console.error("[v0] Platform sync error:", error)
    throw error
  }
}

async function syncPlatformCampaigns(userId: string, connection: any): Promise<{ count: number; campaigns: any[] }> {
  const platform = connection.platform
  const accessToken = decrypt(connection.access_token)

  const syncedCampaigns = []

  if (platform === "meta") {
    // Sync Meta Ads campaigns
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${connection.account_id}/campaigns?fields=id,name,status,daily_budget,lifetime_budget,created_time&access_token=${accessToken}`,
      )

      const metaData = await response.json()

      if (metaData.data) {
        for (const campaign of metaData.data) {
          // Fetch detailed metrics
          const metricsResponse = await fetch(
            `https://graph.facebook.com/v18.0/${campaign.id}/insights?fields=impressions,clicks,spend,actions,action_values&date_preset=last_7d&access_token=${accessToken}`,
          )

          const metricsData = await metricsResponse.json()
          const metrics = metricsData.data?.[0] || {}

          const conversions =
            metrics.actions?.find((a: any) => a.action_type === "offsite_conversion.post_save")?.value || 0
          const revenue =
            metrics.action_values?.find((a: any) => a.action_type === "offsite_conversion.post_save")?.value || 0

          const { error } = await supabaseAdmin.from("campaigns").upsert(
            {
              user_id: userId,
              platform_connection_id: connection.id,
              platform_campaign_id: campaign.id,
              name: campaign.name,
              platform: "meta",
              status: campaign.status,
              budget: campaign.daily_budget || campaign.lifetime_budget || 0,
              impressions: metrics.impressions ? Number.parseInt(metrics.impressions) : 0,
              clicks: metrics.clicks ? Number.parseInt(metrics.clicks) : 0,
              ctr:
                metrics.clicks && metrics.impressions
                  ? (Number.parseInt(metrics.clicks) / Number.parseInt(metrics.impressions)) * 100
                  : 0,
              spend: metrics.spend ? Number.parseFloat(metrics.spend) : 0,
              conversions: Number.parseInt(conversions) || 0,
              revenue: Number.parseFloat(revenue) || 0,
              roas: metrics.spend ? Number.parseFloat(revenue) / Number.parseFloat(metrics.spend) : 0,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "platform_campaign_id,user_id" },
          )

          if (!error) {
            syncedCampaigns.push(campaign.name)
          }
        }
      }

      console.log(`[v0] Synced ${syncedCampaigns.length} campaigns from Meta`)
    } catch (error) {
      console.error("[v0] Error syncing Meta campaigns:", error)
    }
  } else if (platform === "google") {
    // Sync Google Ads campaigns
    try {
      const customerId = connection.account_id

      const response = await fetch(
        "https://googleads.googleapis.com/v14/customers/" + customerId + "/googleAds:search",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "developer-token": process.env.GOOGLE_DEVELOPER_TOKEN || "",
          },
          body: JSON.stringify({
            query: `
            SELECT campaign.id, campaign.name, campaign.status, metrics.impressions, 
                   metrics.clicks, metrics.cost_micros, metrics.conversions,
                   metrics.conversion_value_micros
            FROM campaign
            WHERE campaign.status != 'REMOVED'
          `,
          }),
        },
      )

      const googleData = await response.json()

      if (googleData.results) {
        for (const result of googleData.results) {
          const campaign = result.campaign
          const metrics = result.metrics

          const spend = metrics.cost_micros ? metrics.cost_micros / 1_000_000 : 0
          const revenue = metrics.conversion_value_micros ? metrics.conversion_value_micros / 1_000_000 : 0

          const { error } = await supabaseAdmin.from("campaigns").upsert(
            {
              user_id: userId,
              platform_connection_id: connection.id,
              platform_campaign_id: campaign.id,
              name: campaign.name,
              platform: "google",
              status: campaign.status === 1 ? "active" : "paused",
              impressions: metrics.impressions || 0,
              clicks: metrics.clicks || 0,
              ctr: metrics.impressions ? (metrics.clicks / metrics.impressions) * 100 : 0,
              spend: spend,
              conversions: metrics.conversions || 0,
              revenue: revenue,
              roas: spend > 0 ? revenue / spend : 0,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "platform_campaign_id,user_id" },
          )

          if (!error) {
            syncedCampaigns.push(campaign.name)
          }
        }
      }

      console.log(`[v0] Synced ${syncedCampaigns.length} campaigns from Google Ads`)
    } catch (error) {
      console.error("[v0] Error syncing Google campaigns:", error)
    }
  }

  // Update sync timestamp
  await supabaseAdmin
    .from("platform_connections")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", connection.id)

  return { count: syncedCampaigns.length, campaigns: syncedCampaigns }
}

async function syncPlatformLeads(userId: string, platform: string): Promise<void> {
  try {
    // This would fetch leads from the platform
    // Implementation depends on each platform's lead API
    console.log(`[v0] Lead sync for ${platform} coming soon`)
  } catch (error) {
    console.error(`[v0] Error syncing ${platform} leads:`, error)
  }
}
