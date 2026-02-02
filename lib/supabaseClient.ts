import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

let cachedSupabase: any = null

export const supabase = (() => {
  if (typeof window === "undefined" && (!supabaseUrl || !supabaseAnonKey)) {
    // During build, return null
    return null
  }
  if (!cachedSupabase && supabaseUrl && supabaseAnonKey) {
    cachedSupabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return cachedSupabase
})()

export const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase credentials not available. Check environment variables.")
  }
  if (!cachedSupabase) {
    cachedSupabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return cachedSupabase
}
