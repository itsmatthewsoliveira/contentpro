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
  brandSlug?: string
  referenceImages?: ReferenceImage[]
}

function getBrandStyleEnvelope(brandSlug?: string): string {
  if (brandSlug === 'servicegrowth-ai') {
    return `STYLE LOCK — ServiceGrowth AI:
- Use ONLY these colors: #0D0D0D (background), #00D4FF (cyan accent), #FFFFFF (text)
- Visual language: premium tech editorial, cinematic depth, glass surfaces, clean grid alignment
- Typography style: modern sans-serif only, bold geometric hierarchy, no decorative lettering
- Think: Apple keynote meets sci-fi, polished and sophisticated

NEGATIVE CONSTRAINTS:
- Do NOT use script fonts, cursive, serif/calligraphy, pink, maroon, or warm luxury palettes
- Do NOT use Portuguese or any non-English text
- Do NOT generate generic stock tropes (stressed office person, handshake, hologram woman, random dashboard clichés)`
  }

  if (brandSlug === 'caviar-pavers') {
    return `STYLE LOCK — Caviar Pavers:
- Use ONLY these colors: #1E3A5F (navy), #5C4033 (brown), #C9A227 (gold), #F5F0E6 (cream)
- Visual language: architectural luxury editorial, magazine-quality composition, intentional negative space
- Typography style: elegant serif headline + clean sans-serif support with precise spacing
- Think: Architectural Digest meets Brazilian premium social media

NEGATIVE CONSTRAINTS:
- Do NOT use neon cyberpunk effects, glassmorphism UI, or tech startup motifs
- Do NOT use Portuguese or any non-English text
- Do NOT generate generic stock construction scenes or low-end brochure look`
  }

  return `STYLE LOCK:
- Keep a premium editorial look with tight composition and clear hierarchy
- English only, precise typography, no generic stock clichés`
}

function buildFinalPrompt(prompt: string, brandSlug?: string, hasReferences: boolean = false): string {
  const styleEnvelope = getBrandStyleEnvelope(brandSlug)

  // Anti-bleeding instructions when reference images are included
  const referenceInstructions = hasReferences ? `
REFERENCE IMAGE INSTRUCTIONS:
Study the VISUAL DESIGN PATTERNS in the reference images:
- Learn layout composition and element placement
- Learn typography style (font pairing, sizing, weight variation)
- Learn design elements (lines, shapes, cards, backgrounds)

CRITICAL — DO NOT COPY FROM REFERENCES:
- DO NOT use any text/words you see in the references
- DO NOT use the colors from the references — use ONLY the brand colors above
- DO NOT use any language from the references — ENGLISH ONLY
- DO NOT copy any logos or branding from references

The references are for DESIGN INSPIRATION only, not content.
` : ''

  return `${styleEnvelope}
${referenceInstructions}
EXECUTION RULES:
- 1080x1080 Instagram slide composition
- Leave top-left safe zone (60x60px) clear for logo overlay
- Text must be perfectly spelled in English and visually polished
- No logo rendering, no watermark
- Avoid "AI look": no mushy typography, no random icon clutter, no overdone glow

COMPOSITION BRIEF:
${prompt}

FINAL QUALITY BAR:
Professional social media design output, coherent and art-directed, not generic AI stock.`
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
  const finalPrompt = buildFinalPrompt(prompt, options.brandSlug, hasReferences)

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
