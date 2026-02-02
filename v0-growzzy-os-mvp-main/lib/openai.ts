import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Creative Generation Prompt Template
export const CREATIVE_GENERATION_PROMPT = (input: {
  productName: string
  benefits: string[]
  audience: { age: string; gender: string; interests: string[] }
  painPoints: string
  campaignGoal: string
  tones: string[]
  platforms: string[]
}) => `You are the world's best direct-response copywriter with 20 years of experience creating viral ads that convert at 5%+ CTR and 3x+ ROAS.

Create 20 EXCEPTIONAL ad creative variations for:

PRODUCT: ${input.productName}
BENEFITS: ${input.benefits.join(', ')}
TARGET: ${input.audience.age}, ${input.audience.gender}, interested in ${input.audience.interests.join(', ')}
PAIN POINTS: ${input.painPoints}
GOAL: ${input.campaignGoal}
TONE: ${input.tones.join(', ')}
PLATFORM: ${input.platforms.join(', ')}

For EACH of the 20 variations, provide:

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

Variation 1 could be emotional storytelling.
Variation 2 could be data-driven with statistics.
Variation 3 could be problem-focused with urgency.
Variation 4 could be benefit-stacking.
Variation 5 could be testimonial-based.
And so on...

Return ONLY valid JSON:
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

// AI Insights Prompt Template
export const INSIGHTS_GENERATION_PROMPT = (data: {
  totalSpend: number
  totalRevenue: number
  roas: number
  conversions: number
  topCampaigns: Array<{ name: string; roas: number; spend: number }>
  bottomCampaigns: Array<{ name: string; roas: number; spend: number }>
}) => `Analyze this marketing data and provide actionable insights:

OVERALL METRICS:
- Total Spend: $${data.totalSpend.toFixed(2)}
- Total Revenue: $${data.totalRevenue.toFixed(2)}
- ROAS: ${data.roas.toFixed(2)}x
- Conversions: ${data.conversions}

TOP CAMPAIGNS:
${data.topCampaigns.map((c, i) => `${i + 1}. ${c.name}: ROAS ${c.roas.toFixed(2)}x, Spend $${c.spend.toFixed(2)}`).join('\n')}

BOTTOM CAMPAIGNS:
${data.bottomCampaigns.map((c, i) => `${i + 1}. ${c.name}: ROAS ${c.roas.toFixed(2)}x, Spend $${c.spend.toFixed(2)}`).join('\n')}

Provide a JSON response with:
{
  "wins": [
    "Specific achievement with numbers",
    "Another win",
    "Third win"
  ],
  "concerns": [
    "Specific issue with impact",
    "Another concern",
    "Third concern"
  ],
  "recommendations": [
    {
      "title": "Action to take",
      "reasoning": "Why this matters",
      "projectedImpact": "Expected outcome with numbers",
      "confidence": 0.85
    }
  ]
}`

// Chat Co-Pilot System Prompt
export const COPILOT_SYSTEM_PROMPT = `You are GROWZZY OS AI Co-Pilot, an expert marketing advisor for advertising professionals.

Your role is to:
1. Analyze marketing performance data and identify opportunities
2. Provide actionable, data-driven recommendations
3. Explain complex metrics in simple terms
4. Suggest specific next steps with expected outcomes
5. Stay professional but conversational

When analyzing data:
- Always reference specific metrics (ROAS, CTR, CPC, etc.)
- Compare to industry benchmarks where possible
- Prioritize recommendations by impact
- Provide confidence levels for predictions

Available actions you can suggest:
- Pause underperforming ads
- Scale top-performing campaigns
- Reallocate budgets
- Generate new ad creatives
- Launch new campaigns
- Analyze competitor data
- A/B test variations`
