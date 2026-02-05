'use client'

import { Slide, BrandConfig } from '@/lib/types'
import ServiceGrowthCard from './templates/ServiceGrowthCard'
import ServiceGrowthHero from './templates/ServiceGrowthHero'
import CaviarEditorial from './templates/CaviarEditorial'
import CaviarCTA from './templates/CaviarCTA'

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

  const TemplateComponent = getTemplate(isServiceGrowth, slide)

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
        ...(isSelected
          ? {
              ringColor: isServiceGrowth
                ? brand.colors.accent?.cyan || '#00D4FF'
                : brand.colors.accent?.gold || '#C9A227',
            }
          : {}),
      }}
    >
      <div
        style={{
          width: '1080px',
          height: '1080px',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <TemplateComponent
          slide={slide}
          brand={brand}
          backgroundImage={slide.backgroundImage}
        />
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
    if (
      slide.layout === 'full-photo-overlay' ||
      slide.number === 1
    ) {
      return ServiceGrowthHero
    }
    return ServiceGrowthCard
  }

  // Caviar Pavers
  if (
    slide.layout === 'full-bleed-cta' ||
    slide.number === slide.totalSlides
  ) {
    return CaviarCTA
  }
  return CaviarEditorial
}
