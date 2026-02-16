'use client'

import { useState, useRef } from 'react'
import { Slide } from '@/lib/types'

interface Props {
  slides: Slide[]
  selectedSlide: number
  onSelectSlide: (index: number) => void
  accentColor: string
  brandSlug: string
  approvedSlides: Set<number>
  onReorder?: (fromIndex: number, toIndex: number) => void
  onDelete?: (index: number) => void
  onDuplicate?: (index: number) => void
  onAdd?: () => void
}

export default function SlideList({
  slides,
  selectedSlide,
  onSelectSlide,
  accentColor,
  brandSlug,
  approvedSlides,
  onReorder,
  onDelete,
  onDuplicate,
  onAdd,
}: Props) {
  const isServiceGrowth = brandSlug === 'servicegrowth-ai'
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const [contextMenu, setContextMenu] = useState<{ index: number; y: number } | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== index) {
      setDropTarget(index)
    }
  }

  const handleDrop = (index: number) => {
    if (dragIndex !== null && dragIndex !== index && onReorder) {
      onReorder(dragIndex, index)
    }
    setDragIndex(null)
    setDropTarget(null)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDropTarget(null)
  }

  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault()
    const rect = listRef.current?.getBoundingClientRect()
    const y = e.clientY - (rect?.top || 0)
    setContextMenu({ index, y })
  }

  return (
    <div
      ref={listRef}
      className="flex flex-col gap-2 overflow-y-auto pr-1 relative"
      style={{ maxHeight: 'calc(100vh - 140px)' }}
      onClick={() => setContextMenu(null)}
    >
      {slides.map((slide, i) => {
        const isSelected = selectedSlide === i
        const hasImage = !!slide.generatedImage
        const isApproved = approvedSlides.has(slide.number)
        const isDragging = dragIndex === i
        const isDropTarget = dropTarget === i

        return (
          <div
            key={`${slide.number}-${i}`}
            draggable={!!onReorder}
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={() => handleDrop(i)}
            onDragEnd={handleDragEnd}
            onContextMenu={(e) => handleContextMenu(e, i)}
            className="group relative flex-shrink-0"
            style={{
              opacity: isDragging ? 0.4 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {/* Drop indicator */}
            {isDropTarget && (
              <div
                className="absolute -top-1 left-1 right-1 h-0.5 rounded-full"
                style={{ background: accentColor }}
              />
            )}

            <button
              onClick={() => onSelectSlide(i)}
              className="relative rounded-lg overflow-hidden transition-all cursor-pointer w-full"
              style={{
                width: 76,
                height: 76,
                border: isSelected
                  ? `2px solid ${accentColor}`
                  : '2px solid rgba(255,255,255,0.08)',
                opacity: isSelected ? 1 : 0.7,
              }}
            >
              {hasImage ? (
                <img
                  src={slide.generatedImage}
                  alt={`Slide ${slide.number}`}
                  className="w-full h-full object-cover pointer-events-none"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: isServiceGrowth
                      ? 'linear-gradient(135deg, #0A0A1A, #12122A)'
                      : 'linear-gradient(135deg, #1E3A5F, #5C4033)',
                  }}
                >
                  <span className="text-white/20 text-[10px] font-medium">{slide.number}</span>
                </div>
              )}

              {/* Status dot */}
              <div
                className="absolute top-1 right-1 w-2 h-2 rounded-full"
                style={{
                  background: isApproved
                    ? '#22c55e'
                    : hasImage
                      ? accentColor
                      : 'rgba(255,255,255,0.2)',
                }}
              />

              {/* Slide number */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-0.5">
                <span className="text-[9px] text-white/50 block text-center">{slide.number}</span>
              </div>

              {/* Drag handle */}
              {onReorder && (
                <div className="absolute top-1 left-1 opacity-0 hover:opacity-100 transition-opacity">
                  <svg className="w-3 h-3 text-white/30" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="9" cy="6" r="1.5" />
                    <circle cx="15" cy="6" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" />
                    <circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="18" r="1.5" />
                    <circle cx="15" cy="18" r="1.5" />
                  </svg>
                </div>
              )}
            </button>

            {/* Delete button — visible on hover */}
            {onDelete && slides.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(i) }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                style={{
                  background: 'rgba(239,68,68,0.9)',
                }}
                title="Delete slide"
              >
                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )
      })}

      {/* Add slide button */}
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex-shrink-0 rounded-lg flex items-center justify-center transition-all cursor-pointer"
          style={{
            width: 76,
            height: 36,
            border: '1px dashed rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.02)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${accentColor}40` }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
        >
          <svg className="w-3.5 h-3.5 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="absolute left-20 z-50 rounded-lg py-1 shadow-xl"
          style={{
            top: contextMenu.y,
            background: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.12)',
            minWidth: 120,
          }}
        >
          {onDuplicate && (
            <button
              onClick={() => { onDuplicate(contextMenu.index); setContextMenu(null) }}
              className="w-full text-left px-3 py-1.5 text-[11px] text-white/60 hover:text-white/90 hover:bg-white/5 transition-colors cursor-pointer"
            >
              Duplicate
            </button>
          )}
          {onDelete && slides.length > 1 && (
            <button
              onClick={() => { onDelete(contextMenu.index); setContextMenu(null) }}
              className="w-full text-left px-3 py-1.5 text-[11px] text-red-400/70 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
