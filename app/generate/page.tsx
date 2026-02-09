'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { BrandConfig, Brief, Slide } from '@/lib/types'
import { overlayLogo } from '@/lib/logo-overlay'
import TopicInput from '@/components/TopicInput'
import ExportButton from '@/components/ExportButton'
import StyleReferences from '@/components/StyleReferences'

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black">
          <span className="animate-spin inline-block w-5 h-5 border-2 border-white/15 border-t-white/50 rounded-full" />
        </div>
      }
    >
      <GenerateWorkspace />
    </Suspense>
  )
}

function GenerateWorkspace() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const brandSlug = searchParams.get('brand') || ''

  // Core state
  const [brand, setBrand] = useState<BrandConfig | null>(null)
  const [brief, setBrief] = useState<Brief | null>(null)
  const [selectedSlide, setSelectedSlide] = useState<number>(0)

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingStep, setGeneratingStep] = useState('')
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [imageProgress, setImageProgress] = useState(0)

  // Settings
  const [imageEngine, setImageEngine] = useState<'gemini' | 'openai'>('gemini')
  const [imageModel, setImageModel] = useState<'pro' | 'flash'>('pro')
  // Smart default for global direction based on brand
  const getDefaultDirection = (slug: string) => {
    if (slug === 'servicegrowth-ai') {
      return 'Match the reference style exactly. Premium tech editorial aesthetic. Dark, cinematic, sophisticated. Each slide should feel like part of the same campaign but with creative variation in composition.'
    }
    return 'Match the reference style exactly. Luxury editorial aesthetic. Warm, aspirational, magazine-quality. Each slide should feel like part of the same campaign but with creative variation in composition.'
  }
  const [globalDirection, setGlobalDirection] = useState('')

  // Set default direction when brand loads
  useEffect(() => {
    if (brandSlug && !globalDirection) {
      setGlobalDirection(getDefaultDirection(brandSlug))
    }
  }, [brandSlug])

  // Errors
  const [error, setError] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<number, string>>({})

  // Workflow phase: 'copy' | 'image'
  const [phase, setPhase] = useState<'copy' | 'image'>('copy')

  useEffect(() => {
    if (!brandSlug) { router.push('/'); return }
    fetch(`/api/brands?slug=${brandSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.push('/'); return }
        setBrand(data.config)
      })
  }, [brandSlug, router])

  const isServiceGrowth = brandSlug === 'servicegrowth-ai'
  const accentColor = brand
    ? isServiceGrowth
      ? brand.colors.accent?.cyan || '#00D4FF'
      : brand.colors.accent?.gold || '#C9A227'
    : '#00D4FF'

  // Phase 1: Generate copy
  const handleGenerateCopy = async (topic: string, postType: string, slideCount: number) => {
    setIsGenerating(true)
    setGeneratingStep('Writing headlines, subtext, and bullets...')
    setError(null)
    setImageErrors({})
    setBrief(null)
    setSelectedSlide(0)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandSlug, topic, postType, slideCount }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setBrief(data)
      setPhase('image') // Move to image phase
      setGeneratingStep('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }


  // Build a slide-specific prompt from global direction + slide context
  const buildSlidePrompt = (slide: Slide, slideIndex: number, total: number) => {
    const headline = slide.headline?.replace(/\*/g, '') || ''
    const subtext = slide.subtext || ''
    const purpose = slide.purpose || ''

    // Slide position context
    let positionContext = ''
    if (slideIndex === 0) {
      positionContext = 'This is the OPENING HOOK slide — grab attention, create intrigue.'
    } else if (slideIndex === total - 1) {
      positionContext = 'This is the FINAL CTA slide — clear call to action, confident energy.'
    } else {
      positionContext = `Slide ${slideIndex + 1} of ${total} — ${purpose}.`
    }

    return `${positionContext}

SLIDE CONTENT:
Headline: "${headline}"
${subtext ? `Supporting text: "${subtext}"` : ''}

Create a visually compelling Instagram slide that communicates this message. Use creative typography, intentional composition, and premium design quality. Make it feel like part of a cohesive carousel while having its own unique visual approach.`
  }

  // Phase 2: Generate images
  const handleGenerateImages = async () => {
    if (!brief || !brand) return
    setIsGeneratingImages(true)
    setImageProgress(0)
    setImageErrors({})

    const apiEndpoint = imageEngine === 'openai' ? '/api/images-openai' : '/api/images'
    const updatedSlides = [...brief.slides]
    const totalSlides = updatedSlides.length

    for (let i = 0; i < updatedSlides.length; i++) {
      const slide = updatedSlides[i]

      // Build prompt: global direction is the creative approach, slide context is the specific content
      const slidePrompt = buildSlidePrompt(slide, i, totalSlides)

      setImageProgress(i + 1)
      try {
        const res = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            compositionPrompt: slidePrompt,
            customPrompt: globalDirection || undefined,
            model: imageModel,
            brandSlug,
            topic: brief.meta.topic,
            slideHeadline: slide.headline,
          }),
        })
        const data = await res.json()
        if (!res.ok || data.error) {
          throw new Error(data.error || `Generation failed`)
        }

        if (data.imageBase64) {
          const finalImage = `data:${data.mimeType || 'image/png'};base64,${data.imageBase64}`
          updatedSlides[i] = { ...slide, generatedImage: finalImage }
          setImageErrors((prev) => {
            const next = { ...prev }
            delete next[slide.number]
            return next
          })
          setBrief({ ...brief, slides: [...updatedSlides] })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setImageErrors((prev) => ({ ...prev, [slide.number]: message }))
      }
    }

    setIsGeneratingImages(false)
    setImageProgress(0)
  }

  // Regenerate single slide
  const handleRegenerateSlide = useCallback(async (slideNumber: number) => {
    if (!brief || !brand) return
    const slideIndex = slideNumber - 1
    const slide = brief.slides[slideIndex]
    if (!slide) return

    const apiEndpoint = imageEngine === 'openai' ? '/api/images-openai' : '/api/images'
    const slidePrompt = buildSlidePrompt(slide, slideIndex, brief.slides.length)

    setIsGeneratingImages(true)
    setImageProgress(slideNumber)

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compositionPrompt: slidePrompt,
          customPrompt: globalDirection || undefined,
          model: imageModel,
          brandSlug,
          topic: brief.meta.topic,
          slideHeadline: slide.headline,
        }),
      })
      const data = await res.json()
      if (data.imageBase64) {
        const finalImage = `data:${data.mimeType || 'image/png'};base64,${data.imageBase64}`
        const updatedSlides = brief.slides.map(s =>
          s.number === slideNumber ? { ...s, generatedImage: finalImage } : s
        )
        setBrief({ ...brief, slides: updatedSlides })
      }
    } catch (err) {
      console.error('Regenerate failed:', err)
    } finally {
      setIsGeneratingImages(false)
      setImageProgress(0)
    }
  }, [brief, brand, brandSlug, isServiceGrowth, imageEngine, imageModel, globalDirection])

  // Update slide copy
  const handleSlideUpdate = useCallback((updated: Slide) => {
    if (!brief) return
    const slides = brief.slides.map((s) => s.number === updated.number ? updated : s)
    setBrief({ ...brief, slides })
  }, [brief])

  if (!brand) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <span className="animate-spin inline-block w-5 h-5 border-2 border-white/15 border-t-white/50 rounded-full" />
      </div>
    )
  }

  const currentSlide = brief?.slides[selectedSlide]

  return (
    <main className="min-h-screen bg-black">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-[#050510] to-black" />
      <div
        className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.02] blur-[150px]"
        style={{ background: accentColor }}
      />

      <div className="relative z-10">
        {/* Top Navigation */}
        <header className="border-b border-white/[0.06] px-6 py-4">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-white/30 hover:text-white/60 text-xs transition-colors cursor-pointer"
              >
                ← Back
              </button>
              <div className="w-px h-5 bg-white/10" />
              <div className="flex items-center gap-3">
                <img
                  src={`/brands/${brandSlug}/logo.png`}
                  alt={brand.name}
                  className="h-6 w-auto"
                />
                <span className="text-sm font-medium text-white/80">{brand.name}</span>
              </div>
            </div>

            {brief && (
              <div className="flex items-center gap-3">
                {/* Phase indicator */}
                <div className="flex items-center gap-2 mr-4">
                  <span
                    className="text-[10px] font-medium px-2 py-1 rounded"
                    style={{
                      background: phase === 'copy' ? `${accentColor}20` : 'rgba(255,255,255,0.05)',
                      color: phase === 'copy' ? accentColor : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    1. Copy
                  </span>
                  <span className="text-white/20">→</span>
                  <span
                    className="text-[10px] font-medium px-2 py-1 rounded"
                    style={{
                      background: phase === 'image' ? `${accentColor}20` : 'rgba(255,255,255,0.05)',
                      color: phase === 'image' ? accentColor : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    2. Images
                  </span>
                </div>

                {/* Engine toggle */}
                <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    onClick={() => setImageEngine('gemini')}
                    className="px-3 py-1.5 text-[10px] font-medium transition-all cursor-pointer"
                    style={{
                      background: imageEngine === 'gemini' ? `${accentColor}20` : 'transparent',
                      color: imageEngine === 'gemini' ? accentColor : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    Gemini
                  </button>
                  <button
                    onClick={() => setImageEngine('openai')}
                    className="px-3 py-1.5 text-[10px] font-medium transition-all cursor-pointer"
                    style={{
                      background: imageEngine === 'openai' ? `${accentColor}20` : 'transparent',
                      color: imageEngine === 'openai' ? accentColor : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    GPT-4o
                  </button>
                </div>

                {imageEngine === 'gemini' && (
                  <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    <button
                      onClick={() => setImageModel('pro')}
                      className="px-2.5 py-1.5 text-[10px] font-medium transition-all cursor-pointer"
                      style={{
                        background: imageModel === 'pro' ? `${accentColor}20` : 'transparent',
                        color: imageModel === 'pro' ? accentColor : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      Pro
                    </button>
                    <button
                      onClick={() => setImageModel('flash')}
                      className="px-2.5 py-1.5 text-[10px] font-medium transition-all cursor-pointer"
                      style={{
                        background: imageModel === 'flash' ? `${accentColor}20` : 'transparent',
                        color: imageModel === 'flash' ? accentColor : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      Flash
                    </button>
                  </div>
                )}

                <button
                  onClick={handleGenerateImages}
                  disabled={isGeneratingImages || !brief.slides.some(s => s.compositionPrompt?.trim())}
                  className="px-4 py-2 rounded-lg text-[11px] font-medium transition-all disabled:opacity-30 cursor-pointer"
                  style={{
                    background: `${accentColor}20`,
                    border: `1px solid ${accentColor}40`,
                    color: accentColor,
                  }}
                >
                  {isGeneratingImages
                    ? `Generating ${imageProgress}/${brief.slides.length}...`
                    : 'Generate All Images'
                  }
                </button>

                <ExportButton
                  slideCount={brief.slides.length}
                  brandSlug={brandSlug}
                  accentColor={accentColor}
                  getSlideImage={(i) => brief.slides[i]?.generatedImage}
                />
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          {/* Phase 1: Copy Generation */}
          {phase === 'copy' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-xl font-semibold text-white/90 mb-2">
                  Step 1: Generate Copy
                </h1>
                <p className="text-sm text-white/40">
                  Enter your topic and Claude will write the headlines, subtext, and bullets
                </p>
              </div>

              <TopicInput
                brand={brand}
                brandSlug={brandSlug}
                onGenerate={handleGenerateCopy}
                isGenerating={isGenerating}
              />

              {isGenerating && (
                <div className="flex items-center justify-center gap-3 py-8">
                  <span
                    className="animate-spin inline-block w-5 h-5 border-2 border-white/10 rounded-full"
                    style={{ borderTopColor: accentColor }}
                  />
                  <span className="text-sm text-white/50">{generatingStep}</span>
                </div>
              )}

              {error && (
                <div
                  className="p-4 rounded-xl text-sm"
                  style={{
                    background: 'rgba(255,60,60,0.08)',
                    border: '1px solid rgba(255,60,60,0.2)',
                    color: '#ff6b6b',
                  }}
                >
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Phase 2: Image Generation */}
          {phase === 'image' && brief && (
            <div className="grid grid-cols-[1fr,420px] gap-8">
              {/* Left: Carousel Preview + Slide Editor */}
              <div className="space-y-6">
                {/* Slide thumbnails */}
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {brief.slides.map((slide, i) => (
                    <button
                      key={slide.number}
                      onClick={() => setSelectedSlide(i)}
                      className="flex-shrink-0 relative rounded-lg overflow-hidden transition-all cursor-pointer"
                      style={{
                        width: 100,
                        height: 100,
                        border: selectedSlide === i
                          ? `2px solid ${accentColor}`
                          : '2px solid rgba(255,255,255,0.1)',
                        opacity: selectedSlide === i ? 1 : 0.6,
                      }}
                    >
                      {slide.generatedImage ? (
                        <img
                          src={slide.generatedImage}
                          alt={`Slide ${slide.number}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-[10px] text-white/30"
                          style={{
                            background: isServiceGrowth
                              ? 'linear-gradient(135deg, #0D0D0D, #1a1a2e)'
                              : 'linear-gradient(135deg, #1E3A5F, #5C4033)',
                          }}
                        >
                          Slide {slide.number}
                        </div>
                      )}
                      {/* Status indicator */}
                      <div
                        className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                        style={{
                          background: slide.compositionPrompt?.trim()
                            ? slide.generatedImage
                              ? '#22c55e'
                              : accentColor
                            : 'rgba(255,255,255,0.2)',
                        }}
                      />
                      {imageErrors[slide.number] && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                          <span className="text-red-400 text-[9px]">Error</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Current slide preview */}
                {currentSlide && (
                  <div
                    className="relative rounded-xl overflow-hidden"
                    style={{
                      aspectRatio: '1/1',
                      maxHeight: 500,
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {currentSlide.generatedImage ? (
                      <img
                        src={currentSlide.generatedImage}
                        alt={`Slide ${currentSlide.number}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex flex-col items-center justify-center gap-4 p-8"
                        style={{
                          background: isServiceGrowth
                            ? 'linear-gradient(135deg, #0D0D0D, #111118)'
                            : 'linear-gradient(135deg, #1E3A5F, #2a1a10)',
                        }}
                      >
                        <div className="text-white/50 text-center text-lg font-medium max-w-md">
                          {currentSlide.headline?.replace(/\*/g, '')}
                        </div>
                        <div className="text-white/30 text-center text-sm max-w-sm">
                          {currentSlide.subtext}
                        </div>
                        <div className="mt-4 text-white/20 text-xs">
                          Write an image prompt below, then generate
                        </div>
                      </div>
                    )}

                    {/* Regenerate button */}
                    {currentSlide.generatedImage && (
                      <button
                        onClick={() => handleRegenerateSlide(currentSlide.number)}
                        disabled={isGeneratingImages}
                        className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-[10px] font-medium cursor-pointer transition-all"
                        style={{
                          background: 'rgba(0,0,0,0.7)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.7)',
                        }}
                      >
                        {isGeneratingImages && imageProgress === currentSlide.number
                          ? 'Generating...'
                          : 'Regenerate'
                        }
                      </button>
                    )}
                  </div>
                )}

                {/* Copy editor */}
                {currentSlide && (
                  <div
                    className="p-4 rounded-xl space-y-3"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <h3 className="text-[11px] font-medium tracking-wider uppercase text-white/30">
                      Edit Copy — Slide {currentSlide.number}
                    </h3>
                    <input
                      type="text"
                      value={currentSlide.headline || ''}
                      onChange={(e) => handleSlideUpdate({ ...currentSlide, headline: e.target.value })}
                      placeholder="Headline"
                      className="w-full px-3 py-2 rounded-lg text-sm text-white/90 placeholder-white/20 focus:outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    />
                    <textarea
                      value={currentSlide.subtext || ''}
                      onChange={(e) => handleSlideUpdate({ ...currentSlide, subtext: e.target.value })}
                      placeholder="Subtext"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white/80 placeholder-white/20 focus:outline-none resize-none"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Right: Image Settings */}
              <div className="space-y-4">
                <h2 className="text-[11px] font-medium tracking-wider uppercase text-white/40">
                  Image Settings
                </h2>

                {/* Style References - Most Important */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: `${accentColor}08`,
                    border: `1px solid ${accentColor}25`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
                    <span className="text-[11px] font-medium" style={{ color: accentColor }}>
                      Step 1: Upload Style References
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 mb-3">
                    Upload 1-3 reference images. The AI will copy this exact style — same layout, typography, and design elements. Only colors and text will change.
                  </p>
                  <StyleReferences brandSlug={brandSlug} accentColor={accentColor} />
                </div>

                {/* Carousel Creative Direction - ONE for all slides */}
                <div
                  className="rounded-xl"
                  style={{
                    background: `${accentColor}08`,
                    border: `1px solid ${accentColor}20`,
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
                      <label className="text-[11px] font-medium" style={{ color: accentColor }}>
                        Step 2: Carousel Creative Direction
                      </label>
                    </div>
                    <p className="text-[10px] text-white/40 mb-3">
                      This applies to ALL slides. Claude will add creative variations while keeping the style consistent.
                    </p>
                    <textarea
                      value={globalDirection}
                      onChange={(e) => setGlobalDirection(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2.5 rounded-lg text-[13px] text-white/80 focus:outline-none resize-none leading-relaxed"
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    />
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-[10px] text-white/25">
                        Tip: Describe the mood, visual style, and creative approach you want
                      </p>
                      <button
                        onClick={() => setGlobalDirection(getDefaultDirection(brandSlug))}
                        className="text-[10px] text-white/30 hover:text-white/50 cursor-pointer"
                      >
                        Reset to default
                      </button>
                    </div>
                  </div>
                </div>

                {/* Current slide info (read-only) */}
                {currentSlide && (
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="p-4">
                      <div className="text-[11px] font-medium text-white/40 mb-2">
                        Slide {currentSlide.number} Context
                      </div>
                      <div className="space-y-2 text-[11px]">
                        <div>
                          <span className="text-white/30">Purpose:</span>{' '}
                          <span className="text-white/60">{currentSlide.purpose}</span>
                        </div>
                        <div>
                          <span className="text-white/30">Message:</span>{' '}
                          <span className="text-white/60">{currentSlide.headline?.replace(/\*/g, '')}</span>
                        </div>
                        {currentSlide.subtext && (
                          <div>
                            <span className="text-white/30">Supporting:</span>{' '}
                            <span className="text-white/50">{currentSlide.subtext}</span>
                          </div>
                        )}
                      </div>
                      <p className="mt-3 text-[10px] text-white/20">
                        The AI uses this context + your creative direction to generate each slide uniquely
                      </p>
                    </div>
                  </div>
                )}

                {/* Error display */}
                {Object.keys(imageErrors).length > 0 && (
                  <div
                    className="p-3 rounded-xl text-[11px]"
                    style={{
                      background: 'rgba(255,60,60,0.08)',
                      border: '1px solid rgba(255,60,60,0.15)',
                      color: '#ff8888',
                    }}
                  >
                    {Object.entries(imageErrors).map(([num, msg]) => (
                      <div key={num}>Slide {num}: {msg}</div>
                    ))}
                  </div>
                )}

                {/* Back to copy phase */}
                <button
                  onClick={() => setPhase('copy')}
                  className="w-full py-2 rounded-lg text-[11px] text-white/30 hover:text-white/50 transition-colors cursor-pointer"
                  style={{ border: '1px dashed rgba(255,255,255,0.1)' }}
                >
                  ← Back to Copy Generation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
