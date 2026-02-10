'use client'

import { Slide } from '@/lib/types'

interface Props {
  slide: Slide
  accentColor: string
  onSlideUpdate: (slide: Slide) => void
  onRegenerateSlide: (slideNumber: number) => void
  isGenerating: boolean
}

export default function ImageTab({
  slide,
  accentColor,
  onSlideUpdate,
  onRegenerateSlide,
  isGenerating,
}: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-medium tracking-wider uppercase text-white/30">
        Slide {slide.number} Image
      </h3>

      {/* Visual Concept */}
      {slide.imageDescription && (
        <div>
          <label className="block text-[10px] text-white/25 mb-1">Visual Concept</label>
          <textarea
            value={slide.imageDescription}
            onChange={(e) => onSlideUpdate({ ...slide, imageDescription: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-lg text-[12px] text-white/60 focus:outline-none resize-none leading-relaxed"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}33` }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
          />
        </div>
      )}

      {/* Composition Prompt */}
      <div>
        <label className="block text-[10px] text-white/25 mb-1">Composition Prompt</label>
        <textarea
          value={slide.compositionPrompt || ''}
          onChange={(e) => onSlideUpdate({ ...slide, compositionPrompt: e.target.value })}
          rows={5}
          className="w-full px-3 py-2 rounded-lg text-[11px] text-white/50 focus:outline-none resize-none leading-relaxed font-mono"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}33` }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
        />
        <p className="mt-1 text-[9px] text-white/15">
          This is the prompt sent to the image generation engine.
        </p>
      </div>

      {/* Generate This Slide */}
      <button
        onClick={() => onRegenerateSlide(slide.number)}
        disabled={isGenerating || !slide.compositionPrompt?.trim()}
        className="w-full py-2.5 rounded-lg text-[11px] font-medium transition-all disabled:opacity-30 cursor-pointer"
        style={{
          background: `${accentColor}15`,
          border: `1px solid ${accentColor}30`,
          color: accentColor,
        }}
      >
        {isGenerating ? 'Generating...' : 'Generate This Slide'}
      </button>
    </div>
  )
}
