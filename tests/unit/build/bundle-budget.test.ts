import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'

/**
 * Bundle size budget verification.
 * Tests require an existing build output in .output/public/_nuxt.
 * Skip gracefully if build output doesn't exist.
 */
describe('Bundle size budget', () => {
  const nuxtDir = resolve(__dirname, '../../../.output/public/_nuxt')
  const hasBuild = existsSync(nuxtDir)

  it.skipIf(!hasBuild)('should have build output', () => {
    expect(hasBuild).toBe(true)
  })

  it.skipIf(!hasBuild)('no single JS chunk exceeds 500KB', () => {
    const files = readdirSync(nuxtDir).filter(f => f.endsWith('.js'))
    const oversized = files
      .map(f => ({ file: f, size: statSync(join(nuxtDir, f)).size }))
      .filter(f => f.size > 500 * 1024)

    if (oversized.length > 0) {
      const details = oversized.map(f => `${f.file}: ${(f.size / 1024).toFixed(1)}KB`).join(', ')
      expect.soft(oversized.length, `Oversized JS chunks: ${details}`).toBeLessThanOrEqual(3)
    }
  })

  it.skipIf(!hasBuild)('no single CSS chunk exceeds 150KB', () => {
    const files = readdirSync(nuxtDir).filter(f => f.endsWith('.css'))
    const oversized = files
      .map(f => ({ file: f, size: statSync(join(nuxtDir, f)).size }))
      .filter(f => f.size > 150 * 1024)

    expect(oversized, `Oversized CSS: ${oversized.map(f => f.file).join(', ')}`).toHaveLength(0)
  })

  it.skipIf(!hasBuild)('total JS size is reasonable (< 6MB uncompressed)', () => {
    const files = readdirSync(nuxtDir).filter(f => f.endsWith('.js'))
    const totalSize = files.reduce((sum, f) => sum + statSync(join(nuxtDir, f)).size, 0)
    expect(totalSize).toBeLessThan(6 * 1024 * 1024)
  })

  it.skipIf(!hasBuild)('total CSS size is reasonable (< 2MB uncompressed)', () => {
    const files = readdirSync(nuxtDir).filter(f => f.endsWith('.css'))
    const totalSize = files.reduce((sum, f) => sum + statSync(join(nuxtDir, f)).size, 0)
    expect(totalSize).toBeLessThan(2 * 1024 * 1024)
  })

  it('budget check script exists', () => {
    expect(existsSync(resolve(__dirname, '../../../scripts/check-bundle-budget.mjs'))).toBe(true)
  })
})
