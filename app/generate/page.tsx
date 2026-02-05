'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { BrandConfig, Brief, Slide } from '@/lib/types'
import TopicInput from '@/components/TopicInput'
import CarouselPreview from '@/components/CarouselPreview'
import SlideEditor from '@/components/SlideEditor'
import ExportButton from '@/components/ExportButton'

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
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [imageProgress, setImageProgress] = useState(0)
  const [selectedSlide, setSelectedSlide] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [imageModel, setImageModel] = useState<'pro' | 'flash'>('pro')

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
    setError(null)
    setBrief(null)
    setSelectedSlide(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandSlug, topic, postType, slideCount }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setBrief(data)
      setSelectedSlide(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateImages = async () => {
    if (!brief || !brand) return
    setIsGeneratingImages(true)
    setImageProgress(0)
    const updatedSlides = [...brief.slides]
    for (let i = 0; i < updatedSlides.length; i++) {
      const slide = updatedSlides[i]
      const prompt = slide.compositionPrompt || slide.imageDescription
      if (!prompt) continue
      setImageProgress(i + 1)
      try {
        const res = await fetch('/api/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            compositionPrompt: prompt,
            model: imageModel,
          }),
        })
        const data = await res.json()
        if (data.imageBase64) {
          updatedSlides[i] = {
            ...slide,
            generatedImage: `data:${data.mimeType || 'image/png'};base64,${data.imageBase64}`,
          }
          setBrief({ ...brief, slides: [...updatedSlides] })
        }
      } catch (err) {
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

      setIsGeneratingImages(true)
      setImageProgress(slideNumber)
      try {
        const res = await fetch('/api/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            compositionPrompt: prompt,
            model: imageModel,
          }),
        })
        const data = await res.json()
        if (data.imageBase64) {
          const updatedSlides = [...brief.slides]
          updatedSlides[slideIndex] = {
            ...slide,
            generatedImage: `data:${data.mimeType || 'image/png'};base64,${data.imageBase64}`,
          }
          setBrief({ ...brief, slides: updatedSlides })
        }
      } catch (err) {
        console.error(`Regenerate failed for slide ${slideNumber}:`, err)
      } finally {
        setIsGeneratingImages(false)
        setImageProgress(0)
      }
    },
    [brief, brand, imageModel]
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
              {/* Model toggle */}
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

        {/* Carousel preview */}
        {brief && (
          <div className="space-y-10 animate-fade-in">
            <CarouselPreview
              slides={brief.slides}
              brand={brand}
              brandSlug={brandSlug}
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
