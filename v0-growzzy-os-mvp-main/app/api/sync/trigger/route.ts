import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncAllUserConnections } from '@/lib/background-sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Get user from auth token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !data.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = data.user.id;
    console.log(`[v0] Manual sync triggered for user ${userId}`);

    // Trigger sync
    const syncStats = await syncAllUserConnections(userId);

    return NextResponse.json({
      success: true,
      message: 'Sync completed',
      stats: syncStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[v0] Manual sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}
