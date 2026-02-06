import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const BRANDS_DIR = path.join(process.cwd(), 'brands')

function getRefDir(brandSlug: string): string {
  return path.join(BRANDS_DIR, brandSlug, 'style-references')
}

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  }
  return map[ext.toLowerCase()] || 'application/octet-stream'
}

// GET — list references or serve a specific file
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const brand = searchParams.get('brand')
  const file = searchParams.get('file')

  if (!brand) {
    return NextResponse.json({ error: 'brand parameter required' }, { status: 400 })
  }

  const refDir = getRefDir(brand)

  // Serve a specific file
  if (file) {
    const safeName = path.basename(file) // prevent path traversal
    const filePath = path.join(refDir, safeName)
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    const buffer = fs.readFileSync(filePath)
    const ext = path.extname(safeName)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': getMimeType(ext),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  // List all reference images
  try {
    if (!fs.existsSync(refDir)) {
      return NextResponse.json([])
    }

    const files = fs.readdirSync(refDir)
      .filter((f) => /\.(png|jpg|jpeg|webp|gif)$/i.test(f))
      .sort()

    const images = files.map((filename) => ({
      filename,
      url: `/api/references?brand=${encodeURIComponent(brand)}&file=${encodeURIComponent(filename)}`,
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

    const refDir = getRefDir(brand)
    if (!fs.existsSync(refDir)) {
      fs.mkdirSync(refDir, { recursive: true })
    }

    // Generate a clean filename
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `${timestamp}-${safeName}`
    const filePath = path.join(refDir, filename)

    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(filePath, buffer)

    return NextResponse.json({
      filename,
      url: `/api/references?brand=${encodeURIComponent(brand)}&file=${encodeURIComponent(filename)}`,
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

  const safeName = path.basename(file) // prevent path traversal
  const filePath = path.join(getRefDir(brand), safeName)

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete error:', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
