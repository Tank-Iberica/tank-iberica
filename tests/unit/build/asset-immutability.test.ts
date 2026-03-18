import { describe, it, expect, test } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { globSync } from 'tinyglobby'

/**
 * Verifies static assets have content hashes in filenames
 * and Cache-Control immutable is configured.
 */

const ROOT = resolve(__dirname, '../../..')
const BUILD_DIR = resolve(ROOT, '.output/public/_nuxt')
const hasBuild = existsSync(BUILD_DIR)

describe('Static asset immutability', () => {
  describe('Cache-Control headers', () => {
    const headers = readFileSync(resolve(ROOT, 'public/_headers'), 'utf-8')

    it('_nuxt/ assets have immutable Cache-Control', () => {
      expect(headers).toContain('/_nuxt/*')
      expect(headers).toContain('max-age=31536000')
      expect(headers).toContain('immutable')
    })

    it('images have long Cache-Control', () => {
      expect(headers).toContain('/images/*')
      expect(headers).toContain('max-age=604800')
    })

    it('admin pages have no-store', () => {
      expect(headers).toContain('/admin/*')
      expect(headers).toContain('no-store')
    })
  })

  describe('Nuxt config asset naming', () => {
    const nuxtConfig = readFileSync(resolve(ROOT, 'nuxt.config.ts'), 'utf-8')

    it('Vite generates content-hashed filenames', () => {
      // Vite defaults to content hashing in production builds
      // Verify no custom naming that removes hashes
      expect(nuxtConfig).not.toContain("entryFileNames: '[name].js'")
      expect(nuxtConfig).not.toContain("chunkFileNames: '[name].js'")
    })
  })

  test.skipIf(!hasBuild)('build output has hashed filenames', () => {
    const jsFiles = globSync(['**/*.js'], { cwd: BUILD_DIR })
    // Vite uses short hashes as filenames (e.g. 5pXzGXty.js)
    const hashedFiles = jsFiles.filter((f) => /[\w-]{5,}\.js$/.test(f))
    // Most JS files should have content hashes
    expect(hashedFiles.length).toBeGreaterThan(0)
    const ratio = hashedFiles.length / jsFiles.length
    expect(ratio).toBeGreaterThan(0.5)
  })

  test.skipIf(!hasBuild)('CSS files have hashed filenames', () => {
    const cssFiles = globSync(['**/*.css'], { cwd: BUILD_DIR })
    const hashedFiles = cssFiles.filter((f) => /[\w-]{5,}\.css$/.test(f))
    expect(hashedFiles.length).toBeGreaterThan(0)
  })
})
