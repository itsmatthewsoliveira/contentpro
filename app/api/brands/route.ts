import { NextResponse } from 'next/server'
import { getBrands, getBrand } from '@/lib/brands'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (slug) {
    const brand = getBrand(slug)
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }
    return NextResponse.json({ slug, config: brand })
  }

  const brands = getBrands()
  return NextResponse.json(brands)
}
