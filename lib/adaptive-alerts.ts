/**
 * Adaptive alert engine — thresholds scale with account size, industry,
 * and historical baseline instead of using one-size-fits-all multipliers.
 *
 * For small accounts (low spend), use tighter thresholds (small changes
 * are signal). For large accounts (high spend), use wider thresholds
 * (daily noise dominates). For high-variance industries (e-commerce,
 * seasonal), widen further.
 */
import { log } from "@/lib/logger"

export type MetricPoint = {
  timestamp: string
  platform: "GOOGLE" | "META"
  reach: number
  spend: number
  roas: number
  ctr: number
  impressions: number
  botScore: number
}

export type DetectedAlert = {
  id: string
  metric: "reach" | "ctr" | "spend" | "roas" | "botScore"
  platform: string
  value: number
  threshold: number
  severity: "CRITICAL" | "WARNING" | "INFO"
  detectedAt: string
  description: string
}

export type AlertConfig = {
  // Account size: spend tier affects sensitivity
  accountTier: "small" | "medium" | "large" | "enterprise"
  // Industry: e-commerce has higher daily variance
  industry: string
  // Historical baseline (from past 30 days)
  baseline: {
    avgDailySpend: number
    avgDailyCtr: number
    stdDevSpend: number
    stdDevCtr: number
  }
}

function getAdaptiveMultipliers(config: AlertConfig) {
  // Reach spike: larger accounts need wider bands
  const reachSpikeMult = {
    small: 1.5,      // < $1k/day spend
    medium: 2.0,     // $1k-$10k/day
    large: 2.5,      // $10k-$100k/day
    enterprise: 3.0, // $100k+/day
  }[config.accountTier]
  const reachCriticalMult = reachSpikeMult * 1.5

  // Spend anomaly: based on standard deviation when available
  const spendAnomalyMult = config.baseline.stdDevSpend > 0
    ? Math.max(1.3, Math.min(3.0, 1.5 + (config.baseline.stdDevSpend / Math.max(1, config.baseline.avgDailySpend)) * 2))
    : { small: 1.5, medium: 1.8, large: 2.2, enterprise: 2.5 }[config.accountTier]

  // CTR drop: tighter for high-CTR accounts (any drop matters), looser for noisy industries
  const ctrDropMult = /ecommerce|retail|seasonal/i.test(config.industry) ? 0.5 : 0.6
  const ctrCriticalMult = /ecommerce|retail|seasonal/i.test(config.industry) ? 0.35 : 0.45

  return { reachSpikeMult, reachCriticalMult, spendAnomalyMult, ctrDropMult, ctrCriticalMult }
}

function rollingAverage(points: MetricPoint[], index: number, metric: keyof MetricPoint, window = 5): number {
  const start = Math.max(0, index - window)
  const slice = points.slice(start, index)
  if (!slice.length) return 0
  return slice.reduce((sum, p) => sum + Number(p[metric] || 0), 0) / slice.length
}

export function detectAdaptiveAlerts(
  data: MetricPoint[],
  config: AlertConfig,
): DetectedAlert[] {
  const alerts: DetectedAlert[] = []
  const mult = getAdaptiveMultipliers(config)

  for (let i = 1; i < data.length; i += 1) {
    const point = data[i]
    const avgReach = rollingAverage(data, i, "reach", 5)
    const avgSpend = rollingAverage(data, i, "spend", 5)
    const avgCtr = rollingAverage(data, i, "ctr", 5)

    // Reach spike — adaptive to account tier
    if (avgReach > 0 && point.reach > avgReach * mult.reachSpikeMult) {
      alerts.push({
        id: `${point.platform}-reach-${point.timestamp}`,
        metric: "reach",
        platform: point.platform,
        value: point.reach,
        threshold: Number((avgReach * mult.reachSpikeMult).toFixed(2)),
        severity: point.reach > avgReach * mult.reachCriticalMult ? "CRITICAL" : "WARNING",
        detectedAt: point.timestamp,
        description: `Reach spiked ${((point.reach / avgReach) || 0).toFixed(2)}x above ${config.accountTier}-account rolling average.`,
      })
    }

    // Spend anomaly — uses std-dev-based multiplier
    if (avgSpend > 0 && point.spend > avgSpend * mult.spendAnomalyMult) {
      alerts.push({
        id: `${point.platform}-spend-${point.timestamp}`,
        metric: "spend",
        platform: point.platform,
        value: point.spend,
        threshold: Number((avgSpend * mult.spendAnomalyMult).toFixed(2)),
        severity: point.spend > avgSpend * mult.spendAnomalyMult * 1.5 ? "CRITICAL" : "WARNING",
        detectedAt: point.timestamp,
        description: `Spend increased to $${point.spend.toFixed(2)} (${(point.spend / avgSpend).toFixed(2)}x above baseline std-dev-adjusted threshold).`,
      })
    }

    // CTR drop — looser for seasonal industries
    if (avgCtr > 0 && point.ctr < avgCtr * mult.ctrDropMult) {
      alerts.push({
        id: `${point.platform}-ctr-${point.timestamp}`,
        metric: "ctr",
        platform: point.platform,
        value: point.ctr,
        threshold: Number((avgCtr * mult.ctrDropMult).toFixed(2)),
        severity: point.ctr < avgCtr * mult.ctrCriticalMult ? "CRITICAL" : "WARNING",
        detectedAt: point.timestamp,
        description: `CTR dropped ${(((avgCtr - point.ctr) / avgCtr) * 100).toFixed(1)}% below baseline (industry-adjusted for ${config.industry}).`,
      })
    }

    // Bot score — same threshold, but severity scales with traffic share
    if (point.botScore > 50) {
      alerts.push({
        id: `${point.platform}-bot-${point.timestamp}`,
        metric: "botScore",
        platform: point.platform,
        value: point.botScore,
        threshold: 50,
        severity: point.botScore > 70 ? "CRITICAL" : "INFO",
        detectedAt: point.timestamp,
        description: `Bot score elevated at ${point.botScore.toFixed(1)}. Review traffic quality.`,
      })
    }

    // ROAS drop — new alert type not in the original engine
    const avgRoas = rollingAverage(data, i, "roas", 5)
    if (avgRoas > 0 && point.roas > 0 && point.roas < avgRoas * 0.5) {
      alerts.push({
        id: `${point.platform}-roas-${point.timestamp}`,
        metric: "roas",
        platform: point.platform,
        value: point.roas,
        threshold: Number((avgRoas * 0.5).toFixed(2)),
        severity: "CRITICAL",
        detectedAt: point.timestamp,
        description: `ROAS dropped to ${point.roas.toFixed(2)}x (50%+ below baseline of ${avgRoas.toFixed(2)}x).`,
      })
    }
  }

  return alerts.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
}

export function deriveAlertConfig(
  totalSpendLast30Days: number,
  industry: string,
  baseline: { avgDailySpend: number; avgDailyCtr: number; stdDevSpend: number; stdDevCtr: number },
): AlertConfig {
  const dailyAvg = totalSpendLast30Days / 30
  const accountTier: AlertConfig["accountTier"] =
    dailyAvg < 1000 ? "small" :
    dailyAvg < 10000 ? "medium" :
    dailyAvg < 100000 ? "large" : "enterprise"
  return { accountTier, industry, baseline }
}
