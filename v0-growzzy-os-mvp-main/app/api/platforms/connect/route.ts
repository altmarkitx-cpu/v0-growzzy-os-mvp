import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const OAUTH_CONFIGS = {
  meta: {
    clientId: process.env.NEXT_PUBLIC_META_APP_ID,
    scope: "ads_management,ads_read",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/meta/callback`,
  },
  google: {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    scope: "https://www.googleapis.com/auth/adwords",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/google/callback`,
  },
  linkedin: {
    clientId: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID,
    scope: "r_liteprofile r_emailaddress",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/linkedin/callback`,
  },
  shopify: {
    clientId: process.env.SHOPIFY_API_KEY,
    scope: "read_products,read_orders",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/shopify/callback`,
  },
}

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

  const { platform } = await request.json()

  if (!platform || !OAUTH_CONFIGS[platform as keyof typeof OAUTH_CONFIGS]) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 })
  }

  const config = OAUTH_CONFIGS[platform as keyof typeof OAUTH_CONFIGS]

  let oauthUrl: string

  switch (platform) {
    case "meta":
      oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${encodeURIComponent(config.scope)}&state=${encodeURIComponent(user.id)}`
      break
    case "google":
      oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${encodeURIComponent(config.scope)}&response_type=code&state=${encodeURIComponent(user.id)}&access_type=offline&prompt=consent`
      break
    case "linkedin":
      oauthUrl = `https://www.linkedin.com/oauth/v2/authorization?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${encodeURIComponent(config.scope)}&response_type=code&state=${encodeURIComponent(user.id)}`
      break
    case "shopify":
      oauthUrl = `https://${process.env.SHOPIFY_STORE_NAME}.myshopify.com/admin/oauth/authorize?client_id=${config.clientId}&scope=${encodeURIComponent(config.scope)}&redirect_uri=${encodeURIComponent(config.redirectUri)}&state=${encodeURIComponent(user.id)}`
      break
    default:
      return NextResponse.json({ error: "Unsupported platform" }, { status: 400 })
  }

  return NextResponse.json({
    oauthUrl,
    platform,
    message: "Redirect user to OAuth URL",
  })
}

export async function GET(request: Request) {
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

  // Fetch all connected platforms for this user
  const { data: connections, error } = await supabase.from("platform_credentials").select("*").eq("user_id", user.id)

  if (error) {
    console.error("[v0] Error fetching connections:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ connections: connections || [] })
}
