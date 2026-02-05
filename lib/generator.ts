import Anthropic from '@anthropic-ai/sdk'
import { BrandConfig, Brief, Slide } from './types'

interface GenerateOptions {
  slideCount?: number
  postType?: string
  imageSource?: string
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
    imageSource = 'manual',
  } = options

  const postTypeConfig = brand.postTypes[postType]
  const slideStructure = postTypeConfig?.structure || []
  const totalSlides = slideStructure.length || slideCount

  const aiContent = await generateWithAI(brand, topic, postType, slideStructure)

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
    slides: aiContent.slides.map((slide: Partial<Slide>, index: number) => ({
      ...slide,
      number: index + 1,
      layout: slide.layout || suggestLayout(brandSlug, index, totalSlides),
      totalSlides,
    })),
    caption: aiContent.caption,
    hashtags: aiContent.hashtags,
    imageSource,
  }
}

async function generateWithAI(
  brand: BrandConfig,
  topic: string,
  postType: string,
  slideStructure: string[]
) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable not set')
  }

  const client = new Anthropic({ apiKey })
  const systemPrompt = buildSystemPrompt(brand, postType, slideStructure)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: systemPrompt,
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
    return JSON.parse(jsonStr)
  } catch (err) {
    throw new Error(`Failed to parse AI response as JSON: ${(err as Error).message}`)
  }
}

function buildSystemPrompt(
  brand: BrandConfig,
  postType: string,
  slideStructure: string[]
): string {
  const slideList =
    slideStructure.length > 0
      ? slideStructure.map((s, i) => `  Slide ${i + 1}: ${s}`).join('\n')
      : '  7 slides — you decide the structure'

  const voiceSection = brand.contentVoice
    ? `Voice & Tone:
- Tone: ${brand.contentVoice.tone}
- Perspective: ${brand.contentVoice.perspective}
- Hook patterns: ${brand.contentVoice.hooks.join(' | ')}
- CTA style: ${brand.contentVoice.ctaStyle}`
    : ''

  const visualSection = brand.visualStyle
    ? `Visual Context (write copy that works with this design style):
- Aesthetic: ${brand.visualStyle.aesthetic}
- Key elements: ${brand.visualStyle.elements.slice(0, 5).join(', ')}
- Layouts: ${brand.visualStyle.layouts.join(', ')}`
    : ''

  const isServiceGrowth = brand.name === 'ServiceGrowth AI'
  const imageGuidance = isServiceGrowth
    ? `IMAGE DESCRIPTIONS — CRITICAL: Do NOT write generic backgrounds. Each slide needs a CREATIVE, CONCEPTUAL composition that tells a visual story related to the slide's message. Think like a high-end agency creative director.

Examples of what we want:
- A hyper-realistic 3D robot version of Einstein sitting at a desk thinking, dramatic side lighting, dark moody atmosphere
- A rocket ship launching out of a laptop screen with sparks and smoke, cinematic lighting, dark background
- A person sitting in a floating chair surrounded by holographic UI screens and glowing data streams
- An Elon Musk-style figure in a futuristic control room with neon cyan accents and holographic displays
- A giant glowing neon portal ring (like a wormhole) with a silhouette of a person walking toward it, deep red/cyan color grading
- A typewriter on a desk with words physically floating off the page in 3D, dramatic shadows
- A chess board where the pieces are tiny robots and AI icons, dramatic macro photography
- A human hand reaching toward a robotic hand, Michelangelo style, with electric sparks between fingers

Style rules for image descriptions:
- Always specify: dramatic/cinematic lighting, dark moody atmosphere, 3D render quality
- Include specific subjects: people, robots, objects, scenes — NOT abstract patterns
- Include color direction: deep blacks, cyan/teal accents (#00D4FF glow), neon highlights
- Make each slide's image conceptually connected to its headline/message
- Think mixed media: 3D renders + photography + neon effects
- NO generic stock photo vibes. Think Behance top picks, award-winning agency work
- NO text in the image — the text overlay is handled separately`
    : `IMAGE DESCRIPTIONS — CRITICAL: Each slide needs an editorial-quality, magazine-style composition. Think luxury lifestyle photography meets Brazilian premium design.

Examples of what we want:
- Golden hour aerial shot of a completed paver patio with infinity pool overlooking Jacksonville skyline
- Close-up macro of travertine paver texture with water droplets, warm golden lighting
- A family hosting dinner on an elegantly lit outdoor kitchen and paver patio at dusk
- Architectural detail shot: herringbone paver pattern leading to a modern pool, dramatic perspective
- Before/after split: bare yard transforming into luxury outdoor living space
- Drone shot of a curved paver driveway leading to a Mediterranean-style home
- Close-up of a craftsman's hands laying pavers with precision, golden hour backlighting

Style rules for image descriptions:
- Always specify: golden hour or dramatic natural lighting, warm color grading
- Include specific subjects: outdoor spaces, pavers, pools, patios, people enjoying spaces
- Color direction: warm earth tones, navy blue sky/water accents, golden light
- Editorial magazine quality — NOT stock photography
- Lifestyle context: show people living in these spaces
- NO text in the image — the text overlay is handled separately`

  return `You are a top-tier social media content strategist AND creative director creating an Instagram carousel for ${brand.name}.

Brand: ${brand.name}
Tagline: "${brand.tagline}"
Website: ${brand.website}
${brand.location ? `Location: ${brand.location}` : ''}

${voiceSection}

${visualSection}

Formatting Rules:
- Wrap 1-2 KEY WORDS per headline in *asterisks* to mark them for accent-color highlighting (e.g. "How I *automate* lead follow-up")
- Headlines should be punchy and scannable — max 8 words
- Subtext is 1-2 sentences of supporting detail
- Bullets are short, benefit-driven phrases (3-5 per slide where appropriate)

${imageGuidance}

Slide Structure for this "${postType}" post:
${slideList}

You MUST return valid JSON matching this exact schema:
{
  "strategy": {
    "goal": "string — what this post achieves",
    "targetAudience": "string — who this is for",
    "hook": "string — the opening hook",
    "callToAction": "string — the closing CTA"
  },
  "slides": [
    {
      "purpose": "string — role of this slide",
      "headline": "string — with *accent* words marked",
      "subtext": "string — supporting copy",
      "bullets": ["string array — optional, include where appropriate"],
      "cta": "string or null — only for CTA slides",
      "elements": ["string array — e.g. 'icons', 'photo', 'texture'"],
      "imageDescription": "string — detailed prompt for AI image generation",
      "layout": "string — suggested layout from the brand's available layouts"
    }
  ],
  "caption": "string — Instagram caption with line breaks as \\n",
  "hashtags": ["string array — 15-20 relevant hashtags without # prefix"]
}

Return ONLY the JSON object. No explanation, no markdown fences.`
}

function suggestLayout(brandSlug: string, slideIndex: number, totalSlides: number): string {
  const isFirst = slideIndex === 0
  const isLast = slideIndex === totalSlides - 1

  if (brandSlug === 'servicegrowth-ai') {
    if (isFirst) return 'full-photo-overlay'
    if (isLast) return 'card-on-blur'
    return ['card-on-blur', 'icon-diagram', 'split-content'][slideIndex % 3]
  }

  if (brandSlug === 'caviar-pavers') {
    if (isFirst) return 'editorial-overlay'
    if (isLast) return 'full-bleed-cta'
    return ['editorial-overlay', 'texture-focus', 'magazine-spread'][slideIndex % 3]
  }

  return 'default'
}
