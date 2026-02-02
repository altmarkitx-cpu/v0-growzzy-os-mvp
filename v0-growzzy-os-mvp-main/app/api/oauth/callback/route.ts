import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")
  const platform = searchParams.get("platform") || "meta" // Default to meta, will be refined

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options) {
          cookieStore.delete(name)
        },
      },
    },
  )

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=${error}&message=User denied access`,
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=invalid_request&message=Missing code or state`,
    )
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=unauthorized&message=Not authenticated`,
      )
    }

    let accessToken, refreshToken, accountInfo
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback`

    // Determine platform from code exchange response
    // Try Meta first
    if (process.env.META_APP_ID && process.env.META_APP_SECRET) {
      try {
        const tokenResponse = await fetch("https://graph.instagram.com/v18.0/oauth/access_token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.META_APP_ID,
            client_secret: process.env.META_APP_SECRET,
            redirect_uri: redirectUri,
            code,
          }).toString(),
        })

        const tokenData = await tokenResponse.json()

        if (tokenData.access_token) {
          accessToken = tokenData.access_token

          // Get Meta account info
          const meResponse = await fetch(
            `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${accessToken}`,
          )
          const meData = await meResponse.json()
          accountInfo = { name: meData.name, email: meData.email, id: meData.id }

          await supabase.from("platform_connections").upsert(
            {
              user_id: user.id,
              platform: "meta",
              access_token: accessToken,
              account_info: accountInfo,
              connected_at: new Date(),
            },
            {
              onConflict: "user_id,platform",
            },
          )

          // Start auto-sync
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ platform: "meta", userId: user.id }),
          })

          return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=true&platform=meta&account=${accountInfo.name}`,
          )
        }
      } catch (err) {
        console.error("[v0] Meta OAuth error:", err)
      }
    }

    // Try Google
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      try {
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            code,
            grant_type: "authorization_code",
          }).toString(),
        })

        const tokenData = await tokenResponse.json()

        if (tokenData.access_token) {
          accessToken = tokenData.access_token
          refreshToken = tokenData.refresh_token

          // Get Google account info
          const meResponse = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`)
          const meData = await meResponse.json()
          accountInfo = { name: meData.name, email: meData.email, id: meData.id }

          await supabase.from("platform_connections").upsert(
            {
              user_id: user.id,
              platform: "google",
              access_token: accessToken,
              refresh_token: refreshToken,
              account_info: accountInfo,
              connected_at: new Date(),
            },
            {
              onConflict: "user_id,platform",
            },
          )

          // Start auto-sync
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ platform: "google", userId: user.id }),
          })

          return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=true&platform=google&account=${accountInfo.name}`,
          )
        }
      } catch (err) {
        console.error("[v0] Google OAuth error:", err)
      }
    }

    throw new Error("OAuth exchange failed for all configured platforms")
  } catch (error) {
    console.error("[v0] OAuth callback error:", error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=callback_failed&message=Failed to process OAuth callback`,
    )
  }
}
