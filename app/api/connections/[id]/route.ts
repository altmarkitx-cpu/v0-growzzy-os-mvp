import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export const dynamic = 'force-dynamic'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { error } = await supabase
      .from('ad_accounts')
      .delete()
      .eq('id', id)

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

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { action } = await req.json()

    if (action === 'sync') {
      // Trigger data sync for this connection
      const { data: connection, error: fetchError } = await supabase
        .from('ad_accounts')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Update last sync time
      const { error: updateError } = await supabase
        .from('ad_accounts')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', id)

      if (updateError) throw updateError

      return NextResponse.json({ success: true, message: 'Sync started' })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    console.error('[v0] Connection action error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to perform action' },
      { status: 500 }
    )
  }
}
