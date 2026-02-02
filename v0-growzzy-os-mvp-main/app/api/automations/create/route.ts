import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
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

    const body = await request.json()
    const { name, description, trigger_type, trigger_config, action_type, action_config, is_active } = body

    if (!name || !trigger_type || !action_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: automation, error } = await supabase.from("automations").insert({
      user_id: user.id,
      name,
      description,
      trigger_type,
      trigger_config: trigger_config || {},
      action_type,
      action_config: action_config || {},
      is_active: is_active !== false,
    })

    if (error) {
      console.error("[v0] Failed to create automation:", error)
      return NextResponse.json({ error: "Failed to create automation" }, { status: 500 })
    }

    return NextResponse.json({ automation }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create automation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
