import { type NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      console.warn("[v0] OPENAI_API_KEY not configured, using fallback response")
      return NextResponse.json({
        response: generateFallbackResponse(message),
        isDefault: true,
      })
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are an expert marketing AI co-pilot for GrowzzyOS. Help users optimize campaigns, analyze performance, and provide actionable recommendations.",
            },
            { role: "user", content: message },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error("[v0] OpenAI API error:", response.status, errorData)
        return NextResponse.json({
          response: generateFallbackResponse(message),
          isDefault: true,
        })
      }

      const data = await response.json()
      const aiResponse = data.choices[0]?.message?.content || generateFallbackResponse(message)

      return NextResponse.json({
        response: aiResponse,
        isDefault: false,
      })
    } catch (openaiError: any) {
      console.error("[v0] OpenAI request error:", openaiError.message)
      return NextResponse.json({
        response: generateFallbackResponse(message),
        isDefault: true,
      })
    }
  } catch (error: any) {
    console.error("[v0] AI Copilot error:", error)
    return NextResponse.json(
      {
        response: "I'm having trouble processing your request. Please try again.",
        isDefault: true,
      },
      { status: 500 },
    )
  }
}

function generateFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("optimize") || lowerMessage.includes("improve")) {
    return `📊 **Performance Optimization Tips:**\n\n1. Focus on high-ROAS platforms\n2. Pause campaigns with ROAS < 1x\n3. Test new ad creatives weekly\n4. Optimize landing pages for better conversion\n\nWould you like specific campaign recommendations?`
  }

  if (lowerMessage.includes("budget") || lowerMessage.includes("spend")) {
    return `💰 **Budget Optimization Strategy:**\n\n- Allocate 60% to top performing platforms\n- Reserve 20% for testing\n- Keep 20% for scaling\n- Monitor ROAS daily\n\nNeed help with specific allocations?`
  }

  if (lowerMessage.includes("lead") || lowerMessage.includes("conversion")) {
    return `🎯 **Lead Generation Analysis:**\n\n- Optimize lead forms for faster completion\n- Test different CTAs\n- Add social proof elements\n- Implement retargeting campaigns\n\nWant specific lead tactics?`
  }

  return `🤖 **AI Co-Pilot Assistant:**\n\nI can help you with:\n- Campaign optimization strategies\n- Budget allocation recommendations\n- Lead generation improvements\n- Performance analysis\n\nWhat would you like to optimize?`
}
