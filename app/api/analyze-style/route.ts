import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const BRANDS_DIR = path.join(process.cwd(), 'brands')
const MAX_IMAGE_SIZE = 4 * 1024 * 1024 // 4MB limit for Claude
const MAX_DIMENSION = 1568 // Claude's recommended max dimension

// Resize and compress image to fit within Claude's limits
async function processImage(filePath: string): Promise<{ data: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' }> {
  const buffer = fs.readFileSync(filePath)

  // Check if already small enough
  if (buffer.length < MAX_IMAGE_SIZE) {
    const ext = path.extname(filePath).toLowerCase()
    const mediaType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
    return { data: buffer.toString('base64'), mediaType: mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' }
  }

  // Resize and compress with sharp
  let quality = 85
  let processed = await sharp(buffer)
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality })
    .toBuffer()

  // If still too large, reduce quality further
  while (processed.length > MAX_IMAGE_SIZE && quality > 30) {
    quality -= 10
    processed = await sharp(buffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer()
  }

  return { data: processed.toString('base64'), mediaType: 'image/jpeg' }
}

// Analyze style references and extract typography/design patterns
export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  }

  try {
    const { brandSlug } = await request.json()
    if (!brandSlug) {
      return NextResponse.json({ error: 'brandSlug required' }, { status: 400 })
    }

    const refDir = path.join(BRANDS_DIR, brandSlug, 'style-references')
    if (!fs.existsSync(refDir)) {
      return NextResponse.json({ error: 'No style references found' }, { status: 404 })
    }

    // Load up to 3 reference images
    const files = fs.readdirSync(refDir)
      .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
      .slice(0, 3)

    if (files.length === 0) {
      return NextResponse.json({ error: 'No images in style-references folder' }, { status: 404 })
    }

    // Process images (resize/compress if needed)
    const imageContents: Anthropic.ImageBlockParam[] = []
    for (const file of files) {
      const filePath = path.join(refDir, file)
      try {
        const { data, mediaType } = await processImage(filePath)
        imageContents.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data,
          },
        })
      } catch (err) {
        console.error(`Failed to process image ${file}:`, err)
        // Skip this image and continue with others
      }
    }

    if (imageContents.length === 0) {
      return NextResponse.json({ error: 'Failed to process any images' }, { status: 500 })
    }

    const client = new Anthropic({ apiKey })

    // Use Haiku for cost efficiency — this is analysis, not generation
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContents,
            {
              type: 'text',
              text: `Analyze these social media design references for VISUAL DESIGN TECHNIQUES only.

IMPORTANT:
- Do NOT extract colors (we will use our own brand colors)
- Do NOT extract any text content or language
- ONLY extract the DESIGN PATTERNS and TECHNIQUES

Return JSON with this structure:
{
  "fonts": {
    "primary": "Font style description (e.g., 'Bold serif like Playfair Display')",
    "secondary": "Font style description (e.g., 'Light sans-serif like Montserrat')",
    "accent": "Any script/decorative font style if present"
  },
  "typographyPatterns": [
    "Pattern 1 — e.g., 'Large bold headline + thin subhead below'",
    "Pattern 2 — e.g., 'Mixed weight in same line: bold keyword + light context'",
    "Pattern 3 — e.g., 'Stacked words vertically for impact'"
  ],
  "layoutPatterns": [
    "Layout 1 — e.g., 'Full-bleed photo with text in top-left corner'",
    "Layout 2 — e.g., 'Split layout: photo left, solid color with text right'",
    "Layout 3 — e.g., 'Typography-dominant with small photo accent'"
  ],
  "designElements": [
    "Element 1 — e.g., 'Thin horizontal accent lines as dividers'",
    "Element 2 — e.g., 'Small category tag in top corner'",
    "Element 3 — e.g., 'Rounded pill buttons for CTAs'"
  ],
  "promptGuidance": "2-3 sentences describing how to recreate this VISUAL STYLE (layouts, typography, elements) — do NOT mention specific colors, we will apply brand colors separately."
}

JSON only, no explanation.`,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonStr = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()

    try {
      const analysis = JSON.parse(jsonStr)

      // Save the analysis to a file for future use
      const analysisPath = path.join(BRANDS_DIR, brandSlug, 'style-analysis.json')
      fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2))

      return NextResponse.json(analysis)
    } catch {
      return NextResponse.json({ error: 'Failed to parse analysis', raw: text }, { status: 500 })
    }
  } catch (error) {
    console.error('Style analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}

// GET — retrieve cached analysis
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const brandSlug = searchParams.get('brand')

  if (!brandSlug) {
    return NextResponse.json({ error: 'brand parameter required' }, { status: 400 })
  }

  const analysisPath = path.join(BRANDS_DIR, brandSlug, 'style-analysis.json')

  if (!fs.existsSync(analysisPath)) {
    return NextResponse.json({ error: 'No analysis found. Run analysis first.' }, { status: 404 })
  }

  try {
    const content = fs.readFileSync(analysisPath, 'utf-8')
    return NextResponse.json(JSON.parse(content))
  } catch {
    return NextResponse.json({ error: 'Failed to read analysis' }, { status: 500 })
  }
}
