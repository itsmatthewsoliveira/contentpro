import { NextResponse } from 'next/server'
import { getBrandConfig } from '@/lib/storage'

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
      carouselTheme?: { artDirection?: string; lighting?: string }
      aspectRatio?: '1:1' | '4:5' | '9:16'
    }

    const scene = compositionPrompt || imageDescription
    if (!scene) {
      return NextResponse.json({ error: 'compositionPrompt is required' }, { status: 400 })
    }

    // Build a simple scene-only prompt
    const brandConfig = getBrandConfig(brandSlug || '')
    const colors: string[] = []
    if (brandConfig?.colors) {
      for (const [section, values] of Object.entries(brandConfig.colors)) {
        if (section === 'meaning' || typeof values !== 'object' || !values) continue
        for (const [key, val] of Object.entries(values as Record<string, string>)) {
          if (typeof val === 'string' && val.startsWith('#')) {
            colors.push(`${key}: ${val}`)
          }
        }
      }
    }

    const negatives = brandConfig?.visualStyle?.negativePrompt
      ? `DO NOT: ${brandConfig.visualStyle.negativePrompt}`
      : ''
    const mood = brandConfig?.designSystem?.photographyStyle?.mood
      || brandConfig?.visualStyle?.aesthetic
      || 'Professional quality'
    const imageGuidance = brandConfig?.visualStyle?.imageGuidance || ''
    const dimensions = aspectRatio === '9:16' ? '1080x1920 vertical' : aspectRatio === '4:5' ? '1080x1350 portrait' : '1080x1080 square'

    const fullPrompt = `BACKGROUND IMAGE ONLY — do NOT render any text, words, letters, numbers, labels, watermarks, logos, or typography. The image must contain ZERO text. Text will be added programmatically.

Leave the bottom 30-40% slightly darker or simpler for text overlay space.

SCENE: ${scene}

Brand colors (for lighting and accents): ${colors.join(', ')}
Art direction: ${carouselTheme?.artDirection || 'Professional'}
Lighting: ${carouselTheme?.lighting || 'Balanced'}
Mood: ${mood}
${imageGuidance ? `Style: ${imageGuidance}` : ''}
${customPrompt ? `Direction: ${customPrompt}` : ''}
${negatives}

One single image. No grid or collage. ${dimensions}.`

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
        size: aspectRatio === '9:16' ? '1024x1536' : aspectRatio === '4:5' ? '1024x1536' : '1024x1024',
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
