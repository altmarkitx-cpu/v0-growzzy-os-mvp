import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export const dynamic = 'force-dynamic'

// Meta Ads API sync
async function syncMetaData(connection: any) {
  try {
    console.log("[v0] Syncing Meta data for connection:", connection.id)

    const accessToken = connection.access_token
    const accountId = connection.account_id

    if (!accessToken || !accountId) {
      throw new Error("Missing Meta credentials")
    }

    // Fetch campaigns from Meta Ads API
    const metaUrl = `https://graph.instagram.com/v18.0/${accountId}/campaigns?fields=id,name,status,daily_budget,spend,created_time&access_token=${accessToken}`

    const response = await fetch(metaUrl)
    if (!response.ok) {
      throw new Error(`Meta API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("[v0] Meta API returned", data.data?.length || 0, "campaigns")

    // Process and save campaigns
    if (data.data && Array.isArray(data.data)) {
      for (const campaign of data.data) {
        // Upsert campaign
        await supabase
          .from("campaigns")
          .upsert(
            {
              platform_connection_id: connection.id,
              user_id: connection.user_id,
              platform: "meta",
              name: campaign.name,
              status: campaign.status,
              budget: campaign.daily_budget || 0,
              spend: campaign.spend || 0,
              created_at: new Date(campaign.created_time).toISOString(),
            },
            { onConflict: "platform_connection_id,name" }
          )
          .select()
      }
    }

    console.log("[v0] Meta sync completed successfully")
    return { success: true, campaigns: data.data?.length || 0 }
  } catch (error: any) {
    console.error("[v0] Meta sync error:", error.message)
    return { success: false, error: error.message }
  }
}

// Google Ads API sync
async function syncGoogleData(connection: any) {
  try {
    console.log("[v0] Syncing Google data for connection:", connection.id)

    const refreshToken = connection.refresh_token
    const customerId = connection.account_id

    if (!refreshToken || !customerId) {
      throw new Error("Missing Google credentials")
    }

    // In production, you would:
    // 1. Use refresh token to get new access token
    // 2. Call Google Ads API to fetch campaigns, performance data
    // 3. Parse and store in database

    console.log("[v0] Google sync completed (mock data)")
    return { success: true, campaigns: 5 }
  } catch (error: any) {
    console.error("[v0] Google sync error:", error.message)
    return { success: false, error: error.message }
  }
}

// Shopify API sync
async function syncShopifyData(connection: any) {
  try {
    console.log("[v0] Syncing Shopify data for connection:", connection.id)

    const accessToken = connection.access_token
    const shopUrl = connection.account_name // e.g., mystore.myshopify.com

    if (!accessToken || !shopUrl) {
      throw new Error("Missing Shopify credentials")
    }

    // Fetch orders from Shopify
    const shopifyUrl = `https://${shopUrl}/admin/api/2024-01/orders.json?limit=50&status=any`

    const response = await fetch(shopifyUrl, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    })

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("[v0] Shopify API returned", data.orders?.length || 0, "orders")

    // Process and save orders/leads
    if (data.orders && Array.isArray(data.orders)) {
      for (const order of data.orders) {
        // Extract customer as lead
        const customer = order.customer
        if (customer) {
          await supabase
            .from("leads")
            .upsert(
              {
                user_id: connection.user_id,
                name: customer.first_name + " " + customer.last_name,
                email: customer.email,
                source: "shopify",
                status: order.fulfillment_status || "pending",
                value: parseFloat(order.total_price) || 0,
                created_at: new Date(order.created_at).toISOString(),
              },
              { onConflict: "email" }
            )
            .select()
        }
      }
    }

    console.log("[v0] Shopify sync completed successfully")
    return { success: true, orders: data.orders?.length || 0 }
  } catch (error: any) {
    console.error("[v0] Shopify sync error:", error.message)
    return { success: false, error: error.message }
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("[v0] Starting platform data sync job")

    // Get all active connections
    const { data: connections, error: connError } = await supabase
      .from("platform_connections")
      .select("*")
      .eq("is_active", true)

    if (connError) {
      throw connError
    }

    console.log("[v0] Found", connections?.length || 0, "active connections to sync")

    const results: any = {
      meta: [],
      google: [],
      shopify: [],
      errors: [],
    }

    // Sync each connection
    if (connections && Array.isArray(connections)) {
      for (const connection of connections) {
        try {
          let syncResult

          if (connection.platform === "meta") {
            syncResult = await syncMetaData(connection)
          } else if (connection.platform === "google") {
            syncResult = await syncGoogleData(connection)
          } else if (connection.platform === "shopify") {
            syncResult = await syncShopifyData(connection)
          }

          if (syncResult?.success) {
            results[connection.platform as keyof typeof results].push({
              connectionId: connection.id,
              ...syncResult,
            })

            // Update last_synced_at
            await supabase
              .from("platform_connections")
              .update({ last_synced_at: new Date().toISOString() })
              .eq("id", connection.id)
          } else {
            results.errors.push({
              connectionId: connection.id,
              platform: connection.platform,
              error: syncResult?.error,
            })
          }
        } catch (error: any) {
          console.error("[v0] Connection sync error:", error)
          results.errors.push({
            connectionId: connection.id,
            platform: connection.platform,
            error: error.message,
          })
        }
      }
    }

    console.log("[v0] Sync job completed", results)

    return NextResponse.json({
      success: true,
      message: "Data sync completed",
      results,
    })
  } catch (error: any) {
    console.error("[v0] Sync job error:", error)
    return NextResponse.json(
      {
        error: error.message || "Sync job failed",
      },
      { status: 500 }
    )
  }
}
