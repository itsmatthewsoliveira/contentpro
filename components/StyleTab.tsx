'use client'

import { Slide } from '@/lib/types'
import StyleReferences from './StyleReferences'

type TextLayout = 'bottom-stack' | 'center-bold' | 'editorial-split'

const TEXT_LAYOUTS: { id: TextLayout; name: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'bottom-stack',
    name: 'Bottom Stack',
    description: 'Text stacked at bottom',
    icon: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <rect x="0" y="0" width="40" height="40" rx="3" fill="rgba(255,255,255,0.05)" />
        <rect x="4" y="26" width="20" height="3" rx="1" fill="currentColor" opacity="0.8" />
        <rect x="4" y="31" width="14" height="2" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="4" y="35" width="10" height="1.5" rx="0.75" fill="currentColor" opacity="0.15" />
      </svg>
    ),
  },
  {
    id: 'center-bold',
    name: 'Center Bold',
    description: 'Big headline centered',
    icon: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <rect x="0" y="0" width="40" height="40" rx="3" fill="rgba(255,255,255,0.05)" />
        <rect x="6" y="15" width="28" height="4" rx="1" fill="currentColor" opacity="0.8" />
        <rect x="10" y="21" width="20" height="2" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="14" y="25" width="12" height="1.5" rx="0.75" fill="currentColor" opacity="0.15" />
      </svg>
    ),
  },
  {
    id: 'editorial-split',
    name: 'Editorial',
    description: 'Headline top, subtext bottom-right',
    icon: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <rect x="0" y="0" width="40" height="40" rx="3" fill="rgba(255,255,255,0.05)" />
        <rect x="4" y="6" width="16" height="3" rx="1" fill="currentColor" opacity="0.8" />
        <rect x="4" y="11" width="12" height="2" rx="1" fill="currentColor" opacity="0.5" />
        <rect x="22" y="30" width="14" height="2" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="26" y="34" width="10" height="1.5" rx="0.75" fill="currentColor" opacity="0.15" />
      </svg>
    ),
  },
]

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
  const currentLayout = (slide.textLayout || 'bottom-stack') as TextLayout

  return (
    <div className="space-y-4">
      {/* Text Layout Picker */}
      <div>
        <label className="block text-[10px] text-white/25 mb-2 uppercase tracking-wider">Text Layout</label>
        <div className="grid grid-cols-3 gap-2">
          {TEXT_LAYOUTS.map((layout) => {
            const isActive = currentLayout === layout.id
            return (
              <button
                key={layout.id}
                onClick={() => onSlideUpdate({ ...slide, textLayout: layout.id })}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all cursor-pointer"
                style={{
                  background: isActive ? `${accentColor}15` : 'rgba(255,255,255,0.02)',
                  border: isActive ? `1px solid ${accentColor}40` : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="w-10 h-10"
                  style={{ color: isActive ? accentColor : 'rgba(255,255,255,0.4)' }}
                >
                  {layout.icon}
                </div>
                <span
                  className="text-[9px] font-medium"
                  style={{ color: isActive ? accentColor : 'rgba(255,255,255,0.35)' }}
                >
                  {layout.name}
                </span>
              </button>
            )
          })}
        </div>
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
