'use client'

import { useState, useEffect } from 'react'
import { BrandConfig } from '@/lib/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  brandSlug: string
  brand: BrandConfig
  accentColor: string
  onBrandUpdate: (config: BrandConfig) => void
}

type Section = 'colors' | 'typography' | 'style' | 'voice'

export default function BrandKitModal({
  isOpen,
  onClose,
  brandSlug,
  brand,
  accentColor,
  onBrandUpdate,
}: Props) {
  const [activeSection, setActiveSection] = useState<Section>('colors')
  const [draft, setDraft] = useState<BrandConfig>(brand)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDraft(brand)
  }, [brand])

  if (!isOpen) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/brand-kit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandSlug, config: draft }),
      })
      if (!res.ok) throw new Error('Save failed')
      onBrandUpdate(draft)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const updateColor = (section: string, key: string, value: string) => {
    setDraft({
      ...draft,
      colors: {
        ...draft.colors,
        [section]: {
          ...(draft.colors[section as keyof typeof draft.colors] as Record<string, string> || {}),
          [key]: value,
        },
      },
    })
  }

  const sections: { key: Section; label: string }[] = [
    { key: 'colors', label: 'Colors' },
    { key: 'typography', label: 'Typography' },
    { key: 'style', label: 'Visual Style' },
    { key: 'voice', label: 'Voice' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl flex flex-col"
        style={{
          background: '#0d0d1a',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div>
            <h2 className="text-sm font-semibold text-white/90">Brand Kit</h2>
            <p className="text-[11px] text-white/30 mt-0.5">{brand.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
              style={{
                background: saved ? 'rgba(34,197,94,0.2)' : `${accentColor}20`,
                border: saved ? '1px solid rgba(34,197,94,0.4)' : `1px solid ${accentColor}40`,
                color: saved ? '#22c55e' : accentColor,
              }}
            >
              {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
            </button>
            <button
              onClick={onClose}
              className="text-white/30 hover:text-white/60 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Section tabs */}
        <div
          className="flex px-6 gap-1 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className="px-3 py-2.5 text-[10px] font-medium tracking-wider uppercase transition-all cursor-pointer"
              style={{
                color: activeSection === s.key ? accentColor : 'rgba(255,255,255,0.3)',
                borderBottom: activeSection === s.key ? `2px solid ${accentColor}` : '2px solid transparent',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeSection === 'colors' && (
            <ColorsEditor colors={draft.colors} onUpdate={updateColor} accentColor={accentColor} />
          )}
          {activeSection === 'typography' && (
            <TypographyEditor
              typography={draft.typography}
              onChange={(t) => setDraft({ ...draft, typography: t })}
              accentColor={accentColor}
            />
          )}
          {activeSection === 'style' && (
            <StyleEditor
              visualStyle={draft.visualStyle}
              onChange={(vs) => setDraft({ ...draft, visualStyle: vs })}
              accentColor={accentColor}
            />
          )}
          {activeSection === 'voice' && (
            <VoiceEditor
              voice={draft.contentVoice}
              onChange={(v) => setDraft({ ...draft, contentVoice: v })}
              accentColor={accentColor}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-editors ──

function ColorsEditor({
  colors,
  onUpdate,
  accentColor,
}: {
  colors: BrandConfig['colors']
  onUpdate: (section: string, key: string, value: string) => void
  accentColor: string
}) {
  const colorSections = ['primary', 'accent', 'text', 'secondary', 'neutral'] as const
  return (
    <div className="space-y-4">
      {colorSections.map((section) => {
        const sectionColors = colors[section]
        if (!sectionColors || typeof sectionColors !== 'object') return null

        return (
          <div key={section}>
            <h4 className="text-[10px] font-medium tracking-wider uppercase text-white/30 mb-2">
              {section}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(sectionColors as Record<string, string>).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={typeof val === 'string' && val.startsWith('#') ? val : '#000000'}
                    onChange={(e) => onUpdate(section, key, e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-white/40 block truncate">{key}</span>
                    <input
                      type="text"
                      value={typeof val === 'string' ? val : ''}
                      onChange={(e) => onUpdate(section, key, e.target.value)}
                      className="w-full text-[11px] text-white/70 bg-transparent focus:outline-none font-mono"
                      onFocus={(e) => { e.currentTarget.style.color = accentColor }}
                      onBlur={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TypographyEditor({
  typography,
  onChange,
  accentColor,
}: {
  typography: BrandConfig['typography']
  onChange: (t: BrandConfig['typography']) => void
  accentColor: string
}) {
  const field = (label: string, key: keyof typeof typography, value: string) => (
    <div key={key}>
      <label className="block text-[10px] text-white/25 mb-1">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange({ ...typography, [key]: e.target.value })}
        className="w-full px-3 py-2 rounded-lg text-[12px] text-white/70 focus:outline-none"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}33` }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
      />
    </div>
  )

  return (
    <div className="space-y-3">
      {field('Headline Font', 'headlineFont', typography.headlineFont)}
      {field('Headline Weight', 'headlineFontWeight', typography.headlineFontWeight)}
      {field('Body Font', 'bodyFont', typography.bodyFont)}
      {field('Body Weight', 'bodyFontWeight', typography.bodyFontWeight)}
    </div>
  )
}

function StyleEditor({
  visualStyle,
  onChange,
  accentColor,
}: {
  visualStyle: BrandConfig['visualStyle']
  onChange: (vs: BrandConfig['visualStyle']) => void
  accentColor: string
}) {
  const textarea = (label: string, key: keyof typeof visualStyle, rows: number) => (
    <div key={key}>
      <label className="block text-[10px] text-white/25 mb-1">{label}</label>
      <textarea
        value={(visualStyle[key] as string) || ''}
        onChange={(e) => onChange({ ...visualStyle, [key]: e.target.value })}
        rows={rows}
        className="w-full px-3 py-2 rounded-lg text-[12px] text-white/60 focus:outline-none resize-none leading-relaxed"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}33` }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
      />
    </div>
  )

  return (
    <div className="space-y-3">
      {textarea('Aesthetic', 'aesthetic', 2)}
      {textarea('Image Guidance', 'imageGuidance', 4)}
      {textarea('Negative Prompt (DO NOT)', 'negativePrompt', 3)}
    </div>
  )
}

function VoiceEditor({
  voice,
  onChange,
  accentColor,
}: {
  voice: BrandConfig['contentVoice']
  onChange: (v: BrandConfig['contentVoice']) => void
  accentColor: string
}) {
  const field = (label: string, key: keyof typeof voice, value: string) => (
    <div key={key}>
      <label className="block text-[10px] text-white/25 mb-1">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange({ ...voice, [key]: e.target.value })}
        className="w-full px-3 py-2 rounded-lg text-[12px] text-white/70 focus:outline-none"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}33` }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
      />
    </div>
  )

  return (
    <div className="space-y-3">
      {field('Tone', 'tone', voice.tone)}
      {field('Perspective', 'perspective', voice.perspective)}
      {field('CTA Style', 'ctaStyle', voice.ctaStyle)}
      <div>
        <label className="block text-[10px] text-white/25 mb-1">Hooks (one per line)</label>
        <textarea
          value={(voice.hooks || []).join('\n')}
          onChange={(e) => onChange({ ...voice, hooks: e.target.value.split('\n').filter(Boolean) })}
          rows={4}
          className="w-full px-3 py-2 rounded-lg text-[12px] text-white/60 focus:outline-none resize-none leading-relaxed"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}33` }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
        />
      </div>
    </div>
  )
}
