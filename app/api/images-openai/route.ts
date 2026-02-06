import { NextResponse } from 'next/server'

function getBrandStyleEnvelope(brandSlug?: string): string {
  if (brandSlug === 'servicegrowth-ai') {
    return `STYLE LOCK — ServiceGrowth AI:
- Colors: #0D0D0D background, #00D4FF accent, #FFFFFF text only
- Typography: modern sans-serif only
- Aesthetic: premium dark tech editorial
- English only, perfect spelling
- Avoid generic stock-business visuals and overdone AI glow`
  }

  if (brandSlug === 'caviar-pavers') {
    return `STYLE LOCK — Caviar Pavers:
- Colors: #1E3A5F navy, #5C4033 brown, #C9A227 gold, #F5F0E6 cream only
- Typography: elegant serif headline + clean sans-serif support
- Aesthetic: luxury architectural editorial
- English only, perfect spelling
- Avoid cyber/tech motifs and low-end stock construction imagery`
  }

  return 'STYLE LOCK: Professional editorial Instagram design, English only, no generic AI stock style.'
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { compositionPrompt, imageDescription, brandSlug } = body as {
      compositionPrompt?: string
      imageDescription?: string
      brandSlug?: string
    }

    const prompt = compositionPrompt || imageDescription
    if (!prompt) {
      return NextResponse.json(
        { error: 'compositionPrompt is required' },
        { status: 400 }
      )
    }

    // Add Instagram slide format instruction
    const fullPrompt = `${getBrandStyleEnvelope(brandSlug)}

${prompt}

CRITICAL REQUIREMENTS:
- This is a 1080x1080 pixel Instagram slide
- Leave a 60x60px clear zone in the top-left corner for logo overlay
- All text must be PERFECTLY SPELLED — double-check every word
- ENGLISH ONLY — no other languages
- This should look like a professionally designed social media graphic, not a photograph`

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
        size: '1024x1024',
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
