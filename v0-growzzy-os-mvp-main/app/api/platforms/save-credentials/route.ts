import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  try {
    const { platform, credentials, accountInfo } = await req.json()

    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("platform_connections")
      .upsert(
        {
          user_id: user.id,
          platform,
          credentials: JSON.stringify(credentials), // In production, encrypt this
          account_name: accountInfo.name,
          account_info: accountInfo,
          active: true,
          connected_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,platform",
        },
      )
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      connectionId: data?.[0]?.id,
    })
  } catch (error) {
    console.error("Save credentials error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save credentials",
      },
      { status: 400 },
    )
  }
}
