import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  try {
    const { password } = await req.json()

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

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
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {}
          },
        },
      },
    )

    // Get current user (must have valid reset token in session)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 401 })
    }

    // Update password
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      console.error("[v0] Update password error:", error)
      return NextResponse.json({ error: error.message || "Failed to reset password" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. Please sign in with your new password.",
    })
  } catch (error: any) {
    console.error("[v0] Reset password error:", error)
    return NextResponse.json({ error: error.message || "Failed to reset password" }, { status: 500 })
  }
}
