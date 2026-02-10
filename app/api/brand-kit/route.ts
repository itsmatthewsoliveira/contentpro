import { NextResponse } from 'next/server'
import { getBrandConfig } from '@/lib/storage'
import fs from 'fs'
import path from 'path'

const RUNTIME_DATA_DIR = process.env.CONTENT_STUDIO_DATA_DIR || path.join(process.cwd(), '.content-studio-data')

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const brandSlug = searchParams.get('brand')

  if (!brandSlug) {
    return NextResponse.json({ error: 'brand parameter required' }, { status: 400 })
  }

  const config = getBrandConfig(brandSlug)
  if (!config) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
  }

  return NextResponse.json({ config })
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { brandSlug, config } = body as {
      brandSlug: string
      config: Record<string, unknown>
    }

    if (!brandSlug || !config) {
      return NextResponse.json(
        { error: 'brandSlug and config required' },
        { status: 400 }
      )
    }

    // Save to runtime directory (doesn't overwrite bundled brand.json)
    const runtimeDir = path.join(RUNTIME_DATA_DIR, 'brands', brandSlug)
    fs.mkdirSync(runtimeDir, { recursive: true })

    const configPath = path.join(runtimeDir, 'brand.json')
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))

    return NextResponse.json({ success: true, path: configPath })
  } catch (error) {
    console.error('Failed to save brand config:', error)
    const message = error instanceof Error ? error.message : 'Save failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
