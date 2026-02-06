import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet: any[]) => {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options)
            )
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

    // Mock lead sources data - replace with actual database query
    const sources = [
      {
        id: "1",
        name: "Facebook",
        description: "Facebook and Instagram lead generation campaigns",
        leads: 245,
        conversionRate: 3.2,
        costPerLead: 12.50,
        active: true
      },
      {
        id: "2",
        name: "Google Ads",
        description: "Search and display advertising campaigns",
        leads: 189,
        conversionRate: 4.1,
        costPerLead: 18.75,
        active: true
      },
      {
        id: "3",
        name: "LinkedIn",
        description: "Professional networking and B2B lead generation",
        leads: 67,
        conversionRate: 5.8,
        costPerLead: 25.00,
        active: true
      },
      {
        id: "4",
        name: "Email Newsletter",
        description: "Email marketing and newsletter subscribers",
        leads: 423,
        conversionRate: 2.1,
        costPerLead: 3.25,
        active: false
      }
    ]

    return NextResponse.json({ sources })
  } catch (error) {
    console.error("[v0] Get lead sources error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
