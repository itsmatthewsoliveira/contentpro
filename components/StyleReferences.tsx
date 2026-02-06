'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface ReferenceImage {
  filename: string
  url: string
  displayName?: string
  source?: 'runtime' | 'bundled'
}

interface Props {
  brandSlug: string
  accentColor: string
}

export default function StyleReferences({ brandSlug, accentColor }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [images, setImages] = useState<ReferenceImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchReferences = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/references?brand=${brandSlug}`)
      if (!res.ok) throw new Error('Failed to load references')
      const data = await res.json()
      setImages(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }, [brandSlug])

  useEffect(() => {
    if (isOpen && images.length === 0 && !isLoading) {
      fetchReferences()
    }
  }, [isOpen, images.length, isLoading, fetchReferences])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('brand', brandSlug)
      formData.append('file', file)
      const res = await fetch('/api/references', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }
      const newImage = await res.json()
      setImages((prev) => [...prev, newImage])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = async (filename: string) => {
    try {
      const res = await fetch(
        `/api/references?brand=${brandSlug}&file=${encodeURIComponent(filename)}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error('Delete failed')
      setImages((prev) => prev.filter((img) => img.filename !== filename))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header / Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors group"
        style={{ background: 'transparent' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-[11px] font-medium tracking-[0.15em] uppercase text-white/30 group-hover:text-white/50 transition-colors"
          >
            Style References
          </span>
          {images.length > 0 && (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: `${accentColor}15`,
                color: `${accentColor}aa`,
              }}
            >
              {images.length} loaded
            </span>
          )}
        </div>
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
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          {/* Error message */}
          {error && (
            <div
              className="text-[11px] px-3 py-2 rounded-lg"
              style={{
                background: 'rgba(255,60,60,0.06)',
                border: '1px solid rgba(255,60,60,0.12)',
                color: '#ff6b6b',
              }}
            >
              {error}
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <span
                className="animate-spin inline-block w-4 h-4 border-2 border-white/10 rounded-full"
                style={{ borderTopColor: accentColor }}
              />
            </div>
          )}

          {/* Thumbnail grid */}
          {!isLoading && images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img) => (
                <div
                  key={img.filename}
                  className="relative group/thumb aspect-square rounded-lg overflow-hidden"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <img
                    src={img.url}
                    alt={img.displayName || img.filename}
                    className="w-full h-full object-cover"
                  />
                  {/* Hover overlay with remove button */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                    {img.source !== 'bundled' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemove(img.filename)
                        }}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                        style={{
                          background: 'rgba(255,60,60,0.2)',
                          border: '1px solid rgba(255,60,60,0.3)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,60,60,0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,60,60,0.2)'
                        }}
                        title={`Remove ${img.displayName || img.filename}`}
                      >
                        <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    ) : (
                      <span className="text-[10px] text-white/60">Bundled</span>
                    )}
                  </div>
                  {/* Filename tooltip */}
                  <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-black/70 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                    <p className="text-[9px] text-white/60 truncate">{img.displayName || img.filename}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && images.length === 0 && (
            <div className="text-center py-4">
              <p className="text-[11px] text-white/20">No style references yet</p>
            </div>
          )}

          {/* Upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full py-2 rounded-lg text-[11px] font-medium tracking-wide transition-all disabled:opacity-30 cursor-pointer flex items-center justify-center gap-2"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px dashed rgba(255,255,255,0.1)`,
              color: 'rgba(255,255,255,0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${accentColor}44`
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
            }}
          >
            {isUploading ? (
              <>
                <span
                  className="animate-spin inline-block w-3 h-3 border-[1.5px] border-white/20 rounded-full"
                  style={{ borderTopColor: accentColor }}
                />
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Reference Image
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
