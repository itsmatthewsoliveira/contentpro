'use client'

import { useState } from 'react'
import { Slide } from '@/lib/types'
import StyleReferences from './StyleReferences'

type TextLayout = string

// Layout definitions with mini SVG icon data
// Each icon is a set of rects showing text position in a 40x40 viewbox
interface LayoutDef {
  id: string
  name: string
  category: string
  // Rects: [x, y, w, h, opacity] — representing text blocks
  rects: [number, number, number, number, number][]
}

const LAYOUTS: LayoutDef[] = [
  // Position
  { id: 'bottom-left',    name: 'Bottom Left',    category: 'Position', rects: [[4,26,20,3,0.8],[4,31,14,2,0.3],[4,35,10,1.5,0.15]] },
  { id: 'bottom-center',  name: 'Bottom Center',  category: 'Position', rects: [[10,26,20,3,0.8],[13,31,14,2,0.3],[15,35,10,1.5,0.15]] },
  { id: 'bottom-right',   name: 'Bottom Right',   category: 'Position', rects: [[16,26,20,3,0.8],[22,31,14,2,0.3],[26,35,10,1.5,0.15]] },
  { id: 'center',         name: 'Center',         category: 'Position', rects: [[8,16,24,3.5,0.8],[12,21,16,2,0.3],[14,25,12,1.5,0.15]] },
  { id: 'center-left',    name: 'Center Left',    category: 'Position', rects: [[4,16,18,3,0.8],[4,21,14,2,0.3],[4,25,10,1.5,0.15]] },
  { id: 'center-right',   name: 'Center Right',   category: 'Position', rects: [[18,16,18,3,0.8],[22,21,14,2,0.3],[26,25,10,1.5,0.15]] },
  { id: 'top-left',       name: 'Top Left',       category: 'Position', rects: [[4,5,20,3,0.8],[4,10,14,2,0.3],[4,14,10,1.5,0.15]] },
  { id: 'top-center',     name: 'Top Center',     category: 'Position', rects: [[10,5,20,3,0.8],[13,10,14,2,0.3],[15,14,10,1.5,0.15]] },
  { id: 'top-right',      name: 'Top Right',      category: 'Position', rects: [[16,5,20,3,0.8],[22,10,14,2,0.3],[26,14,10,1.5,0.15]] },
  // Scale
  { id: 'center-mega',    name: 'Mega',           category: 'Scale',    rects: [[4,14,32,5,0.8],[10,21,20,2.5,0.3],[14,25,12,1.5,0.15]] },
  { id: 'center-compact', name: 'Compact',        category: 'Scale',    rects: [[12,17,16,2.5,0.8],[14,21,12,1.5,0.3],[16,24,8,1,0.15]] },
  // Editorial
  { id: 'editorial-split',   name: 'Editorial',      category: 'Editorial', rects: [[4,6,16,3,0.8],[4,11,12,2,0.5],[22,30,14,2,0.3],[26,34,10,1.5,0.15]] },
  { id: 'editorial-reverse', name: 'Edit. Reverse',  category: 'Editorial', rects: [[20,6,16,3,0.8],[24,11,12,2,0.5],[4,30,14,2,0.3],[4,34,10,1.5,0.15]] },
  // Bar
  { id: 'bottom-bar',     name: 'Bottom Bar',     category: 'Bar',      rects: [[0,26,40,14,0.15],[4,28,20,3,0.7],[4,33,14,2,0.3]] },
  { id: 'top-bar',        name: 'Top Bar',        category: 'Bar',      rects: [[0,0,40,14,0.15],[4,3,20,3,0.7],[4,8,14,2,0.3]] },
  // Card
  { id: 'glass-card-center', name: 'Glass Center', category: 'Card',    rects: [[6,10,28,20,0.1],[10,14,20,3,0.8],[13,19,14,2,0.3],[15,23,10,1.5,0.15]] },
  { id: 'glass-card-bottom', name: 'Glass Bottom', category: 'Card',    rects: [[6,18,28,18,0.1],[10,22,20,3,0.8],[13,27,14,2,0.3],[15,31,10,1.5,0.15]] },
  // Creative
  { id: 'diagonal',       name: 'Diagonal',       category: 'Creative', rects: [[4,6,16,3,0.8],[4,11,12,2,0.4],[24,30,12,2,0.3],[28,34,8,1.5,0.15]] },
  { id: 'stacked-full',   name: 'Full Stack',     category: 'Creative', rects: [[4,14,28,4,0.8],[4,20,24,0.5,0.5],[4,23,20,2,0.3],[4,27,14,1.5,0.15]] },
  { id: 'cinema-wide',    name: 'Cinema',         category: 'Creative', rects: [[0,0,40,8,0.12],[0,32,40,8,0.12],[10,16,20,3,0.8],[13,21,14,2,0.3]] },
  { id: 'vertical-strip', name: 'Vert. Strip',    category: 'Creative', rects: [[0,0,17,40,0.15],[3,14,12,3,0.8],[3,19,10,2,0.3],[3,23,8,1.5,0.15]] },
  // Minimal
  { id: 'minimal-bottom', name: 'Min. Bottom',    category: 'Minimal',  rects: [[4,28,18,2.5,0.6],[4,32,12,1.5,0.25]] },
  { id: 'minimal-center', name: 'Min. Center',    category: 'Minimal',  rects: [[11,17,18,2.5,0.6],[14,21,12,1.5,0.25]] },
  { id: 'minimal-top',    name: 'Min. Top',       category: 'Minimal',  rects: [[4,7,18,2.5,0.6],[4,11,12,1.5,0.25]] },
  // Special
  { id: 'quote-style',    name: 'Quote',          category: 'Special',  rects: [[4,10,6,8,0.2],[4,20,24,3,0.8],[4,25,18,2,0.3]] },
  { id: 'stat-hero',      name: 'Stat Hero',      category: 'Special',  rects: [[8,12,24,8,0.7],[13,22,14,2,0.3],[15,26,10,1.5,0.15]] },
]

const CATEGORIES = ['Position', 'Scale', 'Editorial', 'Bar', 'Card', 'Creative', 'Minimal', 'Special']

interface Props {
  slide: Slide
  brandSlug: string
  accentColor: string
  globalDirection: string
  onGlobalDirectionChange: (value: string) => void
  onResetDirection: () => void
  onSlideUpdate: (slide: Slide) => void
}

export default function StyleTab({
  slide,
  brandSlug,
  accentColor,
  globalDirection,
  onGlobalDirectionChange,
  onResetDirection,
  onSlideUpdate,
}: Props) {
  const currentLayout = (slide.textLayout || 'bottom-left') as TextLayout
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Find current category
  const currentCategory = LAYOUTS.find(l => l.id === currentLayout)?.category || 'Position'

  return (
    <div className="space-y-4">
      {/* Text Layout Picker */}
      <div>
        <label className="block text-[10px] text-white/25 mb-2 uppercase tracking-wider">Text Layout</label>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1 mb-2">
          {CATEGORIES.map(cat => {
            const isActive = expandedCategory === cat || (!expandedCategory && cat === currentCategory)
            const count = LAYOUTS.filter(l => l.category === cat).length
            return (
              <button
                key={cat}
                onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
                className="px-2 py-1 rounded text-[8px] font-medium tracking-wider uppercase transition-all cursor-pointer"
                style={{
                  background: isActive ? `${accentColor}15` : 'rgba(255,255,255,0.02)',
                  border: isActive ? `1px solid ${accentColor}30` : '1px solid rgba(255,255,255,0.04)',
                  color: isActive ? accentColor : 'rgba(255,255,255,0.25)',
                }}
              >
                {cat} ({count})
              </button>
            )
          })}
        </div>

        {/* Layout grid for active category */}
        <div className="grid grid-cols-4 gap-1.5">
          {LAYOUTS
            .filter(l => l.category === (expandedCategory || currentCategory))
            .map(layout => {
              const isActive = currentLayout === layout.id
              return (
                <button
                  key={layout.id}
                  onClick={() => onSlideUpdate({ ...slide, textLayout: layout.id })}
                  className="flex flex-col items-center gap-1 p-1.5 rounded-md transition-all cursor-pointer"
                  style={{
                    background: isActive ? `${accentColor}15` : 'rgba(255,255,255,0.02)',
                    border: isActive ? `1px solid ${accentColor}40` : '1px solid rgba(255,255,255,0.04)',
                  }}
                  title={layout.name}
                >
                  <svg viewBox="0 0 40 40" className="w-8 h-8">
                    <rect x="0" y="0" width="40" height="40" rx="2" fill="rgba(255,255,255,0.03)" />
                    {layout.rects.map(([x, y, w, h, o], i) => (
                      <rect key={i} x={x} y={y} width={w} height={h} rx="0.75" fill={isActive ? accentColor : 'rgba(255,255,255,0.5)'} opacity={o} />
                    ))}
                  </svg>
                  <span
                    className="text-[7px] font-medium leading-tight text-center"
                    style={{ color: isActive ? accentColor : 'rgba(255,255,255,0.3)' }}
                  >
                    {layout.name}
                  </span>
                </button>
              )
            })}
        </div>
      </div>

      {/* Style References */}
      <StyleReferences brandSlug={brandSlug} accentColor={accentColor} />

      {/* Creative Direction */}
      <div
        className="rounded-xl p-4"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-medium tracking-wider uppercase text-white/30">
            Creative Direction
          </label>
          <button
            onClick={onResetDirection}
            className="text-[10px] text-white/20 hover:text-white/40 cursor-pointer"
          >
            Reset
          </button>
        </div>
        <textarea
          value={globalDirection}
          onChange={(e) => onGlobalDirectionChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg text-[12px] text-white/70 focus:outline-none resize-none leading-relaxed"
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}33` }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
        />
        <p className="mt-2 text-[10px] text-white/15">
          Applies to all slides. Describe the mood and visual approach.
        </p>
      </div>
    </div>
  )
}
