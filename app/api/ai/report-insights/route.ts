import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { metrics } = await req.json()

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "user",
            content: `Analyze this marketing performance data and provide insights:

Total Spend: $${metrics.totalSpend}
Total Revenue: $${metrics.totalRevenue}
ROAS: ${metrics.roas}x
Conversions: ${metrics.conversions}
Avg CTR: ${metrics.avgCTR}%

Platform Performance:
${metrics.platforms.map((p: any) => `${p.name}: Spend $${p.spend} | ROAS ${p.roas}x | Conv ${p.conversions}`).join("\n")}

Top Campaigns:
${metrics.topCampaigns
  .slice(0, 5)
  .map((c: any, i: number) => `${i + 1}. ${c.name}: ROAS ${c.roas}x | Spend $${c.spend}`)
  .join("\n")}

Provide a JSON response with:
{
  "wins": ["array of 3-5 key wins/successes"],
  "concerns": ["array of 3-5 areas of concern"],
  "recommendations": ["array of 5-7 specific, actionable recommendations"]
}

Be specific and use the actual numbers from the data. Return only valid JSON.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    })

    const data = await response.json()
    const content = data.choices[0].message.content

    let insights
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      insights = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : {
            wins: ["Report generated successfully"],
            concerns: ["Manual review recommended"],
            recommendations: ["Continue monitoring campaign performance"],
          }
    } catch {
      insights = {
        wins: ["Report generated successfully"],
        concerns: ["Manual review recommended"],
        recommendations: ["Continue monitoring campaign performance"],
      }
    }

    return NextResponse.json(insights)
  } catch (error: any) {
    console.error("[v0] Error generating insights:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
