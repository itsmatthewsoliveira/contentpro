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
  const headlineMap: Record<string, string> = { 'Anton': 'Anton-Regular', 'Playfair Display': 'PlayfairDisplay-Bold' }
  const bodyMap: Record<string, { regular: string; semibold: string; bold: string }> = {
    'Inter': { regular: 'Inter-Regular', semibold: 'Inter-SemiBold', bold: 'Inter-Bold' },
    'Montserrat': { regular: 'Montserrat-Regular', semibold: 'Montserrat-SemiBold', bold: 'Montserrat-SemiBold' },
  }
  const hlKey = headlineMap[brandFonts.headline] || 'Anton-Regular'
  if (fontBuffers[hlKey]) fonts.push({ name: brandFonts.headline, data: fontBuffers[hlKey], weight: 400, style: 'normal' })
  const bodyEntry = bodyMap[brandFonts.body] || bodyMap['Inter']
  if (bodyEntry) {
    if (fontBuffers[bodyEntry.regular]) fonts.push({ name: brandFonts.body, data: fontBuffers[bodyEntry.regular], weight: 400, style: 'normal' })
    if (fontBuffers[bodyEntry.semibold]) fonts.push({ name: brandFonts.body, data: fontBuffers[bodyEntry.semibold], weight: 600, style: 'normal' })
    if (fontBuffers[bodyEntry.bold]) fonts.push({ name: brandFonts.body, data: fontBuffers[bodyEntry.bold], weight: 700, style: 'normal' })
  }
  return fonts
}

// ── Layout Type + Metadata ──

export type TextLayout =
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'center' | 'center-left' | 'center-right'
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-mega' | 'center-compact'
  | 'editorial-split' | 'editorial-reverse'
  | 'bottom-bar' | 'top-bar'
  | 'glass-card-center' | 'glass-card-bottom'
  | 'diagonal' | 'stacked-full'
  | 'minimal-bottom' | 'minimal-center' | 'minimal-top'
  | 'cinema-wide' | 'vertical-strip'
  | 'quote-style' | 'stat-hero'

interface LayoutMeta { name: string; category: string }

export const TEXT_LAYOUTS: Record<TextLayout, LayoutMeta> = {
  'bottom-left':       { name: 'Bottom Left',       category: 'Position' },
  'bottom-center':     { name: 'Bottom Center',     category: 'Position' },
  'bottom-right':      { name: 'Bottom Right',      category: 'Position' },
  'center':            { name: 'Center',             category: 'Position' },
  'center-left':       { name: 'Center Left',       category: 'Position' },
  'center-right':      { name: 'Center Right',      category: 'Position' },
  'top-left':          { name: 'Top Left',           category: 'Position' },
  'top-center':        { name: 'Top Center',         category: 'Position' },
  'top-right':         { name: 'Top Right',          category: 'Position' },
  'center-mega':       { name: 'Mega Center',        category: 'Scale' },
  'center-compact':    { name: 'Compact Center',     category: 'Scale' },
  'editorial-split':   { name: 'Editorial',          category: 'Editorial' },
  'editorial-reverse': { name: 'Editorial Reverse',  category: 'Editorial' },
  'bottom-bar':        { name: 'Bottom Bar',         category: 'Bar' },
  'top-bar':           { name: 'Top Bar',            category: 'Bar' },
  'glass-card-center': { name: 'Glass Center',       category: 'Card' },
  'glass-card-bottom': { name: 'Glass Bottom',       category: 'Card' },
  'diagonal':          { name: 'Diagonal',           category: 'Creative' },
  'stacked-full':      { name: 'Full Stack',         category: 'Creative' },
  'minimal-bottom':    { name: 'Minimal Bottom',     category: 'Minimal' },
  'minimal-center':    { name: 'Minimal Center',     category: 'Minimal' },
  'minimal-top':       { name: 'Minimal Top',        category: 'Minimal' },
  'cinema-wide':       { name: 'Cinema',             category: 'Creative' },
  'vertical-strip':    { name: 'Vertical Strip',     category: 'Creative' },
  'quote-style':       { name: 'Quote',              category: 'Special' },
  'stat-hero':         { name: 'Stat Hero',          category: 'Special' },
}

// ── Core Types ──

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
    text: string
    accent: string
    subtext: string
    muted: string
  }
  chrome?: { topLeft?: string; topRight?: string }
}

export interface CompositeOptions {
  backgroundBase64: string
  backgroundMimeType?: string
  text: TextOverlayInput
  brand: BrandStyle
  aspectRatio: '1:1' | '4:5' | '9:16'
  textLayout?: TextLayout
}

// ── Helpers ──

function getHeight(ar: string): number {
  return ar === '9:16' ? 1920 : ar === '4:5' ? 1350 : 1080
}

function scaleFor(ar: string, base: number, portrait: number, story: number): number {
  return ar === '9:16' ? story : ar === '4:5' ? portrait : base
}

function buildHeadlineElements(headline: string, accentWords: string[], textColor: string, accentColor: string) {
  const clean = headline.replace(/\*/g, '')
  const words = clean.split(/\s+/)
  const accentSet = new Set(accentWords.map(w => w.toLowerCase().replace(/\*/g, '')))
  return words.map((word) => ({
    type: 'span' as const,
    props: { style: { color: accentSet.has(word.toLowerCase()) ? accentColor : textColor }, children: word + ' ' },
  }))
}

function chromeBar(brand: BrandStyle, pad: { x: number; top: number }): Record<string, unknown> | null {
  if (!brand.chrome?.topLeft && !brand.chrome?.topRight) return null
  return {
    type: 'div', props: {
      style: { display: 'flex', justifyContent: 'space-between', width: '100%', position: 'absolute', top: pad.top, left: pad.x, right: pad.x, paddingRight: pad.x * 2 },
      children: [
        brand.chrome?.topLeft ? { type: 'span', props: { style: { fontFamily: brand.bodyFont, fontSize: 11, color: brand.colors.muted, letterSpacing: '0.15em', textTransform: 'uppercase' as const, fontWeight: 500 }, children: brand.chrome.topLeft } } : null,
        brand.chrome?.topRight ? { type: 'span', props: { style: { fontFamily: brand.bodyFont, fontSize: 11, color: brand.colors.muted, letterSpacing: '0.15em', textTransform: 'uppercase' as const, fontWeight: 500 }, children: brand.chrome.topRight } } : null,
      ].filter(Boolean),
    },
  }
}

function ctaEl(cta: string, brand: BrandStyle, size: number, align?: string): Record<string, unknown> {
  return {
    type: 'div', props: {
      style: { display: 'flex', marginTop: 24, justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' },
      children: [{ type: 'div', props: {
        style: { fontFamily: brand.bodyFont, fontSize: size, color: brand.colors.text, border: `1px solid ${brand.colors.accent}`, borderRadius: 999, padding: '10px 28px', fontWeight: 600, letterSpacing: '0.02em' },
        children: cta,
      }}],
    },
  }
}

function labelEl(text: string, brand: BrandStyle, size: number, align?: string): Record<string, unknown> {
  return {
    type: 'div', props: {
      style: { fontFamily: brand.bodyFont, fontSize: size, color: brand.colors.accent, letterSpacing: '0.15em', textTransform: 'uppercase' as const, fontWeight: 600, marginBottom: 12, textAlign: (align || 'left') as any },
      children: text.toUpperCase(),
    },
  }
}

function headlineEl(words: ReturnType<typeof buildHeadlineElements>, brand: BrandStyle, size: number, opts: { align?: string; maxW?: string; uppercase?: boolean } = {}): Record<string, unknown> {
  return {
    type: 'div', props: {
      style: { fontFamily: brand.headlineFont, fontSize: size, lineHeight: 1.0, textTransform: (opts.uppercase !== false ? 'uppercase' : 'none') as any, display: 'flex', flexWrap: 'wrap' as const, justifyContent: opts.align === 'center' ? 'center' : opts.align === 'right' ? 'flex-end' : 'flex-start', maxWidth: opts.maxW || '90%' },
      children: words,
    },
  }
}

function subtextEl(text: string, brand: BrandStyle, size: number, opts: { align?: string; maxW?: string; mt?: number } = {}): Record<string, unknown> {
  return {
    type: 'div', props: {
      style: { fontFamily: brand.bodyFont, fontSize: size, color: brand.colors.subtext, marginTop: opts.mt ?? 16, fontWeight: 400, maxWidth: opts.maxW || '80%', lineHeight: 1.4, textAlign: (opts.align || 'left') as any, marginLeft: opts.align === 'right' ? 'auto' : undefined },
      children: text,
    },
  }
}

// ── Parametric Layout Builder ──
// Most layouts share the same structure: a container with positioned children.
// We parameterize: justifyContent, alignItems, gradient, padding, text alignment, headline scale.

interface LayoutParams {
  justify: string       // flex-start, center, flex-end
  align: string         // flex-start, center, flex-end
  textAlign: string     // left, center, right
  gradient: string      // CSS gradient for overlay
  hlScale: number       // headline multiplier (1.0 = default)
  stScale: number       // subtext multiplier
  maxHlW: string        // headline max-width
  maxStW: string        // subtext max-width
  padTop: number
  padBottom: number
}

function parametricLayout(opts: CompositeOptions, params: LayoutParams): Record<string, unknown> {
  const { text, brand, aspectRatio } = opts
  const w = 1080
  const h = getHeight(aspectRatio)
  const px = 60
  const baseHl = scaleFor(aspectRatio, 64, 68, 72)
  const baseSt = scaleFor(aspectRatio, 20, 22, 24)
  const baseCta = scaleFor(aspectRatio, 18, 19, 20)

  const hlSize = Math.round(baseHl * params.hlScale)
  const stSize = Math.round(baseSt * params.stScale)

  const words = buildHeadlineElements(text.headline, text.accentWords || [], brand.colors.text, brand.colors.accent)
  const children: Record<string, unknown>[] = []

  const chrome = chromeBar(brand, { x: px, top: 50 })
  if (chrome) children.push(chrome)

  if (text.purpose) children.push(labelEl(text.purpose, brand, 12, params.textAlign))
  children.push(headlineEl(words, brand, hlSize, { align: params.textAlign, maxW: params.maxHlW }))
  if (text.subtext) children.push(subtextEl(text.subtext, brand, stSize, { align: params.textAlign, maxW: params.maxStW }))
  if (text.cta) children.push(ctaEl(text.cta, brand, baseCta, params.textAlign))

  return {
    type: 'div', props: {
      style: { width: w, height: h, display: 'flex', flexDirection: 'column', justifyContent: params.justify, alignItems: params.align, padding: `${params.padTop}px ${px}px ${params.padBottom}px ${px}px`, background: params.gradient },
      children,
    },
  }
}

// ── Special Layouts ──

function editorialSplitLayout(opts: CompositeOptions, reverse: boolean): Record<string, unknown> {
  const { text, brand, aspectRatio } = opts
  const w = 1080; const h = getHeight(aspectRatio); const px = 60
  const hlSize = scaleFor(aspectRatio, 52, 58, 64)
  const stSize = scaleFor(aspectRatio, 16, 18, 20)
  const ctaSize = scaleFor(aspectRatio, 16, 17, 18)

  const words = buildHeadlineElements(text.headline, text.accentWords || [], brand.colors.text, brand.colors.accent)
  const topChildren: Record<string, unknown>[] = []
  const bottomChildren: Record<string, unknown>[] = []

  const hlAlign = reverse ? 'right' : 'left'
  const stAlign = reverse ? 'left' : 'right'

  if (text.purpose) topChildren.push(labelEl(text.purpose, brand, 10, hlAlign))
  topChildren.push(headlineEl(words, brand, hlSize, { align: hlAlign, maxW: '65%' }))
  if (text.subtext) bottomChildren.push(subtextEl(text.subtext, brand, stSize, { align: stAlign, maxW: '55%' }))
  if (text.cta) bottomChildren.push(ctaEl(text.cta, brand, ctaSize, stAlign))

  const chrome = chromeBar(brand, { x: px, top: 50 })

  return {
    type: 'div', props: {
      style: { width: w, height: h, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: `80px ${px}px 50px ${px}px`, background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0.7) 100%)' },
      children: [
        ...(chrome ? [chrome] : []),
        { type: 'div', props: { style: { display: 'flex', flexDirection: 'column', alignItems: reverse ? 'flex-end' : 'flex-start' }, children: topChildren } },
        { type: 'div', props: { style: { display: 'flex', flexDirection: 'column', alignItems: reverse ? 'flex-start' : 'flex-end' }, children: bottomChildren } },
      ],
    },
  }
}

function glassCardLayout(opts: CompositeOptions, position: 'center' | 'bottom'): Record<string, unknown> {
  const { text, brand, aspectRatio } = opts
  const w = 1080; const h = getHeight(aspectRatio)
  const hlSize = scaleFor(aspectRatio, 56, 60, 64)
  const stSize = scaleFor(aspectRatio, 18, 20, 22)
  const ctaSize = scaleFor(aspectRatio, 16, 17, 18)

  const words = buildHeadlineElements(text.headline, text.accentWords || [], brand.colors.text, brand.colors.accent)
  const cardChildren: Record<string, unknown>[] = []

  if (text.purpose) cardChildren.push(labelEl(text.purpose, brand, 11, 'center'))
  cardChildren.push(headlineEl(words, brand, hlSize, { align: 'center', maxW: '100%' }))
  if (text.subtext) cardChildren.push(subtextEl(text.subtext, brand, stSize, { align: 'center', maxW: '100%', mt: 20 }))
  if (text.cta) cardChildren.push(ctaEl(text.cta, brand, ctaSize, 'center'))

  const card: Record<string, unknown> = {
    type: 'div', props: {
      style: { display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(20px)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', padding: '40px 48px', maxWidth: 800 },
      children: cardChildren,
    },
  }

  const chrome = chromeBar(brand, { x: 60, top: 50 })

  return {
    type: 'div', props: {
      style: { width: w, height: h, display: 'flex', flexDirection: 'column', justifyContent: position === 'center' ? 'center' : 'flex-end', alignItems: 'center', padding: position === 'center' ? '60px' : '60px 60px 80px 60px' },
      children: [...(chrome ? [chrome] : []), card],
    },
  }
}

function barLayout(opts: CompositeOptions, position: 'top' | 'bottom'): Record<string, unknown> {
  const { text, brand, aspectRatio } = opts
  const w = 1080; const h = getHeight(aspectRatio)
  const hlSize = scaleFor(aspectRatio, 48, 52, 56)
  const stSize = scaleFor(aspectRatio, 16, 18, 20)
  const ctaSize = scaleFor(aspectRatio, 15, 16, 17)
  const barHeight = position === 'top' ? Math.round(h * 0.3) : Math.round(h * 0.35)

  const words = buildHeadlineElements(text.headline, text.accentWords || [], brand.colors.text, brand.colors.accent)
  const barChildren: Record<string, unknown>[] = []

  if (text.purpose) barChildren.push(labelEl(text.purpose, brand, 10, 'left'))
  barChildren.push(headlineEl(words, brand, hlSize, { maxW: '90%' }))
  if (text.subtext) barChildren.push(subtextEl(text.subtext, brand, stSize, { maxW: '85%' }))
  if (text.cta) barChildren.push(ctaEl(text.cta, brand, ctaSize))

  const bar: Record<string, unknown> = {
    type: 'div', props: {
      style: { display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', padding: '40px 60px', width: '100%', height: barHeight },
      children: barChildren,
    },
  }

  return {
    type: 'div', props: {
      style: { width: w, height: h, display: 'flex', flexDirection: 'column', justifyContent: position === 'top' ? 'flex-start' : 'flex-end' },
      children: [bar],
    },
  }
}

function cinemaLayout(opts: CompositeOptions): Record<string, unknown> {
  const { text, brand, aspectRatio } = opts
  const w = 1080; const h = getHeight(aspectRatio)
  const hlSize = scaleFor(aspectRatio, 60, 64, 72)
  const stSize = scaleFor(aspectRatio, 18, 20, 22)
  const ctaSize = scaleFor(aspectRatio, 16, 17, 18)
  const barH = 200

  const words = buildHeadlineElements(text.headline, text.accentWords || [], brand.colors.text, brand.colors.accent)
  const children: Record<string, unknown>[] = []

  children.push(headlineEl(words, brand, hlSize, { align: 'center', maxW: '80%' }))
  if (text.subtext) children.push(subtextEl(text.subtext, brand, stSize, { align: 'center', maxW: '70%', mt: 20 }))
  if (text.cta) children.push(ctaEl(text.cta, brand, ctaSize, 'center'))

  return {
    type: 'div', props: {
      style: { width: w, height: h, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px',
        background: `linear-gradient(to bottom, rgba(0,0,0,0.85) 0px, rgba(0,0,0,0.85) ${barH}px, rgba(0,0,0,0.0) ${barH}px, rgba(0,0,0,0.0) ${h - barH}px, rgba(0,0,0,0.85) ${h - barH}px, rgba(0,0,0,0.85) ${h}px)` },
      children,
    },
  }
}

function verticalStripLayout(opts: CompositeOptions): Record<string, unknown> {
  const { text, brand, aspectRatio } = opts
  const w = 1080; const h = getHeight(aspectRatio)
  const hlSize = scaleFor(aspectRatio, 52, 56, 60)
  const stSize = scaleFor(aspectRatio, 16, 18, 20)
  const ctaSize = scaleFor(aspectRatio, 15, 16, 17)

  const words = buildHeadlineElements(text.headline, text.accentWords || [], brand.colors.text, brand.colors.accent)
  const children: Record<string, unknown>[] = []

  if (text.purpose) children.push(labelEl(text.purpose, brand, 10, 'left'))
  children.push(headlineEl(words, brand, hlSize, { maxW: '100%' }))
  if (text.subtext) children.push(subtextEl(text.subtext, brand, stSize, { maxW: '100%' }))
  if (text.cta) children.push(ctaEl(text.cta, brand, ctaSize))

  return {
    type: 'div', props: {
      style: { width: w, height: h, display: 'flex', flexDirection: 'row' },
      children: [{
        type: 'div', props: {
          style: { width: Math.round(w * 0.42), height: h, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 40px 60px 50px' },
          children,
        },
      }],
    },
  }
}

function quoteLayout(opts: CompositeOptions): Record<string, unknown> {
  const { text, brand, aspectRatio } = opts
  const w = 1080; const h = getHeight(aspectRatio)
  const hlSize = scaleFor(aspectRatio, 52, 56, 60)
  const stSize = scaleFor(aspectRatio, 18, 20, 22)
  const ctaSize = scaleFor(aspectRatio, 16, 17, 18)

  const words = buildHeadlineElements(text.headline, text.accentWords || [], brand.colors.text, brand.colors.accent)
  const children: Record<string, unknown>[] = []

  // Large quotation mark
  children.push({ type: 'div', props: { style: { fontFamily: brand.headlineFont, fontSize: 160, color: brand.colors.accent, lineHeight: 0.6, marginBottom: 16, opacity: 0.6 }, children: '\u201C' } })
  children.push(headlineEl(words, brand, hlSize, { uppercase: false, maxW: '85%' }))
  if (text.subtext) children.push(subtextEl(text.subtext, brand, stSize, { mt: 24, maxW: '70%' }))
  if (text.cta) children.push(ctaEl(text.cta, brand, ctaSize))

  return {
    type: 'div', props: {
      style: { width: w, height: h, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.75) 100%)' },
      children,
    },
  }
}

function statHeroLayout(opts: CompositeOptions): Record<string, unknown> {
  const { text, brand, aspectRatio } = opts
  const w = 1080; const h = getHeight(aspectRatio)
  const statSize = scaleFor(aspectRatio, 120, 130, 140)
  const stSize = scaleFor(aspectRatio, 20, 22, 24)
  const ctaSize = scaleFor(aspectRatio, 16, 17, 18)

  // Try to extract a number/stat from headline
  const headline = text.headline.replace(/\*/g, '')

  const children: Record<string, unknown>[] = []

  if (text.purpose) children.push(labelEl(text.purpose, brand, 11, 'center'))
  // Headline as massive stat
  children.push({ type: 'div', props: { style: { fontFamily: brand.headlineFont, fontSize: statSize, lineHeight: 0.9, color: brand.colors.accent, textAlign: 'center' as any, textTransform: 'uppercase' as any }, children: headline } })
  if (text.subtext) children.push(subtextEl(text.subtext, brand, stSize, { align: 'center', maxW: '70%', mt: 24 }))
  if (text.cta) children.push(ctaEl(text.cta, brand, ctaSize, 'center'))

  return {
    type: 'div', props: {
      style: { width: w, height: h, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.8) 100%)' },
      children,
    },
  }
}

function diagonalLayout(opts: CompositeOptions): Record<string, unknown> {
  const { text, brand, aspectRatio } = opts
  const w = 1080; const h = getHeight(aspectRatio)
  const hlSize = scaleFor(aspectRatio, 56, 60, 64)
  const stSize = scaleFor(aspectRatio, 16, 18, 20)
  const ctaSize = scaleFor(aspectRatio, 15, 16, 17)

  const words = buildHeadlineElements(text.headline, text.accentWords || [], brand.colors.text, brand.colors.accent)
  const topChildren: Record<string, unknown>[] = []
  const bottomChildren: Record<string, unknown>[] = []

  if (text.purpose) topChildren.push(labelEl(text.purpose, brand, 10, 'left'))
  topChildren.push(headlineEl(words, brand, hlSize, { maxW: '60%' }))
  if (text.subtext) bottomChildren.push(subtextEl(text.subtext, brand, stSize, { align: 'right', maxW: '50%' }))
  if (text.cta) bottomChildren.push(ctaEl(text.cta, brand, ctaSize, 'right'))

  const chrome = chromeBar(brand, { x: 60, top: 40 })

  return {
    type: 'div', props: {
      style: { width: w, height: h, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '80px 60px 60px 60px',
        background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.8) 100%)' },
      children: [
        ...(chrome ? [chrome] : []),
        { type: 'div', props: { style: { display: 'flex', flexDirection: 'column' }, children: topChildren } },
        { type: 'div', props: { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }, children: bottomChildren } },
      ],
    },
  }
}

function stackedFullLayout(opts: CompositeOptions): Record<string, unknown> {
  const { text, brand, aspectRatio } = opts
  const w = 1080; const h = getHeight(aspectRatio)
  const hlSize = scaleFor(aspectRatio, 72, 78, 84)
  const stSize = scaleFor(aspectRatio, 20, 22, 24)
  const ctaSize = scaleFor(aspectRatio, 18, 19, 20)

  const words = buildHeadlineElements(text.headline, text.accentWords || [], brand.colors.text, brand.colors.accent)
  const children: Record<string, unknown>[] = []

  if (text.purpose) children.push(labelEl(text.purpose, brand, 12, 'left'))
  children.push(headlineEl(words, brand, hlSize, { maxW: '95%' }))
  // Accent line
  children.push({ type: 'div', props: { style: { width: 60, height: 3, background: brand.colors.accent, marginTop: 24, marginBottom: 8, borderRadius: 2 }, children: '' } })
  if (text.subtext) children.push(subtextEl(text.subtext, brand, stSize, { maxW: '85%', mt: 16 }))
  if (text.cta) children.push(ctaEl(text.cta, brand, ctaSize))

  return {
    type: 'div', props: {
      style: { width: w, height: h, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 60px', background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.1) 100%)' },
      children,
    },
  }
}

// ── Layout Dispatcher ──

function buildSlideLayout(opts: CompositeOptions): Record<string, unknown> {
  const layout = opts.textLayout || 'bottom-left'
  const grad = {
    btm: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.0) 70%)',
    top: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.0) 70%)',
    rad: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.75) 100%)',
    radSoft: 'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.6) 100%)',
    none: 'transparent',
  }

  switch (layout) {
    // ── Position variants ──
    case 'bottom-left':
      return parametricLayout(opts, { justify: 'flex-end', align: 'flex-start', textAlign: 'left', gradient: grad.btm, hlScale: 1, stScale: 1, maxHlW: '90%', maxStW: '80%', padTop: 50, padBottom: 50 })
    case 'bottom-center':
      return parametricLayout(opts, { justify: 'flex-end', align: 'center', textAlign: 'center', gradient: grad.btm, hlScale: 1, stScale: 1, maxHlW: '85%', maxStW: '75%', padTop: 50, padBottom: 50 })
    case 'bottom-right':
      return parametricLayout(opts, { justify: 'flex-end', align: 'flex-end', textAlign: 'right', gradient: grad.btm, hlScale: 1, stScale: 1, maxHlW: '85%', maxStW: '75%', padTop: 50, padBottom: 50 })
    case 'center':
      return parametricLayout(opts, { justify: 'center', align: 'center', textAlign: 'center', gradient: grad.rad, hlScale: 1.15, stScale: 1, maxHlW: '85%', maxStW: '70%', padTop: 50, padBottom: 50 })
    case 'center-left':
      return parametricLayout(opts, { justify: 'center', align: 'flex-start', textAlign: 'left', gradient: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.0) 100%)', hlScale: 1.05, stScale: 1, maxHlW: '70%', maxStW: '65%', padTop: 50, padBottom: 50 })
    case 'center-right':
      return parametricLayout(opts, { justify: 'center', align: 'flex-end', textAlign: 'right', gradient: 'linear-gradient(to left, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.0) 100%)', hlScale: 1.05, stScale: 1, maxHlW: '70%', maxStW: '65%', padTop: 50, padBottom: 50 })
    case 'top-left':
      return parametricLayout(opts, { justify: 'flex-start', align: 'flex-start', textAlign: 'left', gradient: grad.top, hlScale: 1, stScale: 1, maxHlW: '85%', maxStW: '75%', padTop: 80, padBottom: 50 })
    case 'top-center':
      return parametricLayout(opts, { justify: 'flex-start', align: 'center', textAlign: 'center', gradient: grad.top, hlScale: 1, stScale: 1, maxHlW: '85%', maxStW: '70%', padTop: 80, padBottom: 50 })
    case 'top-right':
      return parametricLayout(opts, { justify: 'flex-start', align: 'flex-end', textAlign: 'right', gradient: grad.top, hlScale: 1, stScale: 1, maxHlW: '80%', maxStW: '70%', padTop: 80, padBottom: 50 })

    // ── Scale variants ──
    case 'center-mega':
      return parametricLayout(opts, { justify: 'center', align: 'center', textAlign: 'center', gradient: grad.rad, hlScale: 1.5, stScale: 1.1, maxHlW: '90%', maxStW: '70%', padTop: 50, padBottom: 50 })
    case 'center-compact':
      return parametricLayout(opts, { justify: 'center', align: 'center', textAlign: 'center', gradient: grad.radSoft, hlScale: 0.75, stScale: 0.85, maxHlW: '70%', maxStW: '60%', padTop: 50, padBottom: 50 })

    // ── Editorial ──
    case 'editorial-split':
      return editorialSplitLayout(opts, false)
    case 'editorial-reverse':
      return editorialSplitLayout(opts, true)

    // ── Bar ──
    case 'bottom-bar':
      return barLayout(opts, 'bottom')
    case 'top-bar':
      return barLayout(opts, 'top')

    // ── Glass Card ──
    case 'glass-card-center':
      return glassCardLayout(opts, 'center')
    case 'glass-card-bottom':
      return glassCardLayout(opts, 'bottom')

    // ── Creative ──
    case 'diagonal':
      return diagonalLayout(opts)
    case 'stacked-full':
      return stackedFullLayout(opts)
    case 'cinema-wide':
      return cinemaLayout(opts)
    case 'vertical-strip':
      return verticalStripLayout(opts)

    // ── Minimal (no gradient, just subtle shadow via text-shadow) ──
    case 'minimal-bottom':
      return parametricLayout(opts, { justify: 'flex-end', align: 'flex-start', textAlign: 'left', gradient: grad.none, hlScale: 0.9, stScale: 0.85, maxHlW: '80%', maxStW: '70%', padTop: 50, padBottom: 60 })
    case 'minimal-center':
      return parametricLayout(opts, { justify: 'center', align: 'center', textAlign: 'center', gradient: grad.none, hlScale: 0.9, stScale: 0.85, maxHlW: '75%', maxStW: '65%', padTop: 50, padBottom: 50 })
    case 'minimal-top':
      return parametricLayout(opts, { justify: 'flex-start', align: 'flex-start', textAlign: 'left', gradient: grad.none, hlScale: 0.9, stScale: 0.85, maxHlW: '80%', maxStW: '70%', padTop: 80, padBottom: 50 })

    // ── Special ──
    case 'quote-style':
      return quoteLayout(opts)
    case 'stat-hero':
      return statHeroLayout(opts)

    default:
      return parametricLayout(opts, { justify: 'flex-end', align: 'flex-start', textAlign: 'left', gradient: grad.btm, hlScale: 1, stScale: 1, maxHlW: '90%', maxStW: '80%', padTop: 50, padBottom: 50 })
  }
}

// ── Main composite function ──

export async function compositeTextOnImage(opts: CompositeOptions): Promise<{ imageBase64: string; mimeType: string }> {
  const width = 1080
  const height = getHeight(opts.aspectRatio)

  const layout = buildSlideLayout(opts)
  const fonts = getSatoriFonts({ headline: opts.brand.headlineFont, body: opts.brand.bodyFont })

  const svg = await satori(layout as unknown as React.ReactElement, { width, height, fonts: fonts as any })
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } })
  const textPng = resvg.render().asPng()

  const bgBuffer = Buffer.from(opts.backgroundBase64, 'base64')

  const result = await sharp(bgBuffer)
    .resize(width, height, { fit: 'cover' })
    .composite([{ input: textPng, top: 0, left: 0, blend: 'over' }])
    .png()
    .toBuffer()

  return { imageBase64: result.toString('base64'), mimeType: 'image/png' }
}
