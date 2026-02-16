'use client'

import { Slide } from '@/lib/types'

interface Props {
  slide: Slide | null
  aspectRatio: '1:1' | '9:16'
  accentColor: string
  brandSlug: string
  isGenerating: boolean
  imageProgress: number
  approvedSlides: Set<number>
  onApprove: (slideNumber: number) => void
  onRegenerate: (slideNumber: number) => void
}

export default function SlidePreview({
  slide,
  aspectRatio,
  accentColor,
  brandSlug,
  isGenerating,
  imageProgress,
  approvedSlides,
  onApprove,
  onRegenerate,
}: Props) {
  const isServiceGrowth = brandSlug === 'servicegrowth-ai'

  if (!slide) {
    return (
      <div
        className="rounded-xl flex items-center justify-center"
        style={{
          aspectRatio: aspectRatio === '9:16' ? '9/16' : '1/1',
          maxHeight: aspectRatio === '9:16' ? 640 : 500,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <p className="text-white/20 text-sm">Generate copy to get started</p>
      </div>
    )
  }

  const isApproved = approvedSlides.has(slide.number)
  const isThisSlideGenerating = isGenerating && imageProgress === slide.number

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        aspectRatio: aspectRatio === '9:16' ? '9/16' : '1/1',
        maxHeight: aspectRatio === '9:16' ? 640 : 500,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {slide.generatedImage ? (
        <img
          src={slide.generatedImage}
          alt={`Slide ${slide.number}`}
          className="w-full h-full object-cover"
          data-slide-number={slide.number}
        />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-4 p-8"
          style={{
            background: isServiceGrowth
              ? 'linear-gradient(135deg, #0A0A1A, #12122A)'
              : 'linear-gradient(135deg, #1E3A5F, #2a1a10)',
          }}
        >
          <div className="text-white/50 text-center text-lg font-medium max-w-md">
            {slide.headline?.replace(/\*/g, '')}
          </div>
          <div className="text-white/30 text-center text-sm max-w-sm">
            {slide.subtext}
          </div>
          {!isGenerating && (
            <div className="mt-4 text-white/15 text-xs">
              Click &ldquo;Generate&rdquo; to create this slide&apos;s image
            </div>
          )}
        </div>
      )}

      {/* Loading overlay */}
      {isThisSlideGenerating && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span
            className="animate-spin inline-block w-8 h-8 border-[3px] border-white/10 rounded-full"
            style={{ borderTopColor: accentColor }}
          />
        </div>
      )}

      {/* Action buttons */}
      {slide.generatedImage && !isThisSlideGenerating && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <button
            onClick={() => onApprove(slide.number)}
            disabled={isApproved}
            className="px-3 py-1.5 rounded-lg text-[10px] font-medium cursor-pointer transition-all"
            style={{
              background: isApproved ? 'rgba(34,197,94,0.2)' : 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              border: isApproved
                ? '1px solid rgba(34,197,94,0.4)'
                : '1px solid rgba(255,255,255,0.1)',
              color: isApproved ? '#22c55e' : 'rgba(255,255,255,0.7)',
            }}
          >
            {isApproved ? 'Approved' : 'Approve'}
          </button>

          <button
            onClick={() => onRegenerate(slide.number)}
            disabled={isGenerating}
            className="px-3 py-1.5 rounded-lg text-[10px] font-medium cursor-pointer transition-all"
            style={{
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            Regenerate
          </button>
        </div>
      )}
    </div>
  )
}
