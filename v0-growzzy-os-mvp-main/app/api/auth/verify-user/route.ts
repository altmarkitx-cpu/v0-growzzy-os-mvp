import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json()

    if (!userId && !email) {
      return NextResponse.json({ error: "Missing userId or email" }, { status: 400 })
    }

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    })

    if (userId) {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        email_confirm: true,
      })

      if (error) {
        console.error("[v0] Email verification error:", error.message)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      console.log("[v0] User email verified by ID:", email || userId)
      return NextResponse.json({ success: true })
    } else if (email) {
      const { data: users, error: listError } = await supabase.auth.admin.listUsers()

      if (listError) {
        console.error("[v0] Error listing users:", listError.message)
        return NextResponse.json({ error: "Failed to verify user" }, { status: 400 })
      }

      const user = users.users.find((u) => u.email === email)
      if (!user) {
        console.error("[v0] User not found:", email)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      })

      if (updateError) {
        console.error("[v0] Email verification error:", updateError.message)
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }

      console.log("[v0] User email verified:", email)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Verify user error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
