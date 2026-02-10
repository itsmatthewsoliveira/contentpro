'use client'

import { Slide } from '@/lib/types'
import StyleReferences from './StyleReferences'

interface Props {
  slide: Slide
  brandSlug: string
  accentColor: string
  globalDirection: string
  onGlobalDirectionChange: (value: string) => void
  onResetDirection: () => void
  onSlideUpdate: (slide: Slide) => void
}

export default function StyleTab({
  slide,
  brandSlug,
  accentColor,
  globalDirection,
  onGlobalDirectionChange,
  onResetDirection,
  onSlideUpdate,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Layout selector */}
      <div>
        <label className="block text-[10px] text-white/25 mb-1.5">Layout</label>
        <select
          value={slide.layout || 'headline-hero'}
          onChange={(e) => onSlideUpdate({ ...slide, layout: e.target.value })}
          className="w-full px-3 py-2 rounded-lg text-[12px] text-white/70 focus:outline-none appearance-none cursor-pointer"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <option value="headline-hero">Headline Hero</option>
          <option value="text-over-image">Text Over Image</option>
          <option value="chip-layout">Chip Layout</option>
          <option value="split-gradient">Split Gradient</option>
          <option value="center">Center</option>
          <option value="top-left">Top Left</option>
          <option value="top-center">Top Center</option>
        </select>
      </div>

      {/* Style References */}
      <StyleReferences brandSlug={brandSlug} accentColor={accentColor} />

      {/* Creative Direction */}
      <div
        className="rounded-xl p-4"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-medium tracking-wider uppercase text-white/30">
            Creative Direction
          </label>
          <button
            onClick={onResetDirection}
            className="text-[10px] text-white/20 hover:text-white/40 cursor-pointer"
          >
            Reset
          </button>
        </div>
        <textarea
          value={globalDirection}
          onChange={(e) => onGlobalDirectionChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg text-[12px] text-white/70 focus:outline-none resize-none leading-relaxed"
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}33` }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
        />
        <p className="mt-2 text-[10px] text-white/15">
          Applies to all slides. Describe the mood and visual approach.
        </p>
      </div>
    </div>
  )
}
