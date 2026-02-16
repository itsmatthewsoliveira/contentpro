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
  aspectRatio?: '1:1' | '4:5' | '9:16'
  approvedGuidance?: string
}

// Collect brand colors as a simple list
function getBrandColors(brandConfig?: any): string {
  if (!brandConfig?.colors) return 'Professional high-contrast colors.'
  const colors: string[] = []
  for (const [section, values] of Object.entries(brandConfig.colors || {})) {
    if (section === 'meaning' || typeof values !== 'object' || !values) continue
    for (const [key, val] of Object.entries(values as Record<string, string>)) {
      if (typeof val === 'string' && val.startsWith('#')) {
        colors.push(`${key}: ${val}`)
      }
    }
  }
  return colors.join(', ') || 'Professional high-contrast colors.'
}

// Build the scene-only prompt — NO TEXT, just visuals
function buildFinalPrompt(
  sceneDescription: string,
  hasReferences: boolean,
  brandConfig?: any,
  customDirection?: string,
  topic?: string,
  slideHeadline?: string,
  carouselTheme?: CarouselTheme,
  aspectRatio?: '1:1' | '4:5' | '9:16',
  approvedGuidance?: string
): string {
  const scene = sceneDescription?.trim() || ''
  const creativeDirection = customDirection?.trim() || ''
  const colors = getBrandColors(brandConfig)
  const negatives = brandConfig?.visualStyle?.negativePrompt
    ? `DO NOT: ${brandConfig.visualStyle.negativePrompt}`
    : ''
  const imageGuidance = brandConfig?.visualStyle?.imageGuidance
    ? `STYLE: ${brandConfig.visualStyle.imageGuidance}`
    : ''
  const dimensions = aspectRatio === '9:16' ? '1080x1920 vertical' : aspectRatio === '4:5' ? '1080x1350 portrait' : '1080x1080 square'
  const mood = brandConfig?.designSystem?.photographyStyle?.mood
    || brandConfig?.visualStyle?.aesthetic
    || 'Professional quality'

  const themeBlock = carouselTheme
    ? `Art direction: ${carouselTheme.artDirection || 'Professional'}
Lighting: ${carouselTheme.lighting || 'Balanced'}
Mood: ${mood}`
    : `Mood: ${mood}`

  const noTextRule = `BACKGROUND IMAGE ONLY — do NOT render any text, words, letters, numbers, labels, watermarks, logos, or typography. The image must contain ZERO text. Text will be added programmatically.

Leave the bottom 30-40% slightly darker or simpler for text overlay space.`

  if (hasReferences) {
    return `Match the VISUAL STYLE of the reference images (composition, lighting, color treatment, mood).
Do NOT copy any text or words from references.

${noTextRule}

SCENE: ${scene || 'Premium background scene matching the reference style.'}

Brand colors (for lighting and accents): ${colors}
${themeBlock}
${imageGuidance}
${creativeDirection ? `Direction: ${creativeDirection}` : ''}
${negatives}

One single image. No grid or collage. ${dimensions}.`
  }

  return `${noTextRule}

SCENE: ${scene || 'Premium professional background scene.'}

Brand colors (for lighting and accents): ${colors}
${themeBlock}
${imageGuidance}
${creativeDirection ? `Direction: ${creativeDirection}` : ''}
${negatives}

One single image. No grid or collage. ${dimensions}.`
}

// Build approved image guidance from metadata (TEXT only, no binary)
export function buildApprovedImageGuidance(approvedImages: Record<string, unknown>[]): string {
  if (!approvedImages || approvedImages.length === 0) return ''

  const examples = approvedImages.slice(0, 5).map((img, i) => {
    const parts: string[] = []
    if (img.compositionPrompt) {
      const prompt = String(img.compositionPrompt)
      parts.push(`Scene: ${prompt.length > 200 ? prompt.slice(0, 200) + '...' : prompt}`)
    }
    return `  Example ${i + 1}: ${parts.join(', ')}`
  })

  return `QUALITY BENCHMARKS (match this visual quality):\n${examples.join('\n')}`
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
