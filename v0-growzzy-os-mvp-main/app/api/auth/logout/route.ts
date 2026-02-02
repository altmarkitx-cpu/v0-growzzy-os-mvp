import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    console.log('[v0] Logout attempt')

    // Clear authentication cookies
    const cookieStore = await cookies()
    
    cookieStore.delete('sb-access-token')
    cookieStore.delete('sb-refresh-token')

    console.log('[v0] User logged out successfully')

    return NextResponse.json({
      message: 'Logout successful',
    })
  } catch (error) {
    console.error('[v0] Logout error:', error)
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
}
