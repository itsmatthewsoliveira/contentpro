'use client'

import { useState } from 'react'
import { VISUAL_CONCEPTS, VisualConcept } from '@/lib/visual-concepts'

interface Props {
  selectedConcept: string | null
  onSelect: (concept: VisualConcept) => void
  accentColor: string
}

export default function VisualConceptPicker({ selectedConcept, onSelect, accentColor }: Props) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
        style={{ background: 'transparent' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-white/40">
            Visual Concept
          </span>
          {selectedConcept && (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: `${accentColor}20`, color: accentColor }}
            >
              {VISUAL_CONCEPTS.find(c => c.id === selectedConcept)?.name}
            </span>
          )}
        </div>
        <svg
          className="w-3.5 h-3.5 text-white/20 transition-transform"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-[10px] text-white/30 mb-3">
            Choose a compositional framework — how should the visual EMBODY your message?
          </p>

          <div className="grid grid-cols-2 gap-2">
            {VISUAL_CONCEPTS.map((concept) => (
              <button
                key={concept.id}
                onClick={() => onSelect(concept)}
                className="text-left p-3 rounded-lg transition-all cursor-pointer group"
                style={{
                  background: selectedConcept === concept.id
                    ? `${accentColor}15`
                    : 'rgba(255,255,255,0.02)',
                  border: selectedConcept === concept.id
                    ? `1px solid ${accentColor}40`
                    : '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div
                  className="text-[11px] font-medium mb-1 transition-colors"
                  style={{
                    color: selectedConcept === concept.id ? accentColor : 'rgba(255,255,255,0.7)'
                  }}
                >
                  {concept.name}
                </div>
                <div className="text-[10px] text-white/30 leading-relaxed">
                  {concept.description}
                </div>
              </button>
            ))}
          </div>

          {selectedConcept && (
            <div
              className="mt-4 p-3 rounded-lg"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {(() => {
                const concept = VISUAL_CONCEPTS.find(c => c.id === selectedConcept)
                if (!concept) return null
                return (
                  <>
                    <div className="text-[10px] text-white/50 mb-2">
                      <span className="font-medium" style={{ color: accentColor }}>Metaphor:</span> {concept.metaphor}
                    </div>
                    <div className="text-[10px] text-white/50 mb-2">
                      <span className="font-medium" style={{ color: accentColor }}>Figure Role:</span> {concept.figureRole}
                    </div>
                    <div className="text-[10px] text-white/40">
                      <span className="font-medium text-white/50">Best for:</span> {concept.exampleUse}
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
