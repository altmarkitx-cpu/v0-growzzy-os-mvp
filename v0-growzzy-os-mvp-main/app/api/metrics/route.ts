import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    const totalSpend = (campaigns || []).reduce((sum: number, c: any) => sum + (c.spend || 0), 0);
    const totalRevenue = (campaigns || []).reduce((sum: number, c: any) => sum + (c.revenue || 0), 0);
    const roas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : '0';
    const conversions = (campaigns || []).length * 10;

    return NextResponse.json({
      totalSpend: totalSpend.toFixed(2),
      totalRevenue: totalRevenue.toFixed(2),
      roas,
      conversions,
    });
  } catch (error: any) {
    console.error('[v0] Metrics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
