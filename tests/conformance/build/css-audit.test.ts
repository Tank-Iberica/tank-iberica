import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { globSync } from 'glob'

/**
 * CSS audit — verifies global CSS is lean and well-organized.
 * Checks for bloat, duplicates, and excessive !important usage.
 */
describe('CSS audit', () => {
  const cssDir = resolve(__dirname, '../../../app/assets/css')

  it('global CSS files count is reasonable (< 20)', () => {
    const files = globSync('**/*.css', { cwd: cssDir })
    expect(files.length).toBeLessThan(20)
  })

  it('total global CSS size is under 50KB', () => {
    const files = globSync('**/*.css', { cwd: cssDir })
    const totalSize = files.reduce((sum, f) => {
      return sum + statSync(join(cssDir, f)).size
    }, 0)

    expect(totalSize).toBeLessThan(50 * 1024)
  })

  it('no duplicate utility class definitions', () => {
    const tokensFile = resolve(cssDir, 'tokens.css')
    const content = readFileSync(tokensFile, 'utf-8')

    // Extract class names (excluding pseudo-classes/elements)
    const classRegex = /\.([\w-]+)\s*\{/g
    const classes: string[] = []
    let match
    while ((match = classRegex.exec(content)) !== null) {
      classes.push(match[1])
    }

    // Find duplicates
    const seen = new Set<string>()
    const duplicates = new Set<string>()
    for (const cls of classes) {
      if (seen.has(cls)) duplicates.add(cls)
      seen.add(cls)
    }

    // Intentional exceptions:
    // - sr-only / u-sr-only: both forms exist for compat
    // - page/layout transition classes: appear in base rules + prefers-reduced-motion
    const exceptions = [
      'sr-only',
      'page-enter-active',
      'page-leave-active',
      'layout-enter-active',
      'layout-leave-active',
    ]
    for (const ex of exceptions) duplicates.delete(ex)

    expect(
      [...duplicates],
      `Duplicate classes in tokens.css: ${[...duplicates].join(', ')}`,
    ).toHaveLength(0)
  })

  it('no !important in global token CSS (except print/themes)', () => {
    const tokenFiles = globSync('tokens/*.css', { cwd: cssDir })

    for (const file of tokenFiles) {
      const content = readFileSync(join(cssDir, file), 'utf-8')
      expect(content, `${file} uses !important`).not.toContain('!important')
    }
  })

  it('interactions.css has reasonable size (< 10KB)', () => {
    const interactionsFile = resolve(cssDir, 'interactions.css')
    if (existsSync(interactionsFile)) {
      const size = statSync(interactionsFile).size
      expect(size).toBeLessThan(10 * 1024)
    }
  })

  it('build CSS total is under 1MB (if build exists)', () => {
    const nuxtDir = resolve(__dirname, '../../../.output/public/_nuxt')
    if (!existsSync(nuxtDir)) return

    const cssFiles = readdirSync(nuxtDir).filter((f) => f.endsWith('.css'))
    const totalSize = cssFiles.reduce((sum, f) => sum + statSync(join(nuxtDir, f)).size, 0)

    expect(totalSize).toBeLessThan(1024 * 1024)
  })
})
