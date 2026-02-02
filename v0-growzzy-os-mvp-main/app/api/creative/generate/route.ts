import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generateText } from "ai"

export async function POST(req: NextRequest) {
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
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      productName,
      benefits,
      audience,
      painPoints,
      campaignGoal,
      tones,
      platforms,
    } = await req.json()

    console.log("[v0] Generating 3 ad variations for product:", productName)

    const prompt = `You are the world's best direct-response copywriter with 20 years of experience creating viral ads that convert at 5%+ CTR and 3x+ ROAS.

Create 3 EXCEPTIONAL ad creative variations for:

PRODUCT: ${productName}
BENEFITS: ${Array.isArray(benefits) ? benefits.join(", ") : benefits}
TARGET: ${audience.age}, ${audience.gender}, interested in ${audience.interests}
PAIN POINTS: ${painPoints}
GOAL: ${campaignGoal}
TONE: ${tones.join(", ")}
PLATFORM: ${platforms.join(", ")}

For EACH of the 3 variations, provide:

1. PRIMARY TEXT (125 chars max for Meta, 90 for Google)
   - Must have a POWERFUL hook in first 5 words
   - Use proven frameworks: PAS (Problem-Agitate-Solution), AIDA, Before-After-Bridge
   - Include social proof numbers if possible
   - Create urgency or FOMO
   
2. HEADLINE (40 chars max)
   - Must be attention-grabbing
   - Different from primary text
   
3. DESCRIPTION (30 chars max)
   - Reinforce the value proposition
   
4. CALL-TO-ACTION
   - Choose from: Shop Now, Learn More, Sign Up, Get Started, Claim Offer, Download
   
5. CREATIVE BRIEF (for designer/image)
   - Describe the visual: What should the image/video show?
   - Color scheme suggestion
   - Key visual elements
   
6. PSYCHOLOGICAL TRIGGER
   - Which trigger does this use: Urgency, Scarcity, Social Proof, Authority, Reciprocity, Curiosity, Fear of Missing Out
   
7. FRAMEWORK USED
   - Which copywriting framework: PAS, AIDA, BAB, 4P, FAB
   
8. PREDICTED PERFORMANCE SCORE (1-10)
   - Based on best practices, estimate how well this will perform
   
9. TARGET AUDIENCE SEGMENT
   - Which sub-segment of the audience would this work best for?

Make each variation COMPLETELY DIFFERENT in approach. Don't just swap words.

Variation 1 should be emotional storytelling/benefit-focused.
Variation 2 should be data-driven with statistics and authority.
Variation 3 should be problem-focused with urgency and FOMO.

Return ONLY valid JSON with no markdown formatting:
{
  "creatives": [
    {
      "id": 1,
      "primaryText": "...",
      "headline": "...",
      "description": "...",
      "cta": "...",
      "creativeBrief": "...",
      "trigger": "...",
      "framework": "...",
      "score": 8.5,
      "targetSegment": "...",
      "reasoning": "Why this will work..."
    }
  ]
}`

    console.log("[v0] Calling OpenAI for ad generation")

    const response = await generateText({
      model: "openai/gpt-4-turbo",
      prompt,
      maxOutputTokens: 2000,
      temperature: 0.9,
    })

    console.log("[v0] OpenAI response received, parsing creatives")

    // Extract JSON from response
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in OpenAI response")
    }

    const result = JSON.parse(jsonMatch[0])
    const creatives = result.creatives || []

    console.log("[v0] Generated", creatives.length, "ad variations")

    // Save creatives to database
    const savedCreatives = []
    for (const creative of creatives) {
      const { data: saved, error } = await supabase
        .from("ad_creatives")
        .insert({
          user_id: user.id,
          product_name: productName,
          platform: platforms.join(","),
          primary_text: creative.primaryText,
          headline: creative.headline,
          description: creative.description,
          cta: creative.cta,
          creative_brief: creative.creativeBrief,
          trigger: creative.trigger,
          framework: creative.framework,
          score: creative.score,
          target_segment: creative.targetSegment,
          reasoning: creative.reasoning,
          used: false,
        })
        .select()
        .single()

      if (!error && saved) {
        savedCreatives.push({
          ...creative,
          id: saved.id,
        })
      }
    }

    console.log("[v0] Saved", savedCreatives.length, "creatives to database")

    return NextResponse.json({
      success: true,
      creatives: savedCreatives,
      stats: {
        total: creatives.length,
        excellent: creatives.filter((c: any) => c.score >= 9).length,
        good: creatives.filter((c: any) => c.score >= 7 && c.score < 9).length,
        test: creatives.filter((c: any) => c.score >= 5 && c.score < 7).length,
      },
    })
  } catch (error: any) {
    console.error("[v0] Creative generation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate creatives" },
      { status: 500 }
    )
  }
}
