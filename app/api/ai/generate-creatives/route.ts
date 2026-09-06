import { NextResponse } from "next/server"
import OpenAI from "openai"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveUserId } from "@/lib/resolve-user"
import { getRequestWorkspaceId } from "@/lib/workspace"
import { scoreCreativeVariation } from "@/lib/marketing-logic"
import { recordActivity } from "@/lib/activity-log"
import { getBusinessContextForWorkspace } from "@/lib/business-context"
import { rateLimitPolicy, rateLimitResponse } from "@/lib/rate-limit"
import { assertCreditsAvailable, estimatedCredits, recordCreditUsage, recordFixedCreditUsage, CreditQuotaError } from "@/lib/ai-credits"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" })

const CreativeBriefSchema = z.object({
  workspaceId: z.string().optional(),
  adAccountId: z.string().optional(),
  campaignId: z.string().optional(),
  brandName: z.string().optional(),
  businessName: z.string().optional(),
  industry: z.string().optional(),
  brandTone: z.string().optional(),
  objective: z.string().optional(),
  platform: z.string().optional(),
  format: z.string().optional(),
  productName: z.string().optional(),
  valueProp: z.string().optional(),
  painPoint: z.string().optional(),
  socialProof: z.string().optional(),
  cta: z.string().optional(),
  offer: z.string().optional(),
  targetPersona: z.string().optional(),
  ageRange: z.string().optional(),
  location: z.string().optional(),
  visualStyle: z.string().optional(),
  variations: z.number().min(1).max(10).optional(),
  targetAudience: z.string().optional(),
  adFormat: z.string().optional(),
  tone: z.string().optional(),
  productDescription: z.string().optional(),
  generateImages: z.boolean().optional(),
})

function publicAiError(error: any) {
  const message = String(error?.message || "")
  if (error?.status === 429 || /quota|rate limit/i.test(message)) {
    return "AI quota is exhausted right now. Check the OpenAI billing/quota on the production API key, then try again."
  }
  return "AI creative generation failed. Please try again."
}

function buildImagePrompt(input: z.infer<typeof CreativeBriefSchema>, variation: any, businessContext: string) {
  return `Create a high-converting digital ad image for ${input.platform || "Google Display"}.
Brand: ${input.businessName || input.brandName || "User brand"}
Product/service: ${input.productName || input.productDescription || "Not provided"}
Audience: ${input.targetPersona || input.targetAudience || "Not provided"}
Key message: ${variation.headline || input.valueProp || "Not provided"}
Ad objective: ${input.objective || "Conversions"}
Visual style: ${input.visualStyle || input.brandTone || input.tone || "Professional"}
Requirements: premium SaaS ad quality, clear focal point, minimal embedded text, no watermarks, leave bottom area usable for copy overlay.
${businessContext}`
}

async function generateImageUrls(input: z.infer<typeof CreativeBriefSchema>, variations: any[], businessContext: string) {
  if (!process.env.OPENAI_API_KEY || input.generateImages === false) return { urls: [] as string[], error: null as string | null }
  try {
    const targets = variations.slice(0, Math.min(3, variations.length))
    const imageModel = process.env.OPENAI_IMAGE_MODEL || "dall-e-3"
    const responses = await Promise.all(
      targets.map((variation, index) =>
        openai.images.generate({
          model: imageModel,
          prompt: `${buildImagePrompt(input, variation, businessContext)}\nVariation ${index + 1}: ${index === 0 ? "primary composition" : index === 1 ? "different layout" : "different color treatment"}.`,
          size: "1024x1024",
        })
      )
    )
    const urls = responses
      .map((response) => {
        const image = response.data?.[0]
        if (image?.url) return image.url
        if (image?.b64_json) return `data:image/png;base64,${image.b64_json}`
        return null
      })
      .filter(Boolean) as string[]
    return { urls, error: urls.length ? null : "OpenAI did not return image assets" }
  } catch (error: any) {
    console.warn("Image generation fallback triggered:", error?.message || error)
    return { urls: [] as string[], error: publicAiError(error) }
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const userId = await resolveUserId(session.user.id)
    const input = CreativeBriefSchema.parse(await request.json())
    const textLimit = await rateLimitPolicy(userId, "creativeText")
    if (!textLimit.allowed) return rateLimitResponse(textLimit)
    if (input.generateImages !== false) {
      const imageLimit = await rateLimitPolicy(userId, "imageGeneration")
      if (!imageLimit.allowed) return rateLimitResponse(imageLimit)
    }
    const workspaceId = await getRequestWorkspaceId(userId, request as any)
    const requestedCount = input.variations || 3
    const businessContext = await getBusinessContextForWorkspace(workspaceId)

    const campaign = input.campaignId
      ? await prisma.campaign.findFirst({
          where: { id: input.campaignId, userId, workspaceId },
          select: { id: true, adAccountId: true, name: true, objective: true, platform: true, spend: true, roas: true },
        })
      : null
    const selectedIntegration = await prisma.integration.findFirst({
      where: {
        userId,
        workspaceId,
        platform: String(input.platform || campaign?.platform || "GOOGLE").toUpperCase() as any,
        hasAdsAccess: true,
        status: { in: ["OAUTH_GRANTED", "ACCOUNT_SELECTED", "INITIAL_SYNC_RUNNING", "ACTIVE", "SYNC_FAILED"] },
      },
      select: { selectedAdAccountId: true, accountId: true },
    })
    const selectedAdAccountId = selectedIntegration?.selectedAdAccountId || selectedIntegration?.accountId || null
    const adAccountId = campaign?.adAccountId || selectedAdAccountId || null

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          code: "AI_UNAVAILABLE",
          error: "AI creative generation is unavailable because OPENAI_API_KEY is not configured.",
        },
        { status: 503 }
      )
    }
    const textModel = process.env.OPENAI_CREATIVE_MODEL || "gpt-4o"
    const imageModel = process.env.OPENAI_IMAGE_MODEL || "dall-e-3"
    const imageCount = input.generateImages === false ? 0 : Math.min(3, requestedCount)
    const imageCredits = Number(process.env.AI_IMAGE_CREDITS || 100)
    await assertCreditsAvailable(workspaceId, estimatedCredits(textModel) + imageCount * imageCredits)

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true, industry: true, toneOfVoice: true, productDescription: true, websiteUrl: true },
    })

    // Fetch top-performing angles from existing generated creatives for this ad account
    const existingCreatives = adAccountId
      ? await prisma.generatedCreative.findMany({
          where: { workspaceId, adAccountId },
          orderBy: [{ score: "desc" }, { createdAt: "desc" }],
          take: 5,
          select: { score: true, variations: true },
        })
      : []

    // Fetch campaign performance metrics if a campaign is selected
    const campaignMetrics = campaign?.id
      ? await prisma.campaignMetricDaily.findMany({
          where: { campaignId: campaign.id },
          orderBy: { metricDate: "desc" },
          take: 14,
          select: { ctr: true, roas: true, spend: true, conversions: true },
        }).then((rows) => {
          const spend = rows.reduce((s, r) => s + Number(r.spend || 0), 0)
          const conversions = rows.reduce((s, r) => s + Number(r.conversions || 0), 0)
          const avgCtr = rows.length ? rows.reduce((s, r) => s + Number(r.ctr || 0), 0) / rows.length : 0
          const avgRoas = rows.length ? rows.reduce((s, r) => s + Number(r.roas || 0), 0) / rows.length : 0
          return { spend, conversions, avgCtr, avgRoas, hasData: rows.length > 0 }
        }).catch(() => null)
      : null

    const existingAngleSummary = existingCreatives.length
      ? `Existing top creative angles: ${existingCreatives.map((c) => {
          const cVars = Array.isArray(c.variations) ? c.variations : []
          const top = cVars[0] as any
          return top?.angle || top?.headline?.slice(0, 40) || "unknown"
        }).join("; ")}.`
      : ""

    const campaignContext = campaignMetrics?.hasData
      ? `Campaign performance context: ${campaign?.name} has ${campaignMetrics.conversions.toFixed(0)} conversions, ${campaignMetrics.avgCtr.toFixed(2)}% avg CTR, ${campaignMetrics.avgRoas.toFixed(2)}x avg ROAS over the last 14 days.`
      : ""

    const businessName = input.businessName || workspace?.name || "Our Business"
    const productDescription = input.productDescription || workspace?.productDescription || "Not provided"
    const brandTone = input.brandTone || input.tone || workspace?.toneOfVoice || "Professional"
    const industry = input.industry || workspace?.industry || "Not provided"

    let variations: any[] = []

    {
      const system = `You are a senior direct-response creative strategist. Always personalize creative variations using the provided workspace brand context (${businessName}, ${productDescription}). Produce high-converting ad variations tailored specifically to this business. Return ONLY valid JSON matching this schema: { "variations": [{ "headline": "...", "body": "...", "description": "...", "cta": "...", "visualDirection": "...", "whyThisWorks": "...", "angle": "desire|pain|proof|curiosity" }] }`
      const user = `Generate ${requestedCount} ad creative variations.
Brand: ${businessName}
Industry: ${industry}
Tone: ${brandTone}
Campaign: ${campaign?.name || "New campaign"}
Objective: ${input.objective || campaign?.objective || "Conversions"}
Platform/Format: ${input.platform || campaign?.platform || "Google"} / ${input.format || input.adFormat || "Static Image"}
Product/Offer: ${productDescription}
Value prop: ${input.valueProp || productDescription}
Pain point: ${input.painPoint || "Not provided"}
CTA: ${input.cta || "Shop Now"}
Audience: ${input.targetPersona || input.targetAudience || "Target customers"}
${campaignContext}
${existingAngleSummary}
${businessContext}`

      try {
        const completion = await openai.chat.completions.create({
          model: textModel,
          temperature: 0.65,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        })
        await recordCreditUsage({ workspaceId, userId, route: "/api/ai/generate-creatives", model: textModel, inputTokens: completion.usage?.prompt_tokens, outputTokens: completion.usage?.completion_tokens })
        const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}")
        if (Array.isArray(parsed.variations) && parsed.variations.length) variations = parsed.variations
      } catch (err) {
        console.warn("Creative text generation fallback triggered:", err)
      }
    }

    if (!variations.length) {
      // Generate more tailored fallback variations based on input
      const valueProp = input.valueProp || productDescription || "our solution";
      const painPoint = input.painPoint || "inefficient processes";
      const targetAudience = input.targetPersona || input.targetAudience || "business owners";

      variations = [
        {
          headline: `Solve ${painPoint} with ${businessName}`,
          body: `Discover how ${businessName} helps ${targetAudience} overcome ${painPoint.toLowerCase()} and achieve better results.`,
          description: productDescription !== "Not provided" ? productDescription.slice(0, 100) : "Proven solutions designed for real business challenges.",
          cta: "Learn More",
          visualDirection: "Problem/solution visual showing before/after scenarios",
          whyThisWorks: "Directly addresses customer pain point with clear solution",
          angle: "pain",
        },
        {
          headline: `Get Results Like ${targetAudience} Do`,
          body: `Join successful ${targetAudience} who trust ${businessName} to deliver measurable outcomes every day.`,
          description: "Trusted by industry leaders with verified results and customer satisfaction.",
          cta: "See How",
          visualDirection: "Social proof visualization with customer logos and testimonials",
          whyThisWorks: "Leverages social proof to build trust and credibility",
          angle: "proof",
        },
        {
          headline: `The Smart Choice for ${valueProp}`,
          body: `Experience the ${businessName} advantage - specifically designed for ${targetAudience} seeking better ${valueProp.toLowerCase()}.`,
          description: "Engineered for performance with features that matter most to your business.",
          cta: "Get Started",
          visualDirection: "Clean product/service focus with benefit-oriented graphics",
          whyThisWorks: "Highlights unique value proposition with clear differentiation",
          angle: "desire",
        },
      ]
    }

    const scored = variations.slice(0, requestedCount).map((variation) => {
      const score = scoreCreativeVariation({
        headline: variation.headline,
        body: variation.body,
        description: variation.description,
        cta: variation.cta,
        targetPersona: input.targetPersona || input.targetAudience,
        painPoint: input.painPoint,
        valueProp: input.valueProp,
        socialProof: input.socialProof,
      })
      return { ...variation, ...score }
    })

    const imageResult = await generateImageUrls(input, scored, businessContext)
    if (imageResult.urls.length) {
      await recordFixedCreditUsage({ workspaceId, userId, route: "/api/ai/generate-creatives", model: imageModel, credits: imageResult.urls.length * imageCredits })
    }

    const creative = await prisma.generatedCreative.create({
      data: {
        workspaceId,
        adAccountId,
        userId,
        campaignId: campaign?.id || input.campaignId || null,
        brief: input,
        variations: scored,
        imageUrls: imageResult.urls,
        assets: { imageError: imageResult.error },
        headlines: scored.map((item) => item.headline),
        descriptions: scored.map((item) => item.description || item.body),
        score: Math.round(scored.reduce((sum, item) => sum + item.score, 0) / Math.max(1, scored.length)),
        scoreBreakdown: scored.map((item) => ({ headline: item.headline, score: item.score, breakdown: item.breakdown })),
      },
    })

    await recordActivity({
      userId,
      workspaceId,
      adAccountId,
      type: "CREATIVES_GENERATED",
      title: "AI creatives generated",
      message: `${scored.length} scored creative variations generated.`,
      entityType: "GeneratedCreative",
      entityId: creative.id,
      metadata: { score: creative.score, campaignId: campaign?.id || input.campaignId || null },
    })

    return NextResponse.json({
      success: true,
      ok: true,
      creativeId: creative.id,
      creative,
      variations: scored,
      imageUrls: imageResult.urls,
      imageError: imageResult.error,
      data: { variations: scored, imageUrls: imageResult.urls, imageError: imageResult.error },
    })
  } catch (error: any) {
    if (error instanceof CreditQuotaError) return NextResponse.json({ success: false, code: error.code, error: "Monthly credit quota exceeded. Try again after the workspace credits reset." }, { status: 402 })
    return NextResponse.json({ success: false, code: "AI_CREATIVE_FAILED", error: publicAiError(error) }, { status: error?.status === 429 ? 429 : 500 })
  }
}
