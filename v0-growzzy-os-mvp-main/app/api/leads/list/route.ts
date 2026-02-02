import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: leads, error } = await supabase
      .from("leads")
      .select(`
        id,
        email,
        name,
        phone,
        status,
        source,
        campaign_id,
        notes,
        created_at
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Failed to fetch leads:", error)
      return NextResponse.json({ leads: [] })
    }

    return NextResponse.json({ leads: leads || [], total: leads?.length || 0 })
  } catch (error) {
    console.error("[v0] Get leads error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
