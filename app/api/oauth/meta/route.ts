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
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/meta/callback`

  const metaAuthUrl = new URL("https://www.facebook.com/v18.0/dialog/oauth")
  metaAuthUrl.searchParams.append("client_id", process.env.META_APP_ID || "")
  metaAuthUrl.searchParams.append("redirect_uri", redirectUri)
  metaAuthUrl.searchParams.append(
    "scope",
    "ads_management,business_management,pages_read_engagement,pages_manage_metadata",
  )
  metaAuthUrl.searchParams.append("state", state)

  // Store state in session for verification
  const response = NextResponse.redirect(metaAuthUrl.toString())
  response.cookies.set("meta_oauth_state", state, { httpOnly: true, maxAge: 600 })

  return response
}
