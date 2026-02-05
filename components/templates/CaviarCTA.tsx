'use client'

import { Slide, BrandConfig } from '@/lib/types'
import { formatHeadline } from './utils'

interface Props {
  slide: Slide
  brand: BrandConfig
  backgroundImage?: string
}

export default function CaviarCTA({ slide, brand, backgroundImage }: Props) {
  const colors = brand.colors
  const typo = brand.typography
  const gold = colors.accent?.gold || '#C9A227'

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
              background: `linear-gradient(170deg, ${colors.secondary?.navy || '#1A2F4A'} 0%, ${colors.primary.brownDark || '#3D2914'} 50%, ${colors.secondary?.blueDark || '#0F1F33'} 100%)`,
            }),
      }}
    >
      {/* Heavy overlay for CTA focus */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: backgroundImage
            ? 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.75) 100%)'
            : 'radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 100%)',
        }}
      />

      {/* Logo — centered top */}
      <div
        style={{
          position: 'absolute',
          top: '60px',
          left: '0',
          right: '0',
          textAlign: 'center',
          zIndex: 2,
        }}
      >
        <img
          src="/brands/caviar-pavers/logo.png"
          alt="Caviar Outdoor Designs"
          style={{ height: '56px', width: 'auto', objectFit: 'contain', display: 'inline-block' }}
        />
      </div>

      {/* Center content — CTA focus */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -45%)',
          textAlign: 'center',
          width: '78%',
          zIndex: 1,
        }}
      >
        {/* Gold decorative line */}
        <div
          style={{
            width: '50px',
            height: '2px',
            background: gold,
            margin: '0 auto 36px',
          }}
        />

        {/* Headline — large serif */}
        <h1
          style={{
            fontFamily: `${typo.headlineFont}, serif`,
            fontWeight: typo.headlineFontWeight,
            fontSize: '48px',
            color: colors.neutral?.white || '#FFFFFF',
            lineHeight: '1.1',
            marginBottom: '24px',
            letterSpacing: '0.01em',
          }}
          dangerouslySetInnerHTML={{
            __html: formatHeadline(slide.headline, gold, true),
          }}
        />

        {/* Subtext */}
        {slide.subtext && (
          <p
            style={{
              fontFamily: `${typo.bodyFont}, sans-serif`,
              fontSize: '17px',
              color: colors.neutral?.offWhite || '#FAF8F5',
              lineHeight: '1.55',
              marginBottom: '40px',
              maxWidth: '480px',
              marginLeft: 'auto',
              marginRight: 'auto',
              opacity: 0.85,
            }}
          >
            {slide.subtext}
          </p>
        )}

        {/* CTA Button — gold filled */}
        {slide.cta && (
          <div
            style={{
              display: 'inline-block',
              padding: '18px 52px',
              background: gold,
              color: colors.neutral?.charcoal || '#2C2C2C',
              fontFamily: `${typo.subheadFont || typo.bodyFont}, sans-serif`,
              fontWeight: '700',
              fontSize: '14px',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.1em',
            }}
          >
            {slide.cta}
          </div>
        )}

        {/* Website URL */}
        <div
          style={{
            marginTop: '32px',
            fontFamily: `${typo.subheadFont || typo.bodyFont}, sans-serif`,
            fontSize: '13px',
            color: colors.neutral?.warmGray || '#9A9186',
            letterSpacing: '0.06em',
          }}
        >
          {brand.website}
        </div>
      </div>

      {/* Location — bottom center */}
      <div
        style={{
          position: 'absolute',
          bottom: '32px',
          left: '0',
          right: '0',
          textAlign: 'center',
          fontFamily: `${typo.subheadFont || typo.bodyFont}, sans-serif`,
          fontSize: '10px',
          color: colors.neutral?.warmGray || '#9A9186',
          letterSpacing: '0.18em',
          textTransform: 'uppercase' as const,
          opacity: 0.6,
          zIndex: 2,
        }}
      >
        {brand.location}
      </div>
    </div>
  )
}
