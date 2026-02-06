import { NextResponse } from 'next/server'
import { getBrand } from '@/lib/brands'
import { generateBrief } from '@/lib/generator'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { brandSlug, topic, postType, slideCount } = body

    if (typeof brandSlug !== 'string' || typeof topic !== 'string' || !brandSlug.trim() || !topic.trim()) {
      return NextResponse.json(
        { error: 'brandSlug and topic are required' },
        { status: 400 }
      )
    }

    const brand = getBrand(brandSlug)
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const resolvedPostType = typeof postType === 'string' && postType.trim()
      ? postType
      : 'educationalCarousel'

    if (!brand.postTypes[resolvedPostType]) {
      return NextResponse.json(
        { error: `Invalid postType for brand: ${resolvedPostType}` },
        { status: 400 }
      )
    }

    const numericSlideCount = Number(slideCount)
    const resolvedSlideCount = Number.isFinite(numericSlideCount)
      ? Math.min(10, Math.max(1, Math.floor(numericSlideCount)))
      : 7

    const brief = await generateBrief(brandSlug, brand, topic, {
      postType: resolvedPostType,
      slideCount: resolvedSlideCount,
    })

    return NextResponse.json(brief)
  } catch (error) {
    console.error('Generate error:', error)
    const message = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
