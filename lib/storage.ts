import fs from 'fs'
import path from 'path'

export type ReferenceSource = 'runtime' | 'bundled'

export interface ReferenceEntry {
  id: string
  source: ReferenceSource
  filename: string
  filePath: string
}

const IMAGE_EXT_RE = /\.(png|jpg|jpeg|webp|gif)$/i
const RUNTIME_DATA_DIR = process.env.CONTENT_STUDIO_DATA_DIR || path.join(process.cwd(), '.content-studio-data')
const BRANDS_DIR = path.join(process.cwd(), 'brands')

function safeFilename(filename: string): string {
  return path.basename(filename)
}

function isImageFile(filename: string): boolean {
  return IMAGE_EXT_RE.test(filename)
}

function getRuntimeBrandDir(brandSlug: string): string {
  return path.join(RUNTIME_DATA_DIR, 'brands', brandSlug)
}

function getBundledBrandDir(brandSlug: string): string {
  return path.join(BRANDS_DIR, brandSlug)
}

function listImageEntriesFromDir(dir: string, source: ReferenceSource): ReferenceEntry[] {
  if (!fs.existsSync(dir)) return []

  const files = fs.readdirSync(dir)
    .filter(isImageFile)
    .map((filename) => {
      const filePath = path.join(dir, filename)
      const stat = fs.statSync(filePath)
      return {
        filename,
        filePath,
        mtimeMs: stat.mtimeMs,
      }
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs)

  return files.map(({ filename, filePath }) => ({
    id: `${source}:${filename}`,
    source,
    filename,
    filePath,
  }))
}

export function ensureRuntimeBrandDirs(brandSlug: string): void {
  const refDir = getRuntimeReferencesDir(brandSlug)
  fs.mkdirSync(refDir, { recursive: true })
}

export function getRuntimeReferencesDir(brandSlug: string): string {
  return path.join(getRuntimeBrandDir(brandSlug), 'style-references')
}

export function getBundledReferencesDir(brandSlug: string): string {
  return path.join(getBundledBrandDir(brandSlug), 'style-references')
}

export function getRuntimeStyleAnalysisPath(brandSlug: string): string {
  return path.join(getRuntimeBrandDir(brandSlug), 'style-analysis.json')
}

export function getBundledStyleAnalysisPath(brandSlug: string): string {
  return path.join(getBundledBrandDir(brandSlug), 'style-analysis.json')
}

export function listReferenceEntries(
  brandSlug: string,
  options: { limit?: number } = {}
): ReferenceEntry[] {
  const runtimeEntries = listImageEntriesFromDir(getRuntimeReferencesDir(brandSlug), 'runtime')
  const bundledEntries = listImageEntriesFromDir(getBundledReferencesDir(brandSlug), 'bundled')
  const combined = [...runtimeEntries, ...bundledEntries]

  if (typeof options.limit === 'number') {
    return combined.slice(0, options.limit)
  }
  return combined
}

export function resolveReferenceEntry(brandSlug: string, fileId: string): ReferenceEntry | null {
  const normalized = safeFilename(fileId)
  const [sourceRaw, ...rest] = normalized.split(':')

  if (rest.length > 0) {
    const source = sourceRaw === 'runtime' || sourceRaw === 'bundled' ? sourceRaw : null
    if (!source) return null
    const filename = safeFilename(rest.join(':'))
    if (!isImageFile(filename)) return null

    const filePath = source === 'runtime'
      ? path.join(getRuntimeReferencesDir(brandSlug), filename)
      : path.join(getBundledReferencesDir(brandSlug), filename)

    if (!fs.existsSync(filePath)) return null
    return {
      id: `${source}:${filename}`,
      source,
      filename,
      filePath,
    }
  }

  // Backward-compatible plain filename lookup: runtime first, bundled second.
  if (!isImageFile(normalized)) return null

  const runtimePath = path.join(getRuntimeReferencesDir(brandSlug), normalized)
  if (fs.existsSync(runtimePath)) {
    return {
      id: `runtime:${normalized}`,
      source: 'runtime',
      filename: normalized,
      filePath: runtimePath,
    }
  }

  const bundledPath = path.join(getBundledReferencesDir(brandSlug), normalized)
  if (fs.existsSync(bundledPath)) {
    return {
      id: `bundled:${normalized}`,
      source: 'bundled',
      filename: normalized,
      filePath: bundledPath,
    }
  }

  return null
}

export function readStyleAnalysis(brandSlug: string): Record<string, unknown> | null {
  const runtimePath = getRuntimeStyleAnalysisPath(brandSlug)
  if (fs.existsSync(runtimePath)) {
    return JSON.parse(fs.readFileSync(runtimePath, 'utf-8'))
  }

  const bundledPath = getBundledStyleAnalysisPath(brandSlug)
  if (fs.existsSync(bundledPath)) {
    return JSON.parse(fs.readFileSync(bundledPath, 'utf-8'))
  }

  return null
}

export function writeStyleAnalysis(brandSlug: string, data: Record<string, unknown>): string {
  ensureRuntimeBrandDirs(brandSlug)
  const analysisPath = getRuntimeStyleAnalysisPath(brandSlug)
  fs.writeFileSync(analysisPath, JSON.stringify(data, null, 2))
  return analysisPath
}

export function getMimeTypeForPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const map: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  }
  return map[ext] || 'application/octet-stream'
}
