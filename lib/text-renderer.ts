import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'

// Font loading — cached at module level
let fontsLoaded = false
const fontBuffers: Record<string, ArrayBuffer> = {}

function loadFonts() {
  if (fontsLoaded) return
  const fontsDir = join(process.cwd(), 'public', 'fonts')
  const fontFiles: Record<string, string> = {
    'Anton-Regular': 'Anton-Regular.ttf',
    'Inter-Regular': 'Inter-Regular.ttf',
    'Inter-SemiBold': 'Inter-SemiBold.ttf',
    'Inter-Bold': 'Inter-Bold.ttf',
    'PlayfairDisplay-Bold': 'PlayfairDisplay-Bold.ttf',
    'Montserrat-Regular': 'Montserrat-Regular.ttf',
    'Montserrat-SemiBold': 'Montserrat-SemiBold.ttf',
  }
  for (const [key, file] of Object.entries(fontFiles)) {
    try {
      const buf = readFileSync(join(fontsDir, file))
      fontBuffers[key] = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    } catch {
      console.warn(`Font not found: ${file}`)
    }
  }
  fontsLoaded = true
}

function getSatoriFonts(brandFonts: { headline: string; body: string }) {
  loadFonts()

  const fonts: Array<{ name: string; data: ArrayBuffer; weight: number; style: 'normal' | 'italic' }> = []

  // Map brand font names to our files
  const headlineMap: Record<string, string> = {
    'Anton': 'Anton-Regular',
    'Playfair Display': 'PlayfairDisplay-Bold',
  }
  const bodyMap: Record<string, { regular: string; semibold: string; bold: string }> = {
    'Inter': { regular: 'Inter-Regular', semibold: 'Inter-SemiBold', bold: 'Inter-Bold' },
    'Montserrat': { regular: 'Montserrat-Regular', semibold: 'Montserrat-SemiBold', bold: 'Montserrat-SemiBold' },
  }

  // Headline font
  const hlKey = headlineMap[brandFonts.headline] || 'Anton-Regular'
  if (fontBuffers[hlKey]) {
    fonts.push({ name: brandFonts.headline, data: fontBuffers[hlKey], weight: 400, style: 'normal' })
  }

  // Body font
  const bodyEntry = bodyMap[brandFonts.body] || bodyMap['Inter']
  if (bodyEntry) {
    if (fontBuffers[bodyEntry.regular]) {
      fonts.push({ name: brandFonts.body, data: fontBuffers[bodyEntry.regular], weight: 400, style: 'normal' })
    }
    if (fontBuffers[bodyEntry.semibold]) {
      fonts.push({ name: brandFonts.body, data: fontBuffers[bodyEntry.semibold], weight: 600, style: 'normal' })
    }
    if (fontBuffers[bodyEntry.bold]) {
      fonts.push({ name: brandFonts.body, data: fontBuffers[bodyEntry.bold], weight: 700, style: 'normal' })
    }
  }

  return fonts
}

// ── Types ──

export interface TextOverlayInput {
  headline: string
  subtext?: string
  cta?: string
  accentWords?: string[]
  purpose?: string
  slideNumber?: number
  totalSlides?: number
}

export interface BrandStyle {
  headlineFont: string
  bodyFont: string
  colors: {
    text: string        // headline color e.g. #FFFFFF
    accent: string      // accent word color e.g. #4F46E5
    subtext: string     // subtext color e.g. #B0B0C8
    muted: string       // chrome/label color e.g. #555577
  }
  chrome?: {
    topLeft?: string    // e.g. "SERVICEGROWTH"
    topRight?: string   // e.g. "AI AUTOMATION"
  }
}

export interface CompositeOptions {
  backgroundBase64: string
  backgroundMimeType?: string
  text: TextOverlayInput
  brand: BrandStyle
  aspectRatio: '1:1' | '9:16'
}

// ── Headline rendering with accent words ──

function buildHeadlineElements(headline: string, accentWords: string[], textColor: string, accentColor: string) {
  // Clean asterisks from headline
  const clean = headline.replace(/\*/g, '')
  const words = clean.split(/\s+/)

  const accentSet = new Set(accentWords.map(w => w.toLowerCase().replace(/\*/g, '')))

  return words.map((word) => {
    const isAccent = accentSet.has(word.toLowerCase())
    return {
      type: 'span' as const,
      props: {
        style: {
          color: isAccent ? accentColor : textColor,
        },
        children: word + ' ',
      },
    }
  })
}

// ── Layout builder (returns Satori-compatible JSX object) ──

function buildSlideLayout(opts: CompositeOptions): Record<string, unknown> {
  const { text, brand, aspectRatio } = opts
  const width = 1080
  const height = aspectRatio === '9:16' ? 1920 : 1080

  const headlineSize = aspectRatio === '9:16' ? 72 : 64
  const subtextSize = aspectRatio === '9:16' ? 24 : 20
  const ctaSize = aspectRatio === '9:16' ? 20 : 18
  const chromeSize = 11
  const labelSize = 12

  const pad = { x: 60, top: 50, bottom: 50 }

  // Build accent words
  const headlineWords = buildHeadlineElements(
    text.headline,
    text.accentWords || [],
    brand.colors.text,
    brand.colors.accent
  )

  const children: Record<string, unknown>[] = []

  // Chrome: top bar
  if (brand.chrome?.topLeft || brand.chrome?.topRight) {
    children.push({
      type: 'div',
      props: {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          position: 'absolute',
          top: pad.top,
          left: pad.x,
          right: pad.x,
          paddingRight: pad.x * 2,
        },
        children: [
          brand.chrome?.topLeft ? {
            type: 'span',
            props: {
              style: {
                fontFamily: brand.bodyFont,
                fontSize: chromeSize,
                color: brand.colors.muted,
                letterSpacing: '0.15em',
                textTransform: 'uppercase' as const,
                fontWeight: 500,
              },
              children: brand.chrome.topLeft,
            },
          } : null,
          brand.chrome?.topRight ? {
            type: 'span',
            props: {
              style: {
                fontFamily: brand.bodyFont,
                fontSize: chromeSize,
                color: brand.colors.muted,
                letterSpacing: '0.15em',
                textTransform: 'uppercase' as const,
                fontWeight: 500,
              },
              children: brand.chrome.topRight,
            },
          } : null,
        ].filter(Boolean),
      },
    })
  }

  // Category label (purpose)
  if (text.purpose) {
    children.push({
      type: 'div',
      props: {
        style: {
          fontFamily: brand.bodyFont,
          fontSize: labelSize,
          color: brand.colors.accent,
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          fontWeight: 600,
          marginBottom: 12,
        },
        children: text.purpose.toUpperCase(),
      },
    })
  }

  // Headline
  children.push({
    type: 'div',
    props: {
      style: {
        fontFamily: brand.headlineFont,
        fontSize: headlineSize,
        lineHeight: 1.0,
        textTransform: 'uppercase' as const,
        display: 'flex',
        flexWrap: 'wrap' as const,
        maxWidth: '90%',
      },
      children: headlineWords.map(w => w),
    },
  })

  // Subtext
  if (text.subtext) {
    children.push({
      type: 'div',
      props: {
        style: {
          fontFamily: brand.bodyFont,
          fontSize: subtextSize,
          color: brand.colors.subtext,
          marginTop: 16,
          fontWeight: 400,
          maxWidth: '80%',
          lineHeight: 1.4,
        },
        children: text.subtext,
      },
    })
  }

  // CTA button
  if (text.cta) {
    children.push({
      type: 'div',
      props: {
        style: {
          display: 'flex',
          marginTop: 32,
        },
        children: [{
          type: 'div',
          props: {
            style: {
              fontFamily: brand.bodyFont,
              fontSize: ctaSize,
              color: brand.colors.text,
              border: `1px solid ${brand.colors.accent}`,
              borderRadius: 999,
              padding: '10px 28px',
              fontWeight: 600,
              letterSpacing: '0.02em',
            },
            children: text.cta,
          },
        }],
      },
    })
  }

  // Root container — text positioned in bottom-left area over the background
  return {
    type: 'div',
    props: {
      style: {
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: `${pad.top}px ${pad.x}px ${pad.bottom}px ${pad.x}px`,
        // Semi-transparent gradient overlay for text legibility
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.0) 70%)',
      },
      children,
    },
  }
}

// ── Main composite function ──

export async function compositeTextOnImage(opts: CompositeOptions): Promise<{ imageBase64: string; mimeType: string }> {
  const width = 1080
  const height = opts.aspectRatio === '9:16' ? 1920 : 1080

  // 1. Render text overlay as PNG using Satori + Resvg
  const layout = buildSlideLayout(opts)
  const fonts = getSatoriFonts({ headline: opts.brand.headlineFont, body: opts.brand.bodyFont })

  const svg = await satori(layout as unknown as React.ReactElement, {
    width,
    height,
    fonts: fonts as any,
  })

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
  })
  const textPng = resvg.render().asPng()

  // 2. Decode background image
  const bgBuffer = Buffer.from(opts.backgroundBase64, 'base64')

  // 3. Composite text layer on top of background using Sharp
  const result = await sharp(bgBuffer)
    .resize(width, height, { fit: 'cover' })
    .composite([
      {
        input: textPng,
        top: 0,
        left: 0,
        blend: 'over',
      },
    ])
    .png()
    .toBuffer()

  return {
    imageBase64: result.toString('base64'),
    mimeType: 'image/png',
  }
}
