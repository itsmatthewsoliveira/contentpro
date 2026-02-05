'use client'

import { BrandConfig } from '@/lib/types'

interface BrandOption {
  slug: string
  config: BrandConfig
}

interface Props {
  brands: BrandOption[]
  onSelect: (slug: string, config: BrandConfig) => void
}

export default function BrandPicker({ brands, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
      {brands.map(({ slug, config }) => {
        const isServiceGrowth = slug === 'servicegrowth-ai'
        const accentColor = isServiceGrowth
          ? config.colors.accent?.cyan || '#00D4FF'
          : config.colors.accent?.gold || '#C9A227'
        const bgColor = isServiceGrowth
          ? config.colors.primary.background || '#0D0D0D'
          : config.colors.secondary?.navy || '#1A2F4A'

        return (
          <button
            key={slug}
            onClick={() => onSelect(slug, config)}
            className="group text-left rounded-2xl p-8 transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl border border-white/10"
            style={{ background: bgColor }}
          >
            {/* Brand name */}
            <h2
              className="text-2xl font-bold mb-2"
              style={{
                color: '#FFFFFF',
                fontFamily: isServiceGrowth
                  ? 'Inter, sans-serif'
                  : 'Playfair Display, serif',
              }}
            >
              {config.name}
            </h2>

            {/* Tagline */}
            <p
              className="text-sm mb-4"
              style={{ color: accentColor }}
            >
              {config.tagline}
            </p>

            {/* Description */}
            <p className="text-sm text-white/50 mb-6">
              {config.visualStyle.aesthetic}
            </p>

            {/* Color swatches */}
            <div className="flex gap-2 mb-4">
              {Object.entries(config.colors.accent || {})
                .filter(([, v]) => typeof v === 'string' && v.startsWith('#'))
                .slice(0, 3)
                .map(([key, color]) => (
                  <div
                    key={key}
                    className="w-6 h-6 rounded-full border border-white/20"
                    style={{ background: color as string }}
                    title={key}
                  />
                ))}
            </div>

            {/* Templates available */}
            <div className="text-xs text-white/30">
              {Object.keys(config.postTypes).length} templates available
            </div>

            {/* Arrow indicator */}
            <div
              className="mt-4 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: accentColor }}
            >
              Select →
            </div>
          </button>
        )
      })}
    </div>
  )
}
