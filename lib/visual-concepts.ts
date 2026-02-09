// Visual Concept Templates based on design analysis
// These are the COMPOSITIONAL FRAMEWORKS that make posts look intentional

export interface VisualConcept {
  id: string
  name: string
  description: string
  metaphor: string
  figureRole: string
  promptTemplate: string
  exampleUse: string
}

export const VISUAL_CONCEPTS: VisualConcept[] = [
  {
    id: 'thinker-cloud',
    name: 'Thinker with Thought Cloud',
    description: 'Person in contemplative pose with visual cloud/smoke above head containing imagery',
    metaphor: 'Their thoughts visualized — showing what they should be thinking about',
    figureRole: 'Seated person, hand on chin or looking up, head partially obscured by cloud',
    promptTemplate: `Person sitting in modern chair, contemplative thinking pose. Above their head, a stylized cloud/smoke formation containing [IMAGERY]. The cloud uses [BRAND_COLORS] gradient. Clean [BACKGROUND_COLOR] background. Bold typography at top: "[HEADLINE]". Bottom navigation bar with category labels. Professional editorial quality, intentional composition.`,
    exampleUse: 'Educational content about perspective-taking, client empathy, mindset shifts',
  },
  {
    id: 'partial-reveal',
    name: 'Partial Face Reveal',
    description: 'Subject with face partially visible, cropped, or obscured — creates intrigue',
    metaphor: 'Universal relatability — viewer projects themselves onto the figure',
    figureRole: 'Person with face half in frame, looking away, or strategically cropped',
    promptTemplate: `Close crop of person, face partially visible — [CROP_STYLE: side profile / looking down / cropped at eyes]. [BACKGROUND_TREATMENT: soft blur / solid color / gradient]. Typography positioned in the negative space: "[HEADLINE]" as bold anchor text, "[SUBTEXT]" as supporting copy. [BRAND_COLORS] palette. Editorial magazine quality.`,
    exampleUse: 'Personal brand content, vulnerability topics, "behind the scenes" feel',
  },
  {
    id: 'direct-challenge',
    name: 'Direct Gaze Challenge',
    description: 'Subject making eye contact with viewer — confrontational, engaging',
    metaphor: 'Breaking the fourth wall — "Are YOU doing this?"',
    figureRole: 'Person looking directly at camera, confident pose, slight lean forward',
    promptTemplate: `Person facing camera with direct eye contact, [EXPRESSION: confident / questioning / knowing]. Upper body visible, [POSE: arms crossed / leaning on surface / hands gesturing]. Bold headline overlaid: "[HEADLINE]" with [ACCENT_WORD] highlighted in [ACCENT_COLOR]. [BACKGROUND_COLOR] background with subtle gradient. Professional lighting, editorial quality.`,
    exampleUse: 'CTAs, challenges, accountability content, "real talk" posts',
  },
  {
    id: 'metaphor-blur',
    name: 'Conceptual Blur/Fade',
    description: 'Visual effect (blur, fade, dissolve) that EMBODIES the message',
    metaphor: 'The treatment IS the meaning — silence = fading, confusion = blur',
    figureRole: 'Person with part of them visually treated to match the concept',
    promptTemplate: `Person in [POSE], with [EFFECT: face fading to blur / body dissolving into particles / silhouette emerging from fog] representing "[CONCEPT]". The visual effect uses [BRAND_COLORS]. Typography: "[HEADLINE]" positioned [POSITION], with the [EFFECT_WORD] visually treated to match the effect. Clean composition, conceptual art direction.`,
    exampleUse: 'Content about invisibility, silence, transformation, emergence',
  },
  {
    id: 'split-composition',
    name: 'Split Frame Composition',
    description: 'Frame divided into distinct zones — figure on one side, typography on other',
    metaphor: 'Organized thinking, clear separation of visual and verbal',
    figureRole: 'Person positioned in one half/third of frame, text in remaining space',
    promptTemplate: `Split composition: [LEFT/RIGHT] side shows person [POSE/ACTION], [RIGHT/LEFT] side is [BACKGROUND_COLOR] with typography. Headline "[HEADLINE]" with mixed typography — "[ANCHOR_WORD]" in [SCRIPT/DISPLAY] font, rest in clean sans-serif. Small annotation text pointing to figure: "[ANNOTATION]". [BRAND_COLORS] palette throughout. Magazine editorial layout.`,
    exampleUse: 'Educational carousels, before/after concepts, problem/solution framing',
  },
  {
    id: 'object-focus',
    name: 'Symbolic Object Focus',
    description: 'Close-up of meaningful object with typography — hands, eyes, tools',
    metaphor: 'Zoom in on what matters — the detail tells the story',
    figureRole: 'Partial human element (hands, eye, silhouette) with significant object',
    promptTemplate: `Close-up focus on [OBJECT: hands typing / eye detail / tool in use / meaningful item]. [HUMAN_ELEMENT] partially visible. Typography overlaid: "[HEADLINE]" with "[KEY_WORD]" emphasized. [BACKGROUND_TREATMENT: shallow depth of field / gradient fade / solid]. [BRAND_COLORS] color grading. Intimate, editorial quality.`,
    exampleUse: 'Detail-oriented content, craftsmanship, attention/awareness topics',
  },
  {
    id: 'environmental-context',
    name: 'Figure in Environment',
    description: 'Person shown in their element — workspace, outdoors, lifestyle setting',
    metaphor: 'Context creates credibility — show the world they inhabit',
    figureRole: 'Person naturally positioned in relevant environment, not posed stock-style',
    promptTemplate: `Person in [ENVIRONMENT: modern workspace / outdoor setting / lifestyle context], naturally positioned — [ACTION: working / contemplating / engaging]. Environment uses [BRAND_COLORS] color grading. Typography integrated into composition: "[HEADLINE]" positioned [POSITION] with clear hierarchy. Bottom bar: [CATEGORY_LABELS]. Professional lifestyle photography meets editorial design.`,
    exampleUse: 'Authority content, "day in the life", aspirational lifestyle',
  },
  {
    id: 'typography-dominant',
    name: 'Typography as Hero',
    description: 'Minimal imagery, typography IS the visual — dramatic type treatment',
    metaphor: 'The words are powerful enough to stand alone',
    figureRole: 'No figure or very subtle background element — type dominates',
    promptTemplate: `Typography-dominant composition on [BACKGROUND_COLOR] background. Main headline "[HEADLINE]" with dramatic treatment — "[ANCHOR_WORD]" in large [DISPLAY/SCRIPT] font, supporting text in clean sans-serif below. Subtle [TEXTURE: grain / geometric shapes / thin lines] adds depth. [BRAND_COLORS] palette. One small [ACCENT_ELEMENT: icon / line / shape] for visual interest. Clean, bold, intentional.`,
    exampleUse: 'Quote posts, bold statements, manifesto content',
  },
]

export const TYPOGRAPHY_ROLES = {
  anchor: {
    name: 'Anchor Word',
    description: 'The KEY concept — largest, most stylized, often script/display font',
    treatment: 'Display font, largest size, can be colored or outlined',
  },
  support: {
    name: 'Supporting Text',
    description: 'Context for the anchor — clean, readable, medium weight',
    treatment: 'Sans-serif, medium size, regular or bold weight',
  },
  micro: {
    name: 'Micro Copy',
    description: 'Annotations, clarifications, side notes',
    treatment: 'Small, light weight, often positioned as callouts',
  },
  navigation: {
    name: 'Category/Navigation',
    description: 'Series identifier, grounds the post in content type',
    treatment: 'Tiny, all-caps, letter-spaced, top or bottom of frame',
  },
}

export const CAROUSEL_ROLES = [
  { id: 'hook', name: 'Hook', purpose: 'Stop the scroll, pattern interrupt, bold statement' },
  { id: 'problem', name: 'Problem', purpose: 'Articulate the pain point with visual metaphor' },
  { id: 'agitate', name: 'Agitate', purpose: 'Make it urgent, add stakes' },
  { id: 'insight', name: 'Insight', purpose: 'The "aha" moment, turning point' },
  { id: 'solution', name: 'Solution', purpose: 'What to do about it' },
  { id: 'proof', name: 'Proof', purpose: 'Why believe this — results, credentials' },
  { id: 'cta', name: 'CTA', purpose: 'Clear next action, direct engagement' },
]

export function getConceptById(id: string): VisualConcept | undefined {
  return VISUAL_CONCEPTS.find(c => c.id === id)
}
