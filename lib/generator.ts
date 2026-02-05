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

IMPORTANT — LOGO: Do NOT include any logo in the composition. The real logo will be overlaid separately. Leave the top-left area clean for logo placement.

MASTER FORMULA for each compositionPrompt:
[CAMERA/RENDER QUALITY] + [LIGHTING SETUP] + [SCENE/BACKGROUND] + [HERO VISUAL SUBJECT] + [KEY VISUAL ELEMENTS & TEXTURES] + [BACKGROUND DEPTH] + [COLOR PALETTE/MOOD] + [TEXT ELEMENTS with exact wording, font, size, color, placement] + [DESIGN ELEMENTS: cards, pills, accents] + [SLIDE COUNTER] + [TECHNICAL QUALITY MARKERS]

EXAMPLE compositionPrompt:
"Hyper-realistic 3D render with cinematic global illumination on dark moody background (#0D0D0D) with subtle cyan volumetric fog. Center composition: a photorealistic 3D robot version of Einstein sitting at a futuristic glass desk, holographic data screens floating around him, dramatic rim lighting with cyan (#00D4FF) neon edge glow. Tack-sharp details on metallic surfaces, beautiful light bokeh in background. Top-right: '01/07' slide counter in small white text. Lower third: a frosted glass card (glassmorphism, 15% white opacity, heavy blur backdrop, thin white border) containing bold white sans-serif headline 'How I Automate Lead Follow-Up' with 'Automate' in cyan #00D4FF, 48px equivalent. Below: smaller white text 16px 'The exact 5-step system I use to never miss a lead again.' Thin cyan accent line at bottom of card. Premium agency quality, Behance-level design, commercial retouching. Square 1:1 format, 1080x1080px. NO LOGO in the image."

ANOTHER EXAMPLE:
"Shot on Sony A7RV with 50mm f/1.2 lens, professional studio lighting with dramatic side key light. Dark moody studio (#0D0D0D) with volumetric cyan light beams. A sleek white robotic hand emerging from a laptop screen, reaching toward floating holographic app icons (Slack, ChatGPT, GoHighLevel) that orbit in a circle, each icon glowing with subtle neon rim light. Shallow depth of field, razor-sharp foreground, beautiful bokeh on background particles. Top-right: '03/07'. Center-bottom: glassmorphism card with bold white headline 'Your AI Sales Team' — 'AI' in cyan. Subtext: 'Working 24/7 so you don't have to.' Clean composition, commercial retouching quality. Square 1:1, 1080x1080px. NO LOGO in the image."`
    : `COMPOSITION PROMPT GUIDE — You are a creative director creating Brazilian premium social media design. You generate the FULL DESIGNED IMAGE prompt for each slide. The AI image generator will create the ENTIRE slide as one image — visuals, text, graphics, layout, EVERYTHING baked in.

VISUAL STANDARD: Brazilian premium social media design (like Dani Bloom / Social Media HOF). NOT generic stock photography. Think editorial magazine layouts where TYPOGRAPHY DOMINATES and photography serves as a sophisticated backdrop.

THIS IS WHAT THE STYLE LOOKS LIKE — study these patterns:
- Deep navy (#1E3A5F) or warm brown (#5C4033) or cream (#F5F0E6) solid/gradient backgrounds
- HUGE bold mixed-weight typography that takes up 40-60% of the slide area
- Mix of serif AND sans-serif in the SAME headline — e.g., thin sans-serif "The art of" + bold serif "OUTDOOR LIVING"
- Lifestyle editorial photography INTEGRATED with text — woman at desk, hands holding coffee, person working on laptop, close-up of materials
- Text that WRAPS AROUND or OVERLAYS the photo subject — not just text box on top of photo
- Varying font weights within one headline: some words BOLD/BLACK, others light/thin
- Asymmetric text positioning — left-aligned bottom, right column, diagonal flow
- A thin top navigation bar with "CATEGORY" on left and "BRAND NAME" on right
- Clean minimal design elements — thin gold lines, simple geometric accents
- Muted, sophisticated color palette — NOT bright, NOT saturated
- Intentional negative space — some areas are breathing room, not filled
- Professional color grading: warm tones, desaturated, editorial mood

CAMERA & QUALITY DIRECTION (for photo elements):
- Default: "Shot on Sony A7RV with 35mm f/1.4 lens" or "Hasselblad medium format"
- Lighting: Warm studio softboxes, golden hour natural light, soft directional light
- Quality: Tack sharp, rich warm tones, beautiful depth of field, magazine-worthy

IMPORTANT — LOGO: Do NOT include any logo in the composition. The real logo will be overlaid separately. Leave the top-left area clean for logo placement.

COLOR PALETTE:
- Backgrounds: Deep navy #1E3A5F, warm chocolate brown #5C4033, rich cream #F5F0E6
- Text: Cream/off-white #F5F0E6 on dark backgrounds, navy #1E3A5F on light backgrounds
- Accents: Gold #C9A227 for highlight words, thin accent lines
- Overall mood: warm, muted, sophisticated — NOT bright or flashy

MASTER FORMULA for each compositionPrompt:
[BACKGROUND: solid color, gradient, or editorial photo] + [TYPOGRAPHY: exact text, mixed fonts/weights, sizes, placement — this is the HERO element] + [PHOTO ELEMENT: lifestyle editorial photo integrated with layout, if applicable] + [DESIGN ELEMENTS: thin lines, navigation bar, geometric accents] + [COLOR GRADING: warm, muted, editorial] + [SLIDE COUNTER] + [QUALITY: Brazilian premium social media design]

EXAMPLE compositionPrompt:
"Deep navy background (#1E3A5F) with subtle warm gradient. Top bar: thin line with 'OUTDOOR LIVING' left-aligned and 'CAVIAR' right-aligned in tiny cream uppercase tracking. Right side: editorial photograph of a luxury completed paver patio at golden hour, shot on Sony A7RV with 35mm f/1.4 — warm color grading, shallow depth of field, tack-sharp stone textures. The photo takes up the right 55% of the composition. Left side: large mixed-weight typography — thin sans-serif (Montserrat Light, cream) 'The art of' at 28px, then bold serif (Playfair Display Black, cream) 'OUTDOOR' at 64px, then 'LIVING' at 64px below it. A thin gold (#C9A227) horizontal accent line between the heading and a small cream body text at 14px: 'Transforming Jacksonville backyards into luxury retreats.' Bottom-right: '01/07' in small gold text. Brazilian premium social media design quality. Square 1:1 format, 1080x1080px. NO LOGO in the image."

ANOTHER EXAMPLE:
"Warm brown background (#5C4033) full bleed. Center-left: editorial photo of a craftsman's hands laying travertine pavers, shot on Sony A7RV 85mm f/1.4, extreme shallow depth of field, golden hour backlighting creating rim light on the hands. The photo is positioned center-left, slightly overlapping the text area. Right side, overlapping the photo edge: HUGE bold serif text (Playfair Display, cream #F5F0E6) 'Every DETAIL matters.' — 'DETAIL' in extra-bold 72px, rest in light 36px. Below: thin gold line, then small sans-serif 'From the first paver to the final seal.' 14px cream. Top bar: 'CRAFTSMANSHIP' left, 'CAVIAR' right, tiny uppercase. Bottom-right: '03/07'. Muted warm editorial color grading. Square 1:1, 1080x1080px. NO LOGO in the image."

ANOTHER EXAMPLE:
"Rich cream background (#F5F0E6). Asymmetric layout. Top-left area: GIANT serif headline (Playfair Display, navy #1E3A5F) spanning 3 lines — 'Seu espaço' in thin weight 32px, 'MERECE' in bold 80px, 'mais.' in italic 40px. The text takes up the top-left 60% of the composition. Bottom-right: editorial photo of a stunning outdoor kitchen setup at dusk, warm amber uplighting on stone columns, shot on Hasselblad medium format. Photo bleeds off the right and bottom edges. A thin gold accent line separates text from photo area. Small navy body text below headline: 'Premium hardscaping for the home that deserves it.' 14px Montserrat. Bottom: '05/07' in gold. Sophisticated, editorial, magazine-quality. Square 1:1, 1080x1080px. NO LOGO in the image."`

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
- Each prompt generates ONE COMPLETE DESIGNED SLIDE — background, visuals, text, design elements
- NEVER include a logo — the real logo is overlaid separately after generation
- End every prompt with "NO LOGO in the image."
- VARY the compositions — don't repeat the same layout every slide. Mix photo-dominant, text-dominant, split, centered, asymmetric
- Each composition should feel like a premium design agency made it
- TYPOGRAPHY IS THE HERO — text should be large, bold, mixed-weight, intentionally placed
- Specify font size, weight, color, and placement clearly for all text
- Include the EXACT text that should appear in the image (headline, subtext, bullets)
- Include slide counter (e.g. "01/07") in a corner
- Think Brazilian luxury social media design aesthetic — bold, editorial, sophisticated
- Specify "Square 1:1 format, 1080x1080px" in every prompt
- NEVER make generic or stock-photo looking content — this is DESIGN, not photography

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
