import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
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
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { platform } = await request.json()

  try {
    // Fetch platform credentials
    const { data: connection, error: connError } = await supabase
      .from("platform_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("platform", platform)
      .single()

    if (connError || !connection) {
      return NextResponse.json({ error: "Platform not connected" }, { status: 400 })
    }

    const credentials = JSON.parse(connection.credentials)

    let synced = 0

    switch (platform) {
      case "meta":
        // Fetch campaigns and metrics from Meta API
        const metaResponse = await fetch(
          `https://graph.facebook.com/v18.0/${credentials.adAccountId}/campaigns?fields=name,status,objective,daily_budget,insights{spend,impressions,clicks,conversions}&access_token=${credentials.accessToken}`,
        )

        if (metaResponse.ok) {
          const { data: campaigns } = await metaResponse.json()

          for (const campaign of campaigns || []) {
            await supabase.from("campaigns").upsert(
              {
                user_id: user.id,
                platform: "meta",
                platform_id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                spend: campaign.insights?.[0]?.spend || 0,
                revenue: 0,
                impressions: campaign.insights?.[0]?.impressions || 0,
                clicks: campaign.insights?.[0]?.clicks || 0,
                conversions: campaign.insights?.[0]?.conversions || 0,
              },
              { onConflict: "platform_id,platform" },
            )
            synced++
          }
        }
        break

      case "shopify":
        // Fetch products from Shopify
        const shopifyResponse = await fetch(`https://${credentials.shopDomain}/admin/api/2024-01/products.json`, {
          headers: {
            "X-Shopify-Access-Token": credentials.accessToken,
          },
        })

        if (shopifyResponse.ok) {
          const { products } = await shopifyResponse.json()
          synced = products?.length || 0
        }
        break
    }

    const { error: updateError } = await supabase
      .from("platform_connections")
      .update({
        last_synced: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("platform", platform)

    if (updateError) {
      console.error("[v0] Error updating sync time:", updateError)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${synced} items from ${platform}`,
      platform,
      synced,
      syncedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[v0] Sync error:", error)
    return NextResponse.json({ error: error.message || "Sync failed" }, { status: 500 })
  }
}

export async function GET(request: Request) {
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

  // Get sync status for all platforms
  const { data: connections, error } = await supabase
    .from("platform_connections")
    .select("platform, last_synced, is_connected")
    .eq("user_id", user.id)

  if (error) {
    console.error("[v0] Error fetching sync status:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    syncStatus: connections || [],
  })
}
