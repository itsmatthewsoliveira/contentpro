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

interface ReferenceImage {
  data: string // base64
  mimeType: string
}

export async function generateImage(
  prompt: string,
  model: ImageModel = 'pro',
  referenceImages: ReferenceImage[] = []
): Promise<GenerateImageResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY environment variable not set')
  }

  const modelId = MODEL_IDS[model]

  // Build parts array: reference images first, then the text prompt
  const parts: Array<Record<string, unknown>> = []

  // Add reference images (up to 3 to keep request size manageable)
  for (const ref of referenceImages.slice(0, 3)) {
    parts.push({
      inlineData: {
        mimeType: ref.mimeType,
        data: ref.data,
      },
    })
  }

  // Add text prompt — if we have reference images, prefix with style instruction
  if (referenceImages.length > 0) {
    parts.push({
      text: `Study the design style in the reference images above. Match that exact style — the typography, layout, color treatment, design elements, and overall aesthetic. Now generate this composition:\n\n${prompt}`,
    })
  } else {
    parts.push({ text: prompt })
  }

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

  for (const part of data.candidates[0].content.parts) {
    if (part.text) result.text = part.text
    if (part.inlineData) {
      result.imageBase64 = part.inlineData.data
      result.mimeType = part.inlineData.mimeType
    }
  }

  return result
}
