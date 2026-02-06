'use client'

import { useState, useEffect, useCallback } from 'react'

interface StyleAnalysis {
  fonts?: {
    primary?: string
    secondary?: string
    accent?: string
  }
  typographyPatterns?: string[]
  layoutPatterns?: string[]
  designElements?: string[]
  promptGuidance?: string
}

interface Props {
  brandSlug: string
  accentColor: string
}

export default function StyleAnalyzer({ brandSlug, accentColor }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [analysis, setAnalysis] = useState<StyleAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAnalysis = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/analyze-style?brand=${brandSlug}`)
      if (res.ok) {
        const data = await res.json()
        setAnalysis(data)
      }
    } catch {
      // No cached analysis — that's fine
    } finally {
      setIsLoading(false)
    }
  }, [brandSlug])

  // Load cached analysis on open
  useEffect(() => {
    if (isOpen && !analysis && !isLoading) {
      loadAnalysis()
    }
  }, [isOpen, analysis, isLoading, loadAnalysis])

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    setError(null)
    try {
      const res = await fetch('/api/analyze-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandSlug }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Analysis failed')
      }
      const data = await res.json()
      setAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors group"
        style={{ background: 'transparent' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-white/30 group-hover:text-white/50 transition-colors">
            Typography Analysis
          </span>
          {analysis && (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: `${accentColor}15`,
                color: `${accentColor}aa`,
              }}
            >
              ✓ analyzed
            </span>
          )}
        </div>
        <svg
          className="w-3.5 h-3.5 text-white/20 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          {/* Error */}
          {error && (
            <div
              className="text-[11px] px-3 py-2 rounded-lg"
              style={{
                background: 'rgba(255,60,60,0.06)',
                border: '1px solid rgba(255,60,60,0.12)',
                color: '#ff6b6b',
              }}
            >
              {error}
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <span
                className="animate-spin inline-block w-4 h-4 border-2 border-white/10 rounded-full"
                style={{ borderTopColor: accentColor }}
              />
            </div>
          )}

          {/* Analysis Results */}
          {analysis && !isLoading && (
            <div className="space-y-3">
              {/* Fonts */}
              <div>
                <h4 className="text-[10px] font-medium tracking-[0.1em] uppercase text-white/20 mb-1.5">
                  Fonts Detected
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {analysis.fonts?.primary && (
                    <div className="px-2 py-1.5 rounded-lg text-[11px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span className="text-white/30">Primary:</span>{' '}
                      <span className="text-white/70">{analysis.fonts.primary}</span>
                    </div>
                  )}
                  {analysis.fonts?.secondary && (
                    <div className="px-2 py-1.5 rounded-lg text-[11px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span className="text-white/30">Secondary:</span>{' '}
                      <span className="text-white/70">{analysis.fonts.secondary}</span>
                    </div>
                  )}
                  {analysis.fonts?.accent && (
                    <div className="px-2 py-1.5 rounded-lg text-[11px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span className="text-white/30">Accent:</span>{' '}
                      <span className="text-white/70">{analysis.fonts.accent}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Typography Patterns */}
              {analysis.typographyPatterns && analysis.typographyPatterns.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-medium tracking-[0.1em] uppercase text-white/20 mb-1.5">
                    Typography Patterns
                  </h4>
                  <ul className="space-y-1">
                    {analysis.typographyPatterns.map((pattern, i) => (
                      <li key={i} className="text-[11px] text-white/50 pl-2" style={{ borderLeft: `2px solid ${accentColor}33` }}>
                        {pattern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Prompt Guidance */}
              {analysis.promptGuidance && (
                <div>
                  <h4 className="text-[10px] font-medium tracking-[0.1em] uppercase text-white/20 mb-1.5">
                    AI Prompt Guidance
                  </h4>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    {analysis.promptGuidance}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* No analysis yet */}
          {!analysis && !isLoading && (
            <p className="text-[11px] text-white/30 text-center py-2">
              Analyze your references to extract typography patterns
            </p>
          )}

          {/* Analyze Button */}
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="w-full py-2 rounded-lg text-[11px] font-medium tracking-wide transition-all disabled:opacity-30 cursor-pointer flex items-center justify-center gap-2"
            style={{
              background: analysis ? 'rgba(255,255,255,0.03)' : `${accentColor}15`,
              border: `1px solid ${analysis ? 'rgba(255,255,255,0.06)' : `${accentColor}33`}`,
              color: analysis ? 'rgba(255,255,255,0.5)' : accentColor,
            }}
          >
            {isAnalyzing ? (
              <>
                <span
                  className="animate-spin inline-block w-3 h-3 border-[1.5px] border-white/20 rounded-full"
                  style={{ borderTopColor: accentColor }}
                />
                Analyzing with Claude...
              </>
            ) : analysis ? (
              'Re-analyze References'
            ) : (
              'Analyze Style References'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
