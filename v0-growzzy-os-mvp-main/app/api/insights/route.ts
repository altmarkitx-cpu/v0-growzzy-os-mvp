import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = request.nextUrl.searchParams.get('status')

    let query = supabase
      .from('ai_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: insights, error } = await query.limit(20)

    if (error) throw error

    return NextResponse.json({ insights: insights || [] })
  } catch (error: any) {
    console.error('[v0] Get insights error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch insights' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, insightId, campaignId, newValue, note } = body

    if (action === 'apply') {
      const { data: insight, error: fetchError } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('id', insightId)
        .eq('user_id', user.id)
        .single()

      if (fetchError || !insight) {
        return NextResponse.json({ error: 'Insight not found' }, { status: 404 })
      }

      const { error: updateError } = await supabase
        .from('ai_insights')
        .update({
          status: 'applied',
          applied_at: new Date().toISOString(),
          applied_note: note,
        })
        .eq('id', insightId)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        message: `Applied insight for campaign ${insight.campaign_id}`,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('[v0] Apply insight error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to apply insight' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { insightId, status } = body

    if (!insightId || !status) {
      return NextResponse.json(
        { error: 'insightId and status are required' },
        { status: 400 }
      )
    }

    const updateData: any = { status }
    if (status === 'dismissed') {
      updateData.dismissed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('ai_insights')
      .update(updateData)
      .eq('id', insightId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[v0] Update insight error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update insight' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('ai_insights')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[v0] Delete insight error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete insight' },
      { status: 500 }
    )
  }
}
