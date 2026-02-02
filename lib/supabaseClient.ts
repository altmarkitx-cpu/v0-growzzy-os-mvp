import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== "undefined") {
    console.error(
      "[v0] Missing Supabase environment variables.\n\n" +
        "To fix this:\n" +
        "1. Copy .env.local.example to .env.local\n" +
        "2. Get your credentials from https://supabase.com/dashboard/project/_/settings/api\n" +
        "3. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY\n" +
        "4. Restart the development server",
    )
  }
}

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error("Supabase client not initialized. Check environment variables.")
  }
  return supabase
}
