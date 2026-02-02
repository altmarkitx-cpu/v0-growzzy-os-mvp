/**
 * Generate AI Recommendations API
 * Analyzes real platform data and generates actionable recommendations
 */

import { type NextRequest, NextResponse } from "next/server"
import { generateAIRecommendations } from "@/lib/ai-recommendation-engine"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    console.log("[v0] Generating AI recommendations for user:", userId)

    const recommendations = await generateAIRecommendations(userId)

    return NextResponse.json({
      success: true,
      count: recommendations.length,
      recommendations,
    })
  } catch (error: any) {
    console.error("[v0] Error generating recommendations:", error)
    return NextResponse.json({ error: error.message || "Failed to generate recommendations" }, { status: 500 })
  }
}
