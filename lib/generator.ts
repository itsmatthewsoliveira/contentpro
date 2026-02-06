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

function defaultTheme(brandSlug: string): CarouselTheme {
  if (brandSlug === 'servicegrowth-ai') {
    return {
      artDirection: 'Dark premium tech editorial with restrained cyan accents',
      lighting: 'Cinematic low-key lighting with controlled glow edges',
      framing: 'Asymmetric grid with clear text hierarchy and breathing room',
      textureMotif: 'Glass, brushed metal, subtle depth layers',
      consistencyAnchor: 'Same camera language and contrast profile across every slide',
    }
  }

  return {
    artDirection: 'Luxury architectural editorial with aspirational outdoor lifestyle scenes',
    lighting: 'Golden-hour warmth with controlled highlights and soft shadows',
    framing: 'Magazine composition with intentional negative space and elegant alignment',
    textureMotif: 'Natural stone, refined materials, premium environmental details',
    consistencyAnchor: 'Consistent grading and composition rhythm across all slides',
  }
}

function normalizeTheme(raw: unknown, brandSlug: string): CarouselTheme {
  const fallback = defaultTheme(brandSlug)
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

function getBrandPromptRules(brandSlug: string): { identity: string; negatives: string } {
  if (brandSlug === 'servicegrowth-ai') {
    return {
      identity: `BRAND LOCK: ServiceGrowth AI
- Colors: #0D0D0D background, #00D4FF accent, #FFFFFF text only
- Typography: modern sans-serif only, clean geometric hierarchy
- Aesthetic: premium tech editorial, dark, cinematic, precise`,
      negatives: `NEGATIVE RULES:
- No script/cursive/serif lettering
- No pink, maroon, warm luxury palette, or ornate design language
- No generic stock scenes (head-in-hands office person, random hologram, handshake cliches)
- English text only, perfect spelling`,
    }
  }

  return {
    identity: `BRAND LOCK: Caviar Pavers
- Colors: #1E3A5F navy, #5C4033 brown, #C9A227 gold, #F5F0E6 cream only
- Typography: elegant serif headline + clean sans-serif support
- Aesthetic: premium architectural editorial, luxury outdoor lifestyle`,
    negatives: `NEGATIVE RULES:
- No neon cyber/tech style or glassmorphism UI language
- No random stock construction imagery
- English text only, perfect spelling`,
  }
}

function enrichCompositionPrompt(
  brandSlug: string,
  basePrompt: string,
  theme: CarouselTheme,
  slide: Partial<Slide>,
  slideNumber: number,
  totalSlides: number
): string {
  const { identity, negatives } = getBrandPromptRules(brandSlug)
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

${negatives}`
}

function normalizeAIContent(raw: unknown, brandSlug: string, totalSlides: number): AIContent {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const theme = normalizeTheme(record.carouselTheme, brandSlug)

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
      compositionPrompt: asText(candidate.compositionPrompt),
    }

    const basePrompt = partial.compositionPrompt
      || partial.imageDescription
      || `${partial.headline}. ${partial.subtext}`

    partial.compositionPrompt = enrichCompositionPrompt(
      brandSlug,
      basePrompt,
      theme,
      partial,
      i + 1,
      totalSlides
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
    return normalizeAIContent(parsed, brandSlug, totalSlides)
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
  const styleAnalysis = loadStyleAnalysis(brandSlug)

  const layoutHints = styleAnalysis?.layoutPatterns?.length
    ? styleAnalysis.layoutPatterns.join('; ')
    : 'Asymmetric editorial layouts with clear hierarchy'
  const typeHints = styleAnalysis?.typographyPatterns?.length
    ? styleAnalysis.typographyPatterns.join('; ')
    : isServiceGrowth
      ? 'Bold sans-serif hierarchy, clean spacing, no decorative scripts'
      : 'Serif-led headline hierarchy with elegant sans-serif support'
  const designHints = styleAnalysis?.designElements?.length
    ? styleAnalysis.designElements.join('; ')
    : 'Accent dividers, intentional whitespace, restrained decorative elements'

  const brandIdentity = isServiceGrowth
    ? `=== BRAND: ServiceGrowth AI ===
MANDATORY COLORS (ONLY these):
- Background: #0D0D0D
- Accent: #00D4FF
- Text: #FFFFFF

Visual mandate:
- Premium tech editorial
- Modern sans-serif typography only
- Dark cinematic mood with disciplined composition`
    : `=== BRAND: Caviar Pavers ===
MANDATORY COLORS (ONLY these):
- Navy: #1E3A5F
- Brown: #5C4033
- Gold: #C9A227
- Cream: #F5F0E6

Visual mandate:
- Premium architectural editorial
- Elegant serif + sans-serif pairing
- Luxury outdoor lifestyle composition`

  const negativeRules = isServiceGrowth
    ? `NEGATIVE RULES:
- No script/cursive/serif lettering
- No pink, maroon, burgundy, or warm luxury palette bleed
- No Portuguese/Spanish/non-English text
- No generic AI stock scenes`
    : `NEGATIVE RULES:
- No neon cyber/tech motifs
- No glassmorphism UI language
- No Portuguese/Spanish/non-English text
- No generic stock contractor look`

  return `You are a world-class social creative director producing an Instagram carousel.

${brandIdentity}

VISUAL REFERENCE EXTRACTION (use only these design patterns, not colors/text from refs):
- Layout patterns: ${layoutHints}
- Typography patterns: ${typeHints}
- Design elements: ${designHints}

${negativeRules}

GLOBAL REQUIREMENTS:
1. ENGLISH ONLY. Perfect spelling.
2. Every slide must feel like the same campaign, not random outputs.
3. Headlines max 8 words, mark accent words with *asterisks*.
4. compositionPrompt must be specific and production-quality.
5. Include explicit placement language, visual hierarchy, and typography intent.
6. End each composition prompt with: "1080x1080. English only. No logo."

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
