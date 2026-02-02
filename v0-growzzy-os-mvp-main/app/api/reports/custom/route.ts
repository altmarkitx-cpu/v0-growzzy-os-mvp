import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateText } from 'ai';
import { ReportBuilder, type ReportConfig, type ReportData } from '@/lib/report-builder';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      config = {
        title: 'Custom Marketing Report',
        includeMetrics: true,
        includePlatformBreakdown: true,
        includeTopCampaigns: true,
        includeInsights: true,
        includeRecommendations: true,
      },
      dateFrom,
      dateTo,
    } = body as { config?: Partial<ReportConfig>; dateFrom?: string; dateTo?: string };

    console.log('[v0] Building custom report for user:', user.id);

    // Get campaigns data
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('created_at', dateTo || new Date().toISOString());

    // Get leads data
    const { data: leads } = await supabase.from('leads').select('*').eq('user_id', user.id);

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json(
        { error: 'No campaign data available for the selected period' },
        { status: 400 }
      );
    }

    // Calculate metrics
    const totalSpend = (campaigns || []).reduce((sum: number, c: any) => sum + (c.spend || 0), 0);
    const totalRevenue = (campaigns || []).reduce((sum: number, c: any) => sum + (c.revenue || 0), 0);
    const totalImpressions = (campaigns || []).reduce((sum: number, c: any) => sum + (c.impressions || 0), 0);
    const totalClicks = (campaigns || []).reduce((sum: number, c: any) => sum + (c.clicks || 0), 0);
    const totalConversions = (campaigns || []).reduce((sum: number, c: any) => sum + (c.conversions || 0), 0);
    const roas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : '0';
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0';
    const cpc = totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : '0';

    // Group by platform
    const platformBreakdown = (campaigns || []).reduce((acc: any, c: any) => {
      if (!acc[c.platform]) {
        acc[c.platform] = { spend: 0, revenue: 0, count: 0, roas: 0 };
      }
      acc[c.platform].spend += c.spend || 0;
      acc[c.platform].revenue += c.revenue || 0;
      acc[c.platform].count += 1;
      return acc;
    }, {});

    // Calculate platform ROAS
    Object.keys(platformBreakdown).forEach(platform => {
      const platformData = platformBreakdown[platform];
      platformData.roas = platformData.spend > 0 ? (platformData.revenue / platformData.spend).toFixed(2) : '0';
    });

    let insights = '';
    let recommendations = '';

    // Generate AI insights if requested
    if (config.includeInsights) {
      console.log('[v0] Generating AI insights...');
      const insightsPrompt = `Analyze these marketing campaign metrics and provide 4-5 specific, actionable insights:

Campaign Summary:
- Total Spend: $${totalSpend.toFixed(2)}
- Total Revenue: $${totalRevenue.toFixed(2)}
- ROAS: ${roas}x
- Total Impressions: ${totalImpressions.toLocaleString()}
- Total Clicks: ${totalClicks.toLocaleString()}
- Click-Through Rate (CTR): ${ctr}%
- Cost Per Click (CPC): $${cpc}
- Total Conversions: ${totalConversions}
- Active Campaigns: ${campaigns?.length || 0}

Platform Breakdown:
${Object.entries(platformBreakdown)
  .map(([platform, data]: [string, any]) => 
    `- ${platform}: ${data.count} campaigns, $${data.spend.toFixed(2)} spent, $${data.revenue.toFixed(2)} revenue, ROAS: ${data.roas}x`
  )
  .join('\n')}

Top Performing Campaigns:
${campaigns
  ?.slice(0, 5)
  .map((c: any) => `- ${c.name}: $${(c.revenue || 0).toFixed(2)} revenue, ROAS: ${(c.roas || 0).toFixed(2)}x`)
  .join('\n')}

Focus on:
1. Performance trends (what's working well)
2. Areas of concern (underperforming metrics)
3. Comparison between platforms
4. Specific recommendations for optimization`;

      const result = await generateText({
        model: 'openai/gpt-4-mini',
        prompt: insightsPrompt,
      });
      insights = result.text;
    }

    // Generate recommendations if requested
    if (config.includeRecommendations) {
      console.log('[v0] Generating AI recommendations...');
      const recommendationsPrompt = `Based on these marketing metrics, provide 5-7 specific, prioritized recommendations to improve ROI:

Current Metrics:
- ROAS: ${roas}x
- CTR: ${ctr}%
- CPC: $${cpc}
- Conversion Count: ${totalConversions}
- Active Campaigns: ${campaigns?.length || 0}

Platform Performance:
${Object.entries(platformBreakdown)
  .map(([platform, data]: [string, any]) => `- ${platform}: ROAS ${data.roas}x (${data.count} campaigns)`)
  .join('\n')}

For each recommendation:
1. Be specific about the action
2. Explain the expected impact
3. Prioritize by potential ROI improvement`;

      const result = await generateText({
        model: 'openai/gpt-4-mini',
        prompt: recommendationsPrompt,
      });
      recommendations = result.text;
    }

    // Build report
    console.log('[v0] Building PDF report...');
    const finalConfig: ReportConfig = {
      title: config.title || 'Custom Marketing Report',
      includeMetrics: config.includeMetrics !== false,
      includePlatformBreakdown: config.includePlatformBreakdown !== false,
      includeTopCampaigns: config.includeTopCampaigns !== false,
      includeInsights: config.includeInsights !== false,
      includeRecommendations: config.includeRecommendations !== false,
    };

    const reportData: ReportData = {
      totalSpend,
      totalRevenue,
      roas,
      ctr,
      cpc,
      conversions: totalConversions,
      campaigns: (campaigns || []).sort((a, b) => (b.revenue || 0) - (a.revenue || 0)),
      leads: leads || [],
      platformBreakdown,
      insights,
      recommendations,
    };

    const reportBuilder = new ReportBuilder(finalConfig, reportData);
    const pdfBuffer = reportBuilder.getBuffer();

    // Save report to database
    const reportTitle = `Report - ${new Date().toLocaleDateString()}`;
    const reportMetrics = {
      totalSpend,
      totalRevenue,
      roas: parseFloat(roas),
      ctr: parseFloat(ctr),
      cpc: parseFloat(cpc),
      conversions: totalConversions,
      campaigns: campaigns?.length || 0,
      platformBreakdown,
    };

    await supabase.from('reports').insert({
      user_id: user.id,
      title: reportTitle,
      type: 'custom',
      status: 'completed',
      metrics: reportMetrics,
      insights,
      recommendations,
      generated_at: new Date().toISOString(),
      period_start: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      period_end: dateTo || new Date().toISOString().split('T')[0],
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="report-custom-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('[v0] Custom report generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate custom report' },
      { status: 500 }
    );
  }
}
