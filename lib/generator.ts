import Anthropic from '@anthropic-ai/sdk'
import { BrandConfig, Brief, Slide, DesignSystem } from './types'
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
  const { negatives } = getBrandPromptRules(brand)

  // Collect all brand colors
  const colorList: string[] = []
  for (const [section, values] of Object.entries(brand.colors || {})) {
    if (section === 'meaning' || typeof values !== 'object' || !values) continue
    for (const [key, val] of Object.entries(values as Record<string, string>)) {
      if (typeof val === 'string' && val.startsWith('#')) {
        colorList.push(`${key}: ${val}`)
      }
    }
  }

  return `BACKGROUND IMAGE ONLY — do NOT render any text, words, letters, numbers, labels, or typography.

SCENE DESCRIPTION:
${basePrompt}

BRAND COLORS (use these for lighting, accents, and atmosphere):
${colorList.join(', ')}

VISUAL STYLE:
- Art direction: ${theme.artDirection}
- Lighting: ${theme.lighting}
- Mood: ${brand.visualStyle?.aesthetic || 'Professional'}

REQUIREMENTS:
- Generate exactly ONE single image — no grid, collage, or multiple panels
- 1080x1080 pixels
- ZERO text in the image — no words, no letters, no numbers, no labels, no watermarks
- Text will be added programmatically after generation
- Leave the bottom 30-40% of the image slightly darker/simpler for text overlay space
- Professional quality, not generic AI stock

${negatives}`
}

// Build a scene-only description — NO TEXT, just the visual background/3D object
// Text will be composited programmatically after image generation
function buildDesignSpec(
  brand: BrandConfig,
  slide: Partial<Slide>,
  slideNumber: number,
  totalSlides: number,
  theme: CarouselTheme
): string {
  const ds = brand.designSystem
  const imageDesc = asText(slide.imageDescription)
  const photographySubject = asText(slide.photographySubject)
  const heroAsset = asText(slide.heroAsset)
  const purpose = asText(slide.purpose)

  // No designSystem: simple scene description
  if (!ds) {
    const parts: string[] = []
    if (photographySubject) parts.push(photographySubject)
    else if (heroAsset) parts.push(heroAsset)
    else if (imageDesc) parts.push(imageDesc)
    else parts.push(`Professional background scene for ${purpose.toLowerCase()} slide`)
    parts.push(`Mood: ${brand.visualStyle?.aesthetic || 'Professional'}`)
    parts.push(`Art direction: ${theme.artDirection}`)
    return parts.join('\n')
  }

  // With designSystem: build a focused scene description
  const lines: string[] = []

  // The hero visual element
  const heroObj = heroAsset || photographySubject || imageDesc
  if (heroObj) {
    lines.push(`HERO ELEMENT: ${heroObj}`)
    lines.push(`Position the main visual element using rule of thirds.`)
    lines.push(`Leave the bottom 30-40% of the image darker/simpler — text will be overlaid there.`)
  } else {
    // Fallback: pick from asset palette
    const asset = ds.assetPalette[Math.min(slideNumber - 1, ds.assetPalette.length - 1)]
    if (asset) {
      lines.push(`HERO ELEMENT: ${asset}`)
      lines.push(`Leave bottom 30-40% darker for text overlay.`)
    }
  }

  // Background
  lines.push(`\nBACKGROUND: ${ds.colorApplication.backgroundFallback}`)

  // Photography mood
  if (ds.photographyStyle?.mood) {
    lines.push(`MOOD: ${ds.photographyStyle.mood}`)
  }

  // Art direction
  lines.push(`ART DIRECTION: ${theme.artDirection}`)
  lines.push(`Slide ${slideNumber} of ${totalSlides}`)

  return lines.join('\n')
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
      // New Creative Director fields
      photographySubject: asText(candidate.photographySubject),
      compositionVariation: asText(candidate.compositionVariation),
      accentWords: asStringArray(candidate.accentWords, 5),
      heroAsset: asText(candidate.heroAsset),
    }

    // Build the layered design spec (replaces old generateCreativeBrief)
    partial.compositionPrompt = buildDesignSpec(
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
        content: `Create a ${totalSlides}-slide Instagram carousel about: "${topic}"\n\nMake the copy sharp, specific, and scroll-stopping. Every headline should feel like it was written by the brand's best copywriter, not a template.\n\nReturn ONLY valid JSON, no markdown fences.`,
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
      ? slideStructure.map((s, i) => `  ${i + 1}. ${s}`).join('\n')
      : Array.from({ length: totalSlides }, (_, i) => {
          if (i === 0) return `  1. Hook — bold statement that stops the scroll`
          if (i === totalSlides - 1) return `  ${totalSlides}. CTA — clear next step`
          return `  ${i + 1}. Value slide — teach, prove, or agitate`
        }).join('\n')
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

  // Build voice direction from brand config
  const voice = brand.contentVoice
  const voiceBlock = voice
    ? `BRAND VOICE (match this exactly):
- Tone: ${voice.tone}
- Perspective: ${voice.perspective}
- Hook formulas to draw from:
${voice.hooks.map(h => `  • "${h}"`).join('\n')}
- CTA style: ${voice.ctaStyle}
`
    : ''

  // Build design system guidance for Claude to understand available composition tools
  const ds = brand.designSystem
  const designSystemGuidance = ds
    ? `DESIGN SYSTEM (use these for photographySubject, compositionVariation, heroAsset fields):

Available composition variations (pick one per slide, vary across carousel):
${ds.compositionVariations.map(v => `  • ${v}`).join('\n')}

Available hero assets:
${ds.assetPalette.map(a => `  • ${a}`).join('\n')}

Photography subjects to draw from:
${ds.photographyStyle.subjects.map(s => `  • ${s}`).join('\n')}

Photography mood: ${ds.photographyStyle.mood}

Typography: ${ds.typographySystem.headline.style} — accent treatment: ${ds.typographySystem.headline.effects?.join(', ') || 'color emphasis on key words'}
`
    : `DESIGN DIRECTION:
Pick visual concepts that match the brand aesthetic. Use imageDescription to describe what the background should show.`

  return `You are a world-class social creative director and copywriter producing an Instagram carousel for ${brand.name}.

${brandIdentity}

${voiceBlock}

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
5. Subtext should ADD NEW VALUE — never repeat or rephrase the headline
6. Bullets should be scannable, specific insights with real takeaways — not filler
7. NEVER use: "In today's world", "Unlock", "Revolutionary", "Discover", "Game-changer", "Seamless", "Leverage", "Elevate", "Harness", "Navigate", "Supercharge"
8. Write like you're talking to a smart friend, not a boardroom
9. Every slide must earn its place — if it doesn't teach, prove, or provoke, cut it
10. Be SPECIFIC: use real numbers, timeframes, dollar amounts, tool names, or concrete outcomes

HEADLINE EXAMPLES:
- BAD: "The Framework That Works" (vague, boring)
- GOOD: "I Saved 14 Hours a Week With This" (specific, outcome-focused)
- BAD: "Understanding Your Audience" (generic)
- GOOD: "Your Clients Don't Want What You're Selling" (provocative, hook)
- BAD: "Tips for Better Results" (says nothing)
- GOOD: "3 Automations That Replaced My $4K/mo Assistant" (specific, surprising)

CAPTION RULES:
- Open with a hook that makes people want to read more (question, bold claim, or story opener)
- 2-4 short paragraphs max — punchy, not an essay
- End with a clear CTA that matches the brand voice
- Include relevant context about WHY this topic matters to the audience
- NO generic filler like "Hope this helps!" or "Let me know in the comments!"

GLOBAL REQUIREMENTS:
1. ENGLISH ONLY. Perfect spelling.
2. Every slide must feel like the same campaign, not random outputs.
3. Headlines max 8 words, mark accent words with *asterisks*.
4. For imageDescription, write a SPECIFIC visual concept — what should the background photo/render/scene show.
5. For photographySubject, describe the exact background image to generate (e.g., "golden hour pool deck with herringbone pavers" or "pop art style collage of marketing icons and charts").
6. For compositionVariation, pick the layout pattern that best suits this slide's role in the carousel.
7. For accentWords, pick 1-2 words from the headline that should get emphasis treatment (color, underline, or highlight).
8. For heroAsset, describe any specific visual anchor element (3D object, cultural reference, product screenshot) — leave empty if the photo IS the hero.

${designSystemGuidance}

CAROUSEL STRUCTURE (${totalSlides} slides):
${slideList}

Return JSON exactly in this structure:
{
  "strategy": {
    "goal": "specific measurable outcome",
    "targetAudience": "specific person, not generic",
    "hook": "the exact emotional trigger",
    "callToAction": "specific next step"
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
      "subtext": "adds new info, never repeats headline",
      "bullets": ["specific, actionable points"],
      "cta": "",
      "elements": [""],
      "imageDescription": "specific visual concept for the background scene",
      "photographySubject": "exact description of background photo/render to generate",
      "compositionVariation": "layout pattern name from the brand design system",
      "accentWords": ["word1", "word2"],
      "heroAsset": "specific visual anchor element, or empty if photo is the hero",
      "layout": ""
    }
  ],
  "caption": "hook paragraph + value + CTA",
  "hashtags": [""]
}

Return ONLY JSON.`
}
