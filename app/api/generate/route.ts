import { NextResponse } from 'next/server'
import { getBrand } from '@/lib/brands'
import { generateBrief } from '@/lib/generator'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { brandSlug, topic, postType, slideCount } = body

    if (!brandSlug || !topic) {
      return NextResponse.json(
        { error: 'brandSlug and topic are required' },
        { status: 400 }
      )
    }

    const brand = getBrand(brandSlug)
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const brief = await generateBrief(brandSlug, brand, topic, {
      postType: postType || 'educationalCarousel',
      slideCount: slideCount || 7,
    })

    return NextResponse.json(brief)
  } catch (error) {
    console.error('Generate error:', error)
    const message = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
