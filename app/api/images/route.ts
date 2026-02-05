import { NextResponse } from 'next/server'
import { generateImage, buildImagePrompt } from '@/lib/nano-banana'
import { BrandColors } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { imageDescription, brandColors, aesthetic, model } = body as {
      imageDescription: string
      brandColors: BrandColors
      aesthetic?: string
      model?: string
    }

    if (!imageDescription) {
      return NextResponse.json(
        { error: 'imageDescription is required' },
        { status: 400 }
      )
    }

    const prompt = buildImagePrompt(
      imageDescription,
      brandColors as unknown as Record<string, Record<string, string>>,
      aesthetic
    )

    const result = await generateImage(
      prompt,
      model === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image'
    )

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
