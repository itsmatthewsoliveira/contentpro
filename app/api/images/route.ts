import { NextResponse } from 'next/server'
import { generateImage, ImageModel } from '@/lib/nano-banana'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { compositionPrompt, imageDescription, model } = body as {
      compositionPrompt?: string
      imageDescription?: string // legacy fallback
      model?: ImageModel
    }

    const prompt = compositionPrompt || imageDescription
    if (!prompt) {
      return NextResponse.json(
        { error: 'compositionPrompt is required' },
        { status: 400 }
      )
    }

    const result = await generateImage(prompt, model || 'pro')

    if (!result.imageBase64) {
      return NextResponse.json({ error: 'No image generated' }, { status: 500 })
    }

    return NextResponse.json({
      imageBase64: result.imageBase64,
      mimeType: result.mimeType,
    })
  } catch (error) {
    console.error('Image generation error:', error)
    const message = error instanceof Error ? error.message : 'Image generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
