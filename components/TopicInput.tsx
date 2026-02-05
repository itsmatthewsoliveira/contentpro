'use client'

import { useState } from 'react'
import { BrandConfig } from '@/lib/types'

interface Props {
  brand: BrandConfig
  brandSlug: string
  onGenerate: (topic: string, postType: string, slideCount: number) => void
  isGenerating: boolean
}

export default function TopicInput({ brand, brandSlug, onGenerate, isGenerating }: Props) {
  const [topic, setTopic] = useState('')
  const [postType, setPostType] = useState(Object.keys(brand.postTypes)[0])
  const [slideCount, setSlideCount] = useState(7)

  const isServiceGrowth = brandSlug === 'servicegrowth-ai'
  const accentColor = isServiceGrowth
    ? brand.colors.accent?.cyan || '#00D4FF'
    : brand.colors.accent?.gold || '#C9A227'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return
    onGenerate(topic.trim(), postType, slideCount)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Topic */}
      <div>
        <label className="block text-[11px] font-medium tracking-[0.15em] uppercase text-white/30 mb-2">
          Topic
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={
            isServiceGrowth
              ? 'e.g., "How I automate lead qualification with AI"'
              : 'e.g., "5-step paver installation process"'
          }
          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}33` }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
          disabled={isGenerating}
        />
      </div>

      <div className="flex gap-3">
        {/* Post type */}
        <div className="flex-1">
          <label className="block text-[11px] font-medium tracking-[0.15em] uppercase text-white/30 mb-2">
            Template
          </label>
          <select
            value={postType}
            onChange={(e) => setPostType(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm text-white/70 focus:outline-none transition-colors appearance-none cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            disabled={isGenerating}
          >
            {Object.entries(brand.postTypes).map(([key, pt]) => (
              <option key={key} value={key}>
                {pt.description}
              </option>
            ))}
          </select>
        </div>

        {/* Slide count */}
        <div className="w-28">
          <label className="block text-[11px] font-medium tracking-[0.15em] uppercase text-white/30 mb-2">
            Slides
          </label>
          <select
            value={slideCount}
            onChange={(e) => setSlideCount(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl text-sm text-white/70 focus:outline-none transition-colors appearance-none cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            disabled={isGenerating}
          >
            {[5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Generate button */}
      <button
        type="submit"
        disabled={!topic.trim() || isGenerating}
        className="w-full py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        style={{
          background: isGenerating ? `${accentColor}22` : accentColor,
          color: isServiceGrowth ? '#000000' : '#1a1a1a',
        }}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />
            Generating with Claude...
          </span>
        ) : (
          'Generate Carousel'
        )}
      </button>
    </form>
  )
}
