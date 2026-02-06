import Anthropic from '@anthropic-ai/sdk'
import { BrandConfig, Brief, Slide } from './types'
import fs from 'fs'
import path from 'path'

interface GenerateOptions {
  slideCount?: number
  postType?: string
  imageSource?: string
}

interface StyleAnalysis {
  fonts?: {
    primary?: string
    secondary?: string
    accent?: string
  }
  typographyPatterns?: string[]
  layoutPatterns?: string[]
  designElements?: string[]
  promptGuidance?: string
}

// Load cached style analysis if available
function loadStyleAnalysis(brandSlug: string): StyleAnalysis | null {
  try {
    const analysisPath = path.join(process.cwd(), 'brands', brandSlug, 'style-analysis.json')
    if (fs.existsSync(analysisPath)) {
      return JSON.parse(fs.readFileSync(analysisPath, 'utf-8'))
    }
  } catch {
    // Ignore errors, return null
  }
  return null
}

export async function generateBrief(
  brandSlug: string,
  brand: BrandConfig,
  topic: string,
  options: GenerateOptions = {}
): Promise<Brief> {
  const {
    slideCount = 7,
    postType = 'educationalCarousel',
    imageSource = 'nano-banana',
  } = options

  const postTypeConfig = brand.postTypes[postType]
  const slideStructure = postTypeConfig?.structure || []
  const totalSlides = slideStructure.length || slideCount

  const aiContent = await generateWithAI(brand, brandSlug, topic, slideStructure, totalSlides)

  return {
    meta: {
      brand: brandSlug,
      topic,
      postType,
      generatedAt: new Date().toISOString(),
      slideCount: totalSlides,
    },
    brandContext: {
      colors: brand.colors,
      typography: brand.typography,
      visualStyle: brand.visualStyle,
    },
    strategy: aiContent.strategy,
    slides: aiContent.slides.map((slide: Partial<Slide>, index: number) => ({
      ...slide,
      number: index + 1,
      layout: slide.layout || 'full-composition',
      totalSlides,
    })),
    caption: aiContent.caption,
    hashtags: aiContent.hashtags,
    imageSource,
  }
}

async function generateWithAI(
  brand: BrandConfig,
  brandSlug: string,
  topic: string,
  slideStructure: string[],
  totalSlides: number
) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable not set')
  }

  const client = new Anthropic({ apiKey })
  const systemPrompt = buildSystemPrompt(brand, brandSlug, slideStructure, totalSlides)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 6000,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Create an Instagram carousel about: "${topic}"\n\nReturn ONLY valid JSON, no markdown fences.`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonStr = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()

  try {
    return JSON.parse(jsonStr)
  } catch (err) {
    throw new Error(`Failed to parse AI response as JSON: ${(err as Error).message}`)
  }
}

function buildSystemPrompt(
  brand: BrandConfig,
  brandSlug: string,
  slideStructure: string[],
  totalSlides: number
): string {
  const slideList =
    slideStructure.length > 0
      ? slideStructure.map((s, i) => `  Slide ${i + 1}: ${s}`).join('\n')
      : `  ${totalSlides} slides that flow logically from hook to CTA`

  const isServiceGrowth = brandSlug === 'servicegrowth-ai'

  // Load style analysis - ONLY for visual design inspiration, NOT colors or language
  const styleAnalysis = loadStyleAnalysis(brandSlug)

  // Extract ONLY visual design patterns, ignore any colors from references
  const designInspiration = styleAnalysis
    ? `VISUAL DESIGN INSPIRATION (from references):
- Layout techniques: ${styleAnalysis.layoutPatterns?.join('; ') || 'Editorial, asymmetric'}
- Typography style: ${styleAnalysis.typographyPatterns?.join('; ') || 'Mixed weights, serif + sans-serif'}
- Design elements: ${styleAnalysis.designElements?.join('; ') || 'Accent lines, cards, pills'}
NOTE: Use these VISUAL TECHNIQUES only. Ignore any colors or text from references.`
    : ''

  // STRICT brand identity with explicit color requirements
  const brandIdentity = isServiceGrowth
    ? `=== BRAND: ServiceGrowth AI ===
MANDATORY COLORS (use ONLY these):
- Background: #0D0D0D (dark/black)
- Accent/Highlights: #00D4FF (cyan)
- Text: #FFFFFF (white)
DO NOT use any other colors. Cyan is for accent words and highlights only.

Business: AI automation for service businesses
Vibe: Tech-forward, insider knowledge, premium SaaS aesthetic`
    : `=== BRAND: Caviar Pavers ===
MANDATORY COLORS (use ONLY these):
- Backgrounds: #1E3A5F (navy) or #5C4033 (brown) or #F5F0E6 (cream)
- Accent: #C9A227 (gold) — for lines, highlights, key words
- Text: #F5F0E6 (cream) on dark, #1E3A5F (navy) on light
DO NOT use any other colors. Gold is for accents only, not backgrounds.

Business: Luxury paver installation, outdoor living
Location: Jacksonville, Florida
Vibe: Premium editorial, magazine quality, aspirational`

  // Creative direction
  const creativeVision = isServiceGrowth
    ? `CREATIVE DIRECTION:
Create visuals that feel like premium tech marketing:
- Sleek 3D renders, futuristic interfaces, AI concepts
- Dark moody backgrounds with cyan neon accents
- Studio-quality lighting, cinematic depth
- Think: Apple meets sci-fi, polished and sophisticated`
    : `CREATIVE DIRECTION:
Create visuals that feel like luxury real estate marketing:
- Beautiful outdoor spaces at golden hour
- Editorial photography with warm color grading
- That "enhanced reality" look — real but elevated
- Think: Architectural Digest meets Brazilian social media`

  return `You are a creative director creating an Instagram carousel.

${brandIdentity}

${designInspiration}

${creativeVision}

=== CRITICAL RULES ===

1. LANGUAGE: English ONLY. Never use Portuguese, Spanish, or any other language.

2. COLORS: Use ONLY the brand colors listed above. Never copy colors from references.

3. CONSISTENCY: The carousel should tell a STORY with logical flow:
   - Slide 1: Hook (grab attention)
   - Middle slides: Build the narrative, each adding value
   - Final slide: CTA (clear action)
   All slides should feel like they belong to the SAME carousel, not random posts.

4. VISUAL STYLE: Learn the DESIGN TECHNIQUES from references (layouts, typography patterns, element placement) but apply them with THIS brand's colors.

5. TEXT: All text in the images must be in English and use brand colors.

=== COMPOSITION PROMPTS ===

Each compositionPrompt should describe:
- Background (using brand colors)
- Main visual subject
- Text content with EXACT placement (using brand colors for text)
- Design elements
- End with: "Brand colors only. English text. Studio quality. 1080x1080px. NO LOGO."

=== CAROUSEL FLOW ===

Structure: ${slideList}

Create a cohesive carousel where each slide naturally leads to the next.

=== OUTPUT FORMAT ===

Headlines: Max 8 words. Mark *key words* for accent color.
All text: English only.

Return JSON:
{
  "strategy": {"goal":"","targetAudience":"","hook":"","callToAction":""},
  "slides": [{"headline":"*accent* words","subtext":"","compositionPrompt":"detailed prompt"}],
  "caption": "English caption with \\n line breaks",
  "hashtags": ["english","hashtags","only"]
}

JSON only, no explanation.`
}
