import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ leads: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const { name, email, phone, company } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: 'name and email required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('leads')
      .insert({
        user_id: userId,
        name,
        email,
        phone: phone || '',
        company: company || '',
        status: 'new',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create lead' },
      { status: 500 }
    );
  }
}
