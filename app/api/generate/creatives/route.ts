import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

interface CreativeRequest {
  productName: string
  benefits: string[]
  audience: {
    age: string
    gender: string
    interests: string[]
  }
  painPoints: string
  campaignGoal: string
  tones: string[]
  platforms: string[]
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload: CreativeRequest = await req.json()

    // TODO: Integrate with OpenAI API
    // For now, return mock creatives in the expected format
    // In production: import { generateCreatives } from '@/lib/openai'

    const frameworks = [
      'AIDA',
      'PAS (Problem-Agitate-Solve)',
      'FAB (Features-Advantages-Benefits)',
      'Storytelling',
      'Social Proof',
      'FOMO',
      'Curiosity Gap',
      'Direct Response',
    ]

    const triggers = [
      'Urgency',
      'Scarcity',
      'Social Proof',
      'Emotional Connection',
      'Clear Value',
      'Pain Point Relief',
      'Aspiration',
      'Curiosity',
    ]

    const ctaOptions = [
      'Learn More',
      'Get Started',
      'Claim Free Access',
      'Join 10K+ Users',
      'See Results',
      'Schedule Demo',
      'Limited Time Offer',
      'Try Now Free',
      'Unlock Growth',
      'Transform Your Business',
    ]

    const creatives = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      primaryText: generatePrimaryText(payload, i),
      headline: generateHeadline(payload, i),
      description: generateDescription(payload, i),
      cta: ctaOptions[i % ctaOptions.length],
      creativeBrief: generateBrief(payload, i),
      trigger: triggers[i % triggers.length],
      framework: frameworks[i % frameworks.length],
      score: 7.5 + Math.random() * 2.5,
      targetSegment: `${payload.audience.age} years, interested in ${payload.audience.interests[0]}`,
      reasoning: generateReasoning(payload, i),
    }))

    return NextResponse.json({ creatives })
  } catch (error) {
    console.error('[v0] Creative generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate creatives' },
      { status: 500 }
    )
  }
}

function generatePrimaryText(payload: CreativeRequest, index: number): string {
  const templates = [
    `Stop wasting ${payload.painPoints.split(',')[0]} 🛑 ${payload.productName} helps you ${payload.benefits[0].toLowerCase()} in minutes.`,
    `Join 10K+ marketers using ${payload.productName} to ${payload.benefits[0].toLowerCase()}.`,
    `Your competitors are already ${payload.benefits[0].toLowerCase()} with ${payload.productName}. Don't get left behind.`,
    `${payload.benefits[0]} on autopilot? It's now possible with ${payload.productName}.`,
    `The #1 reason teams switch to ${payload.productName}? ${payload.benefits[Math.min(1, payload.benefits.length - 1)].toLowerCase()}.`,
    `Tired of ${payload.painPoints.split(',')[0]}? ${payload.productName} changes everything.`,
    `${payload.benefits[0]} isn't a luxury anymore. It's a necessity. Here's why →`,
    `Imagine ${payload.benefits[Math.min(1, payload.benefits.length - 1)].toLowerCase()} happening automatically. That's ${payload.productName}.`,
  ]
  return templates[index % templates.length]
}

function generateHeadline(payload: CreativeRequest, index: number): string {
  const templates = [
    `${payload.benefits[0]} Guaranteed or Your Money Back`,
    `The ${payload.productName} Method That Changed Everything`,
    `How ${payload.productName} Helped [Company] 3x Their ROI`,
    `${payload.productName}: The Tool Every ${payload.audience.interests[0]} Needs`,
    `Stop Struggling with ${payload.painPoints.split(',')[0]}`,
    `The Shortcut to ${payload.benefits[Math.min(1, payload.benefits.length - 1)]}`,
    `${payload.productName} Makes ${payload.benefits[0]} Easy (Here's How)`,
    `Warning: Your Competitors Know About ${payload.productName}`,
  ]
  return templates[index % templates.length]
}

function generateDescription(payload: CreativeRequest, index: number): string {
  const templates = [
    `Get instant access to ${payload.productName}. No credit card required.`,
    `Limited spots available. Secure yours before it's too late.`,
    `Free training included with every purchase.`,
    `Join hundreds of successful ${payload.audience.interests[0]} professionals.`,
    `30-day money-back guarantee. Risk-free.`,
    `Save hours every week with our automation tools.`,
    `See results in your first week or full refund.`,
    `Join the ${payload.productName} community today.`,
  ]
  return templates[index % templates.length]
}

function generateBrief(payload: CreativeRequest, index: number): string {
  const templates = [
    `Appeal to ${payload.audience.age} year olds interested in ${payload.audience.interests[0]} with ${payload.benefits[0]}.`,
    `Position ${payload.productName} as the solution to ${payload.painPoints.split(',')[0]}.`,
    `Emphasize urgency and scarcity to drive immediate action.`,
    `Use social proof and testimonials to build trust.`,
    `Highlight the time-saving benefits of ${payload.productName}.`,
    `Create FOMO by mentioning how many others are using it.`,
    `Focus on the transformation users experience.`,
    `Address the specific pain point of your audience.`,
  ]
  return templates[index % templates.length]
}

function generateReasoning(payload: CreativeRequest, index: number): string {
  const templates = [
    `This variation uses urgency and scarcity triggers to drive conversions.`,
    `Social proof is one of the most effective persuasion techniques for this audience.`,
    `The emotional angle resonates better with ${payload.audience.interests[0]} professionals.`,
    `Direct response copywriting has proven to increase CTR by 23%.`,
    `This addresses the primary pain point directly, increasing relevance.`,
    `The curiosity gap compels readers to click for more information.`,
    `Storytelling creates connection and memorability.`,
    `This variation is optimized for mobile ${payload.platforms[0]} advertising.`,
  ]
  return templates[index % templates.length]
}
