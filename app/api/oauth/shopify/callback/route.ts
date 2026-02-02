import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOAuthConfig } from '@/lib/oauth-config';
import { exchangeCodeForToken } from '@/lib/oauth-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');
    const state = req.nextUrl.searchParams.get('state');
    const shop = req.nextUrl.searchParams.get('shop');
    const errorParam = req.nextUrl.searchParams.get('error');

    if (errorParam) {
      console.error('[v0] Shopify OAuth error:', errorParam);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/connections?error=${errorParam}`
      );
    }

    if (!code || !state || !shop) {
      return NextResponse.json(
        { error: 'Missing code, state, or shop' },
        { status: 400 }
      );
    }

    // Verify state from database
    const { data: oauthState, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('platform', 'shopify')
      .single();

    if (stateError || !oauthState) {
      return NextResponse.json(
        { error: 'Invalid or expired state' },
        { status: 400 }
      );
    }

    // Check state expiry
    if (new Date(oauthState.expires_at) < new Date()) {
      await supabase.from('oauth_states').delete().eq('state', state);
      return NextResponse.json(
        { error: 'State expired' },
        { status: 400 }
      );
    }

    const config = getOAuthConfig('shopify');
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/oauth/shopify/callback`;

    // Exchange code for access token
    const tokenUrl = `https://${shop}/admin/oauth/access_token`;
    const tokenResponse = await exchangeCodeForToken(
      tokenUrl,
      code,
      config.clientId,
      config.clientSecret,
      redirectUri
    );

    // Get store info
    const storeResponse = await fetch(
      `https://${shop}/admin/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': tokenResponse.access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `{
            shop {
              id
              name
              email
            }
          }`,
        }),
      }
    );
    const storeData = await storeResponse.json();

    // Save connection
    const { error: dbError } = await supabase.from('platform_connections').insert({
      user_id: oauthState.user_id,
      platform: 'shopify',
      account_id: shop,
      account_name: storeData.data?.shop?.name || shop,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token || null,
      expires_at: tokenResponse.expires_in
        ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
        : null,
      status: 'active',
    });

    if (dbError) {
      console.error('[v0] Failed to save connection:', dbError);
      throw new Error('Failed to save connection');
    }

    // Clean up state
    await supabase.from('oauth_states').delete().eq('state', state);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/connections?platform=shopify&success=true`
    );
  } catch (error: any) {
    console.error('[v0] Shopify OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/connections?error=${encodeURIComponent(error.message)}`
    );
  }
}
