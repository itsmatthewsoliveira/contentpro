'use client'

import { Slide, BrandConfig } from '@/lib/types'

interface Props {
  slide: Slide
  brand: BrandConfig
  brandSlug: string
  isSelected?: boolean
  onClick?: () => void
  scale?: number
}

export default function SlidePreview({
  slide,
  brand,
  brandSlug,
  isSelected,
  onClick,
  scale = 0.3,
}: Props) {
  const isServiceGrowth = brandSlug === 'servicegrowth-ai'
  const accentColor = isServiceGrowth
    ? brand.colors.accent?.cyan || '#00D4FF'
    : brand.colors.accent?.gold || '#C9A227'

  const hasImage = slide.generatedImage || slide.backgroundImage
  const imageUrl = slide.generatedImage || slide.backgroundImage

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer transition-all duration-200 rounded-lg overflow-hidden ${
        isSelected
          ? 'ring-2 ring-offset-2 ring-offset-neutral-900'
          : 'hover:ring-1 hover:ring-white/20'
      }`}
      style={{
        width: `${1080 * scale}px`,
        height: `${1080 * scale}px`,
        ...(isSelected ? { ringColor: accentColor } : {}),
      }}
      data-slide-number={slide.number}
    >
      {hasImage ? (
        <img
          src={imageUrl}
          alt={`Slide ${slide.number}`}
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        /* Placeholder when no image generated yet */
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-3 p-4"
          style={{
            background: isServiceGrowth
              ? 'linear-gradient(135deg, #0D0D0D, #111118)'
              : 'linear-gradient(135deg, #1E3A5F, #2a1a10)',
          }}
        >
          <div
            className="text-center font-bold leading-tight"
            style={{
              fontSize: `${Math.max(11, 14 * scale / 0.3)}px`,
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            {slide.headline?.replace(/\*/g, '')}
          </div>
          <div
            className="text-center leading-snug"
            style={{
              fontSize: `${Math.max(8, 10 * scale / 0.3)}px`,
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            {slide.subtext}
          </div>
          <div
            className="mt-2 px-2 py-0.5 rounded text-center"
            style={{
              fontSize: `${Math.max(7, 8 * scale / 0.3)}px`,
              background: `${accentColor}22`,
              color: accentColor,
            }}
          >
            Slide {slide.number} — Click Generate
          </div>
        </div>
      )}
    </div>
  )
}
