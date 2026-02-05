'use client'

import { useState } from 'react'
import JSZip from 'jszip'

interface Props {
  slideCount: number
  brandSlug: string
  accentColor: string
  getSlideImage?: (index: number) => string | undefined
}

export default function ExportButton({ slideCount, brandSlug, accentColor, getSlideImage }: Props) {
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleExport = async () => {
    setExporting(true)
    setProgress(0)

    try {
      const zip = new JSZip()

      for (let i = 0; i < slideCount; i++) {
        setProgress(i + 1)

        // Try to get the generated image data URL
        const imageUrl = getSlideImage?.(i)

        if (imageUrl && imageUrl.startsWith('data:')) {
          // Export from base64 data URL
          const response = await fetch(imageUrl)
          const blob = await response.blob()
          zip.file(`${brandSlug}-slide-${i + 1}.png`, blob)
        } else {
          // Fallback: try to find an img element with data-slide-number
          const img = document.querySelector(
            `[data-slide-number="${i + 1}"]`
          ) as HTMLImageElement | null

          if (img && img.src && img.src.startsWith('data:')) {
            const response = await fetch(img.src)
            const blob = await response.blob()
            zip.file(`${brandSlug}-slide-${i + 1}.png`, blob)
          }
        }
      }

      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `${brandSlug}-carousel.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setExporting(false)
      setProgress(0)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="px-5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all disabled:opacity-40 cursor-pointer"
      style={{
        background: accentColor,
        color: '#000000',
      }}
    >
      {exporting ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin inline-block w-3 h-3 border-[1.5px] border-current border-t-transparent rounded-full" />
          {progress}/{slideCount}
        </span>
      ) : (
        'Export PNGs'
      )}
    </button>
  )
}
