import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const settings = request.headers.get('x-user-settings');
    if (!settings) {
      return NextResponse.json({ error: 'No integration data found' }, { status: 401 });
    }

    const integrations = JSON.parse(settings);
    const googleIntegration = integrations.google;

    if (!googleIntegration || !googleIntegration.connected || !googleIntegration.accessToken) {
      return NextResponse.json({ error: 'Google not connected' }, { status: 401 });
    }

    // Fetch real campaigns from Google Ads API
    const campaignsResponse = await fetch(
      'https://googleads.googleapis.com/v16/customers:listAccessibleCustomers',
      {
        headers: {
          'Authorization': `Bearer ${googleIntegration.accessToken}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        },
      }
    );

    if (!campaignsResponse.ok) {
      throw new Error('Failed to fetch Google Ads customers');
    }

    const customersData = await campaignsResponse.json();
    const customers = customersData.resourceNames || [];

    // For each customer, fetch campaigns
    const allCampaigns = [];
    for (const customer of customers.slice(0, 5)) { // Limit to first 5 customers
      const customerId = customer.split('/')[1];
      
      const campaignResponse = await fetch(
        `https://googleads.googleapis.com/v16/customers/${customerId}:search`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${googleIntegration.accessToken}`,
            'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              SELECT 
                campaign.id,
                campaign.name,
                campaign.status,
                metrics.cost_micros,
                metrics.conversions,
                metrics.impressions,
                metrics.clicks,
                metrics.ctr,
                metrics.average_cpc
              FROM campaign
              WHERE campaign.status != 'REMOVED'
              LIMIT 50
            `,
          }),
        }
      );

      if (campaignResponse.ok) {
        const campaignData = await campaignResponse.json();
        const campaigns = campaignData.results?.map((result: any) => ({
          id: result.campaign.id,
          name: result.campaign.name,
          platform: 'google',
          status: result.campaign.status.toLowerCase(),
          spend: (result.metrics.costMicros || 0) / 1000000, // Convert micros to dollars
          revenue: 0, // Google Ads doesn't provide revenue directly
          roas: '0.00',
          ctr: (result.metrics.ctr || 0) * 100, // Convert to percentage
          cpc: (result.metrics.averageCpc || 0) / 1000000, // Convert micros to dollars
          conversions: result.metrics.conversions || 0,
          impressions: result.metrics.impressions || 0,
          createdAt: new Date().toISOString().split('T')[0],
        })) || [];

        allCampaigns.push(...campaigns);
      }
    }

    return NextResponse.json({ campaigns: allCampaigns });

  } catch (error) {
    console.error('Google campaigns API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Google campaigns' },
      { status: 500 }
    );
  }
}
