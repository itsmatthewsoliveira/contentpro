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

export type TextLayout = 'bottom-stack' | 'center-bold' | 'editorial-split'

export const TEXT_LAYOUTS: Record<TextLayout, { name: string; description: string }> = {
  'bottom-stack': {
    name: 'Bottom Stack',
    description: 'Headline + subtext bottom-left, gradient overlay from bottom',
  },
  'center-bold': {
    name: 'Center Bold',
    description: 'Massive headline centered, label above, subtext below',
  },
  'editorial-split': {
    name: 'Editorial Split',
    description: 'Chrome bar top, headline upper area, subtext mid-right',
  },
}

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
  textLayout?: TextLayout
}

// ── Headline rendering with accent words ──

function buildHeadlineElements(headline: string, accentWords: string[], textColor: string, accentColor: string) {
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

// ── Chrome bar (shared across layouts) ──

function buildChromeBar(brand: BrandStyle, pad: { x: number; top: number }) {
  if (!brand.chrome?.topLeft && !brand.chrome?.topRight) return null
  const chromeSize = 11
  return {
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
  }
}

// ── CTA element (shared across layouts) ──

function buildCtaElement(cta: string, brand: BrandStyle, fontSize: number) {
  return {
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
            fontSize,
            color: brand.colors.text,
            border: `1px solid ${brand.colors.accent}`,
            borderRadius: 999,
            padding: '10px 28px',
            fontWeight: 600,
            letterSpacing: '0.02em',
          },
          children: cta,
        },
      }],
    },
  }
}

// ════════════════════════════════════════════
// LAYOUT 1: Bottom Stack
// Headline + subtext stacked at bottom-left
// Gradient overlay from bottom for legibility
// Inspired by: navy editorial, dark tech, travel posts
// ════════════════════════════════════════════

function buildBottomStackLayout(opts: CompositeOptions): Record<string, unknown> {
  const { text, brand, aspectRatio } = opts
  const width = 1080
  const height = aspectRatio === '9:16' ? 1920 : 1080

  const headlineSize = aspectRatio === '9:16' ? 72 : 64
  const subtextSize = aspectRatio === '9:16' ? 24 : 20
  const ctaSize = aspectRatio === '9:16' ? 20 : 18
  const labelSize = 12
  const pad = { x: 60, top: 50, bottom: 50 }

  const headlineWords = buildHeadlineElements(
    text.headline, text.accentWords || [], brand.colors.text, brand.colors.accent
  )

  const children: Record<string, unknown>[] = []

  // Chrome bar
  const chrome = buildChromeBar(brand, pad)
  if (chrome) children.push(chrome)

  // Category label
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

  // CTA
  if (text.cta) children.push(buildCtaElement(text.cta, brand, ctaSize))

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
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.0) 70%)',
      },
      children,
    },
  }
}

// ════════════════════════════════════════════
// LAYOUT 2: Center Bold
// Massive headline dead center, small label above, subtext below
// Inspired by: "JAMAIS", "BRUXARIA", "VIVER", Atlanta-style posts
// ════════════════════════════════════════════

function buildCenterBoldLayout(opts: CompositeOptions): Record<string, unknown> {
  const { text, brand, aspectRatio } = opts
  const width = 1080
  const height = aspectRatio === '9:16' ? 1920 : 1080

  const headlineSize = aspectRatio === '9:16' ? 96 : 80
  const subtextSize = aspectRatio === '9:16' ? 22 : 18
  const ctaSize = aspectRatio === '9:16' ? 20 : 18
  const labelSize = 11
  const pad = { x: 60, top: 50, bottom: 50 }

  const headlineWords = buildHeadlineElements(
    text.headline, text.accentWords || [], brand.colors.text, brand.colors.accent
  )

  const children: Record<string, unknown>[] = []

  // Chrome bar
  const chrome = buildChromeBar(brand, pad)
  if (chrome) children.push(chrome)

  // Category label — small, centered above headline
  if (text.purpose) {
    children.push({
      type: 'div',
      props: {
        style: {
          fontFamily: brand.bodyFont,
          fontSize: labelSize,
          color: brand.colors.accent,
          letterSpacing: '0.2em',
          textTransform: 'uppercase' as const,
          fontWeight: 600,
          marginBottom: 20,
          textAlign: 'center' as const,
        },
        children: text.purpose.toUpperCase(),
      },
    })
  }

  // Headline — massive, centered
  children.push({
    type: 'div',
    props: {
      style: {
        fontFamily: brand.headlineFont,
        fontSize: headlineSize,
        lineHeight: 0.95,
        textTransform: 'uppercase' as const,
        display: 'flex',
        flexWrap: 'wrap' as const,
        justifyContent: 'center',
        textAlign: 'center' as const,
        maxWidth: '85%',
      },
      children: headlineWords.map(w => w),
    },
  })

  // Subtext — centered below
  if (text.subtext) {
    children.push({
      type: 'div',
      props: {
        style: {
          fontFamily: brand.bodyFont,
          fontSize: subtextSize,
          color: brand.colors.subtext,
          marginTop: 24,
          fontWeight: 400,
          maxWidth: '70%',
          lineHeight: 1.5,
          textAlign: 'center' as const,
        },
        children: text.subtext,
      },
    })
  }

  // CTA — centered
  if (text.cta) children.push(buildCtaElement(text.cta, brand, ctaSize))

  return {
    type: 'div',
    props: {
      style: {
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: `${pad.top}px ${pad.x}px ${pad.bottom}px ${pad.x}px`,
        // Radial vignette for center focus
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.75) 100%)',
      },
      children,
    },
  }
}

// ════════════════════════════════════════════
// LAYOUT 3: Editorial Split
// Chrome bar at top, headline in upper-left, subtext in mid-right area
// Photo is the dominant element — text stays out of the way
// Inspired by: psychology/green brand, Rextech agency, HOF social media
// ════════════════════════════════════════════

function buildEditorialSplitLayout(opts: CompositeOptions): Record<string, unknown> {
  const { text, brand, aspectRatio } = opts
  const width = 1080
  const height = aspectRatio === '9:16' ? 1920 : 1080

  const headlineSize = aspectRatio === '9:16' ? 64 : 52
  const subtextSize = aspectRatio === '9:16' ? 20 : 16
  const ctaSize = aspectRatio === '9:16' ? 18 : 16
  const labelSize = 10
  const pad = { x: 60, top: 50, bottom: 50 }

  const headlineWords = buildHeadlineElements(
    text.headline, text.accentWords || [], brand.colors.text, brand.colors.accent
  )

  // Build a two-zone layout: headline zone (upper-left) and subtext zone (mid-right)
  const topChildren: Record<string, unknown>[] = []
  const bottomChildren: Record<string, unknown>[] = []

  // Category label — above headline
  if (text.purpose) {
    topChildren.push({
      type: 'div',
      props: {
        style: {
          fontFamily: brand.bodyFont,
          fontSize: labelSize,
          color: brand.colors.accent,
          letterSpacing: '0.2em',
          textTransform: 'uppercase' as const,
          fontWeight: 600,
          marginBottom: 16,
        },
        children: text.purpose.toUpperCase(),
      },
    })
  }

  // Headline — upper left, smaller than other layouts to leave room for photo
  topChildren.push({
    type: 'div',
    props: {
      style: {
        fontFamily: brand.headlineFont,
        fontSize: headlineSize,
        lineHeight: 1.0,
        textTransform: 'uppercase' as const,
        display: 'flex',
        flexWrap: 'wrap' as const,
        maxWidth: '65%',
      },
      children: headlineWords.map(w => w),
    },
  })

  // Subtext — positioned bottom-right
  if (text.subtext) {
    bottomChildren.push({
      type: 'div',
      props: {
        style: {
          fontFamily: brand.bodyFont,
          fontSize: subtextSize,
          color: brand.colors.subtext,
          fontWeight: 400,
          maxWidth: '55%',
          lineHeight: 1.5,
          textAlign: 'right' as const,
          marginLeft: 'auto',
        },
        children: text.subtext,
      },
    })
  }

  // CTA — bottom right
  if (text.cta) {
    bottomChildren.push({
      type: 'div',
      props: {
        style: {
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 20,
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
              padding: '8px 24px',
              fontWeight: 600,
              letterSpacing: '0.02em',
            },
            children: text.cta,
          },
        }],
      },
    })
  }

  // Chrome bar at top
  const chromeBar = buildChromeBar(brand, pad)

  return {
    type: 'div',
    props: {
      style: {
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: `${pad.top + 30}px ${pad.x}px ${pad.bottom}px ${pad.x}px`,
        // Subtle top and bottom bands for text readability, transparent middle
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0.7) 100%)',
      },
      children: [
        // Chrome (absolute positioned)
        ...(chromeBar ? [chromeBar] : []),
        // Top zone: label + headline
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column' },
            children: topChildren,
          },
        },
        // Bottom zone: subtext + CTA (right-aligned)
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column' },
            children: bottomChildren,
          },
        },
      ],
    },
  }
}

// ── Layout dispatcher ──

function buildSlideLayout(opts: CompositeOptions): Record<string, unknown> {
  const layout = opts.textLayout || 'bottom-stack'
  switch (layout) {
    case 'center-bold':
      return buildCenterBoldLayout(opts)
    case 'editorial-split':
      return buildEditorialSplitLayout(opts)
    case 'bottom-stack':
    default:
      return buildBottomStackLayout(opts)
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
