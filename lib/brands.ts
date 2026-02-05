import { BrandConfig } from './types'
import caviarPavers from '@/brands/caviar-pavers/brand.json'
import servicegrowthAi from '@/brands/servicegrowth-ai/brand.json'

const brands: Record<string, BrandConfig> = {
  'caviar-pavers': caviarPavers as unknown as BrandConfig,
  'servicegrowth-ai': servicegrowthAi as unknown as BrandConfig,
}

export function getBrands(): { slug: string; config: BrandConfig }[] {
  return Object.entries(brands).map(([slug, config]) => ({ slug, config }))
}

export function getBrand(slug: string): BrandConfig | null {
  return brands[slug] || null
}

export function getBrandSlugs(): string[] {
  return Object.keys(brands)
}
