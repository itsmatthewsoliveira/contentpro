import Anthropic from '@anthropic-ai/sdk'
import { BrandConfig, Brief, Slide } from './types'
import { readStyleAnalysis } from './storage'

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

interface CarouselTheme {
  artDirection: string
  lighting: string
  framing: string
  textureMotif: string
  consistencyAnchor: string
}

interface AIContent {
  strategy: {
    goal: string
    targetAudience: string
    hook: string
    callToAction: string
  }
  carouselTheme: CarouselTheme
  slides: Partial<Slide>[]
  caption: string
  hashtags: string[]
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function asStringArray(value: unknown, max = 20): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean)
    .slice(0, max)
}

function cleanPatternList(
  values: string[] | undefined,
  brandSlug: string,
  max = 4
): string[] {
  if (!values?.length) return []

  const globalBlock = /(vendas|conex[aã]o|marketing\s+digital|portugu[eê]s|spanish)/i
  const serviceGrowthBlock = /(script|cursive|calligraphy|handwriting|maroon|magenta|pink|burgundy)/i
  const caviarBlock = /(cyber|glassmorphism|neon\s+ui|sci-?fi)/i

  return values
    .map((v) => v.trim())
    .filter(Boolean)
    .filter((v) => !globalBlock.test(v))
    .filter((v) => {
      if (brandSlug === 'servicegrowth-ai') return !serviceGrowthBlock.test(v)
      if (brandSlug === 'caviar-pavers') return !caviarBlock.test(v)
      return true
    })
    .slice(0, max)
}

function loadStyleAnalysis(brandSlug: string): StyleAnalysis | null {
  try {
    const data = readStyleAnalysis(brandSlug)
    if (!data || typeof data !== 'object') return null

    const raw = data as Record<string, unknown>
    return {
      fonts: raw.fonts && typeof raw.fonts === 'object'
        ? {
          primary: asText((raw.fonts as Record<string, unknown>).primary),
          secondary: asText((raw.fonts as Record<string, unknown>).secondary),
          accent: asText((raw.fonts as Record<string, unknown>).accent),
        }
        : undefined,
      typographyPatterns: cleanPatternList(asStringArray(raw.typographyPatterns, 8), brandSlug),
      layoutPatterns: cleanPatternList(asStringArray(raw.layoutPatterns, 8), brandSlug),
      designElements: cleanPatternList(asStringArray(raw.designElements, 8), brandSlug),
      promptGuidance: asText(raw.promptGuidance),
    }
  } catch {
    return null
  }
}

// function defaultTheme removed - now using dynamic fallback in normalizeTheme

function normalizeTheme(raw: unknown, brandSlug: string, visualStyle?: any): CarouselTheme {
  const fallback = {
    artDirection: visualStyle?.aesthetic || 'Clean professional layout',
    lighting: 'Balanced professional lighting',
    framing: 'Rule of thirds, clear hierarchy',
    textureMotif: 'Clean surfaces',
    consistencyAnchor: 'Consistent brand colors and typography'
  }

  if (!raw || typeof raw !== 'object') return fallback

  const record = raw as Record<string, unknown>
  return {
    artDirection: asText(record.artDirection, fallback.artDirection),
    lighting: asText(record.lighting, fallback.lighting),
    framing: asText(record.framing, fallback.framing),
    textureMotif: asText(record.textureMotif, fallback.textureMotif),
    consistencyAnchor: asText(record.consistencyAnchor, fallback.consistencyAnchor),
  }
}

function getBrandPromptRules(
  brand: BrandConfig
): { identity: string; negatives: string } {
  // Build identity string from generic config
  const colorList = Object.entries(brand.colors.primary || {})
    .map(([key, val]) => `- ${key}: ${val}`)
    .join('\n')

  const aesthetic = brand.visualStyle?.aesthetic || 'Professional and clean'
  const negativePrompt = brand.visualStyle?.negativePrompt || 'No low-quality stock images'

  const identity = `=== BRAND: ${brand.name} ===
COLORS:
${colorList}

VISUAL MANDATE:
- Aesthetic: ${aesthetic}
- Headline Font: ${brand.typography.headlineFont}
- Body Font: ${brand.typography.bodyFont}
`

  const negatives = `NEGATIVE RULES:
${negativePrompt.split('. ').map(rule => `- ${rule.trim()}`).join('\n')}
`

  return { identity, negatives }
}

function enrichCompositionPrompt(
  brand: BrandConfig,
  basePrompt: string,
  theme: CarouselTheme,
  slide: Partial<Slide>,
  slideNumber: number,
  totalSlides: number
): string {
  const { identity, negatives } = getBrandPromptRules(brand)
  const headline = asText(slide.headline)
  const subtext = asText(slide.subtext)

  return `${identity}

CAROUSEL THEME (use consistently on all slides):
- Art direction: ${theme.artDirection}
- Lighting: ${theme.lighting}
- Framing: ${theme.framing}
- Texture motif: ${theme.textureMotif}
- Consistency anchor: ${theme.consistencyAnchor}

SLIDE CONTEXT:
- Slide ${slideNumber}/${totalSlides}
- Headline: ${headline || 'N/A'}
- Subtext: ${subtext || 'N/A'}

COMPOSITION BRIEF:
${basePrompt}

EXECUTION QUALITY BAR:
- 1080x1080 Instagram-ready design
- Leave top-left 60x60 clear for logo overlay
- Professional design output, not generic AI stock style
- No logo, no watermark
- ${brand.visualStyle?.imageGuidance || 'High quality professional look'}

${negatives}`
}

// Generate a creative brief that gives direction but leaves room for visual creativity
// Generate a creative brief that gives direction but leaves room for visual creativity
function generateCreativeBrief(
  brand: BrandConfig,
  slide: Partial<Slide>,
  slideNumber: number,
  totalSlides: number,
  theme: CarouselTheme
): string {
  const headline = asText(slide.headline).replace(/\*/g, '')
  const subtext = asText(slide.subtext)
  const purpose = asText(slide.purpose)
  const imageDesc = asText(slide.imageDescription)

  // Build a creative brief that describes WHAT to create, not HOW
  const parts: string[] = []

  // Slide role in the story
  if (slideNumber === 1) {
    parts.push('Opening hook slide — grab attention, create intrigue.')
  } else if (slideNumber === totalSlides) {
    parts.push('Final CTA slide — clear call to action, confident energy.')
  } else {
    parts.push(`Slide ${slideNumber}/${totalSlides} — ${purpose.toLowerCase()}.`)
  }

  // The message to convey
  parts.push(`Message: "${headline}"`)
  if (subtext) {
    parts.push(`Supporting: "${subtext}"`)
  }

  // Visual concept from AI (if provided)
  if (imageDesc) {
    parts.push(`Visual concept: ${imageDesc}`)
  }

  // Brand-specific creative direction
  if (brand.visualStyle?.aesthetic) {
    parts.push(`Mood: ${brand.visualStyle.aesthetic}`)
  }

  if (brand.visualStyle?.imageGuidance) {
    parts.push(`Visual Guidance: ${brand.visualStyle.imageGuidance}`)
  }

  // Theme consistency
  parts.push(`Art direction: ${theme.artDirection}`)

  return parts.join('\n')
}

function normalizeAIContent(raw: unknown, brand: BrandConfig, totalSlides: number): AIContent {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const theme = normalizeTheme(record.carouselTheme, brand.name, brand.visualStyle)

  const strategyRaw = record.strategy && typeof record.strategy === 'object'
    ? (record.strategy as Record<string, unknown>)
    : {}

  const strategy = {
    goal: asText(strategyRaw.goal, 'Educate and move the audience to action.'),
    targetAudience: asText(strategyRaw.targetAudience, 'Instagram users interested in this offer.'),
    hook: asText(strategyRaw.hook, 'A strong, specific promise.'),
    callToAction: asText(strategyRaw.callToAction, 'Take the next action now.'),
  }

  const rawSlides = Array.isArray(record.slides) ? record.slides : []
  const slides: Partial<Slide>[] = []

  for (let i = 0; i < totalSlides; i++) {
    const candidate = (rawSlides[i] && typeof rawSlides[i] === 'object')
      ? (rawSlides[i] as Record<string, unknown>)
      : {}

    const partial: Partial<Slide> = {
      purpose: asText(candidate.purpose, i === 0 ? 'Hook' : i === totalSlides - 1 ? 'CTA' : 'Value'),
      headline: asText(candidate.headline, `Slide ${i + 1}`),
      subtext: asText(candidate.subtext),
      bullets: asStringArray(candidate.bullets, 6),
      cta: asText(candidate.cta) || null,
      elements: asStringArray(candidate.elements, 8),
      imageDescription: asText(candidate.imageDescription),
      layout: asText(candidate.layout, 'full-composition'),
      compositionPrompt: '', // Will be filled below
    }

    // Auto-generate a creative brief for the image
    partial.compositionPrompt = generateCreativeBrief(
      brand,
      partial,
      i + 1,
      totalSlides,
      theme
    )

    slides.push(partial)
  }

  return {
    strategy,
    carouselTheme: theme,
    slides,
    caption: asText(record.caption),
    hashtags: asStringArray(record.hashtags, 20),
  }
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
  // User's slideCount always takes priority
  const totalSlides = slideCount

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
    carouselTheme: aiContent.carouselTheme,
    slides: aiContent.slides.map((slide: Partial<Slide>, index: number) => ({
      ...slide,
      number: index + 1,
      layout: slide.layout || 'full-composition',
      totalSlides,
    })) as Slide[],
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
): Promise<AIContent> {
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
    const parsed = JSON.parse(jsonStr)
    return normalizeAIContent(parsed, brand, totalSlides)
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
  const styleAnalysis = loadStyleAnalysis(brandSlug)

  const layoutHints = styleAnalysis?.layoutPatterns?.length
    ? styleAnalysis.layoutPatterns.join('; ')
    : brand.visualStyle?.layouts?.join('; ') || 'Asymmetric editorial layouts'

  const typeHints = styleAnalysis?.typographyPatterns?.length
    ? styleAnalysis.typographyPatterns.join('; ')
    : `${brand.typography.headlineFont} headings with ${brand.typography.bodyFont} body`

  const designHints = styleAnalysis?.designElements?.length
    ? styleAnalysis.designElements.join('; ')
    : brand.visualStyle?.elements?.join('; ') || 'Clean professional design'

  const { identity, negatives } = getBrandPromptRules(brand)

  const brandIdentity = identity
  const negativeRules = negatives

  return `You are a world-class social creative director producing an Instagram carousel.

${brandIdentity}

VISUAL REFERENCE EXTRACTION (use only these design patterns, not colors/text from refs):
- Layout patterns: ${layoutHints}
- Typography patterns: ${typeHints}
- Design elements: ${designHints}

${negativeRules}

COPYWRITING RULES (CRITICAL):
1. Write like a top copywriter, not a corporate robot
2. Headlines must be PUNCHY and SPECIFIC — not vague summaries
3. Use concrete numbers, outcomes, and specifics when possible
4. Each headline should make someone STOP scrolling
5. Subtext should add value, not repeat the headline
6. Bullets should be scannable insights, not filler
7. NEVER use: "In today's world", "Unlock", "Revolutionary", "Discover", "Game-changer", "Seamless", "Leverage"
8. Write like you're talking to a smart friend, not a boardroom

HEADLINE EXAMPLES:
- BAD: "The Framework That Works" (vague, boring)
- GOOD: "I Saved 14 Hours a Week With This" (specific, outcome-focused)
- BAD: "Understanding Your Audience" (generic)
- GOOD: "Your Clients Don't Want What You're Selling" (provocative, hook)

GLOBAL REQUIREMENTS:
1. ENGLISH ONLY. Perfect spelling.
2. Every slide must feel like the same campaign, not random outputs.
3. Headlines max 8 words, mark accent words with *asterisks*.
4. For imageDescription, write a brief visual concept (not layout instructions)

CAROUSEL STRUCTURE:
${slideList}

Return JSON exactly in this structure:
{
  "strategy": {
    "goal": "",
    "targetAudience": "",
    "hook": "",
    "callToAction": ""
  },
  "carouselTheme": {
    "artDirection": "",
    "lighting": "",
    "framing": "",
    "textureMotif": "",
    "consistencyAnchor": ""
  },
  "slides": [
    {
      "purpose": "",
      "headline": "with *accent* words",
      "subtext": "",
      "bullets": [""],
      "cta": "",
      "elements": [""],
      "imageDescription": "",
      "layout": "",
      "compositionPrompt": ""
    }
  ],
  "caption": "",
  "hashtags": [""]
}

Return ONLY JSON.`
}
