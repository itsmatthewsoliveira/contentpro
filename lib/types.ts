// ── Brand Configuration Types ──

export interface BrandColors {
  primary: Record<string, string>
  secondary?: Record<string, string>
  accent: Record<string, string>
  text?: Record<string, string>
  neutral?: Record<string, string>
  meaning?: Record<string, string>
}

export interface BrandTypography {
  headlineFont: string
  headlineFontWeight: string
  subheadFont?: string
  subheadFontWeight?: string
  bodyFont: string
  bodyFontWeight: string
  accentFont?: string
  sizes: {
    heroHeadline: string
    slideHeadline: string
    subheadline: string
    body: string
    caption: string
  }
  style?: Record<string, unknown>
}

export interface BrandVisualStyle {
  aesthetic: string
  reference: string
  elements: string[]
  layouts: string[]
  cardStyle?: {
    background: string
    border: string
    borderRadius: string
    backdropBlur: string
    padding: string
  }
  photoTreatment?: {
    colorGrade: string
    style: string
    subjects: string[]
  }
}

export interface BrandContentVoice {
  tone: string
  perspective: string
  hooks: string[]
  ctaStyle: string
}

export interface PostType {
  description: string
  slideCount?: string
  structure?: string[]
  elements?: string[]
  style?: string
  topics?: string[]
}

export interface BrandConfig {
  name: string
  tagline: string
  website: string
  location?: string
  colors: BrandColors
  typography: BrandTypography
  visualStyle: BrandVisualStyle
  contentVoice: BrandContentVoice
  appIcons?: { name: string; icon: string }[]
  postTypes: Record<string, PostType>
  instagram: {
    dimensions: {
      square: { width: number; height: number }
      portrait: { width: number; height: number }
    }
    safeZones: { top: number; bottom: number; left: number; right: number }
  }
  services?: string[]
}

// ── Content Brief Types ──

export interface Slide {
  number: number
  purpose: string
  headline: string
  subtext: string
  bullets?: string[]
  cta?: string | null
  elements?: string[]
  imageDescription: string
  compositionPrompt: string // Full Nano Banana prompt for complete slide image
  layout: string
  totalSlides: number
  tag?: string
  stepNumber?: number
  generatedImage?: string // base64 data URL from Nano Banana
  backgroundImage?: string // user-uploaded background (legacy/override)
}

export interface BriefStrategy {
  goal: string
  targetAudience: string
  hook: string
  callToAction: string
}

export interface CarouselTheme {
  artDirection: string
  lighting: string
  framing: string
  textureMotif: string
  consistencyAnchor: string
}

export interface Brief {
  meta: {
    brand: string
    topic: string
    postType: string
    generatedAt: string
    slideCount: number
  }
  brandContext: {
    colors: BrandColors
    typography: BrandTypography
    visualStyle: BrandVisualStyle
  }
  strategy: BriefStrategy
  carouselTheme?: CarouselTheme
  slides: Slide[]
  caption: string
  hashtags: string[]
  imageSource: string
}

// ── UI State Types ──

export type GenerationStatus = 'idle' | 'generating' | 'complete' | 'error'
export type ImageStatus = 'idle' | 'generating' | 'complete' | 'error'

export interface WorkspaceState {
  brand: BrandConfig | null
  brandSlug: string
  topic: string
  postType: string
  slideCount: number
  brief: Brief | null
  generationStatus: GenerationStatus
  imageStatus: ImageStatus
  error: string | null
}
