'use client'

import { useState } from 'react'
import { toPng } from 'html-to-image'
import JSZip from 'jszip'

interface Props {
  slideCount: number
  brandSlug: string
  accentColor: string
}

export default function ExportButton({ slideCount, brandSlug, accentColor }: Props) {
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleExport = async () => {
    setExporting(true)
    setProgress(0)

    try {
      const zip = new JSZip()

      for (let i = 1; i <= slideCount; i++) {
        setProgress(i)

        const el = document.querySelector(
          `[data-slide-number="${i}"]`
        ) as HTMLElement | null

        if (!el) continue

        const parent = el.parentElement
        const origStyle = parent?.style.cssText || ''

        if (parent) {
          parent.style.cssText = `
            position: fixed;
            top: -9999px;
            left: -9999px;
            width: 1080px;
            height: 1080px;
            overflow: hidden;
            z-index: -1;
          `
          el.style.transform = 'none'
        }

        const dataUrl = await toPng(el, {
          width: 1080,
          height: 1080,
          pixelRatio: 2,
          cacheBust: true,
        })

        if (parent) {
          parent.style.cssText = origStyle
          el.style.transform = ''
        }

        const response = await fetch(dataUrl)
        const blob = await response.blob()
        zip.file(`${brandSlug}-slide-${i}.png`, blob)
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
