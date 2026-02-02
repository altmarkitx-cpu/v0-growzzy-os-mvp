import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { automationId, userId, action, campaignId, params } = await request.json()

    console.log("[v0] Executing automation:", automationId, "action:", action)

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 400 })
    }

    // Get platform credentials
    const { data: credentials, error: credsError } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("user_id", userId)
      .eq("platform", campaign.platform)
      .single()

    if (credsError || !credentials) {
      return NextResponse.json({ error: "Platform not connected" }, { status: 400 })
    }

    // Execute action on platform
    let result: any

    switch (action) {
      case "pause_campaign":
        console.log(`[v0] Pausing campaign ${campaignId} on ${campaign.platform}`)
        // Implementation would call platform API to pause
        result = { success: true, action: "paused" }
        break

      case "increase_budget":
        console.log(`[v0] Increasing budget for campaign ${campaignId} by ${params.increase}%`)
        const newBudget = campaign.budget * (1 + params.increase / 100)
        // Implementation would call platform API to update budget
        result = { success: true, newBudget }
        break

      case "change_bid":
        console.log(`[v0] Changing bid for campaign ${campaignId} to ${params.newBid}`)
        // Implementation would call platform API to update bid
        result = { success: true, newBid: params.newBid }
        break

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }

    // Log automation execution
    await supabase.from("automation_logs").insert({
      automation_id: automationId,
      campaign_id: campaignId,
      action,
      executed_at: new Date().toISOString(),
      result: "success",
      platform: campaign.platform,
    })

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error("[v0] Automation execution error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
