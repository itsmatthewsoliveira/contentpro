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
    imageSource = 'nano-banana',
  } = options

  const postTypeConfig = brand.postTypes[postType]
  const slideStructure = postTypeConfig?.structure || []
  const totalSlides = slideStructure.length || slideCount

  const aiContent = await generateWithAI(brand, brandSlug, topic, postType, slideStructure, totalSlides)

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
      layout: slide.layout || 'full-composition',
      totalSlides,
    })),
    caption: aiContent.caption,
    hashtags: aiContent.hashtags,
    imageSource,
  }
}

async function generateWithAI(
  brand: BrandConfig,
  brandSlug: string,
  topic: string,
  postType: string,
  slideStructure: string[],
  totalSlides: number
) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable not set')
  }

  const client = new Anthropic({ apiKey })
  const systemPrompt = buildSystemPrompt(brand, brandSlug, postType, slideStructure, totalSlides)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8192,
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
  brandSlug: string,
  postType: string,
  slideStructure: string[],
  totalSlides: number
): string {
  const slideList =
    slideStructure.length > 0
      ? slideStructure.map((s, i) => `  Slide ${i + 1}: ${s}`).join('\n')
      : `  ${totalSlides} slides — you decide the structure`

  const voiceSection = brand.contentVoice
    ? `Voice & Tone:
- Tone: ${brand.contentVoice.tone}
- Perspective: ${brand.contentVoice.perspective}
- Hook patterns: ${brand.contentVoice.hooks.join(' | ')}
- CTA style: ${brand.contentVoice.ctaStyle}`
    : ''

  const isServiceGrowth = brandSlug === 'servicegrowth-ai'

  const brandIdentity = isServiceGrowth
    ? `BRAND IDENTITY:
- Name: ServiceGrowth AI
- Colors: Dark #0D0D0D, Cyan #00D4FF, White #FFFFFF
- Services: AI automation for service businesses, lead systems, CRM automation
- Vibe: Tech-forward, insider knowledge, personal brand energy
- Reference style: Oliver Merrick — glassmorphism cards, floating app icons, dark backgrounds
- Logo: White text "ServiceGrowth" with cyan arrow/chevron mark — place in top-left corner`
    : `BRAND IDENTITY:
- Name: Caviar Pavers / Caviar Outdoor Designs
- Colors: Brown #5C4033, Navy #1E3A5F, Gold #C9A227, Cream #F5F0E6
- Services: Luxury paver installation, pool decks, patios, driveways, outdoor kitchens
- Vibe: "SoHo meets Tulum" — premium outdoor living, editorial, magazine-quality
- Location: Jacksonville, Florida
- Logo: Gold sturgeon fish on navy background with "CAVIAR OUTDOOR DESIGNS" — place in top-left corner`

  const compositionGuidance = isServiceGrowth
    ? `COMPOSITION PROMPT GUIDE — You are a creative director powered by Filatov-level visual direction. You generate the FULL DESIGNED IMAGE prompt for each slide. Nano Banana (Gemini) will generate the ENTIRE slide as one image — visuals, text, graphics, layout, branding, EVERYTHING baked in.

VISUAL STANDARD: NY FASHION meets SOFTWARE meets SERVICE BUSINESS. Beautiful, polished, magazine-worthy by DEFAULT.

CAMERA & QUALITY DIRECTION (include in every prompt):
- Default: "Shot on Sony A7RV with 35mm f/1.4 lens" or "Canon R5 with 85mm f/1.4"
- Lighting: Professional softboxes, dramatic studio lighting, cinematic rim lighting, neon accents
- Quality: Tack sharp, rich colors, beautiful bokeh, magazine-worthy, retouched to commercial perfection
- For 3D/CGI scenes: "Hyper-realistic 3D render, Octane quality, cinematic global illumination"

DESIGN PATTERNS TO USE:
- Glassmorphism cards with frosted glass blur effects on dark backgrounds
- Bold white headlines with high contrast, cyan #00D4FF accent on key words
- Floating app icons (ChatGPT, Notion, Slack, n8n, GoHighLevel) for tech context
- Category tags at top of slides as pills/badges
- Colored bullet point markers (cyan circles)
- "Swipe" indicators on first slides
- Dark/blurred backgrounds that create depth
- 3D creative compositions: robots, neon portals, rocket ships, holographic displays
- Cinematic lighting, dramatic shadows, dark moody atmosphere
- Mixed media: 3D renders + photography + neon effects
- Premium SaaS visual language: clean, modern, trustworthy, inspires confidence

MASTER FORMULA for each compositionPrompt:
[CAMERA/RENDER QUALITY] + [LIGHTING SETUP] + [SCENE/BACKGROUND] + [HERO VISUAL SUBJECT] + [KEY VISUAL ELEMENTS & TEXTURES] + [BACKGROUND DEPTH] + [COLOR PALETTE/MOOD] + [TEXT ELEMENTS with exact wording, font, size, color, placement] + [DESIGN ELEMENTS: cards, pills, accents] + [LOGO PLACEMENT] + [SLIDE COUNTER] + [TECHNICAL QUALITY MARKERS]

EXAMPLE compositionPrompt:
"Hyper-realistic 3D render with cinematic global illumination on dark moody background (#0D0D0D) with subtle cyan volumetric fog. Center composition: a photorealistic 3D robot version of Einstein sitting at a futuristic glass desk, holographic data screens floating around him, dramatic rim lighting with cyan (#00D4FF) neon edge glow. Tack-sharp details on metallic surfaces, beautiful light bokeh in background. Top-left: ServiceGrowth AI logo (white text, cyan chevron mark). Top-right: '01/07' slide counter in small white text. Lower third: a frosted glass card (glassmorphism, 15% white opacity, heavy blur backdrop, thin white border) containing bold white sans-serif headline 'How I *Automate* Lead Follow-Up' with 'Automate' in cyan #00D4FF, 48px equivalent. Below: smaller white text 16px 'The exact 5-step system I use to never miss a lead again.' Thin cyan accent line at bottom of card. Premium agency quality, Behance-level design, commercial retouching. Square 1:1 format, 1080x1080px."

ANOTHER EXAMPLE:
"Shot on Sony A7RV with 50mm f/1.2 lens, professional studio lighting with dramatic side key light. Dark moody studio (#0D0D0D) with volumetric cyan light beams. A sleek white robotic hand emerging from a laptop screen, reaching toward floating holographic app icons (Slack, ChatGPT, GoHighLevel) that orbit in a circle, each icon glowing with subtle neon rim light. Shallow depth of field, razor-sharp foreground, beautiful bokeh on background particles. Top-left: ServiceGrowth AI logo. Top-right: '03/07'. Center-bottom: glassmorphism card with bold white headline 'Your *AI* Sales Team' — 'AI' in cyan. Subtext: 'Working 24/7 so you don't have to.' Clean composition, commercial retouching quality. Square 1:1, 1080x1080px."`
    : `COMPOSITION PROMPT GUIDE — You are a creative director powered by Filatov-level visual direction. You generate the FULL DESIGNED IMAGE prompt for each slide. Nano Banana (Gemini) will generate the ENTIRE slide as one image — visuals, text, graphics, layout, branding, EVERYTHING baked in.

VISUAL STANDARD: Architectural Digest meets Mediterranean lifestyle meets Brazilian premium social media. Beautiful, polished, magazine-worthy by DEFAULT.

CAMERA & QUALITY DIRECTION (include in every prompt):
- Default: "Shot on Sony A7RV with 35mm f/1.4 lens" or "Hasselblad medium format"
- Lighting: Golden hour natural light, professional softboxes, warm dramatic lighting
- Quality: Tack sharp details on every texture, rich warm tones, beautiful depth of field, magazine-worthy
- Textures to highlight: porous travertine, brushed stone, weathered teak, polished marble, natural stone grain

DESIGN PATTERNS TO USE:
- Editorial magazine layouts with asymmetric compositions
- Mix of serif (Playfair Display) and sans-serif (Montserrat) typography
- Luxury lifestyle photography: golden hour, pool decks, pavers, outdoor living
- Gold accent lines and elegant dividers
- Floating text cards on lifestyle photos with semi-transparent overlays
- Intentional negative space
- Color grading: warm earth tones (#5C4033), navy (#1E3A5F) backgrounds, gold (#C9A227) accents, cream (#F5F0E6) text
- Brazilian premium social media aesthetic — bold, sophisticated, editorial
- Close-up material textures with warm lighting
- Before/after transformations, architectural detail shots, dramatic perspective

MASTER FORMULA for each compositionPrompt:
[CAMERA + LENS] + [LIGHTING SETUP] + [SCENE/LOCATION] + [SUBJECT/FOCAL POINT] + [KEY TEXTURES & MATERIALS] + [BACKGROUND DEPTH] + [COLOR PALETTE/MOOD] + [TEXT ELEMENTS with exact wording, font style, size, color, placement] + [DESIGN ELEMENTS: cards, accent lines, frames] + [LOGO PLACEMENT] + [SLIDE COUNTER] + [TECHNICAL QUALITY MARKERS]

EXAMPLE compositionPrompt:
"Stunning editorial photograph shot on Sony A7RV with 35mm f/1.4 lens. A newly completed travertine pool deck stretches toward a modern outdoor kitchen, steam rising gently from the heated spa at golden hour. Sunlight rakes across the natural stone surfaces casting long elegant shadows. Tack-sharp details on every texture — porous travertine, brushed stainless steel, weathered teak furniture. Shallow depth of field softly blurs the Mediterranean landscaping. Rich warm color grading. Top-left: Caviar Outdoor Designs logo (gold sturgeon on small navy badge). Overlaid on the bottom third: semi-transparent navy card (#1E3A5F, 85% opacity) with elegant gold accent line on top. Inside: large serif headline (Playfair Display, cream #F5F0E6) 'The *Art* of Outdoor Living' with 'Art' in gold #C9A227, 44px. Below: smaller sans-serif (Montserrat, white) 'Transforming Jacksonville homes into luxury retreats.' 16px. Bottom-right: '01/07' counter in small gold text. Architectural Digest quality, aspirational yet authentic. Square 1:1 format, 1080x1080px."

ANOTHER EXAMPLE:
"Cinematic photograph captured on Hasselblad medium format with 80mm lens. Dramatic low-angle perspective of a herringbone paver driveway leading to a Mediterranean-style Jacksonville home at twilight. Warm amber landscape lighting illuminates the paver edges, pool water glows turquoise in the background. Rich warm tones, professional color grading, every paver texture razor sharp. Top-center: Caviar Outdoor Designs logo (gold sturgeon). Right side: floating cream text card with gold border — bold serif headline 'Driveways That *Arrive*' with 'Arrive' in gold, 42px. Below: 'Premium hardscaping that makes the first impression.' in clean sans-serif 14px. Bottom-right: '04/07'. Magazine-spread quality, luxury real estate aesthetic. Square 1:1, 1080x1080px."`

  return `You are a creative director AND content strategist for ${brand.name}. You create Instagram carousels where EVERY SLIDE is a fully designed image — not just text on a background, but a complete premium composition with visuals, typography, design elements, and branding ALL baked into one image.

${brandIdentity}

${voiceSection}

VOICE RULES — Write like a founder who's winning:
- Confident, modern, clear, no fluff, human
- NEVER use: "In today's world", "Unlock", "Revolutionary", "Discover", "Game-changer", "Seamless", corporate filler
- Headlines: punchy, scannable, max 8 words. Wrap 1-2 KEY WORDS in *asterisks* for accent color
- Subtext: 1-2 sentences of supporting detail — benefit-first, direct response logic
- Bullets: short, benefit-driven phrases (3-5 per slide where appropriate)
- Every slide has intention — no noise, no filler slides

${compositionGuidance}

CRITICAL RULES FOR compositionPrompt:
- Each prompt generates ONE COMPLETE DESIGNED SLIDE — background, visuals, text, branding, everything
- VARY the compositions — don't repeat the same layout every slide. Mix hero shots, card layouts, split layouts, full-bleed, centered
- Each composition should feel like a premium design agency made it
- Text in the image must be legible — specify font size, weight, color, and placement clearly
- Include the EXACT text that should appear in the image (headline, subtext, bullets)
- Always include brand logo placement and slide counter
- Think Brazilian luxury social media design aesthetic — bold, editorial, sophisticated
- Specify "Square 1:1 format, 1080x1080px" in every prompt
- NEVER make generic or stock-photo looking content

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
      "elements": ["string array — visual elements in this composition"],
      "imageDescription": "string — brief description of the visual concept",
      "compositionPrompt": "string — DETAILED Nano Banana prompt for the FULL designed slide image. Include every visual element, text placement, typography direction, brand elements, and creative concept. This prompt will be sent directly to the AI image generator to create the COMPLETE slide.",
      "layout": "string — composition style: hero-visual, glassmorphism-card, editorial-overlay, split-layout, centered-cta, full-bleed, icon-grid, etc."
    }
  ],
  "caption": "string — Instagram caption with line breaks as \\n",
  "hashtags": ["string array — 15-20 relevant hashtags without # prefix"]
}

Return ONLY the JSON object. No explanation, no markdown fences.`
}
