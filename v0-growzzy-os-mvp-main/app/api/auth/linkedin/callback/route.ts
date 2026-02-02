import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(`/dashboard/settings?error=linkedin_auth_failed`, { status: 302 })
  }

  if (!code) {
    return NextResponse.redirect("/dashboard/settings?error=missing_code", { status: 302 })
  }

  try {
    const protocol = request.headers.get("x-forwarded-proto") || "http"
    const host = request.headers.get("host")
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`

    // Exchange code for access token
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code!,
        redirect_uri: `${appUrl}/api/auth/linkedin/callback`,
        client_id: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }).toString(),
    })

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token")
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Get user profile
    const profileResponse = await fetch("https://api.linkedin.com/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    let profileData = null
    if (profileResponse.ok) {
      profileData = await profileResponse.json()
    }

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
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.redirect(`${appUrl}/dashboard/settings?error=unauthorized`, { status: 302 })
    }

    // Save to platform_credentials
    const { error: saveError } = await supabase.from("platform_credentials").upsert({
      user_id: user.id,
      platform: "linkedin",
      access_token: accessToken,
      account_id: profileData?.id || null,
      account_name: profileData?.localizedFirstName || "LinkedIn Account",
      is_connected: true,
      connected_at: new Date().toISOString(),
    })

    if (saveError) {
      console.error("[v0] Error saving LinkedIn credentials:", saveError)
      return NextResponse.redirect(`${appUrl}/dashboard/settings?error=save_failed`, { status: 302 })
    }

    await fetch(`${appUrl}/api/platforms/sync-platform?platform=linkedin&userId=${user.id}`, {
      method: "POST",
    }).catch((err) => console.error("[v0] Sync trigger error:", err))

    return NextResponse.redirect(`${appUrl}/dashboard/settings?success=linkedin_connected`, { status: 302 })
  } catch (error) {
    console.error("[v0] LinkedIn OAuth error:", error)
    return NextResponse.redirect(`/dashboard/settings?error=linkedin_auth_failed`, { status: 302 })
  }
}
