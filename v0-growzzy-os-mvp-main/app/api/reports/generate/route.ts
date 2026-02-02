import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { dateRange } = await req.json()

    console.log('[v0] Generating report for date range:', dateRange)

    // Mock data for report generation
    // In production, this would fetch real data from the database and use Claude API for insights
    const mockMetrics = {
      totalSpend: 25450,
      totalRevenue: 76350,
      roas: 3.0,
      conversions: 1234,
      previousPeriodSpend: 20360,
      previousPeriodRevenue: 61080,
    }

    const trends = {
      spendTrend: '+25% vs last period',
      revenueTrend: '+25% vs last period',
      roasAnalysis: '3.0x ROAS (50% above target)',
      performanceRating: '🟢 Excellent',
    }

    const insights = [
      'Meta Instagram campaigns delivered 3.8x ROAS, exceeding target by 52%',
      '"Black Friday Flash Sale" generated $12K revenue from $3K spend in just 5 days',
      'Conversion rate improved 22% after creative refresh on Dec 15',
    ]

    const recommendations = [
      {
        title: 'Budget Reallocation',
        reasoning: 'Meta Instagram delivering 3.8x ROAS vs LinkedIn\'s 0.9x. Move $2,000/month from LinkedIn to Instagram.',
        projectedImpact: '+$5,600/month additional revenue, ROAS improves from 3.0x → 3.4x (Confidence: 87%)',
      },
      {
        title: 'Creative Refresh Needed',
        reasoning: '5 ad creatives running 30+ days with declining CTR. "Summer Sale 2024" CTR down 40%.',
        projectedImpact: 'Expected CTR improvement +25-35%, estimated +$2,800/month revenue (Confidence: 82%)',
      },
      {
        title: 'Audience Expansion',
        reasoning: '"Lookalike 1% - Converters" performing at 4.1x ROAS. Expand to Lookalike 2% and 3%.',
        projectedImpact: '+120,000 reach, projected ROAS 3.2-3.6x, $1,500/week budget required (Confidence: 79%)',
      },
      {
        title: 'Bid Optimization',
        reasoning: '3 campaigns stuck in "Learning" phase for 14+ days. Increase budget by 20% to exit learning.',
        projectedImpact: 'Conversion volume +30%, estimated +$4,200/month revenue (Confidence: 88%)',
      },
      {
        title: 'Seasonal Opportunity',
        reasoning: 'Historical data shows 45% spike in conversions during New Year. Increase January budget by 35%.',
        projectedImpact: '$28,000 estimated revenue from $8,000 spend during peak season (Confidence: 91%)',
      },
    ]

    const report = {
      id: `report_${Date.now()}`,
      title: `Performance Report - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
      generatedAt: new Date().toISOString(),
      summary: `Your marketing campaigns performed excellently this period with a 3.0x ROAS and $76,350 in total revenue. Meta ads consistently outperformed other platforms with exceptional audience engagement and conversion rates. Key wins include the Black Friday campaign achieving 4.2x ROAS and a 22% CTR improvement following creative optimization. However, LinkedIn campaigns underperformed at 0.9x ROAS and should be paused in favor of higher-performing channels. Overall performance is 50% above target with significant optimization opportunities available.`,
      keyInsights: insights,
      recommendations,
      metricsAnalysis: trends,
    }

    console.log('[v0] Report generated successfully:', report.id)

    return NextResponse.json(report)
  } catch (error) {
    console.error('[v0] Report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
