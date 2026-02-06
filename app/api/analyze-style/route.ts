import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'

const BRANDS_DIR = path.join(process.cwd(), 'brands')

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

    const imageContents: Anthropic.ImageBlockParam[] = files.map((file) => {
      const filePath = path.join(refDir, file)
      const buffer = fs.readFileSync(filePath)
      const ext = path.extname(file).toLowerCase()
      const mediaType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: buffer.toString('base64'),
        },
      }
    })

    const client = new Anthropic({ apiKey })

    // Use Haiku for cost efficiency — this is analysis, not generation
    const response = await client.messages.create({
      model: 'claude-haiku-3-5-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContents,
            {
              type: 'text',
              text: `Analyze these social media design references and extract the EXACT typography and design patterns. Be specific and technical.

Return JSON with this structure:
{
  "fonts": {
    "primary": "Font name and weight (e.g., Playfair Display Bold)",
    "secondary": "Font name and weight (e.g., Montserrat Light)",
    "accent": "Any script/decorative font if present"
  },
  "typographyPatterns": [
    "Pattern 1 — e.g., 'Large serif headline (80px) + thin sans-serif subhead (24px)'",
    "Pattern 2 — e.g., 'Mixed weight in same line: bold keyword + light context'"
  ],
  "colorUsage": {
    "backgrounds": ["#hex values observed"],
    "text": ["#hex values for text"],
    "accents": ["#hex accent colors"]
  },
  "layoutPatterns": [
    "Layout 1 description",
    "Layout 2 description"
  ],
  "designElements": [
    "Element 1 — e.g., 'Thin gold horizontal lines as dividers'",
    "Element 2 — e.g., 'Top navigation bar with category left, brand right'"
  ],
  "promptGuidance": "A 2-3 sentence summary of how to prompt an AI image generator to recreate this exact style. Be specific about fonts, sizes, weights, colors, and layout."
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
