'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { BrandConfig, Brief, Slide } from '@/lib/types'
import { overlayLogo } from '@/lib/logo-overlay'
import TopicInput from '@/components/TopicInput'
import CarouselPreview from '@/components/CarouselPreview'
import SlideEditor from '@/components/SlideEditor'
import ExportButton from '@/components/ExportButton'
import StyleReferences from '@/components/StyleReferences'
import StyleAnalyzer from '@/components/StyleAnalyzer'

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <span className="animate-spin inline-block w-4 h-4 border-[1.5px] border-white/15 border-t-white/50 rounded-full" />
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

  const [brand, setBrand] = useState<BrandConfig | null>(null)
  const [brief, setBrief] = useState<Brief | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingStep, setGeneratingStep] = useState('')
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [imageProgress, setImageProgress] = useState(0)
  const [selectedSlide, setSelectedSlide] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<number, string>>({})
  const [imageModel, setImageModel] = useState<'pro' | 'flash'>('pro')
  const [imageEngine, setImageEngine] = useState<'gemini' | 'openai'>('gemini')
  // OpenAI only uses gpt-image-1 (no model toggle needed)

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

  const handleGenerate = async (topic: string, postType: string, slideCount: number) => {
    setIsGenerating(true)
    setGeneratingStep('Writing copy & composition prompts...')
    setError(null)
    setImageErrors({})
    setBrief(null)
    setSelectedSlide(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandSlug, topic, postType, slideCount }),
      })
      setGeneratingStep('Processing response...')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setGeneratingStep(`Done — ${data.slides?.length || slideCount} slides ready`)
      setBrief(data)
      setSelectedSlide(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
      setGeneratingStep('')
    }
  }

  const handleGenerateImages = async () => {
    if (!brief || !brand) return
    setIsGeneratingImages(true)
    setImageProgress(0)
    setImageErrors({})
    const updatedSlides = [...brief.slides]

    // Pick the API endpoint based on selected engine
    const apiEndpoint = imageEngine === 'openai' ? '/api/images-openai' : '/api/images'

    for (let i = 0; i < updatedSlides.length; i++) {
      const slide = updatedSlides[i]
      const prompt = slide.compositionPrompt || slide.imageDescription
      if (!prompt) {
        setImageErrors((prev) => ({
          ...prev,
          [slide.number]: 'Missing composition prompt for this slide.',
        }))
        continue
      }
      setImageProgress(i + 1)
      try {
        const res = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            compositionPrompt: prompt,
            model: imageModel, // Gemini uses pro/flash, OpenAI always uses gpt-image-1
            brandSlug,
          }),
        })
        const data = await res.json()
        if (!res.ok || data.error) {
          throw new Error(data.error || `Image generation failed (${res.status})`)
        }
        if (data.imageBase64) {
          const rawImage = `data:${data.mimeType || 'image/png'};base64,${data.imageBase64}`
          // Overlay the real brand logo for consistency
          const finalImage = await overlayLogo(rawImage, brandSlug, {
            logoSize: isServiceGrowth ? 44 : 36,
            padding: 40,
            position: 'top-left',
          })
          updatedSlides[i] = {
            ...slide,
            generatedImage: finalImage,
          }
          setImageErrors((prev) => {
            const next = { ...prev }
            delete next[slide.number]
            return next
          })
          setBrief({ ...brief, slides: [...updatedSlides] })
        } else {
          throw new Error('No image returned by the engine.')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown image generation error'
        setImageErrors((prev) => ({ ...prev, [slide.number]: message }))
        console.error(`Image gen failed for slide ${i + 1}:`, err)
      }
    }
    setIsGeneratingImages(false)
    setImageProgress(0)
  }

  const handleRegenerateSlide = useCallback(
    async (slideNumber: number) => {
      if (!brief || !brand) return
      const slideIndex = slideNumber - 1
      const slide = brief.slides[slideIndex]
      const prompt = slide.compositionPrompt || slide.imageDescription
      if (!prompt) return

      // Pick the API endpoint based on selected engine
      const apiEndpoint = imageEngine === 'openai' ? '/api/images-openai' : '/api/images'

      setIsGeneratingImages(true)
      setImageProgress(slideNumber)
      try {
        const res = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            compositionPrompt: prompt,
            model: imageModel, // Gemini uses pro/flash, OpenAI always uses gpt-image-1
            brandSlug,
          }),
        })
        const data = await res.json()
        if (!res.ok || data.error) {
          throw new Error(data.error || `Image generation failed (${res.status})`)
        }
        if (data.imageBase64) {
          const rawImage = `data:${data.mimeType || 'image/png'};base64,${data.imageBase64}`
          const finalImage = await overlayLogo(rawImage, brandSlug, {
            logoSize: isServiceGrowth ? 44 : 36,
            padding: 40,
            position: 'top-left',
          })
          const updatedSlides = [...brief.slides]
          updatedSlides[slideIndex] = {
            ...slide,
            generatedImage: finalImage,
          }
          setImageErrors((prev) => {
            const next = { ...prev }
            delete next[slide.number]
            return next
          })
          setBrief({ ...brief, slides: updatedSlides })
        } else {
          throw new Error('No image returned by the engine.')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown image generation error'
        setImageErrors((prev) => ({ ...prev, [slide.number]: message }))
        console.error(`Regenerate failed for slide ${slideNumber}:`, err)
      } finally {
        setIsGeneratingImages(false)
        setImageProgress(0)
      }
    },
    [brief, brand, brandSlug, isServiceGrowth, imageModel, imageEngine]
  )

  const handleSlideUpdate = useCallback(
    (updated: Slide) => {
      if (!brief) return
      const slides = brief.slides.map((s) => s.number === updated.number ? updated : s)
      setBrief({ ...brief, slides })
    },
    [brief]
  )

  const handleDropImage = useCallback(
    (slideNumber: number, imageDataUrl: string) => {
      if (!brief) return
      const slides = brief.slides.map((s) =>
        s.number === slideNumber ? { ...s, generatedImage: imageDataUrl } : s
      )
      setBrief({ ...brief, slides })
    },
    [brief]
  )

  if (!brand) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="animate-spin inline-block w-4 h-4 border-[1.5px] border-white/15 border-t-white/50 rounded-full" />
      </div>
    )
  }

  return (
    <main className="min-h-screen relative grain">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-[#050510] to-black" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.015] blur-[120px]" style={{ background: accentColor }} />

      <div className="relative z-10 px-6 py-6 max-w-[1400px] mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-10 animate-fade-in">
          <div className="flex items-center gap-5">
            <button
              onClick={() => router.push('/')}
              className="text-white/25 hover:text-white/60 text-xs tracking-wide transition-colors cursor-pointer"
            >
              ← Back
            </button>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-3">
              <img
                src={`/brands/${brandSlug}/logo.png`}
                alt={brand.name}
                className="h-7 w-auto object-contain"
              />
              <div>
                <h1
                  className="text-sm font-bold tracking-tight"
                  style={{
                    fontFamily: isServiceGrowth ? 'Syne, sans-serif' : 'Playfair Display, serif',
                  }}
                >
                  {brand.name}
                </h1>
                <p className="text-[10px] tracking-wider uppercase" style={{ color: `${accentColor}88` }}>
                  {brand.tagline}
                </p>
              </div>
            </div>
          </div>

          {brief && (
            <div className="flex items-center gap-3">
              {/* Engine toggle (Gemini vs OpenAI) */}
              <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  onClick={() => setImageEngine('gemini')}
                  className="px-3 py-1.5 text-[11px] font-medium tracking-wide transition-all cursor-pointer"
                  style={{
                    background: imageEngine === 'gemini' ? `${accentColor}20` : 'transparent',
                    color: imageEngine === 'gemini' ? accentColor : 'rgba(255,255,255,0.4)',
                  }}
                  title="Google Gemini — faster, good for iteration"
                >
                  Gemini
                </button>
                <button
                  onClick={() => setImageEngine('openai')}
                  className="px-3 py-1.5 text-[11px] font-medium tracking-wide transition-all cursor-pointer"
                  style={{
                    background: imageEngine === 'openai' ? `${accentColor}20` : 'transparent',
                    color: imageEngine === 'openai' ? accentColor : 'rgba(255,255,255,0.4)',
                  }}
                  title="OpenAI GPT-4o — better text rendering"
                >
                  GPT-4o
                </button>
              </div>

              {/* Gemini model toggle (only shown when Gemini is selected) */}
              {imageEngine === 'gemini' && (
                <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    onClick={() => setImageModel('pro')}
                    className="px-3 py-1.5 text-[11px] font-medium tracking-wide transition-all cursor-pointer"
                    style={{
                      background: imageModel === 'pro' ? `${accentColor}20` : 'transparent',
                      color: imageModel === 'pro' ? accentColor : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    Pro
                  </button>
                  <button
                    onClick={() => setImageModel('flash')}
                    className="px-3 py-1.5 text-[11px] font-medium tracking-wide transition-all cursor-pointer"
                    style={{
                      background: imageModel === 'flash' ? `${accentColor}20` : 'transparent',
                      color: imageModel === 'flash' ? accentColor : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    Flash
                  </button>
                </div>
              )}

              {/* Note: OpenAI uses gpt-image-1 only, no model toggle needed */}

              <button
                onClick={handleGenerateImages}
                disabled={isGeneratingImages}
                className="px-5 py-2 rounded-lg text-xs font-medium tracking-wide transition-all disabled:opacity-30 cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.6)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${accentColor}44`
                  e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
                }}
              >
                {isGeneratingImages ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin inline-block w-3 h-3 border-[1.5px] border-white/20 border-t-white/60 rounded-full" />
                    Generating {imageProgress}/{brief.slides.length}
                  </span>
                ) : (
                  'Generate Slides'
                )}
              </button>
              <ExportButton
                slideCount={brief.slides.length}
                brandSlug={brandSlug}
                accentColor={accentColor}
                getSlideImage={(i) => brief.slides[i]?.generatedImage || brief.slides[i]?.backgroundImage}
              />
            </div>
          )}
        </div>

        {/* Topic input */}
        <div className="mb-12 max-w-2xl animate-fade-in-delay-1">
          <TopicInput
            brand={brand}
            brandSlug={brandSlug}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>

        {/* Style references & analysis */}
        <div className="mb-8 max-w-2xl animate-fade-in-delay-1 space-y-3">
          <StyleReferences brandSlug={brandSlug} accentColor={accentColor} />
          <StyleAnalyzer brandSlug={brandSlug} accentColor={accentColor} />
        </div>

        {/* Generation progress */}
        {isGenerating && (
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white/10 rounded-full" style={{ borderTopColor: accentColor }} />
              <span className="text-sm text-white/60">{generatingStep || 'Starting...'}</span>
            </div>
            <div className="w-full max-w-2xl h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)`,
                  width: generatingStep.includes('Processing') ? '80%' : generatingStep.includes('Done') ? '100%' : '40%',
                  animation: generatingStep.includes('Writing') ? 'pulse 2s ease-in-out infinite' : 'none',
                }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 rounded-xl text-sm animate-fade-in"
            style={{
              background: 'rgba(255,60,60,0.06)',
              border: '1px solid rgba(255,60,60,0.12)',
              color: '#ff6b6b',
            }}
          >
            {error}
          </div>
        )}

        {/* Per-slide image errors */}
        {!error && Object.keys(imageErrors).length > 0 && (
          <div
            className="mb-8 p-4 rounded-xl text-sm animate-fade-in"
            style={{
              background: 'rgba(255,60,60,0.06)',
              border: '1px solid rgba(255,60,60,0.12)',
              color: '#ffb3b3',
            }}
          >
            {Object.entries(imageErrors)
              .sort((a, b) => Number(a[0]) - Number(b[0]))
              .map(([slideNum, message]) => (
                <div key={slideNum}>{`Slide ${slideNum}: ${message}`}</div>
              ))}
          </div>
        )}

        {/* Carousel preview */}
        {brief && (
          <div className="space-y-10 animate-fade-in">
            <CarouselPreview
              slides={brief.slides}
              brand={brand}
              brandSlug={brandSlug}
              imageErrors={imageErrors}
              selectedSlide={selectedSlide}
              onSelectSlide={setSelectedSlide}
            />

            {selectedSlide !== null && brief.slides[selectedSlide] && (
              <div className="border-t border-white/[0.04] pt-10">
                <SlideEditor
                  slide={brief.slides[selectedSlide]}
                  brand={brand}
                  brandSlug={brandSlug}
                  onUpdate={handleSlideUpdate}
                  onDropImage={handleDropImage}
                  onRegenerateSlide={handleRegenerateSlide}
                />
              </div>
            )}

            {/* Caption & hashtags */}
            <div className="border-t border-white/[0.04] pt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-[11px] font-medium tracking-[0.15em] uppercase text-white/30 mb-3">Caption</h3>
                <textarea
                  value={brief.caption}
                  onChange={(e) => setBrief({ ...brief, caption: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white/80 focus:outline-none transition-colors resize-none"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                />
              </div>
              <div>
                <h3 className="text-[11px] font-medium tracking-[0.15em] uppercase text-white/30 mb-3">Hashtags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {brief.hashtags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md text-[11px] text-white/35"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
