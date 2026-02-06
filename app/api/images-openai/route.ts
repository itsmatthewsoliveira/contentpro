import { NextResponse } from 'next/server'

export type OpenAIImageModel = 'gpt-image-1' | 'dall-e-3'

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { compositionPrompt, imageDescription, model = 'gpt-image-1' } = body as {
      compositionPrompt?: string
      imageDescription?: string
      model?: OpenAIImageModel
    }

    const prompt = compositionPrompt || imageDescription
    if (!prompt) {
      return NextResponse.json(
        { error: 'compositionPrompt is required' },
        { status: 400 }
      )
    }

    // Add Instagram slide format instruction
    const fullPrompt = `${prompt}

CRITICAL REQUIREMENTS:
- This is a 1080x1080 pixel Instagram slide
- Leave a 60x60px clear zone in the top-left corner for logo overlay
- All text must be PERFECTLY SPELLED — double-check every word
- ENGLISH ONLY — no other languages
- This should look like a professionally designed social media graphic, not a photograph`

    // Build request based on model
    const requestBody: Record<string, unknown> = {
      model,
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    }

    // gpt-image-1 supports 'quality' parameter, dall-e-3 uses 'quality' differently
    if (model === 'gpt-image-1') {
      requestBody.quality = 'high'
    } else if (model === 'dall-e-3') {
      requestBody.quality = 'hd' // DALL-E 3 uses 'standard' or 'hd'
      requestBody.style = 'vivid' // 'vivid' or 'natural'
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      throw new Error(errorData.error?.message || 'OpenAI API request failed')
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
      model,
    })
  } catch (error) {
    console.error('OpenAI image generation error:', error)
    const message = error instanceof Error ? error.message : 'Image generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
