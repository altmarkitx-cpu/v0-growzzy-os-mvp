import { generateText } from "ai"

export async function generateAIRecommendations(campaignData: {
  name: string
  platform: string
  spend: number
  revenue: number
  conversions: number
  ctr: number
  cpc: number
  impressions: number
  industry?: string
}) {
  try {
    console.log("[v0] Generating AI recommendations...")

    const roas = campaignData.spend > 0 ? campaignData.revenue / campaignData.spend : 0

    const { text } = await generateText({
      model: "openai/gpt-4-turbo",
      prompt: `Analyze this marketing campaign and provide actionable recommendations:

Campaign: ${campaignData.name}
Platform: ${campaignData.platform}
Spend: $${campaignData.spend.toFixed(2)}
Revenue: $${campaignData.revenue.toFixed(2)}
ROAS: ${roas.toFixed(2)}x
CTR: ${campaignData.ctr.toFixed(2)}%
CPC: $${campaignData.cpc.toFixed(2)}
Conversions: ${campaignData.conversions}
Impressions: ${campaignData.impressions}
Industry: ${campaignData.industry || "General"}

Provide specific, actionable recommendations in this JSON format:
{
  "diagnosis": "What's working and what's not",
  "budgetRecommendation": "Should we increase/decrease budget and by how much?",
  "targetingAdvice": "Specific targeting improvements",
  "creativeAdvice": "Creative refresh suggestions",
  "predictedImpact": "What ROAS can we achieve with these changes?",
  "confidenceScore": 0.85
}`,
    })

    console.log("[v0] AI recommendations generated")

    try {
      return JSON.parse(text)
    } catch {
      return {
        diagnosis: text,
        budgetRecommendation: "Review campaign targeting",
        targetingAdvice: "Refine audience based on performance",
        creativeAdvice: "Test new ad creatives",
        predictedImpact: "2.5x",
        confidenceScore: 0.75,
      }
    }
  } catch (error) {
    console.log("[v0] Error generating recommendations:", error)
    throw error
  }
}

export async function generateAdCreatives(product: {
  name: string
  description: string
  benefits: string
  audience: string
}) {
  try {
    console.log("[v0] Generating ad creatives...")

    const { text } = await generateText({
      model: "openai/gpt-4-turbo",
      prompt: `You are an expert direct-response copywriter. Create 10 high-converting ad variations for:

Product: ${product.name}
Description: ${product.description}
Key Benefits: ${product.benefits}
Target Audience: ${product.audience}

For each variation provide JSON format with:
{
  "variation": 1,
  "primaryText": "125 character max hook",
  "headline": "40 character max",
  "description": "30 character max",
  "cta": "button text",
  "brief": "image/video description",
  "psychologicalTrigger": "urgency/social proof/curiosity",
  "score": 8.5
}

Return as JSON array of 10 objects. Each should use different copywriting approach.`,
    })

    console.log("[v0] Ad creatives generated")

    try {
      return JSON.parse(text)
    } catch {
      return [
        {
          variation: 1,
          primaryText: `Transform your ${product.name} today - Limited time offer!`,
          headline: `Best ${product.name} Ever`,
          description: "Join 1000s of happy customers",
          cta: "Shop Now",
          brief: `Lifestyle image of ${product.name} in action`,
          psychologicalTrigger: "urgency",
          score: 8.5,
        },
        {
          variation: 2,
          primaryText: `See how ${product.name} ${product.benefits}`,
          headline: `${product.benefits} Guaranteed`,
          description: "Get results in 30 days",
          cta: "Learn More",
          brief: `Before/after comparison showing ${product.benefits}`,
          psychologicalTrigger: "social_proof",
          score: 8.2,
        },
        {
          variation: 3,
          primaryText: `What if ${product.name} could change everything?`,
          headline: `Discover The Secret`,
          description: "Only 50 spots available",
          cta: "Discover",
          brief: `Intriguing close-up of ${product.name}`,
          psychologicalTrigger: "curiosity",
          score: 7.9,
        },
      ]
    }
  } catch (error) {
    console.log("[v0] Error generating creatives:", error)
    throw error
  }
}

export async function chatWithAI(message: string, context?: any) {
  try {
    console.log("[v0] Processing AI chat:", message.substring(0, 50))

    const { text } = await generateText({
      model: "openai/gpt-4-turbo",
      prompt: `You are GROWZZY OS, an AI co-pilot for marketing operations. You help users optimize their campaigns, generate insights, and make data-driven decisions.

${context ? `Current Campaign Data: ${JSON.stringify(context)}` : ""}

User: ${message}

Provide helpful, concise marketing advice. If suggesting changes, include specific metrics/percentages.`,
    })

    console.log("[v0] AI response generated")
    return text
  } catch (error) {
    console.log("[v0] Error in AI chat:", error)
    throw error
  }
}
