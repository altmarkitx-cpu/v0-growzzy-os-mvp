/**
 * Background Sync Orchestrator
 * Manages all platform data syncs with retry logic and token refresh
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';

const SYNC_TIMEOUT = 30000; // 30 seconds per connection
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

interface SyncResult {
  connectionId: string;
  platform: string;
  success: boolean;
  campaignsSynced: number;
  error?: string;
  duration: number;
}

interface SyncStats {
  totalConnections: number;
  successfulSyncs: number;
  failedSyncs: number;
  totalCampaigns: number;
  duration: number;
  errors: SyncResult[];
}

export async function syncAllUserConnections(userId: string): Promise<SyncStats> {
  const startTime = Date.now();
  const stats: SyncStats = {
    totalConnections: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    totalCampaigns: 0,
    duration: 0,
    errors: [],
  };

  try {
    console.log(`[v0] Starting sync for user ${userId}`);

    // Get all active connections
    const { data: connections, error: connError } = await supabaseAdmin
      .from('platform_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (connError) throw connError;
    if (!connections || connections.length === 0) {
      console.log(`[v0] No active connections for user ${userId}`);
      return stats;
    }

    stats.totalConnections = connections.length;

    // Sync each connection with retry logic
    for (const connection of connections) {
      const syncResult = await syncConnectionWithRetry(connection, userId);
      
      if (syncResult.success) {
        stats.successfulSyncs++;
        stats.totalCampaigns += syncResult.campaignsSynced;
      } else {
        stats.failedSyncs++;
        stats.errors.push(syncResult);
      }
    }

    stats.duration = Date.now() - startTime;
    console.log(`[v0] Sync complete. Success: ${stats.successfulSyncs}/${stats.totalConnections}, Campaigns: ${stats.totalCampaigns}, Duration: ${stats.duration}ms`);
    
    return stats;
  } catch (error: any) {
    console.error('[v0] Sync orchestrator error:', error);
    stats.duration = Date.now() - startTime;
    return stats;
  }
}

async function syncConnectionWithRetry(connection: any, userId: string): Promise<SyncResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await syncConnection(connection, userId);
    } catch (error: any) {
      lastError = error;
      console.error(`[v0] Sync attempt ${attempt}/${MAX_RETRIES} failed for ${connection.platform}:`, error.message);
      
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      }
    }
  }

  return {
    connectionId: connection.id,
    platform: connection.platform,
    success: false,
    campaignsSynced: 0,
    error: lastError?.message || 'Unknown error',
    duration: 0,
  };
}

async function syncConnection(connection: any, userId: string): Promise<SyncResult> {
  const startTime = Date.now();
  let campaignsSynced = 0;

  try {
    // Refresh token if needed
    if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
      await refreshConnectionToken(connection);
    }

    // Verify token is not empty
    if (!connection.access_token) {
      throw new Error('Access token is empty or missing');
    }

    // Sync based on platform
    switch (connection.platform) {
      case 'meta':
        campaignsSynced = await syncMetaCampaigns(connection, userId);
        break;
      case 'google':
        campaignsSynced = await syncGoogleCampaigns(connection, userId);
        break;
      case 'shopify':
        campaignsSynced = await syncShopifyData(connection, userId);
        break;
      default:
        throw new Error(`Unsupported platform: ${connection.platform}`);
    }

    // Update last_synced_at
    await supabaseAdmin
      .from('platform_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', connection.id);

    return {
      connectionId: connection.id,
      platform: connection.platform,
      success: true,
      campaignsSynced,
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error(`[v0] Error syncing ${connection.platform}:`, error);
    throw error;
  }
}

async function refreshConnectionToken(connection: any): Promise<void> {
  try {
    console.log(`[v0] Refreshing token for ${connection.platform} connection`);

    let newAccessToken: string | null = null;
    let expiresIn: number | null = null;

    if (connection.platform === 'google' && connection.refresh_token) {
      // Refresh Google token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: connection.refresh_token,
          grant_type: 'refresh_token',
        }).toString(),
      });

      const data = await response.json();
      if (data.access_token) {
        newAccessToken = data.access_token;
        expiresIn = data.expires_in || 3600;
      }
    }

    if (newAccessToken) {
      await supabaseAdmin
        .from('platform_connections')
        .update({
          access_token: newAccessToken,
          expires_at: expiresIn
            ? new Date(Date.now() + expiresIn * 1000).toISOString()
            : null,
        })
        .eq('id', connection.id);

      console.log(`[v0] Token refreshed for ${connection.platform}`);
    }
  } catch (error: any) {
    console.error('[v0] Token refresh error:', error);
    // Don't throw - continue with current token
  }
}

async function syncMetaCampaigns(connection: any, userId: string): Promise<number> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${connection.account_id}/campaigns?fields=id,name,status,daily_budget,lifetime_budget&access_token=${connection.access_token}`
    );

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    let synced = 0;
    if (data.data) {
      for (const campaign of data.data) {
        try {
          const metricsResponse = await fetch(
            `https://graph.facebook.com/v18.0/${campaign.id}/insights?fields=impressions,clicks,spend,actions,action_values&date_preset=last_7d&access_token=${connection.access_token}`
          );
          const metricsData = await metricsResponse.json();
          const metrics = metricsData.data?.[0] || {};

          const conversions = metrics.actions?.find((a: any) => a.action_type === 'offsite_conversion.post_save')?.value || 0;
          const revenue = metrics.action_values?.find((a: any) => a.action_type === 'offsite_conversion.post_save')?.value || 0;

          await supabaseAdmin.from('campaigns').upsert({
            user_id: userId,
            platform_connection_id: connection.id,
            platform: 'meta',
            name: campaign.name,
            status: campaign.status,
            budget: campaign.daily_budget || campaign.lifetime_budget || 0,
            impressions: parseInt(metrics.impressions || 0),
            clicks: parseInt(metrics.clicks || 0),
            ctr: metrics.impressions ? (parseInt(metrics.clicks || 0) / parseInt(metrics.impressions)) * 100 : 0,
            spend: parseFloat(metrics.spend || 0),
            conversions: parseInt(conversions || 0),
            revenue: parseFloat(revenue || 0),
            roas: metrics.spend ? parseFloat(revenue || 0) / parseFloat(metrics.spend) : 0,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });

          synced++;
        } catch (error) {
          console.error(`[v0] Error syncing Meta campaign ${campaign.id}:`, error);
        }
      }
    }
    return synced;
  } catch (error: any) {
    console.error('[v0] Meta sync error:', error);
    throw error;
  }
}

async function syncGoogleCampaigns(connection: any, userId: string): Promise<number> {
  try {
    const customerId = connection.account_id;
    const response = await fetch(`https://googleads.googleapis.com/v14/customers/${customerId}/googleAds:search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
        'developer-token': process.env.GOOGLE_DEVELOPER_TOKEN || '',
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
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error[0].message);

    let synced = 0;
    if (data.results) {
      for (const result of data.results) {
        try {
          const campaign = result.campaign;
          const metrics = result.metrics;
          const spend = metrics.cost_micros ? metrics.cost_micros / 1000000 : 0;
          const revenue = metrics.conversion_value_micros ? metrics.conversion_value_micros / 1000000 : 0;

          await supabaseAdmin.from('campaigns').upsert({
            user_id: userId,
            platform_connection_id: connection.id,
            platform: 'google',
            name: campaign.name,
            status: campaign.status === 1 ? 'active' : 'paused',
            impressions: metrics.impressions || 0,
            clicks: metrics.clicks || 0,
            ctr: metrics.impressions ? (metrics.clicks / metrics.impressions) * 100 : 0,
            spend: spend,
            conversions: metrics.conversions || 0,
            revenue: revenue,
            roas: spend > 0 ? revenue / spend : 0,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });

          synced++;
        } catch (error) {
          console.error(`[v0] Error syncing Google campaign:`, error);
        }
      }
    }
    return synced;
  } catch (error: any) {
    console.error('[v0] Google sync error:', error);
    throw error;
  }
}

async function syncShopifyData(connection: any, userId: string): Promise<number> {
  try {
    const shop = connection.account_id;
    const response = await fetch(`https://${shop}/admin/api/2024-01/orders.json?status=any&limit=250`, {
      headers: {
        'X-Shopify-Access-Token': connection.access_token,
      },
    });

    const data = await response.json();
    if (!data.orders) throw new Error('Failed to fetch Shopify orders');

    let synced = 0;
    for (const order of data.orders) {
      try {
        // Save order as a lead/campaign metric
        await supabaseAdmin.from('analytics').upsert({
          user_id: userId,
          campaign_id: null,
          metric_date: new Date(order.created_at).toISOString().split('T')[0],
          impressions: 0,
          clicks: 0,
          conversions: 1,
          spend: 0,
          revenue: parseFloat(order.total_price || 0),
          created_at: order.created_at,
        }, { onConflict: 'id' });

        synced++;
      } catch (error) {
        console.error(`[v0] Error syncing Shopify order:`, error);
      }
    }
    return synced;
  } catch (error: any) {
    console.error('[v0] Shopify sync error:', error);
    throw error;
  }
}
