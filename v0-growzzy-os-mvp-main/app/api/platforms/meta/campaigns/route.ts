import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get user's Meta integration data from localStorage or database
    const settings = request.headers.get('x-user-settings');
    if (!settings) {
      return NextResponse.json({ error: 'No integration data found' }, { status: 401 });
    }

    const integrations = JSON.parse(settings);
    const metaIntegration = integrations.meta;

    if (!metaIntegration || !metaIntegration.connected || !metaIntegration.accessToken) {
      return NextResponse.json({ error: 'Meta not connected' }, { status: 401 });
    }

    // Fetch real campaigns from Meta Graph API
    const campaignsResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/adcampaigns?fields=name,status,spend,revenue,ctr,cpc,conversions,impressions,created_time&limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${metaIntegration.accessToken}`,
        },
      }
    );

    if (!campaignsResponse.ok) {
      throw new Error('Failed to fetch Meta campaigns');
    }

    const campaignsData = await campaignsResponse.json();
    
    // Transform Meta data to our format
    const campaigns = campaignsData.data?.map((campaign: any) => ({
      id: campaign.id,
      name: campaign.name,
      platform: 'meta',
      status: campaign.status,
      spend: campaign.spend || 0,
      revenue: campaign.revenue || 0,
      roas: campaign.revenue && campaign.spend > 0 ? (campaign.revenue / campaign.spend).toFixed(2) : '0.00',
      ctr: campaign.ctr || 0,
      cpc: campaign.cpc || 0,
      conversions: campaign.conversions || 0,
      impressions: campaign.impressions || 0,
      createdAt: campaign.created_time?.split('T')[0] || new Date().toISOString().split('T')[0],
    })) || [];

    return NextResponse.json({ campaigns });

  } catch (error) {
    console.error('Meta campaigns API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Meta campaigns' },
      { status: 500 }
    );
  }
}
