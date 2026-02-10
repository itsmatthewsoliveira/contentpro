import { NextResponse } from 'next/server'
import { saveApprovedImage, listApprovedImages, deleteApprovedImage } from '@/lib/storage'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const brandSlug = searchParams.get('brand')

  if (!brandSlug) {
    return NextResponse.json({ error: 'brand parameter required' }, { status: 400 })
  }

  const images = listApprovedImages(brandSlug)
  return NextResponse.json({ images })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { brandSlug, imageBase64, metadata } = body as {
      brandSlug: string
      imageBase64: string
      metadata: Record<string, unknown>
    }

    if (!brandSlug || !imageBase64) {
      return NextResponse.json(
        { error: 'brandSlug and imageBase64 required' },
        { status: 400 }
      )
    }

    const result = saveApprovedImage(brandSlug, imageBase64, metadata || {})
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Failed to save approved image:', error)
    const message = error instanceof Error ? error.message : 'Save failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const brandSlug = searchParams.get('brand')
  const id = searchParams.get('id')

  if (!brandSlug || !id) {
    return NextResponse.json({ error: 'brand and id parameters required' }, { status: 400 })
  }

  const deleted = deleteApprovedImage(brandSlug, id)
  return NextResponse.json({ success: deleted })
}
