import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

export async function generateAdCreatives(productData: {
  name: string
  description: string
  benefits: string[]
  targetAudience: string
  goal: string
  platform: string
}) {
  try {
    const benefitsList = productData.benefits.join(", ")

    const prompt = `You are an expert direct-response copywriter. Create 10 high-converting ad variations for:

Product: ${productData.name}
Description: ${productData.description}
Key Benefits: ${benefitsList}
Target Audience: ${productData.targetAudience}
Campaign Goal: ${productData.goal}
Platform: ${productData.platform}

For each variation provide JSON with:
- primaryText (max 125 chars, punchy hook)
- headline (max 40 chars)
- description (max 30 chars)
- cta (call-to-action text)
- creativeIdea (what image/video should show)
- psychologicalTrigger (urgency, social proof, curiosity, scarcity, FOMO, exclusivity, etc.)
- score (1-10 predicted performance score)

Use different copywriting frameworks:
- PAS (Problem-Agitate-Solution)
- AIDA (Attention-Interest-Desire-Action)
- Before-After-Bridge
- Problem-Promise-Proof-Push

Return as JSON array. Make each DIFFERENT, not just word swaps.`

    const message = await client.messages.create({
      model: "claude-opus-4-1-20250805",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    const content = message.content[0]
    if (content.type === "text") {
      try {
        return JSON.parse(content.text)
      } catch {
        console.error("[v0] Failed to parse creatives JSON")
        return []
      }
    }

    return []
  } catch (error) {
    console.error("[v0] Creative generation error:", error)
    return []
  }
}
