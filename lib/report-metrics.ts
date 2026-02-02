import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface CampaignData {
  id: string;
  name: string;
  platform: string;
  spend: number;
  revenue: number;
  clicks: number;
  impressions: number;
  conversions: number;
  ctr: number;
  roas: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ReportMetrics {
  dateRange: { from: Date; to: Date };
  totalSpend: number;
  totalRevenue: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageROAS: number;
  averageCTR: number;
  averageCPC: number;
  averageCPA: number;
  campaigns: CampaignData[];
  topCampaigns: CampaignData[];
  bottomCampaigns: CampaignData[];
  platformBreakdown: Record<
    string,
    {
      spend: number;
      revenue: number;
      roas: number;
      count: number;
    }
  >;
}

export async function calculateReportMetrics(
  userId: string,
  dateRange: { from: Date; to: Date }
): Promise<ReportMetrics> {
  console.log("[v0] Calculating metrics for user:", userId, "dateRange:", dateRange);

  // Fetch campaigns with real data
  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", dateRange.from.toISOString())
    .lte("created_at", dateRange.to.toISOString())
    .order("revenue", { ascending: false });

  if (campaignsError) {
    console.error("[v0] Error fetching campaigns:", campaignsError);
    throw campaignsError;
  }

  if (!campaigns || campaigns.length === 0) {
    throw new Error("No campaigns found for the selected date range");
  }

  console.log("[v0] Found", campaigns.length, "campaigns");

  // Calculate aggregate metrics
  const totalSpend = campaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);

  const averageROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const averageCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const averageCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;

  // Calculate platform breakdown
  const platformBreakdown: Record<
    string,
    {
      spend: number;
      revenue: number;
      roas: number;
      count: number;
    }
  > = {};

  campaigns.forEach((campaign) => {
    if (!platformBreakdown[campaign.platform]) {
      platformBreakdown[campaign.platform] = {
        spend: 0,
        revenue: 0,
        roas: 0,
        count: 0,
      };
    }
    const pb = platformBreakdown[campaign.platform];
    pb.spend += campaign.spend || 0;
    pb.revenue += campaign.revenue || 0;
    pb.count += 1;
  });

  // Calculate platform ROAS
  Object.keys(platformBreakdown).forEach((platform) => {
    const pb = platformBreakdown[platform];
    pb.roas = pb.spend > 0 ? pb.revenue / pb.spend : 0;
  });

  // Get top and bottom campaigns
  const topCampaigns = campaigns.slice(0, 5);
  const bottomCampaigns = campaigns.slice(-5).reverse();

  console.log("[v0] Metrics calculated:", {
    totalSpend: totalSpend.toFixed(2),
    totalRevenue: totalRevenue.toFixed(2),
    averageROAS: averageROAS.toFixed(2),
    campaigns: campaigns.length,
  });

  return {
    dateRange,
    totalSpend,
    totalRevenue,
    totalImpressions,
    totalClicks,
    totalConversions,
    averageROAS,
    averageCTR,
    averageCPC,
    averageCPA,
    campaigns: campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      platform: c.platform,
      spend: c.spend || 0,
      revenue: c.revenue || 0,
      clicks: c.clicks || 0,
      impressions: c.impressions || 0,
      conversions: c.conversions || 0,
      ctr: c.ctr || 0,
      roas: c.roas || 0,
      status: c.status,
      created_at: c.created_at,
      updated_at: c.updated_at,
    })),
    topCampaigns: topCampaigns.map((c) => ({
      id: c.id,
      name: c.name,
      platform: c.platform,
      spend: c.spend || 0,
      revenue: c.revenue || 0,
      clicks: c.clicks || 0,
      impressions: c.impressions || 0,
      conversions: c.conversions || 0,
      ctr: c.ctr || 0,
      roas: c.roas || 0,
      status: c.status,
      created_at: c.created_at,
      updated_at: c.updated_at,
    })),
    bottomCampaigns: bottomCampaigns.map((c) => ({
      id: c.id,
      name: c.name,
      platform: c.platform,
      spend: c.spend || 0,
      revenue: c.revenue || 0,
      clicks: c.clicks || 0,
      impressions: c.impressions || 0,
      conversions: c.conversions || 0,
      ctr: c.ctr || 0,
      roas: c.roas || 0,
      status: c.status,
      created_at: c.created_at,
      updated_at: c.updated_at,
    })),
    platformBreakdown,
  };
}
