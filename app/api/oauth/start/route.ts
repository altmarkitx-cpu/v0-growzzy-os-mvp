import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getOAuthConfig } from "@/lib/oauth-config"

export async function POST(req: Request) {
  try {
    const { platform } = await req.json()

    if (!platform) {
      return NextResponse.json({ error: "Platform required" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
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

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Generate state for OAuth flow
    const state = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    console.log("[v0] Starting OAuth flow for platform:", platform, "user:", user.id, "state:", state)

    // Store state in database
    const { error: stateError } = await supabase.from("oauth_states").insert({
      state,
      platform: platform.toLowerCase(),
      user_id: user.id,
      expires_at: expiresAt.toISOString(),
    })

    if (stateError) {
      console.error("[v0] Failed to store OAuth state:", stateError)
      return NextResponse.json({ error: "Failed to initialize OAuth" }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    let authUrl = ""

    try {
      switch (platform.toLowerCase()) {
        case "meta": {
          const config = getOAuthConfig("meta")
          const redirectUri = `${appUrl}/api/oauth/meta/callback`
          const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: redirectUri,
            scope: "ads_management,business_management,pages_read_engagement",
            state,
            response_type: "code",
            display: "popup",
          })
          authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`
          break
        }

        case "google": {
          const config = getOAuthConfig("google")
          const redirectUri = `${appUrl}/api/oauth/google/callback`
          const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: redirectUri,
            scope: "https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
            state,
            response_type: "code",
            access_type: "offline",
            prompt: "consent",
          })
          authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
          break
        }

        case "shopify": {
          // Shopify requires shop domain, typically provided by user
          return NextResponse.json({
            authUrl: null,
            state,
            sessionId: state,
            message: "Please provide your Shopify store domain",
          })
        }

        case "linkedin": {
          // LinkedIn OAuth - add support later
          return NextResponse.json({
            error: "LinkedIn integration coming soon",
          }, { status: 400 })
        }

        case "tiktok": {
          // TikTok OAuth - add support later
          return NextResponse.json({
            error: "TikTok integration coming soon",
          }, { status: 400 })
        }

        default:
          return NextResponse.json({ error: "Unsupported platform" }, { status: 400 })
      }
    } catch (err: any) {
      console.error("[v0] Error building auth URL:", err)
      return NextResponse.json({ error: err.message || "Failed to build auth URL" }, { status: 500 })
    }

    console.log("[v0] OAuth auth URL generated for platform:", platform)

    return NextResponse.json({
      authUrl,
      state,
      sessionId: state,
      platform,
    })
  } catch (error: any) {
    console.error("[v0] OAuth start error:", error)
    return NextResponse.json({ error: error.message || "OAuth initialization failed" }, { status: 500 })
  }
}
