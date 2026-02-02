import { NextResponse } from "next/server"

const CONFIGS = {
  meta: {
    clientId: process.env.META_APP_ID,
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    scopes: ["ads_read", "ads_management", "business_management"],
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: ["https://www.googleapis.com/auth/adwords"],
  },
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    scopes: ["r_ads", "rw_ads"],
  },
  shopify: {
    clientId: process.env.SHOPIFY_APP_ID,
    authUrl: "https://accounts.shopify.com/oauth/authorize",
    scopes: ["read_products", "read_orders"],
  },
}

export async function POST(req: Request) {
  try {
    const { platform, redirectUri } = await req.json()

    const config = CONFIGS[platform as keyof typeof CONFIGS]
    if (!config) {
      return NextResponse.json({ error: `Platform ${platform} not configured` }, { status: 400 })
    }

    if (!config.clientId) {
      console.log(`[v0] OAuth not configured for ${platform}, returning demo mode URL`)
      return NextResponse.json({
        authUrl: `about:blank?platform=${platform}&demo=true`,
        isDemoMode: true,
      })
    }

    const state = Math.random().toString(36).substring(7)
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      scope: config.scopes.join(" "),
      response_type: "code",
      state,
    })

    return NextResponse.json({
      authUrl: `${config.authUrl}?${params.toString()}`,
      isDemoMode: false,
    })
  } catch (error: any) {
    console.error("[v0] OAuth URL error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
