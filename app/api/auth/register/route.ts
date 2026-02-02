import { NextResponse } from "next/server"
import { getServerSupabaseClient } from "@/lib/supabase-client"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, name } = body
    const supabase = getServerSupabaseClient()

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields (email, password, name)" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      )
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user in Supabase
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        id: uuidv4(),
        email,
        full_name: name,
        password_hash: hashedPassword,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error || !user) {
      console.error("[v0] Database error:", error)
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      )
    }

    console.log("[v0] User created successfully:", user.email)

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.full_name,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    )
  }
}
