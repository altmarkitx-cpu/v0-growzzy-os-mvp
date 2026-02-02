import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  try {
    const formData = await req.json()
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
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

    const { data: lead, error } = await supabase
      .from("leads")
      .insert([
        {
          user_id: user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          status: formData.status || "new",
          value: formData.value || 0,
          tags: formData.tags || [],
          source: formData.source || "direct",
        },
      ])
      .select()

    if (error) throw error

    console.log("[v0] Lead created:", lead)

    return NextResponse.json(lead[0])
  } catch (error: any) {
    console.error("[v0] Error creating lead:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
