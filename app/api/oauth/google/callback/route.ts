import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getOAuthConfig } from "@/lib/oauth-config"
import { exchangeCodeForToken } from "@/lib/oauth-utils"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code")
    const state = request.nextUrl.searchParams.get("state")
    const error = request.nextUrl.searchParams.get("error")
    const errorDescription = request.nextUrl.searchParams.get("error_description")

    console.log("[v0] Google OAuth callback - code:", !!code, "state:", !!state, "error:", error)

    if (error) {
      console.error("[v0] Google OAuth error:", error, errorDescription)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://v0-growzzyos.vercel.app'}/connections?platform=google&error=${encodeURIComponent(errorDescription || error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://v0-growzzyos.vercel.app'}/connections?platform=google&error=${encodeURIComponent("Missing code or state")}`
      )
    }

    // Verify state from database
    const { data: oauthState, error: stateError } = await supabase
      .from("oauth_states")
      .select("*")
      .eq("state", state)
      .eq("platform", "google")
      .single()

    if (stateError || !oauthState) {
      console.error("[v0] State verification failed:", stateError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://v0-growzzyos.vercel.app'}/connections?platform=google&error=${encodeURIComponent("Invalid state")}`
      )
    }

    // Check state expiry
    if (new Date(oauthState.expires_at) < new Date()) {
      await supabase.from("oauth_states").delete().eq("state", state)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://v0-growzzyos.vercel.app'}/connections?platform=google&error=${encodeURIComponent("State expired")}`
      )
    }

    const config = getOAuthConfig("google")
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://v0-growzzyos.vercel.app'}/api/oauth/google/callback`

    console.log("[v0] Exchanging code for token with redirectUri:", redirectUri)

    const tokenResponse = await exchangeCodeForToken(
      config.tokenUrl,
      code,
      config.clientId,
      config.clientSecret,
      redirectUri
    )

    console.log("[v0] Token response received - expires_in:", tokenResponse.expires_in)

    // Get user info from Google
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + tokenResponse.access_token
    )
    const userData = await userResponse.json()

    if (userData.error) {
      console.error("[v0] User info fetch error:", userData.error)
      throw new Error(userData.error.message)
    }

    console.log("[v0] User info retrieved - account_id:", userData.id, "account_name:", userData.name)

    // Save connection
    const connectionData = {
      user_id: oauthState.user_id,
      platform: "google",
      account_id: userData.id,
      account_name: userData.name,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token || null,
      expires_at: tokenResponse.expires_in
        ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
        : null,
      is_active: true,
      last_synced_at: null,
    }

    console.log("[v0] Saving connection to database")

    const { data: connection, error: dbError } = await supabase
      .from("platform_connections")
      .insert(connectionData)
      .select()
      .single()

    if (dbError) {
      console.error("[v0] Failed to save connection:", dbError)
      throw new Error("Failed to save connection")
    }

    console.log("[v0] Connection saved successfully:", connection.id)

    // Trigger automatic sync job in background
    console.log("[v0] Triggering data sync for Google connection")
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://v0-growzzyos.vercel.app'}/api/connections/${connection.id}/sync`,
        { method: "POST" }
      ).catch((err) => console.error("[v0] Sync trigger error (non-blocking):", err))
    } catch (syncErr) {
      console.error("[v0] Sync trigger failed:", syncErr)
      // Don't fail the OAuth flow if sync fails
    }

    // Clean up state
    await supabase.from("oauth_states").delete().eq("state", state)

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://v0-growzzyos.vercel.app'}/connections?platform=google&success=true&connectionId=${connection.id}`
    )
  } catch (error: any) {
    console.error("[v0] Google OAuth callback error:", error)
    const errorMsg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://v0-growzzyos.vercel.app'}/connections?platform=google&error=${encodeURIComponent(errorMsg)}`
    )
  }
}
