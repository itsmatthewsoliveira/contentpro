'use client'

import { useCallback, useRef } from 'react'
import { Slide, BrandConfig } from '@/lib/types'
import ServiceGrowthCard from './templates/ServiceGrowthCard'
import ServiceGrowthHero from './templates/ServiceGrowthHero'
import CaviarEditorial from './templates/CaviarEditorial'
import CaviarCTA from './templates/CaviarCTA'

interface Props {
  slide: Slide
  brand: BrandConfig
  brandSlug: string
  onUpdate: (updated: Slide) => void
  onDropImage: (slideNumber: number, imageDataUrl: string) => void
}

export default function SlideEditor({ slide, brand, brandSlug, onUpdate, onDropImage }: Props) {
  const isServiceGrowth = brandSlug === 'servicegrowth-ai'
  const accentColor = isServiceGrowth
    ? brand.colors.accent?.cyan || '#00D4FF'
    : brand.colors.accent?.gold || '#C9A227'

  const dropRef = useRef<HTMLDivElement>(null)

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

  // Pick the right template
  const TemplateComponent = getTemplate(isServiceGrowth, slide)

  return (
    <div className="grid grid-cols-[1fr,400px] gap-6">
      {/* Live preview */}
      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="relative rounded-xl overflow-hidden border border-white/10"
        style={{ aspectRatio: '1/1', maxHeight: '600px' }}
      >
        <div
          style={{
            width: '1080px',
            height: '1080px',
            transform: 'scale(var(--preview-scale))',
            transformOrigin: 'top left',
          }}
          className="slide-render-target"
          data-slide-number={slide.number}
        >
          <TemplateComponent
            slide={slide}
            brand={brand}
            backgroundImage={slide.backgroundImage}
          />
        </div>

        {/* Drop overlay hint */}
        {!slide.backgroundImage && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
            <div className="bg-black/60 rounded-lg px-4 py-2 text-xs text-white/50">
              Drop image here
            </div>
          </div>
        )}
      </div>

      {/* Edit panel */}
      <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2">
        <h3 className="text-sm font-semibold text-white/80">
          Slide {slide.number} — Edit
        </h3>

        {/* Headline */}
        <div>
          <label className="block text-xs text-white/50 mb-1">
            Headline <span className="text-white/30">(*accent* words)</span>
          </label>
          <input
            type="text"
            value={slide.headline}
            onChange={(e) => onUpdate({ ...slide, headline: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-white/30"
          />
        </div>

        {/* Subtext */}
        <div>
          <label className="block text-xs text-white/50 mb-1">Subtext</label>
          <textarea
            value={slide.subtext}
            onChange={(e) => onUpdate({ ...slide, subtext: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-white/30 resize-none"
          />
        </div>

        {/* Bullets */}
        {slide.bullets && (
          <div>
            <label className="block text-xs text-white/50 mb-1">Bullets</label>
            {slide.bullets.map((bullet, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <span className="text-sm mt-2" style={{ color: accentColor }}>
                  •
                </span>
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => {
                    const updated = [...slide.bullets!]
                    updated[i] = e.target.value
                    onUpdate({ ...slide, bullets: updated })
                  }}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-white/30"
                />
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        {slide.cta !== undefined && slide.cta !== null && (
          <div>
            <label className="block text-xs text-white/50 mb-1">CTA</label>
            <input
              type="text"
              value={slide.cta || ''}
              onChange={(e) => onUpdate({ ...slide, cta: e.target.value || null })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-white/30"
            />
          </div>
        )}

        {/* Background image */}
        <div>
          <label className="block text-xs text-white/50 mb-1">Background Image</label>
          {slide.backgroundImage ? (
            <div className="flex items-center gap-2">
              <div
                className="w-12 h-12 rounded-lg bg-cover bg-center border border-white/10"
                style={{ backgroundImage: `url(${slide.backgroundImage})` }}
              />
              <button
                onClick={() => onUpdate({ ...slide, backgroundImage: undefined })}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          ) : (
            <p className="text-xs text-white/30">
              Drag & drop an image onto the preview, or use Generate Backgrounds
            </p>
          )}
        </div>

        {/* Layout info */}
        <div className="pt-2 border-t border-white/5">
          <p className="text-xs text-white/30">
            Layout: {slide.layout} | Purpose: {slide.purpose}
          </p>
        </div>
      </div>
    </div>
  )
}

function getTemplate(
  isServiceGrowth: boolean,
  slide: Slide
): React.ComponentType<{
  slide: Slide
  brand: BrandConfig
  backgroundImage?: string
}> {
  if (isServiceGrowth) {
    if (slide.layout === 'full-photo-overlay' || slide.number === 1) {
      return ServiceGrowthHero
    }
    return ServiceGrowthCard
  }
  if (slide.layout === 'full-bleed-cta' || slide.number === slide.totalSlides) {
    return CaviarCTA
  }
  return CaviarEditorial
}
