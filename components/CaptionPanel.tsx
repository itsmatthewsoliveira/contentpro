'use client'

import { useState } from 'react'

interface Props {
  caption: string
  hashtags: string[]
  accentColor: string
  onCaptionChange: (caption: string) => void
  onHashtagsChange: (hashtags: string[]) => void
}

export default function CaptionPanel({
  caption,
  hashtags,
  accentColor,
  onCaptionChange,
  onHashtagsChange,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyAll = async () => {
    const hashtagStr = hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')
    const full = `${caption}\n\n${hashtagStr}`
    await navigator.clipboard.writeText(full)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRemoveHashtag = (index: number) => {
    onHashtagsChange(hashtags.filter((_, i) => i !== index))
  }

  const handleAddHashtag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = (e.target as HTMLInputElement).value.trim().replace(/^#/, '')
      if (value && !hashtags.includes(value)) {
        onHashtagsChange([...hashtags, value])
        ;(e.target as HTMLInputElement).value = ''
      }
    }
  }

  if (!caption && hashtags.length === 0) return null

  return (
    <div
      className="border-t"
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
    >
      {/* Toggle header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-3 cursor-pointer transition-colors"
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
      >
        <span className="text-[11px] font-medium tracking-wider uppercase text-white/30">
          Caption & Hashtags
        </span>
        <div className="flex items-center gap-3">
          {!isOpen && hashtags.length > 0 && (
            <span className="text-[10px] text-white/20">
              {hashtags.length} tags
            </span>
          )}
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
        </div>
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="px-6 pb-4 space-y-4">
          {/* Caption */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-white/25">Caption</label>
              <button
                onClick={handleCopyAll}
                className="text-[10px] font-medium cursor-pointer transition-colors"
                style={{ color: copied ? '#22c55e' : accentColor }}
              >
                {copied ? 'Copied!' : 'Copy All'}
              </button>
            </div>
            <textarea
              value={caption}
              onChange={(e) => onCaptionChange(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-[12px] text-white/70 focus:outline-none resize-none leading-relaxed"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            />
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-[10px] text-white/25 mb-2">Hashtags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {hashtags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] group"
                  style={{
                    background: `${accentColor}10`,
                    border: `1px solid ${accentColor}20`,
                    color: `${accentColor}aa`,
                  }}
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveHashtag(i)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ml-0.5"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Type and press Enter to add..."
              onKeyDown={handleAddHashtag}
              className="w-full px-3 py-1.5 rounded-lg text-[11px] text-white/60 placeholder-white/15 focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
