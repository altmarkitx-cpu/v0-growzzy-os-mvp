/**
 * Adaptive report engine — generates report structure dynamically from the
 * actual data, industry, and user preferences instead of forcing one of a
 * handful of static HTML templates.
 *
 * The flow:
 * 1. detectReportShape() — looks at the data and picks the best report
 *    archetype (efficiency, growth, decline-recovery, experimental, weekly).
 * 2. deriveSections() — generates a section list tailored to the data
 *    (skip sections that have no signal, add sections that surface real
 *    issues like creative fatigue or budget reallocation).
 * 3. generateNarrative() — uses the LLM to write the executive summary
 *    grounded ONLY in the data, with industry-aware framing.
 * 4. buildAdaptiveHTML() — composes a styled HTML page from the derived
 *    sections, no fixed template.
 */
import { getOpenAI } from "@/lib/openai"
import { UTILITY_MODEL } from "@/lib/ai-utility"
import { log } from "@/lib/logger"

export type ReportArchetype =
  | "efficiency-review"
  | "growth-summary"
  | "decline-recovery"
  | "experimental"
  | "weekly-snapshot"
  | "audit-findings"

export type ReportSection = {
  id: string
  title: string
  kind: "kpi-row" | "table" | "chart" | "narrative" | "list" | "callout"
  data: unknown
  priority: number
}

export type DerivedReport = {
  archetype: ReportArchetype
  archetypeReason: string
  sections: ReportSection[]
  executiveSummary: string
  recommendedActions: { title: string; reason: string; impact: "high" | "med" | "low" }[]
}

type ReportDataShape = {
  totalSpend: number
  totalRevenue: number
  totalConversions: number
  totalClicks: number
  totalImpressions: number
  blendedRoas: number
  avgCtr: number
  avgCpc: number
  avgCpa: number
  campaignCount: number
  activeCampaigns: number
  topCampaigns: Array<{ name: string; roas: number; spend: number; revenue: number }>
  bottomCampaigns: Array<{ name: string; roas: number; spend: number; revenue: number }>
  platformBreakdown: Record<string, { spend: number; revenue: number; roas: number }>
  dailyMetrics: Array<{ date: string; spend: number; revenue: number; clicks: number; conversions: number }>
  periodDays: number
  industry?: string | null
}

function detectReportShape(data: ReportDataShape): { archetype: ReportArchetype; reason: string } {
  // 1. Short period → weekly snapshot
  if (data.periodDays <= 7) {
    return { archetype: "weekly-snapshot", reason: "Period is 7 days or less — weekly snapshot is the right cadence." }
  }
  // 2. Heavy spend, zero conversions → audit findings
  if (data.totalSpend > 500 && data.totalConversions === 0) {
    return { archetype: "audit-findings", reason: `Account has $${Math.round(data.totalSpend)} spend with 0 conversions — audit-level investigation is needed before optimization.` }
  }
  // 3. Blended ROAS below 1 → decline recovery
  if (data.blendedRoas < 1 && data.totalSpend > 100) {
    return { archetype: "decline-recovery", reason: `Blended ROAS is ${data.blendedRoas.toFixed(2)}x — recovery playbook applies.` }
  }
  // 4. Single platform, low campaign count → experimental
  if (data.campaignCount <= 3 && Object.keys(data.platformBreakdown).length === 1) {
    return { archetype: "experimental", reason: "Single-platform, low-campaign account — experimental framing fits." }
  }
  // 5. High spend, high revenue → growth summary
  if (data.totalRevenue > data.totalSpend * 2) {
    return { archetype: "growth-summary", reason: `Revenue is ${(data.totalRevenue / Math.max(1, data.totalSpend)).toFixed(1)}x spend — growth story applies.` }
  }
  // 6. Default → efficiency review
  return { archetype: "efficiency-review", reason: "Account has mixed performance across campaigns — efficiency review surfaces the variance." }
}

function deriveSections(data: ReportDataShape): ReportSection[] {
  const sections: ReportSection[] = []
  let priority = 0

  // Always: KPI row, but only KPIs that have signal
  const kpis: Array<{ label: string; value: string; delta?: string }> = []
  if (data.totalSpend > 0) kpis.push({ label: "Total Spend", value: `$${Math.round(data.totalSpend).toLocaleString()}` })
  if (data.totalRevenue > 0) kpis.push({ label: "Revenue", value: `$${Math.round(data.totalRevenue).toLocaleString()}` })
  if (data.blendedRoas > 0) kpis.push({ label: "ROAS", value: `${data.blendedRoas.toFixed(2)}x` })
  if (data.avgCtr > 0) kpis.push({ label: "CTR", value: `${data.avgCtr.toFixed(2)}%` })
  if (data.avgCpa > 0) kpis.push({ label: "CPA", value: `$${data.avgCpa.toFixed(2)}` })
  if (data.totalConversions > 0) kpis.push({ label: "Conversions", value: data.totalConversions.toLocaleString() })
  if (kpis.length > 0) {
    sections.push({ id: "kpis", title: "Headline Metrics", kind: "kpi-row", data: kpis, priority: priority++ })
  }

  // Daily trend chart — only if we have enough data points
  if (data.dailyMetrics.length >= 7) {
    sections.push({ id: "trend", title: `${data.periodDays}-Day Trend`, kind: "chart", data: data.dailyMetrics, priority: priority++ })
  }

  // Top performers — only if there are campaigns with spend
  if (data.topCampaigns.length > 0 && data.topCampaigns[0].spend > 0) {
    sections.push({ id: "top", title: "Top Performers", kind: "table", data: data.topCampaigns.slice(0, 5), priority: priority++ })
  }

  // Underperformers — only if there are campaigns with poor ROAS
  const underperformers = data.bottomCampaigns.filter((c) => c.spend > 25 && c.roas < 1)
  if (underperformers.length > 0) {
    sections.push({ id: "under", title: "Needs Attention", kind: "table", data: underperformers.slice(0, 5), priority: priority++ })
  }

  // Platform breakdown — only if multi-platform
  if (Object.keys(data.platformBreakdown).length > 1) {
    sections.push({ id: "platforms", title: "Platform Mix", kind: "table", data: data.platformBreakdown, priority: priority++ })
  }

  // Audit callout for zero-conversion accounts
  if (data.totalSpend > 500 && data.totalConversions === 0) {
    sections.push({
      id: "tracking-warning",
      title: "Conversion Tracking Audit Required",
      kind: "callout",
      data: `Spent $${Math.round(data.totalSpend)} with 0 conversions recorded. Before trusting any ROAS or CPA numbers in this report, verify that the conversion tag is firing in Google Ads / Meta.`,
      priority: priority++,
    })
  }

  return sections.sort((a, b) => a.priority - b.priority)
}

async function generateExecutiveSummary(
  data: ReportDataShape,
  archetype: ReportArchetype,
  industry: string | null | undefined,
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return `Report covers ${data.periodDays} days. ${data.campaignCount} campaigns analyzed across ${Object.keys(data.platformBreakdown).length} platform(s). ${data.activeCampaigns} currently active.`
  }
  try {
    const openai = getOpenAI()
    const prompt = `Write a 2-3 sentence executive summary for a marketing report.

Archetype: ${archetype}
Industry: ${industry || "not specified"}
Period: ${data.periodDays} days
Total spend: $${data.totalSpend.toFixed(0)}
Total revenue: $${data.totalRevenue.toFixed(0)}
Blended ROAS: ${data.blendedRoas.toFixed(2)}x
Average CTR: ${data.avgCtr.toFixed(2)}%
Average CPA: $${data.avgCpa.toFixed(2)}
Active campaigns: ${data.activeCampaigns} of ${data.campaignCount}

Rules:
- Use ONLY the data above. Do not invent numbers.
- Lead with the most important finding for this archetype.
- If archetype is "decline-recovery", lead with the ROAS gap.
- If archetype is "audit-findings", lead with the tracking warning.
- If archetype is "growth-summary", lead with the revenue multiple.
- Keep it under 60 words. No filler.`
    const completion = await openai.chat.completions.create({
      model: UTILITY_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 200,
    })
    return completion.choices[0]?.message?.content?.trim() || "Report generated."
  } catch (err) {
    log("warn", "adaptive-report", "summary generation failed", { message: (err as Error).message })
    return `Report covers ${data.periodDays} days across ${data.campaignCount} campaigns.`
  }
}

async function generateActions(
  data: ReportDataShape,
  archetype: ReportArchetype,
): Promise<DerivedReport["recommendedActions"]> {
  if (!process.env.OPENAI_API_KEY) {
    return []
  }
  try {
    const openai = getOpenAI()
    const prompt = `Based on this report data, recommend 2-4 specific next actions. Return JSON array.

Archetype: ${archetype}
Top campaign: ${data.topCampaigns[0]?.name || "n/a"} (ROAS ${data.topCampaigns[0]?.roas?.toFixed(2) || "n/a"}x)
Bottom campaign: ${data.bottomCampaigns[0]?.name || "n/a"} (ROAS ${data.bottomCampaigns[0]?.roas?.toFixed(2) || "n/a"}x, spend $${data.bottomCampaigns[0]?.spend?.toFixed(0) || "0"})
Blended ROAS: ${data.blendedRoas.toFixed(2)}x
Spend with zero conversions: $${data.bottomCampaigns.filter((c) => c.roas === 0).reduce((sum, c) => sum + c.spend, 0).toFixed(0)}

Return JSON: [{"title":"specific action","reason":"why this matters","impact":"high|med|low"}]
Use ONLY the data. No filler.`
    const completion = await openai.chat.completions.create({
      model: UTILITY_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 500,
    })
    const content = completion.choices[0]?.message?.content || "{}"
    const parsed = JSON.parse(content)
    return Array.isArray(parsed.recommendations)
      ? parsed.recommendations.slice(0, 4).map((r: { title: string; reason: string; impact: string }) => ({
          title: r.title || "Review performance",
          reason: r.reason || "Based on the data above.",
          impact: (["high", "med", "low"].includes(r.impact) ? r.impact : "med") as "high" | "med" | "low",
        }))
      : []
  } catch (err) {
    log("warn", "adaptive-report", "action generation failed", { message: (err as Error).message })
    return []
  }
}

/**
 * Main entry point — derives the report shape, sections, and narrative
 * from the data. The caller renders the HTML using buildAdaptiveHTML().
 */
export async function deriveAdaptiveReport(data: ReportDataShape): Promise<DerivedReport> {
  const { archetype, reason } = detectReportShape(data)
  const sections = deriveSections(data)
  const [executiveSummary, recommendedActions] = await Promise.all([
    generateExecutiveSummary(data, archetype, data.industry),
    generateActions(data, archetype),
  ])
  return { archetype, archetypeReason: reason, sections, executiveSummary, recommendedActions }
}

/**
 * Renders the derived report as self-contained HTML. Sections are
 * composed dynamically based on their `kind`. No fixed template.
 */
export function buildAdaptiveHTML(report: DerivedReport, accountName: string): string {
  const sectionHTML = report.sections
    .map((section) => {
      switch (section.kind) {
        case "kpi-row":
          return renderKPIs(section.data as Array<{ label: string; value: string }>)
        case "table":
          return renderTable(section.data as unknown)
        case "chart":
          return renderChart(section.data as Array<{ date: string; spend: number; revenue: number }>)
        case "callout":
          return renderCallout(section.data as string)
        case "narrative":
          return `<div class="section"><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(String(section.data))}</p></div>`
        default:
          return ""
      }
    })
    .join("\n")

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(accountName)} — ${escapeHtml(report.archetype)}</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 32px; color: #0f172a; }
    h1 { font-size: 28px; margin-bottom: 4px; }
    h2 { font-size: 18px; margin-top: 32px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
    .summary { background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 16px 0; }
    .kpis { display: flex; gap: 16px; flex-wrap: wrap; margin: 16px 0; }
    .kpi { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; min-width: 120px; }
    .kpi-label { font-size: 12px; color: #64748b; }
    .kpi-value { font-size: 20px; font-weight: 600; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; }
    .callout { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 16px 0; }
    .actions { margin: 24px 0; }
    .action { background: #f8fafc; border-radius: 6px; padding: 12px; margin-bottom: 8px; }
    .action-impact-high { border-left: 3px solid #ef4444; }
    .action-impact-med { border-left: 3px solid #f59e0b; }
    .action-impact-low { border-left: 3px solid #94a3b8; }
  </style>
</head>
<body>
  <h1>${escapeHtml(accountName)}</h1>
  <p style="color:#64748b;margin:0">${escapeHtml(report.archetype.replace(/-/g, " "))} — ${escapeHtml(report.archetypeReason)}</p>
  <div class="summary">${escapeHtml(report.executiveSummary)}</div>
  ${sectionHTML}
  ${report.recommendedActions.length > 0 ? `
    <h2>Recommended Actions</h2>
    <div class="actions">
      ${report.recommendedActions.map((a) => `<div class="action action-impact-${a.impact}"><strong>${escapeHtml(a.title)}</strong><br><span style="color:#64748b">${escapeHtml(a.reason)}</span></div>`).join("")}
    </div>
  ` : ""}
</body>
</html>`
}

function renderKPIs(kpis: Array<{ label: string; value: string }>): string {
  return `<div class="kpis">${kpis.map((k) => `<div class="kpi"><div class="kpi-label">${escapeHtml(k.label)}</div><div class="kpi-value">${escapeHtml(k.value)}</div></div>`).join("")}</div>`
}

function renderTable(data: unknown): string {
  if (!data || (Array.isArray(data) && data.length === 0)) return ""
  if (Array.isArray(data)) {
    // Array of objects → table
    const rows = data as Array<Record<string, unknown>>
    const headers = Object.keys(rows[0] || {})
    return `<table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${headers.map((h) => `<td>${escapeHtml(String(r[h] ?? ""))}</td>`).join("")}</tr>`).join("")}</tbody></table>`
  }
  if (typeof data === "object") {
    // Object → key-value table
    const entries = Object.entries(data as Record<string, unknown>)
    return `<table><tbody>${entries.map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(typeof v === "object" ? JSON.stringify(v) : String(v))}</td></tr>`).join("")}</tbody></table>`
  }
  return ""
}

function renderChart(daily: Array<{ date: string; spend: number; revenue: number }>): string {
  // Simple inline SVG line chart — no external deps
  const width = 800
  const height = 200
  const maxVal = Math.max(...daily.flatMap((d) => [d.spend, d.revenue]), 1)
  const xStep = width / Math.max(1, daily.length - 1)
  const spendPath = daily.map((d, i) => `${i * xStep},${height - (d.spend / maxVal) * height}`).join(" ")
  const revenuePath = daily.map((d, i) => `${i * xStep},${height - (d.revenue / maxVal) * height}`).join(" ")
  return `<svg viewBox="0 0 ${width} ${height}" style="width:100%;max-width:800px;height:200px">
    <polyline points="${spendPath}" fill="none" stroke="#3b82f6" stroke-width="2"/>
    <polyline points="${revenuePath}" fill="none" stroke="#10b981" stroke-width="2"/>
    <text x="4" y="16" font-size="12" fill="#3b82f6">Spend</text>
    <text x="4" y="32" font-size="12" fill="#10b981">Revenue</text>
  </svg>`
}

function renderCallout(text: string): string {
  return `<div class="callout">${escapeHtml(text)}</div>`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/**
 * Entry point for the report API route.
 * Fetches real campaign data and generates a fully adaptive report.
 */
export async function generateAdaptiveReport(input: {
  userId: string
  workspaceId?: string | null
  adAccountId?: string | null
  startDate: Date
  endDate: Date
  type?: string
  industry?: string | null
  riskLevel?: string | null
  targetRoas?: number | null
  primaryKpi?: string | null
}): Promise<{
  metrics: Record<string, unknown>
  insights: Record<string, unknown>
  recommendations: Array<{ title: string; reason: string; impact: string }>
  executiveSummary: string
  html: string
}> {
  const { prisma } = await import("@/lib/prisma")
  const { verifiedMetricCampaignWhere } = await import("@/lib/data-trust")

  const connectedIntegrations = await prisma.integration.findMany({
    where: {
      userId: input.userId,
      hasAdsAccess: true,
      status: { in: ["OAUTH_GRANTED", "ACCOUNT_SELECTED", "INITIAL_SYNC_RUNNING", "ACTIVE", "SYNC_FAILED"] },
      ...(input.workspaceId ? { workspaceId: input.workspaceId } : {}),
    },
    select: { id: true, platform: true, selectedAdAccountId: true, accountId: true },
  })

  const integrationIds = connectedIntegrations.map((i) => i.id)
  const accountIds = connectedIntegrations
    .map((i) => i.selectedAdAccountId || i.accountId)
    .filter(Boolean) as string[]
  const selectedIds = input.adAccountId && accountIds.includes(input.adAccountId)
    ? [input.adAccountId]
    : input.adAccountId ? [] : accountIds

  const campaigns = connectedIntegrations.length && selectedIds.length
    ? await prisma.campaign.findMany({
        where: {
          ...verifiedMetricCampaignWhere({ userId: input.userId, workspaceId: input.workspaceId || undefined }),
          integrationId: { in: integrationIds },
          adAccountId: { in: selectedIds },
        },
        orderBy: { spend: "desc" },
      })
    : []

  const dailyMetrics = campaigns.length
    ? await prisma.campaignMetricDaily.findMany({
        where: {
          campaignId: { in: campaigns.map((c) => c.id) },
          metricDate: { gte: input.startDate, lte: input.endDate },
        },
        orderBy: { metricDate: "asc" },
      })
    : []

  // Compute totals
  const totals = dailyMetrics.reduce(
    (acc, m) => {
      acc.spend += Number(m.spend || 0)
      acc.revenue += Number(m.revenue || 0)
      acc.conversions += Number(m.conversions || 0)
      acc.clicks += Number(m.clicks || 0)
      acc.impressions += Number(m.impressions || 0)
      return acc
    },
    { spend: 0, revenue: 0, conversions: 0, clicks: 0, impressions: 0 }
  )

  const blendedRoas = totals.spend > 0 ? totals.revenue / totals.spend : 0
  const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
  const avgCpa = totals.conversions > 0 ? totals.spend / totals.conversions : 0

  const dataShape: ReportDataShape = {
    totalSpend: totals.spend,
    totalRevenue: totals.revenue,
    totalConversions: totals.conversions,
    totalClicks: totals.clicks,
    totalImpressions: totals.impressions,
    avgRoas: blendedRoas,
    avgCtr,
    avgCpa,
    avgCpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    campaignCount: campaigns.length,
    platforms: [...new Set(campaigns.map((c) => c.platform))],
    dailyMetrics: dailyMetrics.map((m) => ({
      date: m.metricDate.toISOString().slice(0, 10),
      spend: Number(m.spend || 0),
      revenue: Number(m.revenue || 0),
      conversions: Number(m.conversions || 0),
      clicks: Number(m.clicks || 0),
      impressions: Number(m.impressions || 0),
    })),
    topCampaigns: campaigns.slice(0, 5).map((c) => ({
      id: c.id,
      name: c.name,
      spend: Number(c.spend || 0),
      revenue: Number(c.revenue || 0),
      conversions: Number(c.conversions || 0),
      roas: c.roas || 0,
      ctr: c.ctr || 0,
    })),
    industry: input.industry || null,
    hasData: campaigns.length > 0,
    targetRoas: input.targetRoas || null,
    primaryKpi: input.primaryKpi || null,
    riskLevel: input.riskLevel || null,
  }

  if (!campaigns.length) {
    return {
      metrics: { ...dataShape, hasCampaignData: false },
      insights: { wins: [], concerns: [], recommendations: [] },
      recommendations: [],
      executiveSummary: "No verified synced campaign data available for the selected period. Connect Google Ads and run a sync to generate a report.",
      html: "<p>No campaign data available.</p>",
    }
  }

  const derived = await deriveAdaptiveReport(dataShape)
  const html = buildAdaptiveHTML(derived, input.industry || "Growzzy Account")

  return {
    metrics: dataShape as Record<string, unknown>,
    insights: { archetype: derived.archetype, sections: derived.sections },
    recommendations: derived.recommendedActions.map((a) => ({
      title: a.title,
      reason: a.reason,
      impact: a.impact,
    })),
    executiveSummary: derived.executiveSummary,
    html,
  }
}
