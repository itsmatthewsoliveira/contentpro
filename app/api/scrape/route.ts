import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(request: Request) {
  try {
    const { url } = (await request.json()) as { url?: string }

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 })
    }

    // Validate URL
    let parsed: URL
    try {
      parsed = new URL(url)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol')
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Fetch the page
    const res = await fetch(parsed.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ContentStudio/1.0)',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${res.status}` },
        { status: 400 }
      )
    }

    const html = await res.text()
    const $ = cheerio.load(html)

    // Remove non-content elements
    $('script, style, nav, footer, header, aside, iframe, noscript, svg, form').remove()
    $('[role="navigation"], [role="banner"], [role="contentinfo"]').remove()

    // Extract metadata
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('title').text().trim() ||
      $('h1').first().text().trim() ||
      ''

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      ''

    // Extract main content — try article first, then main, then body
    const contentEl = $('article').length
      ? $('article')
      : $('main').length
        ? $('main')
        : $('[role="main"]').length
          ? $('[role="main"]')
          : $('body')

    // Get text from headings and paragraphs
    const sections: string[] = []

    contentEl.find('h1, h2, h3, h4, p, li, blockquote').each((_, el) => {
      const tag = (el as unknown as { tagName?: string }).tagName?.toLowerCase()
      const text = $(el).text().trim()
      if (!text || text.length < 10) return

      if (tag?.startsWith('h')) {
        sections.push(`## ${text}`)
      } else if (tag === 'blockquote') {
        sections.push(`> ${text}`)
      } else {
        sections.push(text)
      }
    })

    // Limit to ~4000 chars to fit in Claude's context
    let content = sections.join('\n\n')
    if (content.length > 4000) {
      content = content.slice(0, 4000) + '\n\n[Content truncated]'
    }

    if (content.length < 50) {
      return NextResponse.json(
        { error: 'Could not extract meaningful content from this URL' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      title,
      description,
      content,
      url: parsed.toString(),
    })
  } catch (error) {
    console.error('Scrape error:', error)
    const message = error instanceof Error ? error.message : 'Failed to scrape URL'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
