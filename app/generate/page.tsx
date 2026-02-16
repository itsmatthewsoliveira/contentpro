'use client'

import { Suspense, useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { BrandConfig, Brief, Slide } from '@/lib/types'
import SlideList from '@/components/SlideList'
import SlidePreview from '@/components/SlidePreview'
import PropertiesPanel from '@/components/PropertiesPanel'
import CaptionPanel from '@/components/CaptionPanel'
import ExportButton from '@/components/ExportButton'
import BrandKitModal from '@/components/BrandKitModal'

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
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [imageProgress, setImageProgress] = useState(0)

  // Settings
  const [imageEngine, setImageEngine] = useState<'gemini' | 'openai'>('gemini')
  const [imageModel, setImageModel] = useState<'pro' | 'flash'>('pro')
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '9:16'>('1:1')
  const [approvedSlides, setApprovedSlides] = useState<Set<number>>(new Set())

  const getDefaultDirection = (slug: string) => {
    if (slug === 'servicegrowth-ai') {
      return 'Premium fintech SaaS aesthetic. Dark navy-black backgrounds, indigo/violet accents, extra-bold sans-serif headlines. 3D chrome objects or desaturated grayscale photography. Text-dominant, confident, minimal. Each slide should feel like part of the same campaign.'
    }
    return 'Match the reference style exactly. Luxury editorial aesthetic. Warm, aspirational, magazine-quality. Each slide should feel like part of the same campaign but with creative variation in composition.'
  }
  const [globalDirection, setGlobalDirection] = useState('')

  useEffect(() => {
    if (brandSlug && !globalDirection) {
      setGlobalDirection(getDefaultDirection(brandSlug))
    }
  }, [brandSlug])

  // Brand Kit modal
  const [showBrandKit, setShowBrandKit] = useState(false)

  // Debounce timer for re-composite
  const recompositeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Errors
  const [error, setError] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<number, string>>({})

  // Load brand
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
      ? brand.colors.accent?.indigo || '#4F46E5'
      : brand.colors.accent?.gold || '#C9A227'
    : '#4F46E5'

  // ── Copy Generation ──
  const handleGenerateCopy = async (topic: string, postType: string, slideCount: number) => {
    setIsGenerating(true)
    setError(null)
    setImageErrors({})
    setBrief(null)
    setSelectedSlide(0)
    setApprovedSlides(new Set())

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandSlug, topic, postType, slideCount }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setBrief(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Slide Prompt Builder ──
  const buildSlidePrompt = (slide: Slide, slideIndex: number, total: number) => {
    if (slide.compositionPrompt?.trim()) return slide.compositionPrompt

    const headline = slide.headline?.replace(/\*/g, '') || ''
    const subtext = slide.subtext || ''
    const purpose = slide.purpose || ''

    let positionContext = ''
    if (slideIndex === 0) {
      positionContext = 'This is the OPENING HOOK slide — grab attention, create intrigue.'
    } else if (slideIndex === total - 1) {
      positionContext = 'This is the FINAL CTA slide — clear call to action, confident energy.'
    } else {
      positionContext = `Slide ${slideIndex + 1} of ${total} — ${purpose}.`
    }

    return `${positionContext}\n\nSLIDE CONTENT:\nHeadline: "${headline}"\n${subtext ? `Supporting text: "${subtext}"` : ''}\n${slide.imageDescription ? `Visual concept: ${slide.imageDescription}` : ''}\n\nCreate a visually compelling Instagram slide that communicates this message.`
  }

  // ── Composite text on background ──
  const compositeText = async (bgBase64: string, slide: Slide): Promise<string | null> => {
    try {
      const res = await fetch('/api/composite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backgroundBase64: bgBase64,
          brandSlug,
          slide: {
            headline: slide.headline?.replace(/\*/g, '') || '',
            subtext: slide.subtext || undefined,
            cta: slide.cta || undefined,
            accentWords: slide.accentWords || [],
            purpose: slide.purpose || undefined,
            number: slide.number,
            totalSlides: slide.totalSlides,
          },
          aspectRatio,
          textLayout: slide.textLayout || 'bottom-left',
        }),
      })
      const data = await res.json()
      if (data.imageBase64) {
        return `data:${data.mimeType || 'image/png'};base64,${data.imageBase64}`
      }
    } catch (err) {
      console.error('Composite failed:', err)
    }
    return null
  }

  // ── Generate All Images ──
  const handleGenerateImages = async () => {
    if (!brief || !brand) return
    setIsGeneratingImages(true)
    setImageProgress(0)
    setImageErrors({})

    const apiEndpoint = imageEngine === 'openai' ? '/api/images-openai' : '/api/images'
    const updatedSlides = [...brief.slides]

    for (let i = 0; i < updatedSlides.length; i++) {
      const slide = updatedSlides[i]
      const slidePrompt = buildSlidePrompt(slide, i, updatedSlides.length)
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
            carouselTheme: brief.carouselTheme,
            aspectRatio,
          }),
        })
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error || 'Generation failed')

        if (data.imageBase64) {
          // Store the raw background
          const bgBase64 = data.imageBase64
          updatedSlides[i] = { ...slide, backgroundImage: `data:${data.mimeType || 'image/png'};base64,${bgBase64}` }

          // Composite text on top
          const composited = await compositeText(bgBase64, slide)
          if (composited) {
            updatedSlides[i] = { ...updatedSlides[i], generatedImage: composited }
          } else {
            // Fallback: show raw background if composite fails
            updatedSlides[i] = { ...updatedSlides[i], generatedImage: updatedSlides[i].backgroundImage }
          }

          setImageErrors((prev) => { const next = { ...prev }; delete next[slide.number]; return next })
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

  // ── Regenerate Single Slide ──
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
          carouselTheme: brief.carouselTheme,
          aspectRatio,
        }),
      })
      const data = await res.json()
      if (data.imageBase64) {
        const bgBase64 = data.imageBase64
        const bgDataUrl = `data:${data.mimeType || 'image/png'};base64,${bgBase64}`

        // Composite text on the new background
        const composited = await compositeText(bgBase64, slide)
        setBrief({
          ...brief,
          slides: brief.slides.map(s =>
            s.number === slideNumber
              ? { ...s, backgroundImage: bgDataUrl, generatedImage: composited || bgDataUrl }
              : s
          ),
        })
      }
    } catch (err) {
      console.error('Regenerate failed:', err)
    } finally {
      setIsGeneratingImages(false)
      setImageProgress(0)
    }
  }, [brief, brand, brandSlug, imageEngine, imageModel, globalDirection, aspectRatio])

  // ── Re-composite text when slide copy changes ──
  const handleRecomposite = useCallback(async (slide: Slide) => {
    if (!slide.backgroundImage) return
    // Extract base64 from data URL
    const match = slide.backgroundImage.match(/^data:image\/\w+;base64,(.+)$/)
    if (!match) return

    const composited = await compositeText(match[1], slide)
    if (composited && brief) {
      setBrief({
        ...brief,
        slides: brief.slides.map(s =>
          s.number === slide.number ? { ...s, generatedImage: composited } : s
        ),
      })
    }
  }, [brief, brandSlug, aspectRatio])

  // ── Approve Slide ──
  const handleApproveSlide = useCallback(async (slideNumber: number) => {
    if (!brief) return
    const slide = brief.slides.find(s => s.number === slideNumber)
    if (!slide?.generatedImage) return

    const base64Match = slide.generatedImage.match(/^data:image\/\w+;base64,(.+)$/)
    if (!base64Match) return

    try {
      await fetch('/api/approved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandSlug,
          imageBase64: base64Match[1],
          metadata: {
            slideNumber: slide.number,
            headline: slide.headline,
            subtext: slide.subtext,
            compositionPrompt: slide.compositionPrompt,
            engine: imageEngine,
            model: imageEngine === 'gemini' ? imageModel : undefined,
            topic: brief.meta.topic,
            carouselTheme: brief.carouselTheme,
            globalDirection,
            approvedAt: new Date().toISOString(),
            aspectRatio,
          },
        }),
      })
      setApprovedSlides(prev => { const next = new Set(prev); next.add(slideNumber); return next })
    } catch (err) {
      console.error('Failed to approve image:', err)
    }
  }, [brief, brandSlug, imageEngine, imageModel, globalDirection, aspectRatio])

  // ── Update Slide Copy ──
  const handleSlideUpdate = useCallback((updated: Slide) => {
    if (!brief) return
    const oldSlide = brief.slides.find(s => s.number === updated.number)
    setBrief({ ...brief, slides: brief.slides.map(s => s.number === updated.number ? updated : s) })

    // If text or layout changed and we have a background image, re-composite
    if (updated.backgroundImage && oldSlide) {
      const textChanged = oldSlide.headline !== updated.headline ||
        oldSlide.subtext !== updated.subtext ||
        oldSlide.cta !== updated.cta
      const layoutChanged = oldSlide.textLayout !== updated.textLayout

      if (layoutChanged) {
        // Layout switch: re-composite immediately
        if (recompositeTimer.current) clearTimeout(recompositeTimer.current)
        handleRecomposite(updated)
      } else if (textChanged) {
        // Text edit: debounce 500ms
        if (recompositeTimer.current) clearTimeout(recompositeTimer.current)
        recompositeTimer.current = setTimeout(() => {
          handleRecomposite(updated)
        }, 500)
      }
    }
  }, [brief, handleRecomposite])

  // ── Slide Management ──
  const handleReorderSlides = useCallback((fromIndex: number, toIndex: number) => {
    if (!brief) return
    const slides = [...brief.slides]
    const [moved] = slides.splice(fromIndex, 1)
    slides.splice(toIndex, 0, moved)
    // Re-number slides
    const renumbered = slides.map((s, i) => ({ ...s, number: i + 1, totalSlides: slides.length }))
    setBrief({ ...brief, slides: renumbered, meta: { ...brief.meta, slideCount: renumbered.length } })
    setSelectedSlide(toIndex)
  }, [brief])

  const handleDeleteSlide = useCallback((index: number) => {
    if (!brief || brief.slides.length <= 1) return
    const slides = brief.slides.filter((_, i) => i !== index)
    const renumbered = slides.map((s, i) => ({ ...s, number: i + 1, totalSlides: slides.length }))
    setBrief({ ...brief, slides: renumbered, meta: { ...brief.meta, slideCount: renumbered.length } })
    if (selectedSlide >= renumbered.length) setSelectedSlide(renumbered.length - 1)
  }, [brief, selectedSlide])

  const handleDuplicateSlide = useCallback((index: number) => {
    if (!brief) return
    const slides = [...brief.slides]
    const dup = { ...slides[index], generatedImage: undefined }
    slides.splice(index + 1, 0, dup)
    const renumbered = slides.map((s, i) => ({ ...s, number: i + 1, totalSlides: slides.length }))
    setBrief({ ...brief, slides: renumbered, meta: { ...brief.meta, slideCount: renumbered.length } })
    setSelectedSlide(index + 1)
  }, [brief])

  const handleAddSlide = useCallback(() => {
    if (!brief) return
    const newSlide: Slide = {
      number: brief.slides.length + 1,
      purpose: 'Custom slide',
      headline: '',
      subtext: '',
      imageDescription: '',
      compositionPrompt: '',
      layout: 'headline-hero',
      totalSlides: brief.slides.length + 1,
    }
    const slides = [...brief.slides, newSlide]
    const renumbered = slides.map((s, i) => ({ ...s, number: i + 1, totalSlides: slides.length }))
    setBrief({ ...brief, slides: renumbered, meta: { ...brief.meta, slideCount: renumbered.length } })
    setSelectedSlide(renumbered.length - 1)
  }, [brief])

  // ── Caption/Hashtag Updates ──
  const handleCaptionChange = useCallback((caption: string) => {
    if (!brief) return
    setBrief({ ...brief, caption })
  }, [brief])

  const handleHashtagsChange = useCallback((hashtags: string[]) => {
    if (!brief) return
    setBrief({ ...brief, hashtags })
  }, [brief])

  // ── Loading ──
  if (!brand) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <span className="animate-spin inline-block w-5 h-5 border-2 border-white/15 border-t-white/50 rounded-full" />
      </div>
    )
  }

  const currentSlide = brief?.slides[selectedSlide] || null

  // ── Toggle Button Helper ──
  const ToggleBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className="px-2.5 py-1.5 text-[10px] font-medium transition-all cursor-pointer"
      style={{
        background: active ? `${accentColor}20` : 'transparent',
        color: active ? accentColor : 'rgba(255,255,255,0.4)',
      }}
    >
      {children}
    </button>
  )

  return (
    <main className="min-h-screen bg-black flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-[#050510] to-black pointer-events-none" />
      <div
        className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.02] blur-[150px] pointer-events-none"
        style={{ background: accentColor }}
      />

      {/* Header */}
      <header className="relative z-20 border-b border-white/[0.06] px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="text-white/30 hover:text-white/60 text-xs transition-colors cursor-pointer"
            >
              Back
            </button>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-3">
              <img src={`/brands/${brandSlug}/logo.png`} alt={brand.name} className="h-5 w-auto" />
              <span className="text-sm font-medium text-white/80">{brand.name}</span>
            </div>
            <button
              onClick={() => setShowBrandKit(true)}
              className="px-2.5 py-1 rounded-md text-[10px] font-medium text-white/30 hover:text-white/60 transition-colors cursor-pointer"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Brand Kit
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Engine */}
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <ToggleBtn active={imageEngine === 'gemini'} onClick={() => setImageEngine('gemini')}>Gemini</ToggleBtn>
              <ToggleBtn active={imageEngine === 'openai'} onClick={() => setImageEngine('openai')}>GPT-4o</ToggleBtn>
            </div>

            {/* Model (Gemini only) */}
            {imageEngine === 'gemini' && (
              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <ToggleBtn active={imageModel === 'pro'} onClick={() => setImageModel('pro')}>Pro</ToggleBtn>
                <ToggleBtn active={imageModel === 'flash'} onClick={() => setImageModel('flash')}>Flash</ToggleBtn>
              </div>
            )}

            {/* Aspect Ratio */}
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <ToggleBtn active={aspectRatio === '1:1'} onClick={() => setAspectRatio('1:1')}>1:1</ToggleBtn>
              <ToggleBtn active={aspectRatio === '4:5'} onClick={() => setAspectRatio('4:5')}>4:5</ToggleBtn>
              <ToggleBtn active={aspectRatio === '9:16'} onClick={() => setAspectRatio('9:16')}>9:16</ToggleBtn>
            </div>

            {/* Generate All */}
            {brief && (
              <>
                <button
                  onClick={handleGenerateImages}
                  disabled={isGeneratingImages || !brief.slides.some(s => s.compositionPrompt?.trim())}
                  className="px-4 py-1.5 rounded-lg text-[11px] font-medium transition-all disabled:opacity-30 cursor-pointer"
                  style={{
                    background: `${accentColor}20`,
                    border: `1px solid ${accentColor}40`,
                    color: accentColor,
                  }}
                >
                  {isGeneratingImages
                    ? `${imageProgress}/${brief.slides.length}...`
                    : 'Generate All'
                  }
                </button>

                <ExportButton
                  slideCount={brief.slides.length}
                  brandSlug={brandSlug}
                  accentColor={accentColor}
                  getSlideImage={(i) => brief.slides[i]?.generatedImage}
                />
              </>
            )}
          </div>
        </div>
      </header>

      {/* Three-Panel Workspace */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
        {/* LEFT: Slide List */}
        <div
          className="flex-shrink-0 p-3 overflow-y-auto"
          style={{
            width: 100,
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {brief ? (
            <SlideList
              slides={brief.slides}
              selectedSlide={selectedSlide}
              onSelectSlide={setSelectedSlide}
              accentColor={accentColor}
              brandSlug={brandSlug}
              approvedSlides={approvedSlides}
              onReorder={handleReorderSlides}
              onDelete={handleDeleteSlide}
              onDuplicate={handleDuplicateSlide}
              onAdd={handleAddSlide}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-white/10 text-[10px] text-center leading-relaxed">
                Generate<br />copy to<br />start
              </span>
            </div>
          )}
        </div>

        {/* CENTER: Preview */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center justify-start">
          <div className="w-full max-w-[520px]">
            <SlidePreview
              slide={currentSlide}
              aspectRatio={aspectRatio}
              accentColor={accentColor}
              brandSlug={brandSlug}
              isGenerating={isGeneratingImages}
              imageProgress={imageProgress}
              approvedSlides={approvedSlides}
              onApprove={handleApproveSlide}
              onRegenerate={handleRegenerateSlide}
            />

            {/* Error display */}
            {Object.keys(imageErrors).length > 0 && (
              <div
                className="mt-4 p-3 rounded-xl text-[11px]"
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

            {error && (
              <div
                className="mt-4 p-3 rounded-xl text-[11px]"
                style={{
                  background: 'rgba(255,60,60,0.08)',
                  border: '1px solid rgba(255,60,60,0.15)',
                  color: '#ff8888',
                }}
              >
                {error}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Properties */}
        <div
          className="flex-shrink-0 p-4 overflow-y-auto"
          style={{
            width: 360,
            borderLeft: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <PropertiesPanel
            brand={brand}
            brandSlug={brandSlug}
            brief={brief}
            currentSlide={currentSlide}
            accentColor={accentColor}
            isGenerating={isGenerating}
            isGeneratingImages={isGeneratingImages}
            onGenerateCopy={handleGenerateCopy}
            onRegenerateSlide={handleRegenerateSlide}
            globalDirection={globalDirection}
            onGlobalDirectionChange={setGlobalDirection}
            onResetDirection={() => setGlobalDirection(getDefaultDirection(brandSlug))}
            onSlideUpdate={handleSlideUpdate}
          />
        </div>
      </div>

      {/* Bottom: Caption & Hashtags */}
      {brief && (
        <div className="relative z-10 flex-shrink-0">
          <CaptionPanel
            caption={brief.caption}
            hashtags={brief.hashtags}
            accentColor={accentColor}
            onCaptionChange={handleCaptionChange}
            onHashtagsChange={handleHashtagsChange}
          />
        </div>
      )}

      {/* Brand Kit Modal */}
      <BrandKitModal
        isOpen={showBrandKit}
        onClose={() => setShowBrandKit(false)}
        brandSlug={brandSlug}
        brand={brand}
        accentColor={accentColor}
        onBrandUpdate={(config) => setBrand(config)}
      />
    </main>
  )
}
