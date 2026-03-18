import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { globSync } from 'tinyglobby'

/**
 * Verifies NuxtImg components use responsive `sizes` attribute
 * with real breakpoints rather than generic "100vw" everywhere.
 */

const ROOT = resolve(__dirname, '../../..')

function readFile(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), 'utf-8')
}

describe('NuxtImg sizes attribute optimization', () => {
  const allVueFiles = globSync(['app/**/*.vue'], { cwd: ROOT })

  it('finds NuxtImg usages across the app', () => {
    const filesWithNuxtImg = allVueFiles.filter(f =>
      readFile(f).includes('<NuxtImg'),
    )
    expect(filesWithNuxtImg.length).toBeGreaterThan(5)
  })

  it('NuxtImg instances have sizes attribute (no unoptimized defaults)', () => {
    const missingSize: string[] = []

    for (const file of allVueFiles) {
      const content = readFile(file)
      // Find NuxtImg tags
      const nuxtImgMatches = content.match(/<NuxtImg[\s\S]*?\/>/g) ?? []
      for (const tag of nuxtImgMatches) {
        if (!tag.includes('sizes=') && !tag.includes(':sizes=')) {
          missingSize.push(file)
        }
      }
    }

    // Allow some NuxtImg without sizes (e.g. fixed-size icons)
    // but the majority should have them
    expect(missingSize.length).toBeLessThan(5)
  })

  it('VehicleCard has breakpoint-based sizes (not generic 100vw)', () => {
    const content = readFile('app/components/catalog/VehicleCard.vue')
    expect(content).toContain('sizes=')
    // Should have multiple breakpoints, not just "100vw"
    expect(content).toMatch(/sizes="[^"]*max-width[^"]*calc\(/)
  })

  it('RelatedVehicles has responsive sizes', () => {
    const content = readFile('app/components/vehicle/RelatedVehicles.vue')
    expect(content).toContain('sizes=')
    expect(content).toMatch(/sizes="[^"]*vw/)
  })

  it('article index pages have responsive sizes', () => {
    const guiaIndex = readFile('app/pages/guia/index.vue')
    expect(guiaIndex).toContain('sizes="(max-width:')

    const noticiasIndex = readFile('app/pages/noticias/index.vue')
    expect(noticiasIndex).toContain('sizes="(max-width:')
  })

  it('fixed-size images use exact px sizes', () => {
    // error.vue icon should be fixed size
    const errorVue = readFile('app/error.vue')
    expect(errorVue).toContain('sizes="48px"')

    // Header logos should be fixed size
    const header = readFile('app/components/layout/AppHeader.vue')
    expect(header).toContain('sizes="20px"')
  })
})
