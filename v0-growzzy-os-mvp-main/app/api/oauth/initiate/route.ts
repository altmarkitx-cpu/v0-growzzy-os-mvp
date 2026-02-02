import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

const OAUTH_CONFIGS = {
  meta: {
    baseURL: "https://www.facebook.com/v18.0/dialog/oauth",
    clientId: process.env.META_APP_ID,
    scopes: ["ads_management", "business_management"],
  },
  google: {
    baseURL: "https://accounts.google.com/o/oauth2/v2/auth",
    clientId: process.env.GOOGLE_CLIENT_ID,
    scopes: ["https://www.googleapis.com/auth/adwords"],
  },
  shopify: {
    baseURL: "https://shopify.com/admin/oauth/authorize",
    clientId: process.env.SHOPIFY_APP_ID,
    scopes: ["read_products", "read_orders"],
  },
  linkedin: {
    baseURL: "https://www.linkedin.com/oauth/v2/authorization",
    clientId: process.env.LINKEDIN_CLIENT_ID,
    scopes: ["r_ad_campaigns", "r_ad_campaigns_read"],
  },
}

export async function POST(request: NextRequest) {
  try {
    const { platform } = await request.json()

    if (!platform || !OAUTH_CONFIGS[platform as keyof typeof OAUTH_CONFIGS]) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 })
    }

    const config = OAUTH_CONFIGS[platform as keyof typeof OAUTH_CONFIGS]
    if (!config.clientId) {
      console.log(`[v0] OAuth not configured for ${platform}, using demo mode`)
      return NextResponse.json({
        isDemoMode: true,
        authUrl: "#demo",
        sessionId: `demo-${platform}-${Date.now()}`,
      })
    }

    const cookieStore = await cookies()
    const sessionId = `session-${platform}-${Date.now()}`

    // Store session info temporarily
    cookieStore.set(`oauth_session_${sessionId}`, platform, {
      maxAge: 600, // 10 minutes
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    })

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback`
    const state = Buffer.from(JSON.stringify({ sessionId, platform })).toString("base64")

    let authUrl = ""

    switch (platform) {
      case "meta":
        authUrl = new URL(config.baseURL)
        authUrl.searchParams.set("client_id", config.clientId)
        authUrl.searchParams.set("redirect_uri", redirectUri)
        authUrl.searchParams.set("state", state)
        authUrl.searchParams.set("scope", config.scopes.join(","))
        break

      case "google":
        authUrl = new URL(config.baseURL)
        authUrl.searchParams.set("client_id", config.clientId)
        authUrl.searchParams.set("redirect_uri", redirectUri)
        authUrl.searchParams.set("response_type", "code")
        authUrl.searchParams.set("state", state)
        authUrl.searchParams.set("scope", config.scopes.join(" "))
        authUrl.searchParams.set("access_type", "offline")
        break

      case "shopify":
        authUrl = new URL(config.baseURL)
        authUrl.searchParams.set("client_id", config.clientId)
        authUrl.searchParams.set("redirect_uri", redirectUri)
        authUrl.searchParams.set("state", state)
        authUrl.searchParams.set("scope", config.scopes.join(","))
        break

      case "linkedin":
        authUrl = new URL(config.baseURL)
        authUrl.searchParams.set("client_id", config.clientId)
        authUrl.searchParams.set("redirect_uri", redirectUri)
        authUrl.searchParams.set("state", state)
        authUrl.searchParams.set("scope", config.scopes.join(" "))
        authUrl.searchParams.set("response_type", "code")
        break
    }

    return NextResponse.json({
      authUrl: authUrl.toString(),
      sessionId,
    })
  } catch (error) {
    console.error("[v0] OAuth initiate error:", error)
    return NextResponse.json({ error: "Failed to initiate OAuth" }, { status: 500 })
  }
}
