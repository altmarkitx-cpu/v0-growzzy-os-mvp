import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
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
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const state = crypto.randomUUID()
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/google/callback`

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  googleAuthUrl.searchParams.append("client_id", process.env.GOOGLE_CLIENT_ID || "")
  googleAuthUrl.searchParams.append("redirect_uri", redirectUri)
  googleAuthUrl.searchParams.append(
    "scope",
    "https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/drive",
  )
  googleAuthUrl.searchParams.append("response_type", "code")
  googleAuthUrl.searchParams.append("state", state)

  const response = NextResponse.redirect(googleAuthUrl.toString())
  response.cookies.set("google_oauth_state", state, { httpOnly: true, maxAge: 600 })

  return response
}
