import { createClient } from '@supabase/supabase-js'

// Lazy-load client to avoid issues during build time
let cachedSupabase: any = null

export const getSupabase = () => {
  if (!cachedSupabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    
    // Skip validation during build
    if (!url || !key) {
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        return null
      }
    }
    
    cachedSupabase = createClient(url, key)
  }
  return cachedSupabase
}

// Server-side client with service role key for admin operations
export const getSupabaseServerClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  
  // Skip validation during build
  if (!url || !key) {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return null
    }
  }
  
  return createClient(url, key)
}
