import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: Request) {
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

  try {
    console.log("[v0] Getting analytics aggregates for user:", user.id)

    // Get all campaigns grouped by platform
    const { data: campaigns, error: campaignsError } = await supabase
      .from("campaigns")
      .select("platform, spend, revenue, roas")
      .eq("user_id", user.id)

    if (campaignsError) {
      console.error("[v0] Campaigns fetch error:", campaignsError)
      throw campaignsError
    }

    console.log("[v0] Found campaigns:", campaigns?.length || 0)

    // Aggregate by platform for pie chart
    const platformBreakdown: any = {}

    if (campaigns && Array.isArray(campaigns)) {
      for (const campaign of campaigns) {
        if (!platformBreakdown[campaign.platform]) {
          platformBreakdown[campaign.platform] = {
            name: campaign.platform.charAt(0).toUpperCase() + campaign.platform.slice(1),
            value: 0,
          }
        }
        platformBreakdown[campaign.platform].value += campaign.spend || 0
      }
    }

    const breakdown = Object.values(platformBreakdown).filter((item: any) => item.value > 0)

    console.log("[v0] Platform breakdown:", breakdown.length, "platforms with spend")

    return NextResponse.json({
      breakdown,
      totalPlatforms: breakdown.length,
      totalSpend: breakdown.reduce((sum: number, p: any) => sum + (p.value || 0), 0),
    })
  } catch (error: any) {
    console.error("[v0] Analytics aggregates error:", error.message)
    return NextResponse.json(
      {
        error: error.message || "Failed to get analytics",
        breakdown: [],
      },
      { status: 500 }
    )
  }
}
