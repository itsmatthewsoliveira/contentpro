import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import {
  ensureRuntimeBrandDirs,
  getMimeTypeForPath,
  getRuntimeReferencesDir,
  listReferenceEntries,
  resolveReferenceEntry,
} from '@/lib/storage'

// GET — list references or serve a specific file
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const brand = searchParams.get('brand')
  const file = searchParams.get('file')

  if (!brand) {
    return NextResponse.json({ error: 'brand parameter required' }, { status: 400 })
  }

  // Serve a specific file
  if (file) {
    const entry = resolveReferenceEntry(brand, file)
    if (!entry || !fs.existsSync(entry.filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    const buffer = fs.readFileSync(entry.filePath)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': getMimeTypeForPath(entry.filePath),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  // List all reference images
  try {
    const entries = listReferenceEntries(brand)
    const images = entries.map((entry) => ({
      filename: entry.id,
      displayName: entry.filename,
      source: entry.source,
      url: `/api/references?brand=${encodeURIComponent(brand)}&file=${encodeURIComponent(entry.id)}`,
    }))

    return NextResponse.json(images)
  } catch (err) {
    console.error('Failed to list references:', err)
    return NextResponse.json({ error: 'Failed to list references' }, { status: 500 })
  }
}

// POST — upload a new reference image
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const brand = formData.get('brand') as string
    const file = formData.get('file') as File

    if (!brand || !file) {
      return NextResponse.json({ error: 'brand and file are required' }, { status: 400 })
    }

    const ext = path.extname(file.name).toLowerCase()
    if (!['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) {
      return NextResponse.json({ error: 'Invalid file type. Use PNG, JPG, WebP, or GIF.' }, { status: 400 })
    }

    ensureRuntimeBrandDirs(brand)
    const refDir = getRuntimeReferencesDir(brand)

    // Generate a clean filename
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `${timestamp}-${safeName}`
    const filePath = path.join(refDir, filename)

    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(filePath, buffer)

    const fileId = `runtime:${filename}`
    return NextResponse.json({
      filename: fileId,
      displayName: filename,
      source: 'runtime',
      url: `/api/references?brand=${encodeURIComponent(brand)}&file=${encodeURIComponent(fileId)}`,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// DELETE — remove a reference image
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const brand = searchParams.get('brand')
  const file = searchParams.get('file')

  if (!brand || !file) {
    return NextResponse.json({ error: 'brand and file parameters required' }, { status: 400 })
  }

  const entry = resolveReferenceEntry(brand, file)

  try {
    if (!entry) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Allow deleting both runtime and bundled references
    if (fs.existsSync(entry.filePath)) {
      fs.unlinkSync(entry.filePath)
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete error:', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
