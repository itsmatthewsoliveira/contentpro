'use client'

import { Slide, BrandConfig } from '@/lib/types'
import { formatHeadline } from './utils'

interface Props {
  slide: Slide
  brand: BrandConfig
  backgroundImage?: string
}

export default function ServiceGrowthCard({ slide, brand, backgroundImage }: Props) {
  const colors = brand.colors
  const typo = brand.typography
  const cardStyle = brand.visualStyle.cardStyle

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
              background: `linear-gradient(145deg, ${colors.primary.background} 0%, #111111 40%, ${colors.primary.backgroundAlt} 100%)`,
            }),
      }}
    >
      {/* Subtle noise/texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: backgroundImage
            ? 'linear-gradient(180deg, rgba(13,13,13,0.5) 0%, rgba(13,13,13,0.7) 100%)'
            : 'radial-gradient(ellipse at top right, rgba(0,212,255,0.03) 0%, transparent 60%)',
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
          style={{ height: '52px', width: 'auto', objectFit: 'contain' }}
        />
      </div>

      {/* Slide number — top right */}
      <div
        style={{
          position: 'absolute',
          top: '36px',
          right: '40px',
          fontSize: '13px',
          color: colors.text?.muted || '#666666',
          fontFamily: `${typo.bodyFont}, sans-serif`,
          fontWeight: '500',
          letterSpacing: '0.05em',
          zIndex: 2,
        }}
      >
        {String(slide.number).padStart(2, '0')}/{String(slide.totalSlides).padStart(2, '0')}
      </div>

      {/* Card */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '84%',
          background: cardStyle?.background || 'rgba(22, 22, 22, 0.88)',
          border: cardStyle?.border || '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: cardStyle?.borderRadius || '20px',
          backdropFilter: `blur(${cardStyle?.backdropBlur || '24px'})`,
          WebkitBackdropFilter: `blur(${cardStyle?.backdropBlur || '24px'})`,
          padding: '44px 48px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          zIndex: 1,
        }}
      >
        {/* Icon row */}
        {slide.elements?.includes('icons') && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              gap: '12px',
              marginBottom: '28px',
            }}
          >
            {['🤖', '📊', '⚡', '🔗'].map((emoji, i) => (
              <div
                key={i}
                style={{
                  width: '44px',
                  height: '44px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                }}
              >
                {emoji}
              </div>
            ))}
          </div>
        )}

        {/* Headline */}
        <h1
          style={{
            fontFamily: `${typo.headlineFont}, sans-serif`,
            fontWeight: typo.headlineFontWeight,
            fontSize: '38px',
            color: colors.text?.primary || '#FFFFFF',
            marginBottom: slide.subtext || slide.bullets?.length ? '20px' : '0',
            lineHeight: '1.15',
            letterSpacing: '-0.01em',
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
              fontWeight: '400',
              fontSize: '16px',
              color: colors.text?.secondary || '#B0B0B0',
              lineHeight: '1.65',
              marginBottom: slide.bullets?.length ? '24px' : '0',
            }}
          >
            {slide.subtext}
          </p>
        )}

        {/* Bullets */}
        {slide.bullets && slide.bullets.length > 0 && (
          <ul style={{ listStyle: 'none', margin: '0', padding: 0 }}>
            {slide.bullets.map((bullet, i) => (
              <li
                key={i}
                style={{
                  fontSize: '15px',
                  color: colors.text?.primary || '#FFFFFF',
                  marginBottom: '14px',
                  paddingLeft: '28px',
                  position: 'relative',
                  lineHeight: '1.5',
                }}
              >
                {/* Colored bullet circle */}
                <span
                  style={{
                    position: 'absolute',
                    left: '0',
                    top: '7px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: cyan,
                  }}
                />
                {bullet}
              </li>
            ))}
          </ul>
        )}

        {/* CTA */}
        {slide.cta && (
          <div
            style={{
              display: 'inline-block',
              marginTop: '28px',
              padding: '14px 36px',
              background: cyan,
              color: colors.primary.background || '#0D0D0D',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '15px',
              letterSpacing: '0.01em',
            }}
          >
            {slide.cta}
          </div>
        )}
      </div>

      {/* Website watermark — bottom center */}
      <div
        style={{
          position: 'absolute',
          bottom: '28px',
          left: '0',
          right: '0',
          textAlign: 'center',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.08em',
          zIndex: 2,
        }}
      >
        servicegrowth.ai
      </div>
    </div>
  )
}
