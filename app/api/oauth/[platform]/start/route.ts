import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: { platform: string } }) {
  const { platform } = params

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/${platform}/callback`

    let authUrl = ''

    switch (platform) {
      case 'meta':
        authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${redirectUri}&scope=ads_read,ads_management&state=${Math.random().toString(36)}`
        break

      case 'google':
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/adwords&state=${Math.random().toString(36)}`
        break

      case 'linkedin':
        authUrl = `https://www.linkedin.com/oauth/v2/authorization?client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=r_ads_managed_accounts%20r_ads%20w_ads_campaigns&state=${Math.random().toString(36)}`
        break

      case 'shopify':
        authUrl = `https://YOUR_SHOP.myshopify.com/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=read_products,read_orders&redirect_uri=${redirectUri}&state=${Math.random().toString(36)}`
        break

      default:
        return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
    }

    return NextResponse.json({ authUrl }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to start OAuth flow' }, { status: 500 })
  }
}
