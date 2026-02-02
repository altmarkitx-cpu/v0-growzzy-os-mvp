/**
 * Apply AI Recommendation API
 * Actually executes AI recommendations on the connected platforms
 */

import { type NextRequest, NextResponse } from "next/server"
import { applyAIRecommendation } from "@/lib/ai-recommendation-engine"

export async function POST(request: NextRequest) {
  try {
    const { recommendationId, userId } = await request.json()

    if (!recommendationId || !userId) {
      return NextResponse.json({ error: "Missing recommendationId or userId" }, { status: 400 })
    }

    console.log("[v0] Applying recommendation", recommendationId, "for user", userId)

    const success = await applyAIRecommendation(recommendationId, userId)

    return NextResponse.json({
      success,
      message: "Recommendation applied successfully",
    })
  } catch (error: any) {
    console.error("[v0] Error applying recommendation:", error)
    return NextResponse.json({ error: error.message || "Failed to apply recommendation" }, { status: 500 })
  }
}
