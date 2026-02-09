import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

interface RefineRequest {
  userPrompt: string
  brandSlug: string
  slideContext?: {
    headline?: string
    subtext?: string
    purpose?: string
  }
}

function getBrandRules(brandSlug: string): string {
  if (brandSlug === 'servicegrowth-ai') {
    return `BRAND: ServiceGrowth AI
COLORS (use ONLY these): #0D0D0D background, #00D4FF cyan accent, #FFFFFF text
STYLE: Premium tech editorial, dark cinematic mood, modern sans-serif typography only
DO NOT: script fonts, cursive, serif, pink/maroon/warm colors, Portuguese text, generic stock imagery`
  }

  return `BRAND: Caviar Pavers
COLORS (use ONLY these): #1E3A5F navy, #5C4033 brown, #C9A227 gold, #F5F0E6 cream
STYLE: Premium architectural editorial, elegant serif headlines + sans-serif body, luxury outdoor lifestyle
DO NOT: neon/cyber/tech effects, glassmorphism, Portuguese text, generic stock contractor imagery`
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RefineRequest
    const { userPrompt, brandSlug, slideContext } = body

    if (!userPrompt?.trim()) {
      return NextResponse.json({ error: 'userPrompt is required' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    const client = new Anthropic({ apiKey })
    const brandRules = getBrandRules(brandSlug)

    const contextInfo = slideContext
      ? `\nSLIDE CONTEXT:\n- Headline: ${slideContext.headline || 'N/A'}\n- Subtext: ${slideContext.subtext || 'N/A'}\n- Purpose: ${slideContext.purpose || 'N/A'}`
      : ''

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `You are refining an image generation prompt for an Instagram slide.

${brandRules}
${contextInfo}

USER'S ORIGINAL PROMPT:
${userPrompt}

TASK: Refine this prompt to be more specific and effective for image generation while respecting the brand rules above.

REFINEMENT RULES:
1. Keep the user's creative vision intact — don't change the concept
2. Add specific details about layout, placement, and visual hierarchy
3. Explicitly mention brand colors where relevant
4. Add typography guidance if text is involved
5. End with: "1080x1080 Instagram slide. English only. Leave top-left 60x60px clear for logo. No watermarks."
6. Keep it concise — the image model works better with focused prompts

Return ONLY the refined prompt text, no explanation or markdown.`,
        },
      ],
    })

    const refinedPrompt =
      response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    return NextResponse.json({ refinedPrompt })
  } catch (error) {
    console.error('Refine prompt error:', error)
    const message = error instanceof Error ? error.message : 'Prompt refinement failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
