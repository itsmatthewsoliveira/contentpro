'use client'

import { useState } from 'react'
import { Slide, BrandConfig } from '@/lib/types'
import TopicInput from './TopicInput'
import CopyTab from './CopyTab'
import ImageTab from './ImageTab'
import StyleTab from './StyleTab'

type Tab = 'copy' | 'image' | 'style'

interface Props {
  brand: BrandConfig
  brandSlug: string
  brief: { slides: Slide[]; caption: string; hashtags: string[] } | null
  currentSlide: Slide | null
  accentColor: string

  isGenerating: boolean
  isGeneratingImages: boolean
  onGenerateCopy: (topic: string, postType: string, slideCount: number) => void
  onRegenerateSlide: (slideNumber: number) => void

  globalDirection: string
  onGlobalDirectionChange: (value: string) => void
  onResetDirection: () => void

  onSlideUpdate: (slide: Slide) => void
}

export default function PropertiesPanel({
  brand,
  brandSlug,
  brief,
  currentSlide,
  accentColor,
  isGenerating,
  isGeneratingImages,
  onGenerateCopy,
  onRegenerateSlide,
  globalDirection,
  onGlobalDirectionChange,
  onResetDirection,
  onSlideUpdate,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('copy')

  // Before copy generation: show topic input
  if (!brief) {
    return (
      <div className="space-y-6">
        <div className="mb-2">
          <h2 className="text-[11px] font-medium tracking-wider uppercase text-white/40">
            New Carousel
          </h2>
        </div>

        <TopicInput
          brand={brand}
          brandSlug={brandSlug}
          onGenerate={onGenerateCopy}
          isGenerating={isGenerating}
        />

        {isGenerating && (
          <div className="flex items-center justify-center gap-3 py-4">
            <span
              className="animate-spin inline-block w-4 h-4 border-2 border-white/10 rounded-full"
              style={{ borderTopColor: accentColor }}
            />
            <span className="text-[11px] text-white/40">Writing copy...</span>
          </div>
        )}
      </div>
    )
  }

  // Tab buttons
  const tabs: { key: Tab; label: string }[] = [
    { key: 'copy', label: 'Copy' },
    { key: 'image', label: 'Image' },
    { key: 'style', label: 'Style' },
  ]

  return (
    <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
      {/* Tab bar */}
      <div
        className="flex rounded-lg overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 text-[10px] font-medium tracking-wider uppercase transition-all cursor-pointer"
            style={{
              background: activeTab === tab.key ? `${accentColor}15` : 'transparent',
              color: activeTab === tab.key ? accentColor : 'rgba(255,255,255,0.3)',
              borderRight: tab.key !== 'style' ? '1px solid rgba(255,255,255,0.08)' : undefined,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        className="rounded-xl p-4"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {currentSlide ? (
          <>
            {activeTab === 'copy' && (
              <CopyTab
                slide={currentSlide}
                accentColor={accentColor}
                onSlideUpdate={onSlideUpdate}
              />
            )}
            {activeTab === 'image' && (
              <ImageTab
                slide={currentSlide}
                accentColor={accentColor}
                onSlideUpdate={onSlideUpdate}
                onRegenerateSlide={onRegenerateSlide}
                isGenerating={isGeneratingImages}
              />
            )}
            {activeTab === 'style' && (
              <StyleTab
                slide={currentSlide}
                brandSlug={brandSlug}
                accentColor={accentColor}
                globalDirection={globalDirection}
                onGlobalDirectionChange={onGlobalDirectionChange}
                onResetDirection={onResetDirection}
                onSlideUpdate={onSlideUpdate}
              />
            )}
          </>
        ) : (
          <p className="text-[11px] text-white/20 text-center py-4">
            Select a slide to edit
          </p>
        )}
      </div>

      {/* New carousel button */}
      <button
        onClick={() => window.location.reload()}
        className="w-full py-2 rounded-lg text-[11px] text-white/20 hover:text-white/40 transition-colors cursor-pointer"
        style={{ border: '1px dashed rgba(255,255,255,0.08)' }}
      >
        + New Carousel
      </button>
    </div>
  )
}
