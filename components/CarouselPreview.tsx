'use client'

import { Slide, BrandConfig } from '@/lib/types'
import SlidePreview from './SlidePreview'

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
  brand,
  brandSlug,
  imageErrors,
  selectedSlide,
  onSelectSlide,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/60">
          Carousel Preview — {slides.length} slides
        </h3>
      </div>

      {/* Horizontal scrollable carousel */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {slides.map((slide, index) => (
          <div key={index} className="flex-shrink-0">
            <SlidePreview
              slide={slide}
              brand={brand}
              brandSlug={brandSlug}
              isSelected={selectedSlide === index}
              onClick={() => onSelectSlide(index)}
              scale={0.28}
            />
            <p className="text-xs text-white/40 mt-2 text-center truncate max-w-[300px]">
              {slide.purpose || `Slide ${slide.number}`}
            </p>
            {imageErrors?.[slide.number] && (
              <p className="text-[11px] text-red-300/80 mt-1 text-center truncate max-w-[300px]">
                {imageErrors[slide.number]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
