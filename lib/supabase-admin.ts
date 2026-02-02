import { createClient } from '@supabase/supabase-js'

let cachedAdmin: any = null

// Server-side admin client for privileged operations - lazily initialized
export function getSupabaseAdmin() {
  if (!cachedAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    
    // Skip creation during build
    if (!url || !key) {
      return null
    }
    
    cachedAdmin = createClient(url, key)
  }
  return cachedAdmin
}

// For backward compatibility
export const supabaseAdmin = {
  get from() {
    return getSupabaseAdmin()?.from
  },
}
