'use client'

import { useState } from 'react'
import { BrandConfig } from '@/lib/types'

type InputMode = 'topic' | 'url'

interface Props {
  brand: BrandConfig
  brandSlug: string
  onGenerate: (topic: string, postType: string, slideCount: number) => void
  isGenerating: boolean
}

export default function TopicInput({ brand, brandSlug, onGenerate, isGenerating }: Props) {
  const [inputMode, setInputMode] = useState<InputMode>('topic')
  const [topic, setTopic] = useState('')
  const [url, setUrl] = useState('')
  const [isScraping, setIsScraping] = useState(false)
  const [scrapeError, setScrapeError] = useState<string | null>(null)
  const [postType, setPostType] = useState(Object.keys(brand.postTypes)[0])
  const [slideCount, setSlideCount] = useState(7)

  const isServiceGrowth = brandSlug === 'servicegrowth-ai'
  const accentColor = isServiceGrowth
    ? brand.colors.accent?.indigo || '#4F46E5'
    : brand.colors.accent?.gold || '#C9A227'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setScrapeError(null)

    if (inputMode === 'url') {
      if (!url.trim()) return
      setIsScraping(true)
      try {
        const res = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() }),
        })
        const data = await res.json()
        if (data.error) {
          setScrapeError(data.error)
          return
        }
        // Build a topic string from the scraped content
        const topicFromUrl = `Based on this article:\n\nTitle: ${data.title}\n\n${data.content}`
        onGenerate(topicFromUrl, postType, slideCount)
      } catch (err) {
        setScrapeError(err instanceof Error ? err.message : 'Failed to scrape URL')
      } finally {
        setIsScraping(false)
      }
    } else {
      if (!topic.trim()) return
      onGenerate(topic.trim(), postType, slideCount)
    }
  }

  const busy = isGenerating || isScraping

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mode toggle */}
      <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          type="button"
          onClick={() => setInputMode('topic')}
          className="flex-1 py-2 text-[10px] font-medium tracking-wider uppercase transition-all cursor-pointer"
          style={{
            background: inputMode === 'topic' ? `${accentColor}15` : 'transparent',
            color: inputMode === 'topic' ? accentColor : 'rgba(255,255,255,0.3)',
            borderRight: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          Topic
        </button>
        <button
          type="button"
          onClick={() => setInputMode('url')}
          className="flex-1 py-2 text-[10px] font-medium tracking-wider uppercase transition-all cursor-pointer"
          style={{
            background: inputMode === 'url' ? `${accentColor}15` : 'transparent',
            color: inputMode === 'url' ? accentColor : 'rgba(255,255,255,0.3)',
          }}
        >
          From URL
        </button>
      </div>

      {/* Input field */}
      <div>
        {inputMode === 'topic' ? (
          <>
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
              disabled={busy}
            />
          </>
        ) : (
          <>
            <label className="block text-[11px] font-medium tracking-[0.15em] uppercase text-white/30 mb-2">
              Blog or Article URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setScrapeError(null) }}
              placeholder="https://example.com/blog/your-article"
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: scrapeError ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.06)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}33` }}
              onBlur={(e) => { e.currentTarget.style.borderColor = scrapeError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.06)' }}
              disabled={busy}
            />
            {scrapeError && (
              <p className="mt-1.5 text-[10px] text-red-400/80">{scrapeError}</p>
            )}
            <p className="mt-1.5 text-[10px] text-white/15">
              Paste a blog post URL and we&apos;ll extract the content for your carousel
            </p>
          </>
        )}
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
            disabled={busy}
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
            disabled={busy}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Generate button */}
      <button
        type="submit"
        disabled={(inputMode === 'topic' ? !topic.trim() : !url.trim()) || busy}
        className="w-full py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        style={{
          background: busy ? `${accentColor}22` : accentColor,
          color: isServiceGrowth ? '#000000' : '#1a1a1a',
        }}
      >
        {isScraping ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />
            Extracting content...
          </span>
        ) : isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />
            Generating with Claude...
          </span>
        ) : inputMode === 'url' ? (
          'Extract & Generate Carousel'
        ) : (
          'Generate Carousel'
        )}
      </button>
    </form>
  )
}
