/**
 * Adaptive daily brief — derives the brief structure from the actual data
 * instead of forcing a fixed 4-field shape. Sections appear only when they
 * have real signal, and the summary is generated dynamically based on what
 * matters most for this account.
 */
import { getOpenAI } from "@/lib/openai"
import { UTILITY_MODEL } from "@/lib/ai-utility"
import { log } from "@/lib/logger"
import type { Campaign, CampaignMetricDaily } from "@prisma/client"

type CampaignWithMetrics = Pick<
  Campaign,
  "id" | "name" | "status" | "platform" | "spend" | "budgetAmount" |
  "impressions" | "clicks" | "conversions" | "revenue" | "ctr" | "cpc" | "cpa" | "roas" | "hasCreative"
> & {
  metricsDaily?: Pick<CampaignMetricDaily, "metricDate" | "spend" | "clicks" | "impressions" | "conversions" | "revenue" | "ctr" | "roas" | "cpa">[]
}

export type BriefSection = {
  id: string
  title: string
  kind: "alert" | "metric-row" | "list" | "narrative" | "action"
  data: unknown
  priority: number
}

export type AdaptiveDailyBrief = {
  archetype: "healthy-growth" | "needs-optimization" | "crisis-recovery" | "early-stage" | "dormant"
  archetypeReason: string
  summary: string
  sections: BriefSection[]
  topIssue: string | null
  accountHealthScore: number
}

function detectArchetype(campaigns: CampaignWithMetrics[]): AdaptiveDailyBrief["archetype"] {
  if (campaigns.length === 0) return "dormant"
  const totalSpend = campaigns.reduce((s, c) => Number(s + (c.spend || 0)), 0)
  const totalRevenue = campaigns.reduce((s, c) => s + Number(c.revenue || 0), 0)
  const totalConversions = campaigns.reduce((s, c) => s + Number(c.conversions || 0), 0)
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const zeroConvCampaigns = campaigns.filter((c) => Number(c.spend || 0) > 50 && Number(c.conversions || 0) === 0).length

  if (totalSpend < 100) return "early-stage"
  if (roas < 0.5 && zeroConvCampaigns > 0) return "crisis-recovery"
  if (zeroConvCampaigns > campaigns.length / 2) return "needs-optimization"
  if (roas > 2) return "healthy-growth"
  return "needs-optimization"
}

function deriveSections(campaigns: CampaignWithMetrics[]): BriefSection[] {
  const sections: BriefSection[] = []
  let priority = 0

  // Section 1: Crisis alert — only if there are zero-conversion campaigns
  const zeroConv = campaigns
    .filter((c) => Number(c.spend || 0) > 50 && Number(c.conversions || 0) === 0)
    .sort((a, b) => Number(b.spend || 0) - Number(a.spend || 0))
    .slice(0, 5)
  if (zeroConv.length > 0) {
    const totalWaste = zeroConv.reduce((s, c) => s + Number(c.spend || 0), 0)
    sections.push({
      id: "waste-alert",
      title: "Spend With Zero Conversions",
      kind: "alert",
      data: {
        totalWaste: `$${Math.round(totalWaste).toLocaleString()}`,
        campaigns: zeroConv.map((c) => ({ name: c.name, spend: Number(c.spend || 0) })),
      },
      priority: priority++,
    })
  }

  // Section 2: Creative fatigue — only if CTR is declining
  const fatiguing = campaigns
    .map((c) => {
      const rows = [...(c.metricsDaily || [])].sort((a, b) => Number(b.metricDate) - Number(a.metricDate))
      if (rows.length < 6) return null
      const ctr3 = rows.slice(0, 3).reduce((s, r) => s + Number(r.clicks || 0), 0) / Math.max(1, rows.slice(0, 3).reduce((s, r) => s + Number(r.impressions || 0), 0))
      const ctr7 = rows.slice(0, 7).reduce((s, r) => s + Number(r.clicks || 0), 0) / Math.max(1, rows.slice(0, 7).reduce((s, r) => s + Number(r.impressions || 0), 0))
      const decline = ctr7 > 0 ? ((ctr7 - ctr3) / ctr7) * 100 : 0
      return decline >= 20 ? { name: c.name, declinePct: decline.toFixed(0) } : null
    })
    .filter(Boolean) as Array<{ name: string; declinePct: string }>
  if (fatiguing.length > 0) {
    sections.push({
      id: "fatigue",
      title: "Creative Fatigue Detected",
      kind: "list",
      data: fatiguing.map((f) => `${f.name} — CTR down ${f.declinePct}% vs prior week`),
      priority: priority++,
    })
  }

  // Section 3: Scale candidates — only if there are high-ROAS campaigns
  const scalable = campaigns
    .filter((c) => Number(c.roas || 0) > 2 && Number(c.spend || 0) > 50)
    .sort((a, b) => Number(b.roas || 0) - Number(a.roas || 0))
    .slice(0, 3)
  if (scalable.length > 0) {
    sections.push({
      id: "scale",
      title: "Ready to Scale",
      kind: "list",
      data: scalable.map((c) => `${c.name} — ${Number(c.roas || 0).toFixed(2)}x ROAS on $${Math.round(Number(c.spend || 0))}`),
      priority: priority++,
    })
  }

  // Section 4: Account health — only if there are campaigns to score
  if (campaigns.length > 0) {
    const totalSpend = campaigns.reduce((s, c) => s + Number(c.spend || 0), 0)
    const totalRevenue = campaigns.reduce((s, c) => s + Number(c.revenue || 0), 0)
    const totalClicks = campaigns.reduce((s, c) => s + Number(c.clicks || 0), 0)
    const totalImpressions = campaigns.reduce((s, c) => s + Number(c.impressions || 0), 0)
    sections.push({
      id: "health",
      title: "Account Snapshot",
      kind: "metric-row",
      data: [
        { label: "Campaigns", value: campaigns.length.toString() },
        { label: "Spend", value: `$${Math.round(totalSpend).toLocaleString()}` },
        { label: "Revenue", value: `$${Math.round(totalRevenue).toLocaleString()}` },
        { label: "ROAS", value: totalSpend > 0 ? `${(totalRevenue / totalSpend).toFixed(2)}x` : "—" },
        { label: "CTR", value: totalImpressions > 0 ? `${((totalClicks / totalImpressions) * 100).toFixed(2)}%` : "—" },
      ],
      priority: priority++,
    })
  }

  return sections.sort((a, b) => a.priority - b.priority)
}

async function generateSummary(
  archetype: AdaptiveDailyBrief["archetype"],
  campaigns: CampaignWithMetrics[],
): Promise<string> {
  if (!process.env.OPENAI_API_KEY || campaigns.length === 0) {
    if (campaigns.length === 0) return "No campaigns synced yet. Connect an ad account to start the daily brief."
    const totalSpend = campaigns.reduce((s, c) => s + Number(c.spend || 0), 0)
    return `${campaigns.length} campaigns, $${Math.round(totalSpend).toLocaleString()} spend.`
  }
  try {
    const openai = getOpenAI()
    const totalSpend = campaigns.reduce((s, c) => s + Number(c.spend || 0), 0)
    const totalRevenue = campaigns.reduce((s, c) => s + Number(c.revenue || 0), 0)
    const prompt = `Write a 1-2 sentence daily brief summary for a marketer.

Archetype: ${archetype}
Campaigns: ${campaigns.length}
Spend: $${totalSpend.toFixed(0)}
Revenue: $${totalRevenue.toFixed(0)}

Rules:
- Lead with the most important action for this archetype.
- If "crisis-recovery", name the waste.
- If "healthy-growth", name the scale opportunity.
- If "early-stage", say what's needed next.
- If "dormant", say nothing is connected.
- Under 40 words. No filler.`
    const completion = await openai.chat.completions.create({
      model: UTILITY_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 120,
    })
    return completion.choices[0]?.message?.content?.trim() || "Daily brief ready."
  } catch (err) {
    log("warn", "adaptive-daily-brief", "summary failed", { message: (err as Error).message })
    return `${campaigns.length} campaigns analyzed.`
  }
}

function computeAccountHealth(campaigns: CampaignWithMetrics[]): number {
  if (campaigns.length === 0) return 0
  const totalSpend = campaigns.reduce((s, c) => s + Number(c.spend || 0), 0)
  const totalRevenue = campaigns.reduce((s, c) => s + Number(c.revenue || 0), 0)
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const zeroConvRate = campaigns.filter((c) => Number(c.spend || 0) > 50 && Number(c.conversions || 0) === 0).length / campaigns.length
  // 0-100 score: roas contributes up to 60, conversion rate up to 40
  return Math.round(Math.min(60, roas * 20) + Math.max(0, 40 - zeroConvRate * 40))
}

export async function buildAdaptiveDailyBrief(campaigns: CampaignWithMetrics[]): Promise<AdaptiveDailyBrief> {
  const archetype = detectArchetype(campaigns)
  const sections = deriveSections(campaigns)
  const summary = await generateSummary(archetype, campaigns)
  const accountHealthScore = computeAccountHealth(campaigns)
  const topIssue = sections[0]?.title ?? null
  const archetypeReason = {
    "healthy-growth": "ROAS is strong — focus on scaling winners.",
    "needs-optimization": "Some campaigns need attention — focus on the worst performers first.",
    "crisis-recovery": "Significant waste detected — pause losing campaigns before optimizing further.",
    "early-stage": "Account is in early testing — need more data before optimization.",
    "dormant": "No campaigns synced yet — connect an ad account to begin.",
  }[archetype]
  return { archetype, archetypeReason, summary, sections, topIssue, accountHealthScore }
}
