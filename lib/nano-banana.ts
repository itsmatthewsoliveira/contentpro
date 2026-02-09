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

interface GenerateImageOptions {
  brandConfig?: any
  referenceImages?: ReferenceImage[]
  customPrompt?: string
  topic?: string
  slideHeadline?: string
}

// Brand context - what the business is about
// Brand context - what the business is about
function getBrandContext(brandConfig?: any): { colors: string; business: string } {
  if (!brandConfig) {
    // Fallback if no config passed
    return {
      colors: 'Use professional high-contrast colors.',
      business: 'Professional Service Business'
    }
  }

  const colorList = Object.entries(brandConfig.colors.primary || {})
    .map(([key, val]) => `- ${key}: ${val}`)
    .join('\n')

  return {
    colors: colorList,
    business: `${brandConfig.name} - ${brandConfig.tagline}
Content should show: ${brandConfig.visualStyle?.aesthetic || 'Professional imagery'}`
  }
}

// Build prompt with topic context
function buildFinalPrompt(
  userPrompt: string,
  hasReferences: boolean,
  brandConfig?: any,
  customDirection?: string,
  topic?: string,
  slideHeadline?: string
): string {
  const direction = customDirection?.trim() || userPrompt?.trim() || ''
  const { colors, business } = getBrandContext(brandConfig)

  const contentContext = topic
    ? `CONTENT TOPIC: ${topic}${slideHeadline ? `\nThis slide's message: "${slideHeadline}"` : ''}`
    : ''

  const imageGuidance = brandConfig?.visualStyle?.imageGuidance
    ? `GUIDANCE: ${brandConfig.visualStyle.imageGuidance}`
    : ''

  const negativeContext = brandConfig?.visualStyle?.negativePrompt
    ? `NEGATIVE PROMPT: ${brandConfig.visualStyle.negativePrompt}`
    : ''

  if (hasReferences) {
    return `COPY THE VISUAL STYLE of the reference images, but create NEW CONTENT about the brand.

CRITICAL: Do NOT copy the text or subject matter from references. Only copy the DESIGN STYLE.

${business}

${contentContext}

Match from references (STYLE ONLY):
- Layout composition and visual hierarchy
- Typography style and font treatment
- Design elements and aesthetic

Use these brand colors:
${colors}

${imageGuidance}

ENGLISH ONLY. No Portuguese or Spanish.

${direction ? direction : 'Create a premium, high-quality image about this brand/topic.'}

${negativeContext}

1080x1080 square. Leave top-left clear for logo. No watermarks.`
  }

  return `${business}

${contentContext}

${direction ? direction : 'Create a premium, high-quality image about this brand/topic.'}

Brand colors:
${colors}

${imageGuidance}

ENGLISH ONLY.

${negativeContext}

1080x1080 square. Leave top-left clear for logo. No watermarks.`
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
    options.slideHeadline
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
