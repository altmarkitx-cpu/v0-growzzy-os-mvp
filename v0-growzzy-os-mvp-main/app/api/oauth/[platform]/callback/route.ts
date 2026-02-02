import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { platform: string } }) {
  const { platform } = params
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 })
  }

  try {
    let accessToken = ''
    let refreshToken = ''
    let accountId = ''
    let accountName = ''

    switch (platform) {
      case 'meta': {
        const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: process.env.META_APP_ID,
            client_secret: process.env.META_APP_SECRET,
            redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/meta/callback`,
            code,
          }),
        })

        const tokenData = await tokenResponse.json()
        accessToken = tokenData.access_token
        accountId = 'meta_account_1'
        accountName = 'Meta Account'
        break
      }

      case 'google': {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/google/callback`,
            code,
            grant_type: 'authorization_code',
          }),
        })

        const tokenData = await tokenResponse.json()
        accessToken = tokenData.access_token
        refreshToken = tokenData.refresh_token || ''
        accountId = 'google_account_1'
        accountName = 'Google Account'
        break
      }

      case 'linkedin': {
        const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: process.env.LINKEDIN_CLIENT_ID,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET,
            redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/linkedin/callback`,
            code,
            grant_type: 'authorization_code',
          }),
        })

        const tokenData = await tokenResponse.json()
        accessToken = tokenData.access_token
        accountId = 'linkedin_account_1'
        accountName = 'LinkedIn Account'
        break
      }

      case 'shopify': {
        const tokenResponse = await fetch('https://YOUR_SHOP.myshopify.com/admin/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: process.env.SHOPIFY_API_KEY,
            client_secret: process.env.SHOPIFY_API_SECRET,
            code,
          }),
        })

        const tokenData = await tokenResponse.json()
        accessToken = tokenData.access_token
        accountId = 'shopify_account_1'
        accountName = 'Shopify Store'
        break
      }

      default:
        return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
    }

    const response = NextResponse.redirect(new URL('/dashboard', request.url))

    response.cookies.set({
      name: `${platform}_token`,
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 86400 * 30, // 30 days
    })

    return response
  } catch (error) {
    console.error(`OAuth callback error for ${platform}:`, error)
    return NextResponse.redirect(new URL('/connections?error=oauth_failed', request.url))
  }
}
