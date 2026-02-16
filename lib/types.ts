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
  reference?: string
  elements?: string[]
  layouts?: string[]
  cardStyle?: Record<string, string>
  imageGuidance?: string
  negativePrompt?: string
  layoutPreferences?: {
    first?: string
    last?: string
    middle?: string[]
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

// ── Design System Types (Creative Director Engine) ──

export interface PhotographyStyle {
  treatment: string
  subjects: string[]
  framing: string[]
  mood: string
}

export interface TypeLevel {
  style: string
  scale: string
  placement: string | string[]
  effects?: string[]
  usage?: string
}

export interface ChromeElement {
  element?: string
  left?: string
  right?: string
  style: string
}

export interface ColorApplication {
  photoOverlay?: string
  textPrimary: string
  textAccent: string
  backgroundFallback: string
}

export interface DesignSystem {
  photographyStyle: PhotographyStyle
  typographySystem: {
    headline: TypeLevel
    body: TypeLevel
    accent?: TypeLevel
  }
  repeatingChrome?: {
    topBar?: ChromeElement
    bottomBar?: ChromeElement
  }
  decorativeElements: string[]
  colorApplication: ColorApplication
  compositionVariations: string[]
  assetPalette: string[]
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
  designSystem?: DesignSystem
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
  compositionPrompt: string // Scene description for background image generation
  layout: string
  totalSlides: number
  tag?: string
  stepNumber?: number
  photographySubject?: string
  compositionVariation?: string
  accentWords?: string[]
  heroAsset?: string
  generatedImage?: string // Final composited image (background + text overlay)
  backgroundImage?: string // Raw background image without text (for re-compositing)
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

// ── Approved Images Types ──

export interface ApprovedImageMetadata {
  id: string
  brandSlug: string
  slideNumber: number
  headline: string
  subtext: string
  compositionPrompt: string
  engine: 'gemini' | 'openai'
  model?: string
  topic: string
  carouselTheme?: CarouselTheme
  globalDirection?: string
  aspectRatio: '1:1' | '9:16'
  approvedAt: string
  imagePath: string // relative path to the saved PNG
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
