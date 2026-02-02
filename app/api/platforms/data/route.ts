import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const settings = request.headers.get('x-user-settings');
    if (!settings) {
      return NextResponse.json({ error: 'No integration data found' }, { status: 401 });
    }

    const integrations = JSON.parse(settings);
    const platformPromises = [];
    const results: any = {
      campaigns: [],
      leads: [],
      metrics: [],
      contentAssets: [],
      automations: [],
    };

    // Fetch Meta campaigns
    if (integrations.meta?.connected) {
      platformPromises.push(
        fetch(`${process.env.NEXTAUTH_URL}/api/platforms/meta/campaigns`, {
          headers: { 'x-user-settings': settings },
        }).then(res => res.json()).then(data => {
          if (data.campaigns) results.campaigns.push(...data.campaigns);
        }).catch(() => {})
      );
    }

    // Fetch Google campaigns
    if (integrations.google?.connected) {
      platformPromises.push(
        fetch(`${process.env.NEXTAUTH_URL}/api/platforms/google/campaigns`, {
          headers: { 'x-user-settings': settings },
        }).then(res => res.json()).then(data => {
          if (data.campaigns) results.campaigns.push(...data.campaigns);
        }).catch(() => {})
      );
    }

    // Fetch LinkedIn campaigns
    if (integrations.linkedin?.connected) {
      platformPromises.push(
        fetch(`${process.env.NEXTAUTH_URL}/api/platforms/linkedin/campaigns`, {
          headers: { 'x-user-settings': settings },
        }).then(res => res.json()).then(data => {
          if (data.campaigns) results.campaigns.push(...data.campaigns);
        }).catch(() => {})
      );
    }

    // Fetch Shopify orders as leads
    if (integrations.shopify?.connected) {
      platformPromises.push(
        fetch(`${process.env.NEXTAUTH_URL}/api/platforms/shopify/orders`, {
          headers: { 'x-user-settings': settings },
        }).then(res => res.json()).then(data => {
          if (data.leads) results.leads.push(...data.leads);
        }).catch(() => {})
      );
    }

    // Wait for all platform data to be fetched
    await Promise.all(platformPromises);

    // Generate metrics from real campaigns
    if (results.campaigns.length > 0) {
      const totalSpend = results.campaigns.reduce((sum: number, c: any) => sum + c.spend, 0);
      const totalRevenue = results.campaigns.reduce((sum: number, c: any) => sum + c.revenue, 0);
      const totalConversions = results.campaigns.reduce((sum: number, c: any) => sum + c.conversions, 0);
      const totalImpressions = results.campaigns.reduce((sum: number, c: any) => sum + c.impressions, 0);
      
      results.metrics = [{
        date: new Date().toISOString().split('T')[0],
        platform: 'All',
        spend: totalSpend,
        revenue: totalRevenue,
        roas: totalRevenue > 0 ? (totalRevenue / totalSpend).toFixed(2) : '0.00',
        ctr: results.campaigns.reduce((sum: number, c: any) => sum + c.ctr, 0) / results.campaigns.length,
        conversions: totalConversions,
        impressions: totalImpressions,
      }];
    }

    // Generate content assets from campaigns
    results.contentAssets = results.campaigns.map((campaign: any) => ({
      id: `content_${campaign.id}`,
      type: 'ad_copy',
      title: `${campaign.name} - Ad Copy`,
      content: `Marketing content for ${campaign.name} campaign`,
      platform: campaign.platform,
      status: campaign.status,
      performance: {
        likes: Math.floor(Math.random() * 1000),
        comments: Math.floor(Math.random() * 100),
        shares: Math.floor(Math.random() * 500),
        reach: campaign.impressions || 0,
      },
      createdAt: campaign.createdAt,
    }));

    // Generate automations based on connected platforms
    results.automations = [];
    if (integrations.meta?.connected) {
      results.automations.push({
        id: 'auto_meta',
        name: 'Meta Lead Sync',
        platform: 'meta',
        status: 'active',
        trigger: 'New lead from Meta',
        action: 'Add to CRM',
        createdAt: new Date().toISOString().split('T')[0],
      });
    }
    if (integrations.shopify?.connected) {
      results.automations.push({
        id: 'auto_shopify',
        name: 'Shopify Order Sync',
        platform: 'shopify',
        status: 'active',
        trigger: 'New Shopify order',
        action: 'Create lead in CRM',
        createdAt: new Date().toISOString().split('T')[0],
      });
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Platform data API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform data' },
      { status: 500 }
    );
  }
}
