'use client'

import { Slide, BrandConfig } from '@/lib/types'
import { formatHeadline } from './utils'

interface Props {
  slide: Slide
  brand: BrandConfig
  backgroundImage?: string
}

export default function CaviarEditorial({ slide, brand, backgroundImage }: Props) {
  const colors = brand.colors
  const typo = brand.typography
  const gold = colors.accent?.gold || '#C9A227'
  const navy = colors.secondary?.navy || '#1A2F4A'

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
              background: `linear-gradient(155deg, ${navy} 0%, ${colors.primary.brownDark || '#3D2914'} 60%, ${colors.secondary?.blueDark || '#0F1F33'} 100%)`,
            }),
      }}
    >
      {/* Cinematic gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: backgroundImage
            ? 'linear-gradient(180deg, rgba(26,47,74,0.25) 0%, rgba(0,0,0,0.65) 100%)'
            : 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)',
        }}
      />

      {/* Logo — top left, subtle */}
      <div
        style={{
          position: 'absolute',
          top: '32px',
          left: '40px',
          zIndex: 2,
        }}
      >
        <img
          src="/brands/caviar-pavers/logo.png"
          alt="Caviar Outdoor Designs"
          style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
        />
      </div>

      {/* Step number watermark — large, faded */}
      {slide.stepNumber && (
        <div
          style={{
            position: 'absolute',
            top: '50px',
            right: '50px',
            fontFamily: `${typo.headlineFont}, serif`,
            fontSize: '120px',
            fontWeight: '700',
            color: gold,
            opacity: 0.12,
            lineHeight: '1',
            zIndex: 1,
          }}
        >
          {String(slide.stepNumber).padStart(2, '0')}
        </div>
      )}

      {/* Content — lower left, editorial positioning */}
      <div
        style={{
          position: 'absolute',
          bottom: '72px',
          left: '56px',
          right: '56px',
          zIndex: 2,
        }}
      >
        {/* Tag pill */}
        {slide.tag && (
          <div
            style={{
              display: 'inline-block',
              padding: '7px 18px',
              background: gold,
              color: colors.neutral?.charcoal || '#2C2C2C',
              fontFamily: `${typo.subheadFont || typo.bodyFont}, sans-serif`,
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.12em',
              marginBottom: '20px',
            }}
          >
            {slide.tag}
          </div>
        )}

        {/* Gold accent line before headline */}
        <div
          style={{
            width: '40px',
            height: '2px',
            background: gold,
            marginBottom: '20px',
            opacity: 0.7,
          }}
        />

        {/* Headline — serif, editorial */}
        <h1
          style={{
            fontFamily: `${typo.headlineFont}, serif`,
            fontWeight: typo.headlineFontWeight,
            fontSize: '40px',
            color: colors.neutral?.white || '#FFFFFF',
            marginBottom: '16px',
            lineHeight: '1.15',
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
              fontWeight: '400',
              fontSize: '15px',
              color: colors.neutral?.offWhite || '#FAF8F5',
              lineHeight: '1.7',
              maxWidth: '580px',
              opacity: 0.85,
            }}
          >
            {slide.subtext}
          </p>
        )}

        {/* Bullets — with gold dash markers */}
        {slide.bullets && slide.bullets.length > 0 && (
          <ul style={{ listStyle: 'none', margin: '20px 0 0', padding: 0 }}>
            {slide.bullets.map((bullet, i) => (
              <li
                key={i}
                style={{
                  fontSize: '14px',
                  color: colors.neutral?.offWhite || '#FAF8F5',
                  marginBottom: '10px',
                  paddingLeft: '22px',
                  position: 'relative',
                  lineHeight: '1.5',
                  opacity: 0.85,
                }}
              >
                <span
                  style={{
                    color: gold,
                    position: 'absolute',
                    left: 0,
                    fontWeight: '700',
                  }}
                >
                  —
                </span>
                {bullet}
              </li>
            ))}
          </ul>
        )}

        {/* CTA — elegant bordered button */}
        {slide.cta && (
          <div
            style={{
              display: 'inline-block',
              marginTop: '28px',
              padding: '14px 36px',
              background: 'transparent',
              border: `1.5px solid ${gold}`,
              color: gold,
              fontFamily: `${typo.subheadFont || typo.bodyFont}, sans-serif`,
              fontWeight: '600',
              fontSize: '13px',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
            }}
          >
            {slide.cta}
          </div>
        )}
      </div>

      {/* Bottom right — slide counter */}
      <div
        style={{
          position: 'absolute',
          bottom: '32px',
          right: '40px',
          fontFamily: `${typo.subheadFont || typo.bodyFont}, sans-serif`,
          fontSize: '11px',
          color: colors.neutral?.warmGray || '#9A9186',
          letterSpacing: '0.08em',
          zIndex: 2,
        }}
      >
        {String(slide.number).padStart(2, '0')} / {String(slide.totalSlides).padStart(2, '0')}
      </div>
    </div>
  )
}
