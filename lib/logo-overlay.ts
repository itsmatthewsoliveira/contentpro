/**
 * Composites the brand logo onto a generated slide image using canvas.
 * This ensures the logo is ALWAYS consistent across all slides.
 */
export async function overlayLogo(
  imageDataUrl: string,
  brandSlug: string,
  options: {
    logoSize?: number // height in px at 1080x1080 scale
    padding?: number // distance from edges
    position?: 'top-left' | 'top-center' | 'top-right'
  } = {}
): Promise<string> {
  const {
    logoSize = 40,
    padding = 40,
    position = 'top-left',
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1080
    const ctx = canvas.getContext('2d')
    if (!ctx) { resolve(imageDataUrl); return }

    const bgImage = new Image()
    bgImage.crossOrigin = 'anonymous'
    bgImage.onload = () => {
      // Draw the generated slide image
      ctx.drawImage(bgImage, 0, 0, 1080, 1080)

      // Load and draw the logo
      const logo = new Image()
      logo.crossOrigin = 'anonymous'
      logo.onload = () => {
        // Calculate logo dimensions maintaining aspect ratio
        const aspectRatio = logo.width / logo.height
        const logoHeight = logoSize
        const logoWidth = logoHeight * aspectRatio

        let x = padding
        let y = padding

        if (position === 'top-center') {
          x = (1080 - logoWidth) / 2
        } else if (position === 'top-right') {
          x = 1080 - logoWidth - padding
        }

        ctx.drawImage(logo, x, y, logoWidth, logoHeight)
        resolve(canvas.toDataURL('image/png'))
      }
      logo.onerror = () => {
        // If logo fails to load, return image without logo
        resolve(imageDataUrl)
      }
      logo.src = `/brands/${brandSlug}/logo.png`
    }
    bgImage.onerror = () => reject(new Error('Failed to load generated image'))
    bgImage.src = imageDataUrl
  })
}
