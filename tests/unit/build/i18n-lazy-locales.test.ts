import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const CONFIG = readFileSync(resolve(ROOT, 'nuxt.config.ts'), 'utf-8')

describe('Lazy load i18n locales', () => {
  it('i18n lazy loading is enabled', () => {
    expect(CONFIG).toContain('lazy: true')
  })

  it('locales use file references (not inline)', () => {
    expect(CONFIG).toContain("file: 'es.json'")
    expect(CONFIG).toContain("file: 'en.json'")
  })

  it('langDir points to i18n directory', () => {
    expect(CONFIG).toContain("langDir: '../i18n'")
  })

  it('default locale is ES', () => {
    expect(CONFIG).toContain("defaultLocale: 'es'")
  })

  it('uses prefix_except_default strategy', () => {
    expect(CONFIG).toContain("strategy: 'prefix_except_default'")
  })

  it('has browser language detection', () => {
    expect(CONFIG).toContain('detectBrowserLanguage')
    expect(CONFIG).toContain("fallbackLocale: 'es'")
  })
})
