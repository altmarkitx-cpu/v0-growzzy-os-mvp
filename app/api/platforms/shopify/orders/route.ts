import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const settings = request.headers.get('x-user-settings');
    if (!settings) {
      return NextResponse.json({ error: 'No integration data found' }, { status: 401 });
    }

    const integrations = JSON.parse(settings);
    const shopifyIntegration = integrations.shopify;

    if (!shopifyIntegration || !shopifyIntegration.connected || !shopifyIntegration.accessToken) {
      return NextResponse.json({ error: 'Shopify not connected' }, { status: 401 });
    }

    // Fetch real orders from Shopify API
    const ordersResponse = await fetch(
      `https://${shopifyIntegration.shop}/admin/api/2024-01/orders.json?status=any&limit=50`,
      {
        headers: {
          'X-Shopify-Access-Token': shopifyIntegration.accessToken,
        },
      }
    );

    if (!ordersResponse.ok) {
      throw new Error('Failed to fetch Shopify orders');
    }

    const ordersData = await ordersResponse.json();
    
    // Transform Shopify orders to leads format
    const leads = ordersData.orders?.map((order: any) => ({
      id: `shopify_${order.id}`,
      name: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || 'Unknown',
      email: order.customer?.email || '',
      phone: order.customer?.phone || '',
      company: order.customer?.company || '',
      status: order.financial_status === 'paid' ? 'qualified' : 'new',
      source: 'Shopify',
      score: Math.floor(Math.random() * 100), // Could be calculated based on order value
      tags: order.tags?.split(', ') || [],
      createdAt: order.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      value: order.total_price || 0,
      platform: 'shopify',
    })) || [];

    return NextResponse.json({ leads });

  } catch (error) {
    console.error('Shopify orders API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Shopify orders' },
      { status: 500 }
    );
  }
}
