import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

export async function generateRecommendations(campaignData: {
  name: string
  platform: string
  spend: number
  revenue: number
  roas: number
  ctr: number
  conversions: number
  industry: string
  durationDays: number
}) {
  try {
    const prompt = `Analyze this marketing campaign data and provide 5 specific, actionable recommendations:

Campaign: ${campaignData.name}
Platform: ${campaignData.platform}
Spend: $${campaignData.spend.toFixed(2)}
Revenue: $${campaignData.revenue.toFixed(2)}
ROAS: ${campaignData.roas}x
CTR: ${campaignData.ctr}%
Conversions: ${campaignData.conversions}
Industry: ${campaignData.industry}
Duration: ${campaignData.durationDays} days

For each recommendation provide:
1. Issue/Opportunity identified
2. Specific action to take
3. Expected impact (in %)
4. Priority (High/Medium/Low)
5. Estimated implementation time

Format as JSON array with objects containing: issue, action, expectedImpact, priority, timeToImplement`

    const message = await client.messages.create({
      model: "claude-opus-4-1-20250805",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    const content = message.content[0]
    if (content.type === "text") {
      try {
        return JSON.parse(content.text)
      } catch {
        return [
          {
            issue: "Analysis complete",
            action: content.text,
            expectedImpact: 0,
            priority: "Medium",
            timeToImplement: "1-2 hours",
          },
        ]
      }
    }

    return []
  } catch (error) {
    console.error("[v0] Claude recommendation error:", error)
    return []
  }
}

export async function generateAIInsights(metrics: {
  spend: number
  revenue: number
  roas: number
  conversions: number
}) {
  try {
    const message = await client.messages.create({
      model: "claude-opus-4-1-20250805",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `Based on these metrics, provide a brief (2-3 sentences) AI insight about campaign performance:
Spend: $${metrics.spend.toFixed(2)}
Revenue: $${metrics.revenue.toFixed(2)}
ROAS: ${metrics.roas}x
Conversions: ${metrics.conversions}

Focus on what's working well and what needs attention.`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type === "text") {
      return content.text
    }
    return "No insights available"
  } catch (error) {
    console.error("[v0] Claude insights error:", error)
    return "Unable to generate insights at this time"
  }
}
