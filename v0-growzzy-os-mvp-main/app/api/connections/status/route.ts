import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl!, supabaseAnonKey!)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock connection data - in production, fetch from connections table
    const connections = {
      meta: {
        connected: Math.random() > 0.5,
        accountName: 'Example Ad Account',
        connectedAt: '2024-01-15',
        syncedAt: '2 hours ago',
      },
      google: {
        connected: Math.random() > 0.5,
        accountName: 'example@gmail.com',
        connectedAt: '2024-01-10',
        syncedAt: '1 hour ago',
      },
      linkedin: {
        connected: Math.random() > 0.5,
        accountName: 'LinkedIn Campaign Manager',
        connectedAt: '2024-01-12',
        syncedAt: '3 hours ago',
      },
      tiktok: {
        connected: false,
        accountName: null,
        connectedAt: null,
        syncedAt: null,
      },
      shopify: {
        connected: false,
        accountName: null,
        connectedAt: null,
        syncedAt: null,
      },
    }

    return NextResponse.json({ connections })
  } catch (error: any) {
    console.error('[v0] Get connections status error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch connections status' },
      { status: 500 }
    )
  }
}
