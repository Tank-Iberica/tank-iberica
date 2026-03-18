import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { globSync } from 'glob'

/**
 * Verifies CSS Layers are properly configured for specificity control.
 * Layer order: base → tokens → utilities.
 * Component scoped styles are un-layered (override all layers).
 */
describe('CSS Layers architecture', () => {
  const tokensMain = readFileSync(
    resolve(__dirname, '../../app/assets/css/tokens.css'),
    'utf-8',
  )

  it('declares layer order: base, tokens, utilities', () => {
    expect(tokensMain).toContain('@layer base, tokens, utilities;')
  })

  it('has @layer base block with reset styles', () => {
    expect(tokensMain).toMatch(/@layer base\s*\{/)
  })

  it('has @layer utilities block with utility classes', () => {
    expect(tokensMain).toMatch(/@layer utilities\s*\{/)
  })

  it('all token files use @layer tokens', () => {
    const tokenFiles = globSync('app/assets/css/tokens/*.css', {
      cwd: resolve(__dirname, '../..'),
    })

    expect(tokenFiles.length).toBeGreaterThanOrEqual(5)

    for (const file of tokenFiles) {
      const content = readFileSync(resolve(__dirname, '../..', file), 'utf-8')
      expect(content, `${file} should use @layer tokens`).toContain('@layer tokens')
    }
  })

  it('no !important in token or base CSS files', () => {
    const tokenFiles = globSync('app/assets/css/tokens/*.css', {
      cwd: resolve(__dirname, '../..'),
    })

    for (const file of tokenFiles) {
      const content = readFileSync(resolve(__dirname, '../..', file), 'utf-8')
      expect(content, `${file} should not use !important`).not.toContain('!important')
    }

    // Main tokens.css should not use !important
    expect(tokensMain).not.toContain('!important')
  })

  it('interactions.css does not use !important', () => {
    const content = readFileSync(
      resolve(__dirname, '../../app/assets/css/interactions.css'),
      'utf-8',
    )
    expect(content).not.toContain('!important')
  })
})
