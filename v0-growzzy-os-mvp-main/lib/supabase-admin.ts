import { createClient } from '@supabase/supabase-js'

// Server-side admin client for privileged operations
// Only use inside API routes, never at module level
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
)
