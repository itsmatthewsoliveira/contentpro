/**
 * Convert *accent* markers in headlines to styled HTML spans
 */
export function formatHeadline(
  headline: string,
  accentColor: string,
  italic: boolean = false
): string {
  if (!headline) return ''
  return headline.replace(
    /\*([^*]+)\*/g,
    `<span style="color: ${accentColor}${italic ? '; font-style: italic' : ''}">\$1</span>`
  )
}
