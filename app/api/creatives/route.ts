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

    // Mock creatives data - replace with actual database query
    const creatives = [
      {
        id: "1",
        name: "Summer Sale Banner",
        headline: "50% Off Everything",
        description: "Summer clearance sale with massive discounts",
        platform: "facebook",
        status: "active",
        imageUrl: "https://via.placeholder.com/300x200",
        performance: {
          impressions: 15420,
          clicks: 892,
          ctr: "5.78%",
          conversions: 45,
          spend: 234.50,
          trend: "up"
        },
        createdAt: new Date().toISOString()
      },
      {
        id: "2",
        name: "Product Launch Video",
        headline: "Introducing Our New Collection",
        description: "Exciting new product launch video campaign",
        platform: "instagram",
        status: "active",
        imageUrl: "https://via.placeholder.com/300x200",
        performance: {
          impressions: 8750,
          clicks: 412,
          ctr: "4.71%",
          conversions: 28,
          spend: 156.75,
          trend: "up"
        },
        createdAt: new Date().toISOString()
      },
      {
        id: "3",
        name: "Google Search Ad",
        headline: "Best Deals Online",
        description: "Search campaign for best deals and offers",
        platform: "google",
        status: "paused",
        imageUrl: null,
        performance: {
          impressions: 23100,
          clicks: 1155,
          ctr: "5.00%",
          conversions: 67,
          spend: 445.25,
          trend: "down"
        },
        createdAt: new Date().toISOString()
      }
    ]

    return NextResponse.json({ creatives })
  } catch (error) {
    console.error("[v0] Get creatives error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
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

    const body = await req.json()
    
    // Create creative logic here
    const newCreative = {
      id: Date.now().toString(),
      ...body,
      userId: user.id,
      createdAt: new Date().toISOString(),
      status: "active"
    }

    return NextResponse.json({ creative: newCreative })
  } catch (error) {
    console.error("[v0] Create creative error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
