import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const range = searchParams.get('range') || '30d'

    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // TODO: In production, fetch from database based on authenticated user
    // For now, return mock data structure that the frontend expects

    const mockCampaigns = [
      {
        id: '1',
        name: 'Black Friday Flash Sale',
        platform: 'meta',
        status: 'active',
        spend: 3200,
        revenue: 13440,
        conversions: 345,
        roas: 4.2,
        ctr: 3.8,
      },
      {
        id: '2',
        name: 'Holiday Gift Guide',
        platform: 'meta',
        status: 'active',
        spend: 4100,
        revenue: 15990,
        conversions: 412,
        roas: 3.9,
        ctr: 3.5,
      },
      {
        id: '3',
        name: 'New Customer Acquisition',
        platform: 'google',
        status: 'active',
        spend: 2800,
        revenue: 7840,
        conversions: 224,
        roas: 2.8,
        ctr: 2.1,
      },
    ]

    const totalSpend = mockCampaigns.reduce((sum, c) => sum + c.spend, 0)
    const totalRevenue = mockCampaigns.reduce((sum, c) => sum + c.revenue, 0)
    const totalConversions = mockCampaigns.reduce((sum, c) => sum + c.conversions, 0)

    const metrics = {
      totalSpend,
      totalRevenue,
      roas: totalRevenue / totalSpend,
      conversions: totalConversions,
      ctr: 3.1,
      cpc: 1.25,
      previousPeriodSpend: totalSpend * 0.9,
      previousPeriodRevenue: totalRevenue * 0.85,
      campaigns: mockCampaigns,
      platformBreakdown: [
        { platform: 'Meta', spend: 7300, revenue: 29430 },
        { platform: 'Google', spend: 2800, revenue: 7840 },
      ],
      trendData: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        spend: Math.floor(Math.random() * 500 + 300),
        revenue: Math.floor(Math.random() * 1500 + 1000),
      })),
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('[v0] Dashboard metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
