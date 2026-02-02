import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('connected_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ connections: data || [] })
  } catch (error: any) {
    console.error('[v0] Get connections error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch connections' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const connectionId = req.nextUrl.searchParams.get('id')
    if (!connectionId) {
      return NextResponse.json({ error: 'Connection ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('ad_accounts')
      .delete()
      .eq('id', connectionId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[v0] Delete connection error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete connection' },
      { status: 500 }
    )
  }
}
      { error: error.message || 'Failed to delete connection' },
      { status: 500 }
    );
  }
}
