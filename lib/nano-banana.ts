const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

interface GenerateImageResult {
  text: string | null
  imageBase64: string | null
  mimeType: string | null
}

export type ImageModel = 'flash' | 'pro'

const MODEL_IDS: Record<ImageModel, string> = {
  flash: 'gemini-2.5-flash-image',
  pro: 'gemini-3-pro-image-preview',
}

export interface ReferenceImage {
  data: string // base64
  mimeType: string
}

interface CarouselTheme {
  artDirection?: string
  lighting?: string
  framing?: string
  textureMotif?: string
  consistencyAnchor?: string
}

interface GenerateImageOptions {
  brandConfig?: any
  referenceImages?: ReferenceImage[]
  customPrompt?: string
  topic?: string
  slideHeadline?: string
  carouselTheme?: CarouselTheme
  aspectRatio?: '1:1' | '9:16'
  approvedGuidance?: string
}

const DESIGN_PRINCIPLES = `DESIGN FUNDAMENTALS (apply to every image):
- Use rule of thirds for element placement — align key elements along grid lines and intersections
- Maintain clear visual hierarchy: primary headline > supporting text > background elements
- Use consistent alignment — left-align or center-align text blocks, never mix randomly
- Ensure adequate whitespace/breathing room between elements — avoid crowding
- Typography should have clear size contrast between headline, subtext, and body
- Balance visual weight across the composition — don't cluster everything in one corner
- Use color contrast to guide the eye to the most important element first`

// Brand context - what the business is about
function getBrandContext(brandConfig?: any): { colors: string; business: string; negatives: string; designSystemBlock: string } {
  if (!brandConfig) {
    return {
      colors: 'Use professional high-contrast colors.',
      business: 'Professional Service Business',
      negatives: '',
      designSystemBlock: '',
    }
  }

  // Collect ALL color categories (primary, secondary, accent, text, neutral)
  const colorSections: string[] = []
  for (const [section, values] of Object.entries(brandConfig.colors || {})) {
    if (section === 'meaning' || typeof values !== 'object' || !values) continue
    const entries = Object.entries(values as Record<string, string>)
      .filter(([, v]) => typeof v === 'string' && v.startsWith('#'))
      .map(([key, val]) => `  ${key}: ${val}`)
    if (entries.length) {
      colorSections.push(`${section}:\n${entries.join('\n')}`)
    }
  }

  // Build designSystem block if available
  let designSystemBlock = ''
  const ds = brandConfig.designSystem
  if (ds) {
    const parts: string[] = ['DESIGN SYSTEM (follow these rules precisely):']

    // Typography system
    if (ds.typographySystem) {
      parts.push(`\nTYPOGRAPHY:`)
      parts.push(`- Headline: ${ds.typographySystem.headline?.style || 'Bold sans-serif'}`)
      parts.push(`- Headline scale: ${ds.typographySystem.headline?.scale || 'Large'}`)
      if (ds.typographySystem.headline?.effects?.length) {
        parts.push(`- Headline effects: ${ds.typographySystem.headline.effects.join('; ')}`)
      }
      parts.push(`- Body: ${ds.typographySystem.body?.style || 'Regular sans-serif'}`)
      if (ds.typographySystem.accent) {
        parts.push(`- Accent: ${ds.typographySystem.accent.style} — ${ds.typographySystem.accent.usage || ''}`)
      }
    }

    // Repeating chrome
    if (ds.repeatingChrome) {
      parts.push(`\nREPEATING CHROME (include on EVERY slide):`)
      if (ds.repeatingChrome.topBar) {
        const tb = ds.repeatingChrome.topBar
        if (tb.left) parts.push(`- Top-left: "${tb.left}" — ${tb.style}`)
        if (tb.right) parts.push(`- Top-right: "${tb.right}" — ${tb.style}`)
      }
      if (ds.repeatingChrome.bottomBar) {
        const bb = ds.repeatingChrome.bottomBar
        parts.push(`- Bottom: ${bb.element || ''} — ${bb.style}`)
      }
    }

    // Decorative elements
    if (ds.decorativeElements?.length) {
      parts.push(`\nDECORATIVE ELEMENTS:`)
      ds.decorativeElements.slice(0, 5).forEach((e: string) => parts.push(`- ${e}`))
    }

    // Color application
    if (ds.colorApplication) {
      parts.push(`\nCOLOR APPLICATION:`)
      if (ds.colorApplication.photoOverlay) parts.push(`- Photo overlay: ${ds.colorApplication.photoOverlay}`)
      parts.push(`- Text primary: ${ds.colorApplication.textPrimary}`)
      parts.push(`- Text accent: ${ds.colorApplication.textAccent}`)
      parts.push(`- Background fallback: ${ds.colorApplication.backgroundFallback}`)
    }

    // Photography mood
    if (ds.photographyStyle?.mood) {
      parts.push(`\nPHOTOGRAPHY MOOD: ${ds.photographyStyle.mood}`)
    }

    designSystemBlock = parts.join('\n')
  }

  return {
    colors: colorSections.join('\n') || 'Use professional high-contrast colors.',
    business: `Content should show: ${brandConfig.visualStyle?.aesthetic || 'Professional imagery'}
(Do NOT render the brand name, company name, or tagline as text in the image)`,
    negatives: brandConfig.visualStyle?.negativePrompt
      ? `DO NOT: ${brandConfig.visualStyle.negativePrompt}`
      : '',
    designSystemBlock,
  }
}

// Build prompt with topic context
function buildFinalPrompt(
  userPrompt: string,
  hasReferences: boolean,
  brandConfig?: any,
  customDirection?: string,
  topic?: string,
  slideHeadline?: string,
  carouselTheme?: CarouselTheme,
  aspectRatio?: '1:1' | '9:16',
  approvedGuidance?: string
): string {
  // userPrompt = Claude's compositionPrompt (rich layered design spec or creative brief)
  // customDirection = user's global creative direction (supplements, doesn't replace)
  const slideContext = userPrompt?.trim() || ''
  const creativeDirection = customDirection?.trim() || ''
  const { colors, business, negatives, designSystemBlock } = getBrandContext(brandConfig)

  const contentContext = topic
    ? `CONTENT TOPIC: ${topic}${slideHeadline ? `\nThis slide's message: "${slideHeadline}"` : ''}`
    : ''

  const imageGuidance = brandConfig?.visualStyle?.imageGuidance
    ? `IMAGE GUIDANCE: ${brandConfig.visualStyle.imageGuidance}`
    : ''

  const dimensions = aspectRatio === '9:16' ? '1080x1920 vertical (9:16 portrait)' : '1080x1080 square'

  // Visual style for this slide
  const themeBlock = carouselTheme
    ? `VISUAL STYLE (apply to this single slide):
- Art direction: ${carouselTheme.artDirection || 'Professional editorial'}
- Lighting: ${carouselTheme.lighting || 'Balanced professional lighting'}
- Framing: ${carouselTheme.framing || 'Clear hierarchy'}
- Texture/motif: ${carouselTheme.textureMotif || 'Clean surfaces'}
- Consistency anchor: ${carouselTheme.consistencyAnchor || 'Brand colors and typography'}`
    : ''

  // Determine if the slide context is a full layered spec (from buildDesignSpec) or a basic brief
  const compositionLabel = slideContext.includes('CANVAS:') || slideContext.includes('LAYER ')
    ? 'LAYERED DESIGN SPECIFICATION (follow this Photoshop-like layer stack):'
    : 'SLIDE COMPOSITION:'

  if (hasReferences) {
    return `COPY THE VISUAL STYLE of the reference images, but create NEW CONTENT about the brand.

CRITICAL: Do NOT copy the text or subject matter from references. Only copy the DESIGN STYLE.

${DESIGN_PRINCIPLES}

${business}

${contentContext}

Match from references (STYLE ONLY):
- Layout composition and visual hierarchy
- Typography style and font treatment
- Design elements and aesthetic

Brand colors (USE THESE EXACTLY):
${colors}

${designSystemBlock}

${themeBlock}

${imageGuidance}

${compositionLabel}
${slideContext || 'Create a premium, high-quality slide for this brand/topic.'}

${creativeDirection ? `CREATIVE DIRECTION:\n${creativeDirection}` : ''}

${negatives}

${approvedGuidance || ''}

CRITICAL: Generate exactly ONE single image. Do NOT create a grid, collage, multiple panels, or side-by-side layout.
ENGLISH ONLY. No Portuguese or Spanish. Perfect spelling.
${dimensions}. DO NOT include any logo, brand name, company name, tagline, or watermark text in the image. The user will add branding separately.`
  }

  return `${DESIGN_PRINCIPLES}

${business}

${contentContext}

Brand colors (USE THESE EXACTLY):
${colors}

${designSystemBlock}

${themeBlock}

${imageGuidance}

${compositionLabel}
${slideContext || 'Create a premium, high-quality slide for this brand/topic.'}

${creativeDirection ? `CREATIVE DIRECTION:\n${creativeDirection}` : ''}

${negatives}

${approvedGuidance || ''}

CRITICAL: Generate exactly ONE single image. Do NOT create a grid, collage, multiple panels, or side-by-side layout.
ENGLISH ONLY. Perfect spelling.
${dimensions}. DO NOT include any logo, brand name, company name, tagline, or watermark text in the image. The user will add branding separately.`
}

// Build approved image guidance from metadata (TEXT only, no binary)
export function buildApprovedImageGuidance(approvedImages: Record<string, unknown>[]): string {
  if (!approvedImages || approvedImages.length === 0) return ''

  const examples = approvedImages.slice(0, 5).map((img, i) => {
    const parts: string[] = []
    if (img.headline) parts.push(`Headline: "${img.headline}"`)
    if (img.compositionPrompt) {
      const prompt = String(img.compositionPrompt)
      parts.push(`Composition: ${prompt.length > 200 ? prompt.slice(0, 200) + '...' : prompt}`)
    }
    if (img.globalDirection) {
      const dir = String(img.globalDirection)
      parts.push(`Direction: ${dir.length > 150 ? dir.slice(0, 150) + '...' : dir}`)
    }
    return `  Example ${i + 1}:\n    ${parts.join('\n    ')}`
  })

  return `QUALITY BENCHMARKS (these slides were approved — match this quality level):
${examples.join('\n')}`
}

export async function generateImage(
  prompt: string,
  model: ImageModel = 'pro',
  options: GenerateImageOptions = {}
): Promise<GenerateImageResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY environment variable not set')
  }

  const modelId = MODEL_IDS[model]
  const referenceImages = options.referenceImages || []
  const hasReferences = referenceImages.length > 0
  const finalPrompt = buildFinalPrompt(
    prompt,
    hasReferences,
    options.brandConfig,
    options.customPrompt,
    options.topic,
    options.slideHeadline,
    options.carouselTheme,
    options.aspectRatio,
    options.approvedGuidance
  )

  // Build parts array: reference images first (if any), then the text prompt
  const parts: Array<Record<string, unknown>> = []

  // Add reference images (up to 3)
  for (const ref of referenceImages.slice(0, 3)) {
    parts.push({
      inlineData: {
        mimeType: ref.mimeType,
        data: ref.data,
      },
    })
  }

  // Add the text prompt
  parts.push({ text: finalPrompt })

  const response = await fetch(
    `${GEMINI_BASE_URL}/${modelId}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const result: GenerateImageResult = { text: null, imageBase64: null, mimeType: null }
  const resultParts = data?.candidates?.[0]?.content?.parts
  if (!Array.isArray(resultParts)) {
    throw new Error('Gemini response did not include any content parts')
  }

  for (const part of resultParts) {
    if (part.text) result.text = part.text
    if (part.inlineData) {
      result.imageBase64 = part.inlineData.data
      result.mimeType = part.inlineData.mimeType
    }
  }

  return result
}
