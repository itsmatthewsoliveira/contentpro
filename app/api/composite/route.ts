import { NextResponse } from 'next/server'
import { compositeTextOnImage, type BrandStyle, type TextOverlayInput, type TextLayout } from '@/lib/text-renderer'
import { getBrandConfig } from '@/lib/storage'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      backgroundBase64,
      backgroundMimeType,
      brandSlug,
      slide,
      aspectRatio = '1:1',
      textLayout,
    } = body as {
      backgroundBase64: string
      backgroundMimeType?: string
      brandSlug: string
      slide: {
        headline: string
        subtext?: string
        cta?: string
        accentWords?: string[]
        purpose?: string
        number?: number
        totalSlides?: number
      }
      aspectRatio?: '1:1' | '9:16'
      textLayout?: TextLayout
    }

    if (!backgroundBase64) {
      return NextResponse.json({ error: 'backgroundBase64 is required' }, { status: 400 })
    }
    if (!slide?.headline) {
      return NextResponse.json({ error: 'slide.headline is required' }, { status: 400 })
    }

    // Build brand style from config
    const brandConfig = getBrandConfig(brandSlug)
    const brandStyle: BrandStyle = {
      headlineFont: brandConfig?.typography?.headlineFont || 'Anton',
      bodyFont: brandConfig?.typography?.bodyFont || 'Inter',
      colors: {
        text: brandConfig?.colors?.text?.primary || '#FFFFFF',
        accent: Object.values(brandConfig?.colors?.accent || {})[0] as string || '#4F46E5',
        subtext: brandConfig?.colors?.text?.secondary || '#B0B0C8',
        muted: brandConfig?.colors?.text?.muted || '#555577',
      },
      chrome: brandConfig?.designSystem?.repeatingChrome?.topBar
        ? {
            topLeft: brandConfig.designSystem.repeatingChrome.topBar.left,
            topRight: brandConfig.designSystem.repeatingChrome.topBar.right,
          }
        : undefined,
    }

    const textInput: TextOverlayInput = {
      headline: slide.headline,
      subtext: slide.subtext,
      cta: slide.cta || undefined,
      accentWords: slide.accentWords,
      purpose: slide.purpose,
      slideNumber: slide.number,
      totalSlides: slide.totalSlides,
    }

    const result = await compositeTextOnImage({
      backgroundBase64,
      backgroundMimeType,
      text: textInput,
      brand: brandStyle,
      aspectRatio,
      textLayout,
    })

    return NextResponse.json({
      imageBase64: result.imageBase64,
      mimeType: result.mimeType,
    })
  } catch (error) {
    console.error('Composite error:', error)
    const message = error instanceof Error ? error.message : 'Compositing failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
