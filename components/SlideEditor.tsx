'use client'

import { useCallback, useRef, useState } from 'react'
import { Slide, BrandConfig } from '@/lib/types'

interface Props {
  slide: Slide
  brand: BrandConfig
  brandSlug: string
  onUpdate: (updated: Slide) => void
  onDropImage: (slideNumber: number, imageDataUrl: string) => void
  onRegenerateSlide?: (slideNumber: number) => void
}

export default function SlideEditor({ slide, brand, brandSlug, onUpdate, onDropImage, onRegenerateSlide }: Props) {
  const isServiceGrowth = brandSlug === 'servicegrowth-ai'
  const accentColor = isServiceGrowth
    ? brand.colors.accent?.cyan || '#00D4FF'
    : brand.colors.accent?.gold || '#C9A227'
  const dropRef = useRef<HTMLDivElement>(null)
  const [isRefining, setIsRefining] = useState(false)

  const handleRefinePrompt = async () => {
    if (!slide.compositionPrompt?.trim()) return
    setIsRefining(true)
    try {
      const res = await fetch('/api/refine-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: slide.compositionPrompt,
          brandSlug,
          slideContext: {
            headline: slide.headline,
            subtext: slide.subtext,
            purpose: slide.purpose,
          },
        }),
      })
      const data = await res.json()
      if (data.refinedPrompt) {
        onUpdate({ ...slide, compositionPrompt: data.refinedPrompt })
      }
    } catch (err) {
      console.error('Refine prompt failed:', err)
    } finally {
      setIsRefining(false)
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (!file?.type.startsWith('image/')) return

      const reader = new FileReader()
      reader.onload = () => {
        onDropImage(slide.number, reader.result as string)
      }
      reader.readAsDataURL(file)
    },
    [slide.number, onDropImage]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const hasImage = slide.generatedImage || slide.backgroundImage
  const imageUrl = slide.generatedImage || slide.backgroundImage

  return (
    <div className="grid grid-cols-[1fr,400px] gap-6">
      {/* Image preview */}
      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="relative rounded-xl overflow-hidden border border-white/10"
        style={{ aspectRatio: '1/1', maxHeight: '600px' }}
      >
        {hasImage ? (
          <img
            src={imageUrl}
            alt={`Slide ${slide.number}`}
            className="w-full h-full object-cover"
            data-slide-number={slide.number}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-4"
            data-slide-number={slide.number}
            style={{
              background: isServiceGrowth
                ? 'linear-gradient(135deg, #0D0D0D, #111118)'
                : 'linear-gradient(135deg, #1E3A5F, #2a1a10)',
            }}
          >
            <div className="text-white/40 text-sm text-center max-w-xs">
              {slide.headline?.replace(/\*/g, '')}
            </div>
            <div className="text-white/20 text-xs text-center">
              Generate this slide or drag & drop an image
            </div>
          </div>
        )}

        {/* Regenerate button overlay */}
        {onRegenerateSlide && (
          <button
            onClick={() => onRegenerateSlide(slide.number)}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
            style={{
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${accentColor}44`
              e.currentTarget.style.color = 'rgba(255,255,255,0.95)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
            }}
          >
            Regenerate
          </button>
        )}
      </div>

      {/* Edit panel */}
      <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2">
        <h3 className="text-[11px] font-medium tracking-[0.15em] uppercase text-white/30">
          Slide {slide.number} — Edit Copy
        </h3>

        {/* Headline */}
        <div>
          <label className="block text-[11px] text-white/40 mb-1.5">
            Headline <span className="text-white/20">(*accent* words)</span>
          </label>
          <input
            type="text"
            value={slide.headline}
            onChange={(e) => onUpdate({ ...slide, headline: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none transition-colors"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}33` }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
          />
        </div>

        {/* Subtext */}
        <div>
          <label className="block text-[11px] text-white/40 mb-1.5">Subtext</label>
          <textarea
            value={slide.subtext}
            onChange={(e) => onUpdate({ ...slide, subtext: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none transition-colors resize-none"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}33` }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
          />
        </div>

        {/* Bullets */}
        {slide.bullets && slide.bullets.length > 0 && (
          <div>
            <label className="block text-[11px] text-white/40 mb-1.5">Bullets</label>
            {slide.bullets.map((bullet, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <span className="text-sm mt-2" style={{ color: accentColor }}>•</span>
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => {
                    const updated = [...slide.bullets!]
                    updated[i] = e.target.value
                    onUpdate({ ...slide, bullets: updated })
                  }}
                  className="flex-1 px-3 py-2 rounded-lg text-sm text-white focus:outline-none transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}33` }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
                />
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        {slide.cta !== undefined && slide.cta !== null && (
          <div>
            <label className="block text-[11px] text-white/40 mb-1.5">CTA</label>
            <input
              type="text"
              value={slide.cta || ''}
              onChange={(e) => onUpdate({ ...slide, cta: e.target.value || null })}
              className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none transition-colors"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}33` }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
            />
          </div>
        )}

        {/* Composition Prompt - ALWAYS VISIBLE */}
        <div
          className="mt-4 p-3 rounded-xl"
          style={{
            background: `${accentColor}08`,
            border: `1px solid ${accentColor}20`,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-medium tracking-wide" style={{ color: accentColor }}>
              Image Prompt (write your own)
            </label>
            <button
              onClick={handleRefinePrompt}
              disabled={isRefining || !slide.compositionPrompt?.trim()}
              className="px-2.5 py-1 rounded-md text-[10px] font-medium transition-all disabled:opacity-30 cursor-pointer"
              style={{
                background: isRefining ? `${accentColor}30` : `${accentColor}20`,
                color: accentColor,
                border: `1px solid ${accentColor}30`,
              }}
            >
              {isRefining ? 'Refining...' : 'Refine with Claude'}
            </button>
          </div>
          <p className="text-[10px] text-white/30 mb-2">
            Describe what you want — Claude will refine it for the image model
          </p>
          <textarea
            value={slide.compositionPrompt || ''}
            onChange={(e) => onUpdate({ ...slide, compositionPrompt: e.target.value })}
            rows={6}
            placeholder="e.g., Person sitting in chair thinking, thought cloud above head showing a luxury outdoor patio with pergola. Navy and gold gradient colors. Clean cream background. Bold headline at top."
            className="w-full px-3 py-2 rounded-lg text-sm text-white/80 placeholder-white/20 focus:outline-none transition-colors resize-none"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}44` }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
        </div>

        {/* Image info */}
        <div className="pt-2 border-t border-white/[0.04]">
          {hasImage ? (
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-lg bg-cover bg-center border border-white/10"
                style={{ backgroundImage: `url(${imageUrl})` }}
              />
              <div className="flex-1">
                <p className="text-[11px] text-white/40">Generated image</p>
              </div>
              <button
                onClick={() => onUpdate({ ...slide, generatedImage: undefined, backgroundImage: undefined })}
                className="text-[11px] text-red-400/60 hover:text-red-400 transition-colors cursor-pointer"
              >
                Remove
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-white/20">
              No image yet — generate slides or drag & drop
            </p>
          )}
        </div>

        {/* Layout info */}
        <div className="text-[11px] text-white/15">
          Layout: {slide.layout} | Purpose: {slide.purpose}
        </div>
      </div>
    </div>
  )
}
