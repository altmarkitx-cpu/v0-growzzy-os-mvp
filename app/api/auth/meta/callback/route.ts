import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorReason = searchParams.get("error_reason")

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=${encodeURIComponent(errorReason || "unknown_error")}`,
    )
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=no_code_provided`)
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://graph.facebook.com/v19.0/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for access token")
    }

    const { access_token, expires_in } = await tokenResponse.json()

    // Get user's ad accounts
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_id,account_status,currency&access_token=${access_token}`,
    )

    if (!accountsResponse.ok) {
      throw new Error("Failed to fetch ad accounts")
    }

    const { data: adAccounts } = await accountsResponse.json()

    // Get user's profile
    const userResponse = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,email&access_token=${access_token}`,
    )
    const userData = await userResponse.json()

    const connectionData = {
      platform: "meta",
      accessToken: access_token,
      refreshToken: null,
      user: userData,
      adAccounts: adAccounts?.data || [],
      connectedAt: new Date().toISOString(),
    }

    // Redirect back with connection data in URL
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=meta_connected&data=${encodeURIComponent(JSON.stringify(connectionData))}`

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("Meta OAuth error:", error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=connection_failed`)
  }
}
