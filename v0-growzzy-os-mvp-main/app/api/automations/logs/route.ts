import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
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

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get automations with their execution logs
    const { data: automations } = await supabase
      .from("automations")
      .select("id, name")
      .eq("user_id", user.id)

    // For demo purposes, return recent execution logs
    // In production, you'd have an automation_logs table
    const logs = [
      {
        id: "log-1",
        automation_id: "auto-1",
        automation_name: "Daily Report",
        status: "success",
        message: "Automation executed successfully",
        executed_at: new Date(Date.now() - 5 * 60000).toISOString(),
      },
      {
        id: "log-2",
        automation_id: "auto-2",
        automation_name: "ROAS Monitor",
        status: "success",
        message: "ROAS threshold check completed",
        executed_at: new Date(Date.now() - 15 * 60000).toISOString(),
      },
    ]

    return NextResponse.json({ logs }, { status: 200 })
  } catch (error: any) {
    console.error("[v0] Error fetching logs:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
