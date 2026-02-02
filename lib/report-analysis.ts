import { generateText, generateObject } from 'ai';
import { z } from 'zod';

export interface CampaignMetrics {
  totalSpend: number;
  totalRevenue: number;
  roas: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  ctr: number;
  cpc: number;
  campaigns: Array<{
    id: string;
    name: string;
    platform: string;
    spend: number;
    revenue: number;
    roas: number;
    conversions: number;
  }>;
  platformBreakdown: Record<string, {
    spend: number;
    revenue: number;
    count: number;
    roas: number;
  }>;
}

const ReportInsightsSchema = z.object({
  executiveSummary: z.object({
    keyWins: z.array(z.string()).describe('Top 3-4 key wins and successes'),
    areasOfConcern: z.array(z.string()).describe('Top 2-3 areas needing improvement'),
    overallTrend: z.string().describe('One sentence describing overall performance trend'),
  }),
  performanceAnalysis: z.object({
    roasAnalysis: z.string().describe('Analysis of ROAS performance with recommendations'),
    platformPerformance: z.string().describe('Which platforms are performing best and why'),
    conversionAnalysis: z.string().describe('Analysis of conversion rates and optimization opportunities'),
  }),
  recommendations: z.array(z.object({
    title: z.string(),
    description: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    estimatedImpact: z.string(),
  })).describe('Specific, actionable recommendations prioritized by impact'),
  psychologicalInsights: z.array(z.string()).describe('Psychological/behavioral insights about audience based on performance'),
});

export type ReportInsights = z.infer<typeof ReportInsightsSchema>;

/**
 * Generate AI-powered insights for campaign metrics using Claude
 */
export async function generateReportInsights(metrics: CampaignMetrics): Promise<ReportInsights> {
  const metricsContext = `
Marketing Campaign Performance Summary:
- Total Spend: $${metrics.totalSpend.toFixed(2)}
- Total Revenue: $${metrics.totalRevenue.toFixed(2)}
- Return on Ad Spend (ROAS): ${metrics.roas.toFixed(2)}x
- Total Impressions: ${metrics.totalImpressions.toLocaleString()}
- Total Clicks: ${metrics.totalClicks.toLocaleString()}
- Click-Through Rate: ${metrics.ctr.toFixed(2)}%
- Cost Per Click: $${metrics.cpc.toFixed(2)}
- Total Conversions: ${metrics.totalConversions}
- Active Campaigns: ${metrics.campaigns.length}

Platform Breakdown:
${Object.entries(metrics.platformBreakdown)
  .map(([platform, data]) => 
    `${platform.toUpperCase()}: ${data.count} campaigns, $${data.spend.toFixed(2)} spent, $${data.revenue.toFixed(2)} revenue, ${data.roas.toFixed(2)}x ROAS`
  )
  .join('\n')}

Top 5 Performing Campaigns:
${metrics.campaigns
  .sort((a, b) => b.roas - a.roas)
  .slice(0, 5)
  .map((c, i) => `${i + 1}. ${c.name} (${c.platform}): ${c.roas.toFixed(2)}x ROAS, $${c.revenue.toFixed(2)} revenue`)
  .join('\n')}
`;

  try {
    const result = await generateObject({
      model: 'anthropic/claude-3-5-sonnet-20241022',
      schema: ReportInsightsSchema,
      prompt: `You are an expert marketing analyst. Analyze these campaign metrics and provide deep, actionable insights:

${metricsContext}

Provide comprehensive analysis including:
1. Key wins - what's working well
2. Areas of concern - what needs improvement
3. Performance analysis broken down by ROAS, platform, and conversions
4. Specific, high-impact recommendations with estimated impact
5. Psychological insights about the audience based on their performance patterns

Focus on insights that are specific to these numbers, not generic advice. Each recommendation should be tied to data.`,
      temperature: 0.7,
    });

    return result.object;
  } catch (error) {
    console.error('[v0] Error generating report insights:', error);
    throw new Error('Failed to generate AI insights for report');
  }
}

/**
 * Generate AI recommendations for campaign optimization
 */
export async function generateRecommendations(metrics: CampaignMetrics, insights: ReportInsights) {
  const prompt = `Based on this performance data and analysis, generate 5 specific, prioritized action items:

Metrics:
- Current ROAS: ${metrics.roas.toFixed(2)}x
- Conversion Rate: ${((metrics.totalConversions / metrics.totalClicks) * 100).toFixed(2)}%
- CTR: ${metrics.ctr.toFixed(2)}%

Key Issues:
${insights.performanceAnalysis.roasAnalysis}

For each recommendation, specify:
1. What to do
2. Why it will help
3. Expected impact (% improvement)
4. Timeline (immediate, 1-2 weeks, ongoing)
`;

  try {
    const result = await generateText({
      model: 'anthropic/claude-3-5-sonnet-20241022',
      prompt,
      temperature: 0.7,
    });

    return result.text;
  } catch (error) {
    console.error('[v0] Error generating recommendations:', error);
    throw new Error('Failed to generate recommendations');
  }
}

/**
 * Generate psychological profiling of audience based on performance
 */
export async function analyzePsychologicalInsights(metrics: CampaignMetrics): Promise<string[]> {
  const prompt = `As a marketing psychologist, analyze this campaign data and provide insights about the audience's behavior, motivations, and psychology:

- ROAS: ${metrics.roas.toFixed(2)}x
- CTR: ${metrics.ctr.toFixed(2)}% (higher = more attention-grabbing messaging)
- Conversion Rate: ${((metrics.totalConversions / metrics.totalClicks) * 100).toFixed(2)}%
- Platforms performing best: ${Object.entries(metrics.platformBreakdown).map(([p, d]) => p).join(', ')}

Provide 4-5 key psychological insights about what these metrics reveal about the audience, their pain points, objection patterns, and purchasing psychology.

Format as a numbered list.`;

  try {
    const result = await generateText({
      model: 'anthropic/claude-3-5-sonnet-20241022',
      prompt,
      temperature: 0.7,
    });

    return result.text.split('\n').filter(line => line.trim().length > 0);
  } catch (error) {
    console.error('[v0] Error analyzing psychological insights:', error);
    return [];
  }
}
