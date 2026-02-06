# CLAUDE.md — Content Studio v2

## What This Is

A Next.js 14 web app that generates Instagram carousel slides for multiple brands. User enters a topic → Claude generates copy + structured composition data → an image generation engine (GPT-4o OR Gemini, user picks) renders the complete slide images → logo overlay is composited programmatically.

The app supports **side-by-side engine comparison** so the user can generate the same carousel with both GPT-4o and Gemini and compare quality.

---

## Current State

There are TWO projects:
1. **CLI Project** (`/content-studio`) — Original Node.js command-line tool (legacy)
2. **Web UI** (`/content-studio-ui`) — Next.js 14 web app (active development)

The Web UI is the primary focus. It already has working:
- Brand selection (ServiceGrowth AI, Caviar Pavers)
- Claude copy generation with composition prompts
- Gemini image generation (Pro and Flash models)
- Style reference upload and analysis
- Logo overlay compositing
- ZIP export

---

## The Problem We're Solving

Current output has these issues:
1. **Typography is inconsistent** — Gemini renders mixed fonts poorly, misspells words, uses wrong font styles
2. **Visual coherence breaks across slides** — Each slide looks like it came from a different brand
3. **Portuguese text bleeds in** — Brazilian design references leak Portuguese into English-brand output
4. **Pink/maroon script fonts appear on tech brand** — Caviar Pavers aesthetic bleeds into ServiceGrowth AI
5. **Generic AI stock imagery** — Suited businessman grabbing head, woman touching holographic dashboard

---

## CRITICAL CAVEATS (Lessons Learned)

### 1. NEVER Send Style Reference Images to Image APIs
The previous version sent reference PNGs to Gemini and it caused massive style bleeding — Portuguese text, wrong colors, wrong fonts all leaked in. All style guidance must be in the TEXT prompt only. Reference images are for Claude's style analysis, NOT for image generation.

### 2. Brand Colors Must Be Hardcoded in Prompts
Don't let Claude or any AI "detect" colors from references. Explicitly state the EXACT hex codes:
- ServiceGrowth AI: `#0D0D0D` background, `#00D4FF` cyan accent, `#FFFFFF` white text
- Caviar Pavers: `#1E3A5F` navy, `#5C4033` brown, `#C9A227` gold, `#F5F0E6` cream

### 3. Language Must Be Explicitly Enforced
Add "ENGLISH ONLY. Never use Portuguese, Spanish, or any other language." to EVERY prompt — copy generation AND image generation.

### 4. Carousel Coherence Requires a Theme Object
Random per-slide prompts create visual chaos. The `carouselTheme` object (background, lighting, motif, colorAccent, imageryStyle) must be defined ONCE and passed to EVERY slide's image prompt.

### 5. Logo is ALWAYS Composited, Never AI-Generated
AI models render logos poorly. Use Sharp to composite the real PNG logo after image generation.

### 6. Negative Prompts Are Essential
Each brand needs explicit "DO NOT" instructions to prevent cross-contamination.

### 7. Do NOT Use responseModalities: ["IMAGE"] Alone for Gemini
Must be `["TEXT", "IMAGE"]` or it fails silently. This is a common gotcha.

### 8. Style Analysis Extracts ONLY Visual Patterns, Never Colors
The analyze-style endpoint must explicitly NOT extract colors from references — only layout patterns, typography styles, and design elements. Colors come from brand config only.

---

## The Solution Architecture

```
User enters topic
       ↓
Claude (Sonnet) generates:
  - carouselTheme (consistent visual thread for ALL slides)
  - slides[] with structured composition data
  - caption + hashtags
       ↓
User clicks "Generate with GPT-4o" or "Generate with Gemini" or "Generate Both"
       ↓
Image engine receives per-slide prompt with:
  - Brand style rules + NEGATIVE constraints
  - carouselTheme for visual consistency
  - Structured text content to render
  - Layout zone instructions
       ↓
Logo overlay composited via Sharp (never AI-generated)
       ↓
Side-by-side comparison view
       ↓
Export selected slides as ZIP
```

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Copy Generation:** Claude API (Sonnet via Anthropic SDK)
- **Image Generation:**
  - OpenAI API (`gpt-image-1`) — better text rendering
  - Google AI API (Gemini 2.0 Flash / Gemini Pro) — faster, good for iteration
- **Image Processing:** Sharp (logo overlay compositing)
- **Export:** JSZip for ZIP downloads

---

## Project Structure

```
/content-studio-ui
├── app/
│   ├── layout.tsx                    # Root layout, dark theme
│   ├── page.tsx                      # Brand picker dashboard
│   ├── generate/page.tsx             # Main workspace
│   ├── globals.css
│   └── api/
│       ├── generate/route.ts         # Claude: topic → brief JSON
│       ├── images/route.ts           # Gemini: composition → image
│       ├── images-openai/route.ts    # GPT-4o: composition → image
│       ├── brands/route.ts           # List brands
│       ├── references/route.ts       # Style reference upload
│       ├── analyze-style/route.ts    # Claude vision: analyze references
│       └── export/route.ts           # ZIP download
│
├── components/
│   ├── BrandPicker.tsx
│   ├── TopicInput.tsx
│   ├── CarouselPreview.tsx
│   ├── SlideEditor.tsx
│   ├── ExportButton.tsx
│   ├── StyleReferences.tsx
│   ├── StyleAnalyzer.tsx
│   └── EngineSelector.tsx            # Pick Gemini / GPT-4o / Both
│
├── lib/
│   ├── generator.ts                  # Claude API integration
│   ├── brands.ts                     # Load brand configs
│   ├── types.ts                      # TypeScript interfaces
│   └── logo-overlay.ts               # Sharp logo compositing
│
├── brands/
│   ├── servicegrowth-ai/
│   │   ├── brand.json
│   │   ├── logo.png
│   │   └── style-references/
│   └── caviar-pavers/
│       ├── brand.json
│       ├── logo.png
│       └── style-references/
│
└── public/
    └── brands/
        ├── servicegrowth-ai/logo.png
        └── caviar-pavers/logo.png
```

---

## The Two Brands

### ServiceGrowth AI

```json
{
  "slug": "servicegrowth-ai",
  "name": "ServiceGrowth AI",
  "tagline": "Built by operators, not grifters",
  "business": "AI automation for service businesses",
  "language": "English",
  "colors": {
    "background": "#0D0D0D",
    "accent": "#00D4FF",
    "text": "#FFFFFF",
    "secondary": "#1a1a2e"
  },
  "styleDescription": "Dark tech editorial. Glassmorphism cards with frosted glass effect. Neon cyan (#00D4FF) as the ONLY accent color. Cinematic moody lighting with volumetric light rays. Modern sans-serif typography ONLY. Bold white headlines, cyan accent words. Dark gradient backgrounds. Floating UI elements and dashboard mockups.",
  "typographyRules": "ONLY modern sans-serif fonts. Bold weight for headlines, regular for body. Accent words in cyan #00D4FF. NO script fonts. NO cursive. NO serif. NO decorative fonts.",
  "negativePrompt": "DO NOT use: script fonts, cursive fonts, serif fonts, calligraphy, handwriting fonts, pink colors, maroon colors, warm tones, Portuguese text, Brazilian design patterns, generic stock photos. ENGLISH ONLY. NO misspellings."
}
```

### Caviar Pavers

```json
{
  "slug": "caviar-pavers",
  "name": "Caviar Pavers",
  "tagline": "Luxury Outdoor Living",
  "business": "Premium paver installation and outdoor living design",
  "location": "Jacksonville, Florida",
  "language": "English",
  "colors": {
    "background": "#F5F0E6",
    "accent": "#C9A227",
    "text": "#1E3A5F",
    "secondary": "#5C4033"
  },
  "styleDescription": "Brazilian premium editorial design. Mixed serif + sans-serif typography. Asymmetric magazine layouts. Cream and warm backgrounds. Navy text with gold accent lines. Editorial photography of luxury outdoor spaces.",
  "typographyRules": "Mixed typography: large serif headlines (Playfair Display style) with clean sans-serif subtext. Gold thin lines as decorative separators.",
  "negativePrompt": "DO NOT use: neon colors, glassmorphism, cyber/tech aesthetic, dark moody backgrounds, sci-fi elements. NO Portuguese text. ENGLISH ONLY. NO misspellings."
}
```

---

## Image Generation APIs

### GPT-4o (OpenAI) — Better Text Rendering

```typescript
const response = await fetch("https://api.openai.com/v1/images/generations", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: "gpt-image-1",
    prompt: compositionPrompt,
    n: 1,
    size: "1024x1024",
    quality: "high",
    response_format: "b64_json",
  }),
});

const data = await response.json();
const imageBase64 = data.data[0].b64_json;
```

### Gemini (Google) — Faster Iteration

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: compositionPrompt }] }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    }),
  }
);

const data = await response.json();
const imagePart = data.candidates[0].content.parts.find(p => p.inlineData);
const imageBase64 = imagePart.inlineData.data;
```

---

## Engine Comparison Feature

The UI allows:
1. **Generate with Gemini** — Fast, good for quick iteration
2. **Generate with GPT-4o** — Better text rendering, higher quality
3. **Generate Both** — Side-by-side comparison to pick best slides

Users can mix-and-match: pick slide 1 from GPT-4o, slides 2-5 from Gemini, etc.

---

## Slide Templates

```typescript
export const SLIDE_TEMPLATES = {
  hook: { name: "Hook", purpose: "Stop the scroll", textSize: "large", layoutZone: "center" },
  problem: { name: "Problem", purpose: "Articulate the pain point", textSize: "large", layoutZone: "top-left" },
  agitate: { name: "Agitate", purpose: "Make it urgent with stats", textSize: "large", layoutZone: "center" },
  solution: { name: "Solution", purpose: "Present the answer", textSize: "medium", layoutZone: "top-left" },
  mechanism: { name: "How It Works", purpose: "Show the process", textSize: "medium", layoutZone: "top-center" },
  proof: { name: "Social Proof", purpose: "Stats, results, testimonials", textSize: "large", layoutZone: "center" },
  cta: { name: "Call to Action", purpose: "Clear next step", textSize: "large", layoutZone: "center" },
};

export const CAROUSEL_STRUCTURES = [
  { id: "4-slides", templates: ["hook", "problem", "solution", "cta"] },
  { id: "6-slides", templates: ["hook", "problem", "agitate", "solution", "proof", "cta"] },
  { id: "8-slides", templates: ["hook", "problem", "agitate", "solution", "mechanism", "proof", "breakdown", "cta"] },
];
```

---

## Environment Variables

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...        # Claude for copy generation
OPENAI_API_KEY=sk-...               # GPT-4o for image generation
GOOGLE_AI_API_KEY=AIza...           # Gemini for image generation
```

---

## Voice Rules

When generating copy:
- Confident, modern, clear, no fluff
- Headlines max 8 words, *accent* key words with asterisks
- NEVER use: "In today's world", "Unlock", "Revolutionary", "Discover", "Game-changer", "Seamless"
- Every slide has intention — no filler

---

## What NOT to Do

1. **Do NOT send style reference images to image APIs** — causes style bleeding
2. **Do NOT use Haiku for copy generation** — Sonnet is worth the cost for carousel quality
3. **Do NOT let brand styles cross-contaminate** — load fresh config per request
4. **Do NOT render logos with AI** — always composite with Sharp
5. **Do NOT use `responseModalities: ["IMAGE"]` alone** — must include "TEXT"
6. **Do NOT trust AI to spell correctly** — include spelling warnings in prompts
7. **Do NOT let style analysis extract colors** — colors come from brand config ONLY

---

## Commands

```bash
# Development
cd /Users/chef/Downloads/content-studio-ui
npm run dev

# Build
npm run build
```

---

## File Locations

| Purpose | Path |
|---------|------|
| Web UI project | `/Users/chef/Downloads/content-studio-ui` |
| CLI project (legacy) | `/Users/chef/Downloads/content-studio` |
| Brand configs | `content-studio-ui/brands/{slug}/brand.json` |
| Style references | `content-studio-ui/brands/{slug}/style-references/` |
| Style analysis | `content-studio-ui/brands/{slug}/style-analysis.json` |
| Logos | `content-studio-ui/public/brands/{slug}/logo.png` |

---

*Last updated: February 5, 2026*
