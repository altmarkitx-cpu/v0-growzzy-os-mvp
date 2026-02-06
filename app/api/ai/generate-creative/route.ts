import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

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
    const { product, targetAudience, tone, platform, goal } = body

    // Mock AI-generated content - replace with actual AI API call
    const generatedContent = [
      {
        headline: `Transform Your ${product} Experience`,
        text: `Discover the power of our premium ${product.toLowerCase()} designed specifically for ${targetAudience.toLowerCase()}. Join thousands of satisfied customers who have transformed their lives with our innovative solution.`,
        cta: "Shop Now - Limited Time Offer",
        tone: tone
      },
      {
        headline: `The Ultimate ${product} Solution`,
        text: `Why settle for less when you can have the best? Our ${product.toLowerCase()} delivers unmatched quality and performance for ${targetAudience.toLowerCase()}. Experience the difference today.`,
        cta: "Learn More - Free Shipping",
        tone: tone
      },
      {
        headline: `${product} That Actually Works`,
        text: `Tired of disappointing results? Our ${product.toLowerCase()} is scientifically formulated to deliver real results for ${targetAudience.toLowerCase()}. Backed by our satisfaction guarantee.`,
        cta: "Try Risk-Free Today",
        tone: tone
      }
    ]

    return NextResponse.json({ content: generatedContent })
  } catch (error) {
    console.error("[v0] Generate creative error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
