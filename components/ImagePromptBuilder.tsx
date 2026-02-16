'use client'

import { useState, useEffect } from 'react'
import { VisualConcept } from '@/lib/visual-concepts'
import { Slide } from '@/lib/types'

interface Props {
  slide: Slide
  concept: VisualConcept | null
  brandSlug: string
  accentColor: string
  onPromptChange: (prompt: string) => void
  onRefine: () => Promise<void>
  isRefining: boolean
}

export default function ImagePromptBuilder({
  slide,
  concept,
  brandSlug,
  accentColor,
  onPromptChange,
  onRefine,
  isRefining,
}: Props) {
  const [prompt, setPrompt] = useState(slide.compositionPrompt || '')
  const [showTemplate, setShowTemplate] = useState(false)

  // Update local state when slide changes
  useEffect(() => {
    setPrompt(slide.compositionPrompt || '')
  }, [slide.compositionPrompt, slide.number])

  const handlePromptChange = (value: string) => {
    setPrompt(value)
    onPromptChange(value)
  }

  const applyTemplate = () => {
    if (!concept) return

    // Build a starter prompt from the template
    const brandColors = brandSlug === 'servicegrowth-ai'
      ? 'dark #0D0D0D background, cyan #00D4FF accents, white text'
      : 'navy #1E3A5F, gold #C9A227 accents, cream #F5F0E6 background'

    const headline = slide.headline?.replace(/\*/g, '') || 'Your headline here'

    // Simple template fill
    let filled = concept.promptTemplate
      .replace('[HEADLINE]', headline)
      .replace('[BRAND_COLORS]', brandColors)
      .replace('[BACKGROUND_COLOR]', brandSlug === 'servicegrowth-ai' ? 'dark charcoal' : 'warm cream')
      .replace('[ACCENT_COLOR]', brandSlug === 'servicegrowth-ai' ? 'cyan #00D4FF' : 'gold #C9A227')
      .replace('[SUBTEXT]', slide.subtext || '')

    // Add placeholders for user to fill
    filled = filled
      .replace(/\[([A-Z_]+)\]/g, '[$1 - describe this]')

    handlePromptChange(filled)
    setShowTemplate(false)
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: `${accentColor}08`,
        border: `1px solid ${accentColor}25`,
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-[12px] font-semibold" style={{ color: accentColor }}>
              Slide {slide.number} Image Prompt
            </h4>
            <p className="text-[10px] text-white/30 mt-0.5">
              {slide.purpose} &mdash; &ldquo;{slide.headline?.replace(/\*/g, '').slice(0, 40)}&hellip;&rdquo;
            </p>
          </div>
          <div className="flex gap-2">
            {concept && (
              <button
                onClick={() => setShowTemplate(!showTemplate)}
                className="px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                {showTemplate ? 'Hide Template' : 'Use Template'}
              </button>
            )}
            <button
              onClick={onRefine}
              disabled={isRefining || !prompt.trim()}
              className="px-3 py-1.5 rounded-md text-[10px] font-medium transition-all disabled:opacity-30 cursor-pointer flex items-center gap-1.5"
              style={{
                background: `${accentColor}25`,
                border: `1px solid ${accentColor}40`,
                color: accentColor,
              }}
            >
              {isRefining ? (
                <>
                  <span className="animate-spin inline-block w-2.5 h-2.5 border-[1.5px] border-current/30 border-t-current rounded-full" />
                  Refining...
                </>
              ) : (
                'Refine with Claude'
              )}
            </button>
          </div>
        </div>

        {/* Template preview */}
        {showTemplate && concept && (
          <div className="mb-3 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-white/50">
                Template: {concept.name}
              </span>
              <button
                onClick={applyTemplate}
                className="px-2 py-1 rounded text-[9px] font-medium cursor-pointer"
                style={{ background: accentColor, color: '#000' }}
              >
                Apply to Prompt
              </button>
            </div>
            <pre className="text-[9px] text-white/30 whitespace-pre-wrap font-mono leading-relaxed">
              {concept.promptTemplate}
            </pre>
          </div>
        )}

        {/* Prompt textarea */}
        <textarea
          value={prompt}
          onChange={(e) => handlePromptChange(e.target.value)}
          rows={6}
          placeholder={concept
            ? `Describe your vision using the "${concept.name}" framework...`
            : "Describe exactly what you want in this slide: layout, figure, pose, colors, typography placement, mood..."
          }
          className="w-full px-3 py-2.5 rounded-lg text-[13px] text-white/90 placeholder-white/25 focus:outline-none transition-colors resize-none leading-relaxed"
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}50` }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
        />

        {/* Helper text */}
        <div className="mt-2 flex items-start gap-4 text-[10px] text-white/25">
          <div className="flex-1">
            <span className="text-white/40">Include:</span> figure pose, background, colors, typography placement, mood
          </div>
          <div className="text-right">
            {prompt.length} chars
          </div>
        </div>
      </div>
    </div>
  )
}
