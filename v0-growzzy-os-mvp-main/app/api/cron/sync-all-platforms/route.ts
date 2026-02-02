import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { syncAllUserConnections } from "@/lib/background-sync"

export async function POST(request: Request) {
  // Verify CRON_SECRET for security
  const authHeader = request.headers.get("Authorization")
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[v0] Unauthorized cron request")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()
  
  try {
    console.log("[v0] Starting scheduled platform sync...")

    // Get all unique users with active connections
    const { data: connections, error: connError } = await supabaseAdmin
      .from("platform_connections")
      .select("user_id")
      .eq("is_active", true)

    if (connError) {
      console.error("[v0] Error fetching connections:", connError)
      throw connError
    }

    if (!connections || connections.length === 0) {
      console.log("[v0] No active connections to sync")
      return NextResponse.json({
        success: true,
        message: "No active connections to sync",
        duration: Date.now() - startTime,
      })
    }

    // Get unique user IDs
    const userIds = [...new Set(connections.map((c: any) => c.user_id))]
    console.log(`[v0] Starting sync for ${userIds.length} users with active connections`)

    // Sync each user's connections in parallel with a concurrency limit
    const CONCURRENCY = 3
    const results = []
    
    for (let i = 0; i < userIds.length; i += CONCURRENCY) {
      const batch = userIds.slice(i, i + CONCURRENCY)
      const batchResults = await Promise.all(
        batch.map(userId => syncAllUserConnections(userId as string))
      )
      results.push(...batchResults)
    }

    // Aggregate statistics
    const stats = {
      totalUsers: userIds.length,
      totalConnections: results.reduce((sum, r) => sum + r.totalConnections, 0),
      successfulSyncs: results.reduce((sum, r) => sum + r.successfulSyncs, 0),
      failedSyncs: results.reduce((sum, r) => sum + r.failedSyncs, 0),
      totalCampaigns: results.reduce((sum, r) => sum + r.totalCampaigns, 0),
      errors: results.flatMap(r => r.errors).slice(0, 10), // Include first 10 errors
    }

    const duration = Date.now() - startTime
    console.log(`[v0] Sync complete: ${stats.successfulSyncs}/${stats.totalConnections} successful, ${stats.totalCampaigns} campaigns synced in ${duration}ms`)

    return NextResponse.json({
      success: true,
      stats,
      duration,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[v0] Cron sync error:", error)
    const duration = Date.now() - startTime
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Sync failed",
        duration,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
