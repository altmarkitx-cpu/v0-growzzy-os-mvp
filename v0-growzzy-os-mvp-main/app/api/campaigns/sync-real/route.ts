/**
 * Real Campaign Sync API
 * Fetches actual campaigns from connected platforms and syncs to database
 */

import { type NextRequest, NextResponse } from "next/server"
import { syncPlatformData } from "@/lib/platform-sync"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { userId, platforms } = await request.json()

    if (!userId || !platforms?.length) {
      return NextResponse.json({ error: "Missing userId or platforms" }, { status: 400 })
    }

    console.log("[v0] Starting real campaign sync for user:", userId)

    // Sync platform data
    await syncPlatformData(userId, platforms)

    // Get synced campaigns
    const { data: campaigns, error } = await supabaseAdmin.from("campaigns").select("*").eq("user_id", userId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `Synced ${campaigns?.length || 0} campaigns from ${platforms.join(", ")}`,
      campaigns,
    })
  } catch (error: any) {
    console.error("[v0] Campaign sync error:", error)
    return NextResponse.json({ error: error.message || "Failed to sync campaigns" }, { status: 500 })
  }
}
