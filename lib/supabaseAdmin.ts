import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let cachedAdmin: any = null

export const getSupabaseAdmin = () => {
  if (!cachedAdmin && supabaseUrl && serviceRoleKey) {
    cachedAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }
  return cachedAdmin
}

// Keep for backward compatibility but it returns lazy-loaded version
export const supabaseAdmin = {
  get from() {
    return getSupabaseAdmin()?.from
  },
}
