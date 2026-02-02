import { createBrowserClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

// Server-side client with service role key - only use inside API routes, never at module level
export function getServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    // Return null instead of throwing during build time
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Supabase configuration missing')
    }
    // During development/build, return a dummy client that will fail at runtime
    return createSupabaseClient('https://placeholder.supabase.co', 'placeholder-key')
  }

  return createSupabaseClient(url, key)
}
