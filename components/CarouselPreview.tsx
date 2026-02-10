'use client'

import { Slide, BrandConfig } from '@/lib/types'

interface Props {
  slides: Slide[]
  brand: BrandConfig
  brandSlug: string
  imageErrors?: Record<number, string>
  selectedSlide: number | null
  onSelectSlide: (index: number) => void
}

export default function CarouselPreview({
  slides,
  brandSlug,
  imageErrors,
  selectedSlide,
  onSelectSlide,
}: Props) {
  const isServiceGrowth = brandSlug === 'servicegrowth-ai'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/60">
          Carousel Preview — {slides.length} slides
        </h3>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {slides.map((slide, index) => (
          <div key={index} className="flex-shrink-0 cursor-pointer" onClick={() => onSelectSlide(index)}>
            <div
              className="w-[280px] rounded-lg overflow-hidden transition-all"
              style={{
                aspectRatio: '1/1',
                border: selectedSlide === index
                  ? '2px solid rgba(255,255,255,0.3)'
                  : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {slide.generatedImage ? (
                <img src={slide.generatedImage} alt={`Slide ${slide.number}`} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center p-4"
                  style={{
                    background: isServiceGrowth
                      ? 'linear-gradient(135deg, #0A0A1A, #12122A)'
                      : 'linear-gradient(135deg, #1E3A5F, #2a1a10)',
                  }}
                >
                  <p className="text-white/40 text-sm text-center">{slide.headline?.replace(/\*/g, '') || `Slide ${slide.number}`}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-white/40 mt-2 text-center truncate max-w-[280px]">
              {slide.purpose || `Slide ${slide.number}`}
            </p>
            {imageErrors?.[slide.number] && (
              <p className="text-[11px] text-red-300/80 mt-1 text-center truncate max-w-[280px]">
                {imageErrors[slide.number]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
