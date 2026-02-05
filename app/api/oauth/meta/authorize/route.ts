import { NextRequest, NextResponse } from 'next/server';
import { getOAuthConfig, buildOAuthUrl } from '@/lib/oauth-config';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

export const dynamic = 'force-dynamic';

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
      platform: 'meta',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    const config = getOAuthConfig('meta');
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://v0-growzzyos.vercel.app'}/api/oauth/meta/callback`;

    const authUrl = buildOAuthUrl(
      'meta',
      config.authorizationUrl,
      config.clientId,
      redirectUri,
      state
    );

    // Return JSON with OAuth URL for popup handling
    return NextResponse.json({
      authUrl,
      state,
    });
  } catch (error: any) {
    console.error('[v0] Meta OAuth authorize error:', error);
    return NextResponse.json(
      { error: error.message || 'Authorization failed' },
      { status: 500 }
    );
  }
}
