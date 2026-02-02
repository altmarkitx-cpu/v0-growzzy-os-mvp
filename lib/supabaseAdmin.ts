import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error("[v0] NEXT_PUBLIC_SUPABASE_URL is not set in environment variables")
}

if (!serviceRoleKey) {
  console.error("[v0] SUPABASE_SERVICE_ROLE_KEY is not set in environment variables. Admin operations will not work.")
}

export const supabaseAdmin = createClient(supabaseUrl || "", serviceRoleKey || "", {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})
