'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrandConfig } from '@/lib/types'

interface BrandOption {
  slug: string
  config: BrandConfig
}

export default function Dashboard() {
  const router = useRouter()
  const [brands, setBrands] = useState<BrandOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/brands')
      .then((r) => r.json())
      .then((data) => {
        setBrands(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen relative grain">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-[#050510] to-black" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#00D4FF] opacity-[0.02] blur-[150px]" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#0033CC] opacity-[0.03] blur-[120px]" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">
        {/* Header */}
        <div className="text-center mb-20 animate-fade-in">
          <div className="text-[11px] font-medium tracking-[0.3em] uppercase text-white/25 mb-6">
            AI-Powered Content Engine
          </div>
          <h1
            className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Content Studio
          </h1>
          <div className="w-12 h-[2px] bg-[#00D4FF] mx-auto mb-6 opacity-60" />
          <p className="text-white/35 text-base max-w-md mx-auto leading-relaxed">
            Generate Instagram carousels with AI-crafted copy and visuals.
            Pick a brand to start.
          </p>
        </div>

        {/* Brand selection */}
        {loading ? (
          <div className="flex items-center gap-3 text-white/30">
            <span className="animate-spin inline-block w-4 h-4 border-[1.5px] border-white/15 border-t-white/50 rounded-full" />
            <span className="text-sm tracking-wide">Loading brands</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto w-full animate-fade-in-delay-1">
            {brands.map(({ slug, config }) => {
              const isServiceGrowth = slug === 'servicegrowth-ai'
              const accent = isServiceGrowth ? '#00D4FF' : '#C9A227'

              return (
                <button
                  key={slug}
                  onClick={() => router.push(`/generate?brand=${slug}`)}
                  className="group relative text-left rounded-2xl p-8 transition-all duration-300 cursor-pointer overflow-hidden"
                  style={{
                    background: '#0A0A0A',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${accent}33`
                    e.currentTarget.style.boxShadow = `0 0 60px ${accent}08`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Logo */}
                  <div className="mb-6">
                    <img
                      src={`/brands/${slug}/logo.png`}
                      alt={config.name}
                      className="h-10 w-auto object-contain"
                    />
                  </div>

                  {/* Brand name */}
                  <h2
                    className="text-xl font-bold text-white mb-1 tracking-tight"
                    style={{
                      fontFamily: isServiceGrowth ? 'Syne, sans-serif' : 'Playfair Display, serif',
                    }}
                  >
                    {config.name}
                  </h2>

                  {/* Tagline */}
                  <p className="text-xs font-medium tracking-wide mb-4" style={{ color: accent }}>
                    {config.tagline}
                  </p>

                  {/* Description */}
                  <p className="text-[13px] text-white/30 leading-relaxed mb-6">
                    {config.visualStyle.aesthetic}
                  </p>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between">
                    {/* Color swatches */}
                    <div className="flex gap-1.5">
                      {Object.entries(config.colors.accent || {})
                        .filter(([, v]) => typeof v === 'string' && (v as string).startsWith('#'))
                        .slice(0, 3)
                        .map(([key, color]) => (
                          <div
                            key={key}
                            className="w-3 h-3 rounded-full"
                            style={{ background: color as string }}
                          />
                        ))}
                    </div>

                    {/* Template count */}
                    <div className="text-[11px] text-white/20 tracking-wide">
                      {Object.keys(config.postTypes).length} templates
                    </div>
                  </div>

                  {/* Hover arrow */}
                  <div
                    className="absolute top-8 right-8 text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 -translate-x-2"
                    style={{ color: accent }}
                  >
                    →
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-24 text-center text-[11px] text-white/15 tracking-widest uppercase animate-fade-in-delay-3">
          Built for fast, iterative content creation
        </div>
      </div>
    </main>
  )
}
