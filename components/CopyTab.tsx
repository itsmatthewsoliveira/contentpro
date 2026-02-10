'use client'

import { Slide } from '@/lib/types'

interface Props {
  slide: Slide
  accentColor: string
  onSlideUpdate: (slide: Slide) => void
}

export default function CopyTab({ slide, accentColor, onSlideUpdate }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-medium tracking-wider uppercase text-white/30">
          Slide {slide.number} — {slide.purpose}
        </h3>
      </div>

      {/* Headline */}
      <div>
        <label className="block text-[10px] text-white/25 mb-1">Headline</label>
        <input
          type="text"
          value={slide.headline || ''}
          onChange={(e) => onSlideUpdate({ ...slide, headline: e.target.value })}
          className="w-full px-3 py-2 rounded-lg text-sm text-white/90 placeholder-white/20 focus:outline-none"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}33` }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
        />
      </div>

      {/* Subtext */}
      <div>
        <label className="block text-[10px] text-white/25 mb-1">Subtext</label>
        <textarea
          value={slide.subtext || ''}
          onChange={(e) => onSlideUpdate({ ...slide, subtext: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg text-sm text-white/80 placeholder-white/20 focus:outline-none resize-none"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}33` }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
        />
      </div>

      {/* Bullets */}
      {slide.bullets && slide.bullets.length > 0 && (
        <div>
          <label className="block text-[10px] text-white/25 mb-1">Bullets</label>
          {slide.bullets.map((bullet, i) => (
            <input
              key={i}
              type="text"
              value={bullet}
              onChange={(e) => {
                const newBullets = [...(slide.bullets || [])]
                newBullets[i] = e.target.value
                onSlideUpdate({ ...slide, bullets: newBullets })
              }}
              className="w-full px-3 py-1.5 rounded-lg text-[12px] text-white/70 placeholder-white/20 focus:outline-none mb-1"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            />
          ))}
        </div>
      )}

      {/* CTA */}
      {slide.cta !== undefined && (
        <div>
          <label className="block text-[10px] text-white/25 mb-1">CTA</label>
          <input
            type="text"
            value={slide.cta || ''}
            onChange={(e) => onSlideUpdate({ ...slide, cta: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-sm text-white/80 placeholder-white/20 focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          />
        </div>
      )}
    </div>
  )
}
