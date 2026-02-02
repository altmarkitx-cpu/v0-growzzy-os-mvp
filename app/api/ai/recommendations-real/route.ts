import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generateRecommendations } from "@/lib/claude-ai-service"

export async function POST(request: Request) {
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
    const { campaignId, campaignData } = await request.json()

    if (!campaignData) {
      return NextResponse.json({ error: "Campaign data required" }, { status: 400 })
    }

    const recommendations = await generateRecommendations({
      name: campaignData.name || "Campaign",
      platform: campaignData.platform || "unknown",
      spend: Number.parseFloat(campaignData.spend) || 0,
      revenue: Number.parseFloat(campaignData.revenue) || 0,
      roas: Number.parseFloat(campaignData.roas) || 0,
      ctr: Number.parseFloat(campaignData.ctr) || 0,
      conversions: Number.parseInt(campaignData.conversions) || 0,
      industry: campaignData.industry || "General",
      durationDays: campaignData.durationDays || 30,
    })

    // Save recommendations to database
    if (campaignId && recommendations.length > 0) {
      const { error } = await supabase.from("ai_recommendations").insert({
        user_id: user.id,
        campaign_id: campaignId,
        recommendations: recommendations,
        created_at: new Date().toISOString(),
      })

      if (error) console.error("[v0] Error saving recommendations:", error)
    }

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error("[v0] Error generating recommendations:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}
