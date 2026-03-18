import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

/**
 * Verifies modulepreload readiness.
 * Nuxt 3 + Vite automatically inject <link rel="modulepreload"> during SSR.
 * This test verifies the build outputs ESM chunks that can be modulepreloaded.
 */
describe('Modulepreload readiness', () => {
  const nuxtDir = resolve(__dirname, '../../../.output/public/_nuxt')
  const hasBuild = existsSync(nuxtDir)

  it.skipIf(!hasBuild)('build produces JS modules (ESM chunks)', () => {
    const jsFiles = readdirSync(nuxtDir).filter(f => f.endsWith('.js'))
    expect(jsFiles.length).toBeGreaterThan(50) // Should have many code-split chunks
  })

  it.skipIf(!hasBuild)('entry chunk exists', () => {
    const jsFiles = readdirSync(nuxtDir).filter(f => f.endsWith('.js'))
    // Nuxt entry is typically named with a hash, look for reasonable entry size
    const entryCandidates = jsFiles.filter(f => {
      const stat = require('fs').statSync(join(nuxtDir, f))
      return stat.size > 100 * 1024 // Entry is usually > 100KB
    })
    expect(entryCandidates.length).toBeGreaterThan(0)
  })

  it.skipIf(!hasBuild)('has route-level code splitting (many small chunks)', () => {
    const jsFiles = readdirSync(nuxtDir).filter(f => f.endsWith('.js'))
    const smallChunks = jsFiles.filter(f => {
      const stat = require('fs').statSync(join(nuxtDir, f))
      return stat.size < 50 * 1024
    })
    // Most chunks should be small (route-level splits)
    const ratio = smallChunks.length / jsFiles.length
    expect(ratio).toBeGreaterThan(0.5) // >50% chunks should be < 50KB
  })

  it('nuxt.config has font preload enabled', () => {
    const nuxtConfig = require('fs').readFileSync(
      resolve(__dirname, '../../../nuxt.config.ts'),
      'utf-8',
    )
    expect(nuxtConfig).toContain('preload: true')
  })
})
