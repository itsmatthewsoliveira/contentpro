import { NextResponse } from 'next/server'
import { generateImage, ImageModel } from '@/lib/nano-banana'
import fs from 'fs'
import path from 'path'

// Cache loaded reference images per brand to avoid re-reading files
const referenceCache: Record<string, Array<{ data: string; mimeType: string }>> = {}

function loadStyleReferences(brandSlug: string): Array<{ data: string; mimeType: string }> {
  if (referenceCache[brandSlug]) return referenceCache[brandSlug]

  const refDir = path.join(process.cwd(), 'brands', brandSlug, 'style-references')
  const refs: Array<{ data: string; mimeType: string }> = []

  try {
    if (!fs.existsSync(refDir)) return refs

    const files = fs.readdirSync(refDir)
      .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
      .slice(0, 3) // Max 3 reference images to keep request size manageable

    for (const file of files) {
      const filePath = path.join(refDir, file)
      const buffer = fs.readFileSync(filePath)
      // Resize/compress would be ideal, but for now just limit count
      const ext = path.extname(file).toLowerCase()
      const mimeType = ext === '.png' ? 'image/png'
        : ext === '.webp' ? 'image/webp'
        : 'image/jpeg'

      refs.push({
        data: buffer.toString('base64'),
        mimeType,
      })
    }
  } catch (err) {
    console.error(`Failed to load style references for ${brandSlug}:`, err)
  }

  referenceCache[brandSlug] = refs
  return refs
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { compositionPrompt, imageDescription, model, brandSlug } = body as {
      compositionPrompt?: string
      imageDescription?: string
      model?: ImageModel
      brandSlug?: string
    }

    const prompt = compositionPrompt || imageDescription
    if (!prompt) {
      return NextResponse.json(
        { error: 'compositionPrompt is required' },
        { status: 400 }
      )
    }

    // Load style reference images for this brand
    const referenceImages = brandSlug ? loadStyleReferences(brandSlug) : []

    const result = await generateImage(prompt, model || 'pro', referenceImages)

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
