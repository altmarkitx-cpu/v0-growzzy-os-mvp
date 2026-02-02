import { NextRequest, NextResponse } from 'next/server';
import { getOAuthConfig } from '@/lib/oauth-config';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Generate secure state
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state in database with expiry (10 minutes)
    await supabase.from('oauth_states').insert({
      state,
      user_id: userId,
      platform: 'shopify',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    const config = getOAuthConfig('shopify');
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/oauth/shopify/callback`;

    const authUrl = new URL('https://accounts.shopify.com/oauth/authorize');
    authUrl.searchParams.append('client_id', config.clientId);
    authUrl.searchParams.append('scope', config.scopes.join(','));
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', state);

    return NextResponse.json({ 
      authUrl: authUrl.toString(),
      state 
    });
  } catch (error: any) {
    console.error('[v0] Shopify authorize error:', error);
    return NextResponse.json(
      { error: error.message || 'Authorization failed' },
      { status: 500 }
    );
  }
}
