import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { globSync } from 'tinyglobby'

/**
 * Verifies NuxtLink prefetch behavior in catalog/vehicle components.
 * Nuxt 3 NuxtLink with `prefetch` attribute triggers viewport-based
 * prefetching (IntersectionObserver), not hover-only.
 */

const ROOT = resolve(__dirname, '../../..')

function readFile(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), 'utf-8')
}

describe('VehicleCard prefetch', () => {
  const cardContent = readFile('app/components/catalog/VehicleCard.vue')

  it('NuxtLink has prefetch attribute', () => {
    // Check that NuxtLink has prefetch (Nuxt 3 viewport-based prefetching)
    expect(cardContent).toMatch(/<NuxtLink[^>]*\bprefetch\b/)
  })

  it('NuxtLink uses dynamic vehicle slug route', () => {
    expect(cardContent).toContain('/vehiculo/${vehicle.slug}')
  })

  it('uses content-visibility: auto for virtual rendering', () => {
    expect(cardContent).toContain('content-visibility: auto')
  })

  it('has contain-intrinsic-size for stable scrolling', () => {
    expect(cardContent).toContain('contain-intrinsic-size')
  })
})

describe('NuxtLink prefetch across catalog components', () => {
  const catalogFiles = globSync(['app/components/catalog/**/*.vue'], { cwd: ROOT })

  it('catalog directory has components', () => {
    expect(catalogFiles.length).toBeGreaterThan(0)
  })

  it('NuxtLinks in catalog components use prefetch', () => {
    const missingPrefetch: string[] = []

    for (const file of catalogFiles) {
      const content = readFile(file)
      // Find NuxtLink tags that link to vehicle detail pages
      const nuxtLinks = content.match(/<NuxtLink[^>]*vehiculo[^>]*/g) ?? []
      for (const link of nuxtLinks) {
        if (!link.includes('prefetch')) {
          missingPrefetch.push(file)
        }
      }
    }

    expect(missingPrefetch, `NuxtLinks missing prefetch: ${missingPrefetch.join(', ')}`).toHaveLength(0)
  })
})
