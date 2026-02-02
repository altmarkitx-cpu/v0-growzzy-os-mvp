import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

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
      platform: 'linkedin',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'LinkedIn credentials not configured' }, { status: 500 });
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/oauth/linkedin/callback`;

    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('scope', 'r_liteprofile r_emailaddress w_member_social rw_ads');

    return NextResponse.json({
      authUrl: authUrl.toString(),
      state,
    });
  } catch (error: any) {
    console.error('[v0] LinkedIn authorize error:', error);
    return NextResponse.json(
      { error: error.message || 'Authorization failed' },
      { status: 500 }
    );
  }
}
