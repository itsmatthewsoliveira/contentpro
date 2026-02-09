import { NextResponse } from 'next/server'
import { generateImage, ImageModel, ReferenceImage } from '@/lib/nano-banana'
import { listReferenceEntries, getMimeTypeForPath, getBrandConfig } from '@/lib/storage'
import fs from 'fs'

// Load up to 3 reference images for a brand
function loadReferenceImages(brandSlug: string): ReferenceImage[] {
  const entries = listReferenceEntries(brandSlug, { limit: 3 })
  const refs: ReferenceImage[] = []

  for (const entry of entries) {
    try {
      const buffer = fs.readFileSync(entry.filePath)
      refs.push({
        data: buffer.toString('base64'),
        mimeType: getMimeTypeForPath(entry.filePath),
      })
    } catch (err) {
      console.error(`Failed to load reference ${entry.filename}:`, err)
    }
  }

  return refs
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { compositionPrompt, imageDescription, model, brandSlug, customPrompt, topic, slideHeadline } = body as {
      compositionPrompt?: string
      imageDescription?: string
      model?: ImageModel
      brandSlug?: string
      customPrompt?: string
      topic?: string
      slideHeadline?: string
    }

    const prompt = compositionPrompt || imageDescription
    if (!prompt) {
      return NextResponse.json(
        { error: 'compositionPrompt is required' },
        { status: 400 }
      )
    }

    // Load reference images and brand config
    const referenceImages = brandSlug ? loadReferenceImages(brandSlug) : []
    const brandConfig = brandSlug ? getBrandConfig(brandSlug) : undefined

    console.log(`Loaded ${referenceImages.length} reference images for ${brandSlug}`)

    const result = await generateImage(prompt, model || 'pro', {
      brandConfig,
      referenceImages,
      customPrompt,
      topic,
      slideHeadline,
    })

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
