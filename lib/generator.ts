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
  colorUsage?: {
    backgrounds?: string[]
    text?: string[]
    accents?: string[]
  }
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

  const aiContent = await generateWithAI(brand, brandSlug, topic, postType, slideStructure, totalSlides)

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
  postType: string,
  slideStructure: string[],
  totalSlides: number
) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable not set')
  }

  const client = new Anthropic({ apiKey })
  const systemPrompt = buildSystemPrompt(brand, brandSlug, postType, slideStructure, totalSlides)

  // Use Haiku for cost efficiency — it's 25x cheaper than Sonnet
  // The detailed system prompt guides it well enough
  const response = await client.messages.create({
    model: 'claude-haiku-3-5-20241022',
    max_tokens: 6000,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' }, // Enable prompt caching — 90% cheaper on repeat calls
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
  _postType: string,
  slideStructure: string[],
  totalSlides: number
): string {
  const slideList =
    slideStructure.length > 0
      ? slideStructure.map((s, i) => `  Slide ${i + 1}: ${s}`).join('\n')
      : `  ${totalSlides} slides — you decide the structure`

  const voiceSection = brand.contentVoice
    ? `Voice: ${brand.contentVoice.tone}, ${brand.contentVoice.perspective}. CTA: ${brand.contentVoice.ctaStyle}`
    : ''

  const isServiceGrowth = brandSlug === 'servicegrowth-ai'

  // Load style analysis if available — this gives us EXACT fonts and patterns from references
  const styleAnalysis = loadStyleAnalysis(brandSlug)
  const styleGuidance = styleAnalysis
    ? `
TYPOGRAPHY (from reference analysis):
- Primary: ${styleAnalysis.fonts?.primary || 'Bold serif'}
- Secondary: ${styleAnalysis.fonts?.secondary || 'Light sans-serif'}
- Accent: ${styleAnalysis.fonts?.accent || 'None'}
Patterns: ${styleAnalysis.typographyPatterns?.slice(0, 2).join('; ') || 'Mixed weights'}
${styleAnalysis.promptGuidance || ''}`
    : ''

  const brandIdentity = isServiceGrowth
    ? `BRAND IDENTITY:
- Name: ServiceGrowth AI
- Colors: Dark #0D0D0D, Cyan #00D4FF, White #FFFFFF
- Services: AI automation for service businesses, lead systems, CRM automation
- Vibe: Tech-forward, insider knowledge, personal brand energy
- Reference style: Oliver Merrick — glassmorphism cards, floating app icons, dark backgrounds
- Logo: White text "ServiceGrowth" with cyan arrow/chevron mark — place in top-left corner`
    : `BRAND IDENTITY:
- Name: Caviar Pavers / Caviar Outdoor Designs
- Colors: Brown #5C4033, Navy #1E3A5F, Gold #C9A227, Cream #F5F0E6
- Services: Luxury paver installation, pool decks, patios, driveways, outdoor kitchens
- Vibe: "SoHo meets Tulum" — premium outdoor living, editorial, magazine-quality
- Location: Jacksonville, Florida
- Logo: Gold sturgeon fish on navy background with "CAVIAR OUTDOOR DESIGNS" — place in top-left corner`

  const compositionGuidance = isServiceGrowth
    ? `COMPOSITION GUIDE — Generate FULL slide image prompts. Gemini creates the ENTIRE slide: visuals, text, graphics, layout baked in.

STYLE: Dark #0D0D0D backgrounds, cyan #00D4FF accents, glassmorphism cards, floating tech icons, 3D renders, cinematic lighting. Oliver Merrick aesthetic.

CAMERA: "Sony A7RV 35mm f/1.4" or "3D render, Octane quality, cinematic lighting"

ELEMENTS: Glassmorphism cards (frosted blur), bold white headlines (cyan accent words), floating app icons, category pills, cyan bullet markers, swipe indicators, neon rim lighting.

NO LOGO — logo overlaid separately. Keep top-left clean.

PROMPT FORMULA: [Camera/Quality] + [Background #0D0D0D] + [Hero visual] + [Glassmorphism card with headline + subtext] + [Slide counter XX/XX] + "1080x1080px. NO LOGO."`
    : `COMPOSITION GUIDE — Generate FULL slide image prompts. Gemini creates the ENTIRE slide: visuals, text, graphics, layout baked in.

STYLE: Brazilian premium social media (Dani Bloom). Typography DOMINATES (40-60% of slide). Editorial magazine layouts, NOT stock photography.

COLORS: Navy #1E3A5F, Brown #5C4033, Cream #F5F0E6, Gold #C9A227 accents. Warm, muted, sophisticated.

TYPOGRAPHY: Mix Playfair Display (serif, bold) + Montserrat (sans, light) in SAME headline. Varying weights. Asymmetric positioning.

CAMERA: "Sony A7RV 35mm f/1.4" or "Hasselblad medium format", golden hour, warm tones.

LAYOUT: Top nav bar (category left, CAVIAR right), editorial photos integrated with text, thin gold accent lines, intentional negative space.

NO LOGO — logo overlaid separately. Keep top-left clean.

PROMPT FORMULA: [Background color/gradient] + [HUGE mixed-weight typography as hero] + [Editorial photo element] + [Gold accent lines] + [Top nav bar] + [Slide counter] + "1080x1080px. NO LOGO."`

  return `Creative director for ${brand.name}. Create Instagram carousels where each slide is a fully designed image.

${brandIdentity}
${styleGuidance}
${voiceSection}

VOICE: Confident, modern, no fluff. Headlines max 8 words, *accent* key words. No corporate clichés.

${compositionGuidance}

RULES:
- VARY layouts (photo-dominant, text-dominant, split, asymmetric)
- Include EXACT text in compositionPrompt
- Slide counter "XX/${totalSlides}" in corner
- End prompts with "1080x1080px. NO LOGO."

Structure: ${slideList}

Return JSON:
{
  "strategy": {"goal":"","targetAudience":"","hook":"","callToAction":""},
  "slides": [{"purpose":"","headline":"*accent* words","subtext":"","bullets":[],"compositionPrompt":"FULL prompt for Gemini"}],
  "caption": "with \\n breaks",
  "hashtags": ["no # prefix"]
}

JSON only, no markdown.`
}
