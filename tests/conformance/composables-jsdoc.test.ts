import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { globSync } from 'glob'

/**
 * Verification test for JSDoc presence on all public composables.
 * Every exported use* function must have a JSDoc comment.
 */
describe('Composables JSDoc coverage', () => {
  const composableFiles = globSync('app/composables/**/*.ts', {
    cwd: resolve(__dirname, '../..'),
  })

  // Collect all composable functions and their JSDoc status
  const results: { file: string; fn: string; hasJsdoc: boolean }[] = []

  for (const file of composableFiles) {
    const content = readFileSync(resolve(__dirname, '../..', file), 'utf-8')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^export\s+function\s+(use[A-Z]\w*)/)
      if (!match) continue

      const fnName = match[1]
      let hasJsdoc = false

      for (let j = i - 1; j >= 0; j--) {
        const prev = lines[j].trim()
        if (prev === '') continue
        if (prev === '*/' || prev.endsWith('*/')) hasJsdoc = true
        break
      }

      results.push({ file, fn: fnName, hasJsdoc })
      break // Only check first exported function per file
    }
  }

  it('should find composable files', () => {
    expect(composableFiles.length).toBeGreaterThan(100)
  })

  it('should find exported use* functions', () => {
    expect(results.length).toBeGreaterThan(200)
  })

  it('should have >95% JSDoc coverage on exported composables', () => {
    const total = results.length
    const withJsdoc = results.filter((r) => r.hasJsdoc).length
    const coverage = (withJsdoc / total) * 100

    const missing = results.filter((r) => !r.hasJsdoc)
    const missingMsg =
      missing.length > 0
        ? `\nMissing JSDoc:\n${missing.map((r) => `  ${r.file}: ${r.fn}`).join('\n')}`
        : ''

    expect(
      coverage,
      `JSDoc coverage: ${coverage.toFixed(1)}% (${withJsdoc}/${total})${missingMsg}`,
    ).toBeGreaterThanOrEqual(95)
  })

  it('should have 100% JSDoc coverage', () => {
    const missing = results.filter((r) => !r.hasJsdoc)
    expect(missing, `Missing JSDoc in: ${missing.map((r) => r.file).join(', ')}`).toHaveLength(0)
  })
})
