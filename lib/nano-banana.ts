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

export async function generateImage(
  prompt: string,
  model: ImageModel = 'pro'
): Promise<GenerateImageResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY environment variable not set')
  }

  const modelId = MODEL_IDS[model]

  const response = await fetch(
    `${GEMINI_BASE_URL}/${modelId}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
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
