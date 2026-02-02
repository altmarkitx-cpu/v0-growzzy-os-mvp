import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"

const appUrl = "https://your-app-url.com" // Replace with your actual app URL
const accessToken = "your-access-token" // Replace with your actual access token
const refreshToken = "your-refresh-token" // Replace with your actual refresh token
const tokenData = { expires_in: 3600 } // Replace with your actual token data
const userData = { id: "user-id", name: "user-name" } // Replace with your actual user data

export async function GET(request) {
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

  // Save to platform_credentials table
  const { error: saveError } = await supabase.from("platform_credentials").upsert({
    user_id: user.id,
    platform: "google",
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
    account_id: userData?.id || null,
    account_name: userData?.name || null,
    is_connected: true,
    connected_at: new Date().toISOString(),
    last_synced_at: null,
  })

  if (saveError) {
    console.error("[v0] Error saving Google credentials:", saveError)
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings?error=save_failed&message=${encodeURIComponent(saveError.message)}`,
      { status: 302 },
    )
  }

  // Trigger immediate data sync
  await fetch(`${appUrl}/api/platforms/sync-platform?platform=google&userId=${user.id}`, {
    method: "POST",
  }).catch((err) => console.error("[v0] Sync trigger error:", err))

  return NextResponse.redirect(`${appUrl}/dashboard/settings?success=google_connected`, { status: 302 })
}
