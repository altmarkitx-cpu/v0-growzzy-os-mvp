import { supabase } from "./supabaseClient"

export async function syncAllPlatforms() {
  if (!supabase) {
    console.error("[v0] Supabase client not initialized")
    return
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("[v0] No user logged in")
      return
    }

    // Get all connected platforms
    const { data: connections, error } = await supabase
      .from("platform_credentials")
      .select("platform, is_connected")
      .eq("user_id", user.id)
      .eq("is_connected", true)

    if (error) {
      console.error("[v0] Error fetching connections:", error)
      return
    }

    // Sync each platform
    for (const connection of connections || []) {
      await syncPlatform(connection.platform)
    }

    console.log("[v0] All platforms synced successfully")
  } catch (error) {
    console.error("[v0] Sync all platforms error:", error)
  }
}

export async function syncPlatform(platform: string) {
  try {
    const response = await fetch("/api/platforms/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ platform }),
    })

    if (!response.ok) {
      throw new Error(`Failed to sync ${platform}`)
    }

    const data = await response.json()
    console.log(`[v0] ${platform} synced:`, data)
    return data
  } catch (error) {
    console.error(`[v0] Error syncing ${platform}:`, error)
  }
}

// Set up periodic sync (every 15 minutes)
export function startPeriodicSync() {
  setInterval(
    () => {
      syncAllPlatforms()
    },
    15 * 60 * 1000,
  )
}
