'use client'

import { Slide, BrandConfig } from '@/lib/types'
import { formatHeadline } from './utils'

interface Props {
  slide: Slide
  brand: BrandConfig
  backgroundImage?: string
}

export default function ServiceGrowthHero({ slide, brand, backgroundImage }: Props) {
  const colors = brand.colors
  const typo = brand.typography
  const cyan = colors.accent?.cyan || '#00D4FF'

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: `${typo.bodyFont}, sans-serif`,
        ...(backgroundImage
          ? {
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : {
              background: `linear-gradient(160deg, ${colors.primary.background} 0%, #0a1020 50%, ${colors.primary.backgroundAlt} 100%)`,
            }),
      }}
    >
      {/* Dark overlay for readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: backgroundImage
            ? 'linear-gradient(180deg, rgba(13,13,13,0.3) 0%, rgba(13,13,13,0.85) 70%)'
            : 'radial-gradient(ellipse at bottom left, rgba(0,212,255,0.06) 0%, transparent 50%)',
        }}
      />

      {/* Logo — top left */}
      <div
        style={{
          position: 'absolute',
          top: '32px',
          left: '40px',
          zIndex: 2,
        }}
      >
        <img
          src="/brands/servicegrowth-ai/logo.png"
          alt="ServiceGrowth AI"
          style={{ height: '56px', width: 'auto', objectFit: 'contain' }}
        />
      </div>

      {/* Category tag — top right area */}
      {slide.purpose && (
        <div
          style={{
            position: 'absolute',
            top: '36px',
            right: '40px',
            zIndex: 2,
            display: 'inline-block',
            padding: '6px 16px',
            background: `${cyan}18`,
            border: `1px solid ${cyan}33`,
            borderRadius: '20px',
            color: cyan,
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em',
          }}
        >
          {slide.purpose}
        </div>
      )}

      {/* Main content — lower portion */}
      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          left: '56px',
          right: '56px',
          zIndex: 1,
        }}
      >
        {/* Headline — large, dramatic */}
        <h1
          style={{
            fontFamily: `${typo.headlineFont}, sans-serif`,
            fontWeight: '800',
            fontSize: '52px',
            color: colors.text?.primary || '#FFFFFF',
            lineHeight: '1.05',
            marginBottom: '20px',
            letterSpacing: '-0.02em',
          }}
          dangerouslySetInnerHTML={{
            __html: formatHeadline(slide.headline, cyan),
          }}
        />

        {/* Subtext */}
        {slide.subtext && (
          <p
            style={{
              fontFamily: `${typo.bodyFont}, sans-serif`,
              fontSize: '18px',
              color: colors.text?.secondary || '#B0B0B0',
              lineHeight: '1.5',
              maxWidth: '680px',
            }}
          >
            {slide.subtext}
          </p>
        )}

        {/* Swipe indicator — only on slide 1 */}
        {slide.number === 1 && (
          <div
            style={{
              marginTop: '36px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            <span>Swipe for more</span>
            <span style={{ color: cyan, fontSize: '16px' }}>→</span>
          </div>
        )}

        {/* CTA */}
        {slide.cta && (
          <div
            style={{
              display: 'inline-block',
              marginTop: '32px',
              padding: '16px 40px',
              background: cyan,
              color: colors.primary.background || '#0D0D0D',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '16px',
            }}
          >
            {slide.cta}
          </div>
        )}
      </div>

      {/* Decorative accent line */}
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          height: '3px',
          background: `linear-gradient(90deg, ${cyan}, transparent)`,
          opacity: 0.4,
        }}
      />
    </div>
  )
}
