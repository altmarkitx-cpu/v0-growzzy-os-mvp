import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generateAdCreatives } from "@/lib/creative-generator-service"

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
    const { productName, productDescription, benefits, targetAudience, campaignGoal, platform } = await request.json()

    if (!productName || !productDescription) {
      return NextResponse.json({ error: "Product name and description required" }, { status: 400 })
    }

    const creatives = await generateAdCreatives({
      name: productName,
      description: productDescription,
      benefits: benefits || [],
      targetAudience: targetAudience || "General audience",
      goal: campaignGoal || "Drive conversions",
      platform: platform || "Meta",
    })

    // Save to database
    if (creatives.length > 0) {
      for (const creative of creatives) {
        await supabase.from("ad_creatives").insert({
          user_id: user.id,
          name: `${productName} - ${creative.psychologicalTrigger || "Variation"}`,
          type: "generated",
          content: JSON.stringify(creative),
          platform: platform || "meta",
          status: "draft",
          created_at: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({
      success: true,
      creatives: creatives,
      count: creatives.length,
    })
  } catch (error) {
    console.error("[v0] Creative generation error:", error)
    return NextResponse.json({ error: "Failed to generate creatives" }, { status: 500 })
  }
}
