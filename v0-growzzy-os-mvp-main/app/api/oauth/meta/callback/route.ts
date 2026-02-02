import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getOAuthConfig } from '@/lib/oauth-config'
import { exchangeCodeForToken } from '@/lib/oauth-utils'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    const state = req.nextUrl.searchParams.get('state')
    const error = req.nextUrl.searchParams.get('error')
    const errorDescription = req.nextUrl.searchParams.get('error_description')

    console.log('[v0] Meta OAuth callback - code:', !!code, 'state:', !!state, 'error:', error)

    if (error) {
      console.error('[v0] Meta OAuth error:', error, errorDescription)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/connections?platform=meta&error=${encodeURIComponent(errorDescription || error)}`,
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/connections?platform=meta&error=${encodeURIComponent('Missing code or state')}`,
      )
    }

    // Verify state from database
    const { data: oauthState, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('platform', 'meta')
      .single()

    if (stateError || !oauthState) {
      console.error('[v0] State verification failed:', stateError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/connections?platform=meta&error=${encodeURIComponent('Invalid state')}`,
      )
    }

    // Check state expiry
    if (new Date(oauthState.expires_at) < new Date()) {
      await supabase.from('oauth_states').delete().eq('state', state)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/connections?platform=meta&error=${encodeURIComponent('State expired')}`,
      )
    }

    const config = getOAuthConfig('meta')
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/oauth/meta/callback`

    console.log('[v0] Exchanging code for token with redirectUri:', redirectUri)

    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken(config.tokenUrl, code, config.clientId, config.clientSecret, redirectUri)

    console.log('[v0] Token response received - expires_in:', tokenResponse.expires_in)

    // Get user's Meta business account info
    const userInfoResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${tokenResponse.access_token}`,
    )
    const userInfo = await userInfoResponse.json()

    if (userInfo.error) {
      console.error('[v0] User info fetch error:', userInfo.error)
      throw new Error(userInfo.error.message)
    }

    console.log('[v0] User info retrieved - account_id:', userInfo.id, 'account_name:', userInfo.name)

    // Save connection to database
    const connectionData = {
      user_id: oauthState.user_id,
      platform: 'meta',
      account_id: userInfo.id,
      account_name: userInfo.name || userInfo.email,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token || null,
      expires_at: tokenResponse.expires_in
        ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
        : null,
      is_active: true,
      last_synced_at: null,
    }

    console.log('[v0] Saving connection to database')

    const { data: connection, error: dbError } = await supabase
      .from('platform_connections')
      .insert(connectionData)
      .select()
      .single()

    if (dbError) {
      console.error('[v0] Failed to save connection:', dbError)
      throw new Error('Failed to save connection')
    }

    console.log('[v0] Connection saved successfully:', connection.id)

    // Trigger automatic sync job in background
    console.log('[v0] Triggering data sync for Meta connection')
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/connections/${connection.id}/sync`,
        { method: 'POST' },
      ).catch((err) => console.error('[v0] Sync trigger error (non-blocking):', err))
    } catch (syncErr) {
      console.error('[v0] Sync trigger failed:', syncErr)
      // Don't fail the OAuth flow if sync fails - user can manually sync later
    }

    // Clean up state
    await supabase.from('oauth_states').delete().eq('state', state)

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/connections?platform=meta&success=true&connectionId=${connection.id}`,
    )
  } catch (error: any) {
    console.error('[v0] Meta OAuth callback error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/connections?platform=meta&error=${encodeURIComponent(errorMsg)}`,
    )
  }
}
