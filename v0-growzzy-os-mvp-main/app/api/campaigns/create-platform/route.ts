import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createMetaCampaign } from "@/lib/platform-apis/meta"
import { createGoogleCampaign } from "@/lib/platform-apis/google"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { platform, name, budget, objective, targeting } = await request.json()

    console.log("[v0] Creating campaign on", platform)

    // Get platform credentials
    const { data: cred } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("user_id", user.id)
      .eq("platform", platform)
      .single()

    if (!cred) {
      return NextResponse.json({ error: "Platform not connected" }, { status: 400 })
    }

    let campaignId: string
    let success: boolean

    if (platform === "meta") {
      const result = await createMetaCampaign(cred.access_token, cred.account_id, {
        name,
        objective: objective || "OUTCOME_SALES",
        budget,
      })
      campaignId = result.campaignId
      success = result.success
    } else if (platform === "google") {
      const result = await createGoogleCampaign(cred.access_token, cred.account_id, {
        name,
        budget,
        channels: targeting?.channels || ["DISPLAY"],
      })
      campaignId = result.campaignId
      success = result.success
    } else {
      return NextResponse.json({ error: "Platform not supported" }, { status: 400 })
    }

    // Save to database
    if (success) {
      await supabase.from("campaigns").insert({
        user_id: user.id,
        platform,
        platform_campaign_id: campaignId,
        name,
        status: "PAUSED",
        daily_budget: budget,
        objective,
      })
    }

    console.log("[v0] Campaign created:", campaignId)

    return NextResponse.json({
      success,
      campaignId,
      platform,
      name,
      message: success ? "Campaign created! Review in platform settings." : "Failed to create campaign",
    })
  } catch (error: any) {
    console.error("[v0] Error creating campaign:", error)
    return NextResponse.json({ error: error.message || "Failed to create campaign" }, { status: 500 })
  }
}
