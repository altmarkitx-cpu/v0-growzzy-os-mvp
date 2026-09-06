import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { resolveUserId } from "@/lib/resolve-user"
import { prisma } from "@/lib/prisma"
import { detectAdaptiveAlerts, deriveAlertConfig } from "@/lib/adaptive-alerts"
import { getRequestWorkspaceId } from "@/lib/workspace"
import { verifiedMetricCampaignWhere } from "@/lib/data-trust"
import { log } from "@/lib/logger"

export const dynamic = "force-dynamic"

type AnalyticsPlatform = "GOOGLE"

function rangeStart(range: string) {
  const days = range === "today" ? 1 : range === "30d" ? 30 : range === "7d" ? 7 : 14
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))
  return start
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    const userId = await resolveUserId(session.user.id)
    const workspaceId = await getRequestWorkspaceId(userId, request)
    const range = request.nextUrl.searchParams.get("range") || "7d"
    const requestedPlatform = (request.nextUrl.searchParams.get("platform") || "ALL").toUpperCase()
    const allowedPlatforms: AnalyticsPlatform[] = ["GOOGLE"]

    const integrations = await prisma.integration.findMany({
      where: {
        userId,
        workspaceId,
        hasAdsAccess: true,
        status: { in: ["OAUTH_GRANTED", "ACCOUNT_SELECTED", "INITIAL_SYNC_RUNNING", "ACTIVE", "SYNC_FAILED"] },
        platform: { in: allowedPlatforms },
      },
      select: { id: true, platform: true, selectedAdAccountId: true, accountId: true },
      take: 20,
    })
    const connectedPlatforms = [...new Set(integrations.map((integration) => integration.platform as AnalyticsPlatform))]
    const activePlatforms =
      requestedPlatform === "ALL"
        ? connectedPlatforms
        : connectedPlatforms.includes(requestedPlatform as AnalyticsPlatform)
          ? [requestedPlatform as AnalyticsPlatform]
          : []
    const selectedAccountIds = integrations
      .filter((integration) => activePlatforms.includes(integration.platform as AnalyticsPlatform))
      .map((integration) => integration.selectedAdAccountId || integration.accountId)
      .filter(Boolean) as string[]

    if (!activePlatforms.length || !selectedAccountIds.length) {
      return NextResponse.json({ ok: true, data: { connectedPlatforms, points: [], alerts: [], hasVerifiedData: false } })
    }

    const metrics = await prisma.campaignMetricDaily.findMany({
      where: {
        metricDate: { gte: rangeStart(range) },
        campaign: {
          ...verifiedMetricCampaignWhere({ userId, workspaceId }),
          platform: { in: activePlatforms },
          adAccountId: { in: selectedAccountIds },
        },
      },
      include: { campaign: { select: { platform: true } } },
      orderBy: { metricDate: "asc" },
      take: 20000,
    })

    const byDate = new Map<string, { timestamp: string; spend: number; impressions: number; clicks: number; conversions: number; revenue: number }>()
    const metricPoints = metrics.map((metric) => ({
      timestamp: metric.metricDate.toISOString(),
      platform: metric.campaign.platform as AnalyticsPlatform,
      reach: 0,
      spend: Number(metric.spend || 0),
      roas: Number(metric.roas || 0),
      ctr: Number(metric.ctr || 0),
      impressions: Number(metric.impressions || 0),
      botScore: 0,
    }))

    for (const metric of metrics) {
      const key = metric.metricDate.toISOString().slice(0, 10)
      const current = byDate.get(key) || {
        timestamp: metric.metricDate.toISOString(),
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
      }
      current.spend += Number(metric.spend || 0)
      current.impressions += Number(metric.impressions || 0)
      current.clicks += Number(metric.clicks || 0)
      current.conversions += Number(metric.conversions || 0)
      current.revenue += Number(metric.revenue || 0)
      byDate.set(key, current)
    }

    const points = Array.from(byDate.values()).map((point) => ({
      ...point,
      label: new Date(point.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      reach: 0,
      roas: point.spend > 0 ? Number((point.revenue / point.spend).toFixed(2)) : 0,
      ctr: point.impressions > 0 ? Number(((point.clicks / point.impressions) * 100).toFixed(2)) : 0,
      botScore: null,
    }))

    // Derive adaptive alert config from 30-day spend and computed baseline
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const baselineMetrics = await prisma.campaignMetricDaily.findMany({
      where: {
        metricDate: { gte: thirtyDaysAgo },
        campaign: {
          ...verifiedMetricCampaignWhere({ userId, workspaceId }),
          platform: { in: activePlatforms },
          adAccountId: { in: selectedAccountIds },
        },
      },
      select: { spend: true, ctr: true },
    })
    const spendVals = baselineMetrics.map((m) => Number(m.spend || 0))
    const ctrVals = baselineMetrics.map((m) => Number(m.ctr || 0))
    const avgDailySpend = spendVals.length ? spendVals.reduce((a, b) => a + b, 0) / spendVals.length : 0
    const avgDailyCtr = ctrVals.length ? ctrVals.reduce((a, b) => a + b, 0) / ctrVals.length : 0
    const stdDevSpend = spendVals.length > 1
      ? Math.sqrt(spendVals.reduce((s, v) => s + (v - avgDailySpend) ** 2, 0) / spendVals.length)
      : 0
    const stdDevCtr = ctrVals.length > 1
      ? Math.sqrt(ctrVals.reduce((s, v) => s + (v - avgDailyCtr) ** 2, 0) / ctrVals.length)
      : 0
    // Pull industry from workspace settings for adaptive thresholds
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId || "" },
      select: { industry: true },
    }).catch(() => null)
    const alertConfig = deriveAlertConfig(
      avgDailySpend * 30,
      workspace?.industry || "default",
      { avgDailySpend, avgDailyCtr, stdDevSpend, stdDevCtr }
    )
    const alerts = detectAdaptiveAlerts(metricPoints, alertConfig)
      .filter((alert) => alert.metric !== "botScore" && alert.metric !== "reach")

    return NextResponse.json({
      ok: true,
      data: {
        connectedPlatforms,
        points,
        alerts,
        hasVerifiedData: points.length > 0,
        range,
        trust: "Metrics are sourced only from verified synced daily campaign rows. Alerts use adaptive thresholds based on your account size and industry.",
      },
    })
  } catch (error: any) {
    log("error", "api/analytics/advanced", "Failed to load verified analytics", { message: error?.message })
    return NextResponse.json({ ok: false, error: error?.message || "Failed to load analytics data" }, { status: 500 })
  }
}
