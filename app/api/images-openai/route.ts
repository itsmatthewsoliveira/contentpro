import { NextResponse } from 'next/server'
import { getBrandConfig, listApprovedImages } from '@/lib/storage'
import { buildApprovedImageGuidance } from '@/lib/nano-banana'

interface CarouselTheme {
  artDirection?: string
  lighting?: string
  framing?: string
  textureMotif?: string
  consistencyAnchor?: string
}

function buildBrandBlock(brandSlug?: string): string {
  if (!brandSlug) {
    return 'STYLE: Professional editorial Instagram design, English only, no generic AI stock style.'
  }

  const brandConfig = getBrandConfig(brandSlug)
  if (!brandConfig) {
    return 'STYLE: Professional editorial Instagram design, English only, no generic AI stock style.'
  }

  // Collect all colors from brand config
  const colorLines: string[] = []
  for (const [section, values] of Object.entries(brandConfig.colors || {})) {
    if (section === 'meaning' || typeof values !== 'object' || !values) continue
    for (const [key, val] of Object.entries(values as Record<string, string>)) {
      if (typeof val === 'string' && val.startsWith('#')) {
        colorLines.push(`  ${key}: ${val}`)
      }
    }
  }

  const aesthetic = brandConfig.visualStyle?.aesthetic || 'Professional editorial'
  const negativePrompt = brandConfig.visualStyle?.negativePrompt || ''
  const imageGuidance = brandConfig.visualStyle?.imageGuidance || ''
  const headlineFont = brandConfig.typography?.headlineFont || 'Clean modern font'
  const bodyFont = brandConfig.typography?.bodyFont || 'Sans-serif'

  // Build designSystem block if available
  let designSystemBlock = ''
  const ds = (brandConfig as any).designSystem
  if (ds) {
    const parts: string[] = ['DESIGN SYSTEM (follow these rules precisely):']

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

    if (ds.decorativeElements?.length) {
      parts.push(`\nDECORATIVE ELEMENTS:`)
      ds.decorativeElements.slice(0, 5).forEach((e: string) => parts.push(`- ${e}`))
    }

    if (ds.colorApplication) {
      parts.push(`\nCOLOR APPLICATION:`)
      if (ds.colorApplication.photoOverlay) parts.push(`- Photo overlay: ${ds.colorApplication.photoOverlay}`)
      parts.push(`- Text primary: ${ds.colorApplication.textPrimary}`)
      parts.push(`- Text accent: ${ds.colorApplication.textAccent}`)
      parts.push(`- Background fallback: ${ds.colorApplication.backgroundFallback}`)
    }

    if (ds.photographyStyle?.mood) {
      parts.push(`\nPHOTOGRAPHY MOOD: ${ds.photographyStyle.mood}`)
    }

    designSystemBlock = parts.join('\n')
  }

  return `BRAND COLORS (use EXACTLY):
${colorLines.join('\n')}

TYPOGRAPHY:
- Headlines: ${headlineFont} style
- Body: ${bodyFont} style

AESTHETIC: ${aesthetic}

${designSystemBlock}

${imageGuidance ? `IMAGE GUIDANCE: ${imageGuidance}` : ''}

${negativePrompt ? `DO NOT: ${negativePrompt}` : ''}`
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { compositionPrompt, imageDescription, brandSlug, customPrompt, carouselTheme, aspectRatio } = body as {
      compositionPrompt?: string
      imageDescription?: string
      brandSlug?: string
      customPrompt?: string
      carouselTheme?: CarouselTheme
      aspectRatio?: '1:1' | '9:16'
    }

    const prompt = compositionPrompt || imageDescription
    if (!prompt) {
      return NextResponse.json(
        { error: 'compositionPrompt is required' },
        { status: 400 }
      )
    }

    const brandBlock = buildBrandBlock(brandSlug)

    // Approved images quality guidance
    const approvedImages = brandSlug ? listApprovedImages(brandSlug) : []
    const approvedGuidance = buildApprovedImageGuidance(approvedImages)

    // Carousel theme for cross-slide consistency
    const themeBlock = carouselTheme
      ? `VISUAL STYLE (apply to this single slide):
- Art direction: ${carouselTheme.artDirection || 'Professional editorial'}
- Lighting: ${carouselTheme.lighting || 'Balanced professional lighting'}
- Framing: ${carouselTheme.framing || 'Clear hierarchy'}
- Texture/motif: ${carouselTheme.textureMotif || 'Clean surfaces'}
- Consistency anchor: ${carouselTheme.consistencyAnchor || 'Brand colors and typography'}`
      : ''

    const designPrinciples = `DESIGN FUNDAMENTALS (apply to every image):
- Use rule of thirds for element placement — align key elements along grid lines and intersections
- Maintain clear visual hierarchy: primary headline > supporting text > background elements
- Use consistent alignment — left-align or center-align text blocks, never mix randomly
- Ensure adequate whitespace/breathing room between elements — avoid crowding
- Typography should have clear size contrast between headline, subtext, and body
- Balance visual weight across the composition — don't cluster everything in one corner
- Use color contrast to guide the eye to the most important element first`

    // Detect if the prompt is a full layered design spec
    const compositionLabel = prompt.includes('CANVAS:') || prompt.includes('LAYER ')
      ? 'LAYERED DESIGN SPECIFICATION (follow this Photoshop-like layer stack):'
      : 'SLIDE COMPOSITION:'

    const fullPrompt = `${brandBlock}

${designPrinciples}

${themeBlock}

${compositionLabel}
${prompt}

${customPrompt ? `CREATIVE DIRECTION:\n${customPrompt}` : ''}

${approvedGuidance}

CRITICAL REQUIREMENTS:
- Generate exactly ONE single image — do NOT create a grid, collage, or multiple panels
- ${aspectRatio === '9:16' ? '1080x1920 pixel vertical (9:16 portrait)' : '1080x1080 pixel square'} Instagram slide
- All text must be PERFECTLY SPELLED — double-check every word
- ENGLISH ONLY — no other languages
- Professional social media graphic, not a photograph
- DO NOT include any logo, brand name, company name, tagline, or watermark text in the image. The user will add branding separately.`

    console.log('OpenAI prompt length:', fullPrompt.length)

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: fullPrompt,
        n: 1,
        size: aspectRatio === '9:16' ? '1024x1536' : '1024x1024',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`)
      } catch {
        throw new Error(`OpenAI API error: ${response.status} - ${errorText.slice(0, 200)}`)
      }
    }

    const data = await response.json()
    const imageBase64 = data.data?.[0]?.b64_json

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image generated' }, { status: 500 })
    }

    return NextResponse.json({
      imageBase64,
      mimeType: 'image/png',
      engine: 'openai',
    })
  } catch (error) {
    console.error('OpenAI image generation error:', error)
    const message = error instanceof Error ? error.message : 'Image generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
