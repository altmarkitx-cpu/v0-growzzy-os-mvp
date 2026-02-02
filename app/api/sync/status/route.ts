import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    // Get sync status for all user connections
    const { data: connections, error } = await supabaseAdmin
      .from('platform_connections')
      .select('id,platform,account_name,status,last_synced_at,created_at')
      .eq('user_id', userId)
      .order('last_synced_at', { ascending: false });

    if (error) throw error;

    const syncStatus = {
      connections: connections || [],
      lastSyncTime: connections?.[0]?.last_synced_at || null,
      nextSyncTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
      isSyncing: false,
    };

    return NextResponse.json(syncStatus);
  } catch (error: any) {
    console.error('[v0] Sync status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
