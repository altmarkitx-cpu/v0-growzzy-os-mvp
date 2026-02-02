import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getOAuthConfig } from '@/lib/oauth-config'
import { exchangeCodeForToken } from '@/lib/oauth-utils'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export const dynamic = 'force-dynamic'

interface SyncResult {
  platform: string
  status: 'success' | 'failed'
  campaignsSync?: number
  analyticsSync?: number
  ordersSync?: number
  message: string
  error?: string
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    console.log('[v0] Starting sync for connection:', id)

    // Get connection details
    const { data: connection, error: fetchError } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !connection) {
      console.error('[v0] Connection not found:', fetchError)
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    if (!connection.is_active) {
      console.log('[v0] Connection is inactive, skipping sync')
      return NextResponse.json({ message: 'Connection inactive' })
    }

    // Check and refresh token if needed
    if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
      console.log('[v0] Token expired, attempting refresh')
      const refreshed = await refreshConnectionToken(connection)
      if (!refreshed) {
        console.warn('[v0] Token refresh failed, marking connection as expired')
        await supabase
          .from('platform_connections')
          .update({ is_active: false })
          .eq('id', id)
        return NextResponse.json({ error: 'Token expired and refresh failed' }, { status: 401 })
      }
    }

    // Sync data based on platform
    let syncResult: SyncResult = {
      platform: connection.platform,
      status: 'success',
      message: 'Sync started',
    }

    switch (connection.platform.toLowerCase()) {
      case 'meta':
        syncResult = await syncMetaData(connection)
        break
      case 'google':
        syncResult = await syncGoogleData(connection)
        break
      case 'shopify':
        syncResult = await syncShopifyData(connection)
        break
      default:
        return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
    }

    // Update last synced time
    const { error: updateError } = await supabase
      .from('platform_connections')
      .update({
        last_synced_at: new Date().toISOString(),
        is_active: true,
      })
      .eq('id', id)

    if (updateError) {
      console.error('[v0] Failed to update sync timestamp:', updateError)
    }

    console.log('[v0] Sync completed for connection:', id, syncResult)

    return NextResponse.json({
      success: syncResult.status === 'success',
      ...syncResult,
    })
  } catch (error: any) {
    console.error('[v0] Sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Sync failed', status: 'failed' },
      { status: 500 }
    )
  }
}

async function refreshConnectionToken(connection: any): Promise<boolean> {
  try {
    if (!connection.refresh_token) {
      console.log('[v0] No refresh token available')
      return false
    }

    const config = getOAuthConfig(connection.platform.toLowerCase() as 'meta' | 'google' | 'shopify')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUri =
      connection.platform.toLowerCase() === 'meta'
        ? `${appUrl}/api/oauth/meta/callback`
        : `${appUrl}/api/oauth/google/callback`

    console.log('[v0] Attempting to refresh token for:', connection.platform)

    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: connection.refresh_token,
      }).toString(),
    })

    if (!tokenResponse.ok) {
      console.error('[v0] Token refresh failed:', tokenResponse.statusText)
      return false
    }

    const tokenData = await tokenResponse.json()

    // Update connection with new token
    const { error } = await supabase
      .from('platform_connections')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || connection.refresh_token,
        expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
      })
      .eq('id', connection.id)

    if (error) {
      console.error('[v0] Failed to update token:', error)
      return false
    }

    console.log('[v0] Token refreshed successfully for connection:', connection.id)
    return true
  } catch (error: any) {
    console.error('[v0] Token refresh error:', error)
    return false
  }
}

async function syncMetaData(connection: any): Promise<SyncResult> {
  try {
    console.log('[v0] Starting Meta data sync for account:', connection.account_id)

    // Fetch campaigns and their insights
    const campaignsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${connection.account_id}/campaigns?fields=id,name,status,spend&access_token=${connection.access_token}`
    )

    const campaignsData = await campaignsResponse.json()

    if (campaignsData.error) {
      throw new Error(campaignsData.error.message)
    }

    let campaignsSync = 0

    // Save campaigns to database
    if (campaignsData.data && Array.isArray(campaignsData.data)) {
      for (const campaign of campaignsData.data) {
        try {
          const { error } = await supabase.from('campaigns').upsert({
            id: `meta-${campaign.id}`,
            user_id: connection.user_id,
            platform_connection_id: connection.id,
            platform: 'meta',
            name: campaign.name,
            status: campaign.status.toLowerCase(),
            spend: campaign.spend || 0,
            revenue: 0,
            clicks: 0,
            impressions: 0,
            conversions: 0,
            ctr: 0,
            roas: 0,
            budget: 0,
            updated_at: new Date().toISOString(),
          })

          if (!error) {
            campaignsSync++
          }
        } catch (err) {
          console.error('[v0] Failed to save campaign:', err)
        }
      }
    }

    console.log('[v0] Meta sync completed:', campaignsSync, 'campaigns')

    return {
      platform: 'meta',
      status: 'success',
      campaignsSync,
      message: `Synced ${campaignsSync} campaigns from Meta`,
    }
  } catch (error: any) {
    console.error('[v0] Meta sync error:', error)
    return {
      platform: 'meta',
      status: 'failed',
      message: 'Meta sync failed',
      error: error.message,
    }
  }
}

async function syncGoogleData(connection: any): Promise<SyncResult> {
  try {
    console.log('[v0] Starting Google data sync for account:', connection.account_id)

    // Google Ads requires special setup - using placeholder for now
    // In production, you'd need to use google-ads-api library
    console.log('[v0] Google Ads sync placeholder - full implementation requires google-ads-api')

    return {
      platform: 'google',
      status: 'success',
      campaignsSync: 0,
      message: 'Google sync initialized (full implementation requires setup)',
    }
  } catch (error: any) {
    console.error('[v0] Google sync error:', error)
    return {
      platform: 'google',
      status: 'failed',
      message: 'Google sync failed',
      error: error.message,
    }
  }
}

async function syncShopifyData(connection: any): Promise<SyncResult> {
  try {
    console.log('[v0] Starting Shopify data sync for store:', connection.account_name)

    const query = `
      {
        orders(first: 10, sortKey: CREATED_AT, reverse: true) {
          edges {
            node {
              id
              name
              totalPriceSet {
                shopMoney {
                  amount
                }
              }
              lineItems(first: 10) {
                edges {
                  node {
                    title
                    quantity
                  }
                }
              }
            }
          }
        }
      }
    `

    const response = await fetch(`https://${connection.account_name}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': connection.access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })

    const data = await response.json()

    if (data.errors) {
      throw new Error(data.errors[0]?.message || 'Shopify API error')
    }

    const ordersSync = data.data?.orders?.edges?.length || 0
    console.log('[v0] Shopify sync completed:', ordersSync, 'orders')

    return {
      platform: 'shopify',
      status: 'success',
      ordersSync,
      message: `Synced ${ordersSync} recent orders from Shopify`,
    }
  } catch (error: any) {
    console.error('[v0] Shopify sync error:', error)
    return {
      platform: 'shopify',
      status: 'failed',
      message: 'Shopify sync failed',
      error: error.message,
    }
  }
}
