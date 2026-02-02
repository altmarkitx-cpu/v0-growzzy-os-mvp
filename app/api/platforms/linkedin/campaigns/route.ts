import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const settings = request.headers.get('x-user-settings');
    if (!settings) {
      return NextResponse.json({ error: 'No integration data found' }, { status: 401 });
    }

    const integrations = JSON.parse(settings);
    const linkedinIntegration = integrations.linkedin;

    if (!linkedinIntegration || !linkedinIntegration.connected || !linkedinIntegration.accessToken) {
      return NextResponse.json({ error: 'LinkedIn not connected' }, { status: 401 });
    }

    // Fetch real campaigns from LinkedIn Marketing API
    const campaignsResponse = await fetch(
      'https://api.linkedin.com/v2/adCampaigns?q=search&search=',
      {
        headers: {
          'Authorization': `Bearer ${linkedinIntegration.accessToken}`,
        },
      }
    );

    if (!campaignsResponse.ok) {
      throw new Error('Failed to fetch LinkedIn campaigns');
    }

    const campaignsData = await campaignsResponse.json();
    
    // Transform LinkedIn data to our format
    const campaigns = campaignsData.elements?.map((campaign: any) => ({
      id: campaign.id,
      name: campaign.name,
      platform: 'linkedin',
      status: campaign.status.toLowerCase(),
      spend: campaign.cost?.totalAmount || 0,
      revenue: 0, // LinkedIn doesn't provide revenue directly
      roas: '0.00',
      ctr: campaign.metrics?.ctr || 0,
      cpc: campaign.metrics?.cpc || 0,
      conversions: campaign.metrics?.conversions || 0,
      impressions: campaign.metrics?.impressions || 0,
      createdAt: campaign.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    })) || [];

    return NextResponse.json({ campaigns });

  } catch (error) {
    console.error('LinkedIn campaigns API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LinkedIn campaigns' },
      { status: 500 }
    );
  }
}
