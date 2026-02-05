const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

interface GenerateImageResult {
  text: string | null
  imageBase64: string | null
  mimeType: string | null
}

export async function generateImage(
  prompt: string,
  model: string = 'gemini-2.5-flash-image'
): Promise<GenerateImageResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY environment variable not set')
  }

  const response = await fetch(
    `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`,
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

export function buildImagePrompt(
  imageDescription: string,
  brandColors: Record<string, Record<string, string>>,
  _aesthetic?: string
): string {
  // Detect brand by color palette
  const isServiceGrowth = brandColors.primary?.background === '#0D0D0D'

  let prompt = imageDescription

  if (isServiceGrowth) {
    prompt += `. Cinematic lighting, dramatic shadows, dark moody atmosphere. 3D render quality mixed with photography. Color grading: deep blacks with cyan/teal (#00D4FF) neon accent glows and highlights. Hyper-realistic, award-winning creative agency quality. Square 1:1 aspect ratio composition. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO WATERMARKS in the image.`
  } else {
    prompt += `. Editorial magazine photography quality. Golden hour warm lighting, rich color grading with earth tones, navy blue accents, and gold highlights. Luxury lifestyle aesthetic. Square 1:1 aspect ratio composition. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO WATERMARKS in the image.`
  }

  return prompt
}
