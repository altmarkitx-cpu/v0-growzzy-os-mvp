import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { decrypt } from "@/lib/crypto"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
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

    const { data: connections } = await supabase
      .from("platform_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)

    if (!connections || connections.length === 0) {
      return NextResponse.json({ synced: 0, campaigns: [] })
    }

    const allCampaigns = []

    // Sync from Meta
    const metaConnections = connections.filter((c: any) => c.platform === "meta")
    for (const connection of metaConnections) {
      const accessToken = decrypt(connection.access_token)

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${connection.account_id}/campaigns?fields=id,name,status,daily_budget,lifetime_budget,adset_count,created_time&access_token=${accessToken}`,
      )
      const metaData = await response.json()

      if (metaData.data) {
        for (const campaign of metaData.data) {
          // Fetch detailed metrics
          const metricsResponse = await fetch(
            `https://graph.facebook.com/v18.0/${campaign.id}/insights?fields=impressions,clicks,spend,actions&access_token=${accessToken}`,
          )
          const metricsData = await metricsResponse.json()

          const metrics = metricsData.data?.[0] || {}

          const { error } = await supabase.from("campaigns").upsert(
            {
              user_id: user.id,
              platform_connection_id: connection.id,
              name: campaign.name,
              platform: "meta",
              status: campaign.status,
              budget: campaign.daily_budget || campaign.lifetime_budget,
              impressions: metrics.impressions || 0,
              clicks: metrics.clicks || 0,
              ctr: metrics.clicks && metrics.impressions ? (metrics.clicks / metrics.impressions) * 100 : 0,
              spend: Number.parseFloat(metrics.spend || "0"),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "name,user_id" },
          )

          if (!error) {
            allCampaigns.push(campaign.name)
          }
        }
      }
    }

    // Update sync timestamp
    await supabase
      .from("platform_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("user_id", user.id)

    return NextResponse.json({
      success: true,
      synced: allCampaigns.length,
      campaigns: allCampaigns,
    })
  } catch (error: any) {
    console.error("[v0] Sync error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
