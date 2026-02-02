import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generateText } from "ai"

export async function POST(request: Request) {
  try {
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

    const { message, conversationHistory } = await request.json()

    console.log("[v0] Processing AI chat:", message.substring(0, 50))

    // Get user's campaign data for context
    const { data: campaigns } = await supabase.from("campaigns").select("*").eq("user_id", user.id).limit(10)

    const campaignContext =
      campaigns?.map((c) => `${c.name}: $${c.spend} spend, $${c.revenue} revenue, ${c.roas}x ROAS`).join("\n") ||
      "No campaigns"

    // Generate response using Claude
    const { text } = await generateText({
      model: "openai/gpt-4-turbo",
      prompt: `You are GROWZZY OS, an expert AI marketing co-pilot. Help users optimize their campaigns and make data-driven decisions.

User's Current Campaigns:
${campaignContext}

User: ${message}

Provide specific, actionable advice. If suggesting changes, include metrics. Keep responses concise but helpful.`,
    })

    console.log("[v0] AI response generated")

    return NextResponse.json({
      success: true,
      response: text,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[v0] Error in AI chat:", error)
    return NextResponse.json({ error: error.message || "Failed to process chat" }, { status: 500 })
  }
}
