import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = getSupabaseServer()

    const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (err) {
    console.error('[api/auth/me] fatal error:', err)
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
