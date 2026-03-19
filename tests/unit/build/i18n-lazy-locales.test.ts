import { describe, it, expect } from 'vitest'
import { loadNuxtConfig } from '../../helpers/nuxtConfig'

describe('Lazy load i18n locales', () => {
  let config: Record<string, any>

  beforeAll(async () => {
    config = await loadNuxtConfig()
  })

  it('i18n lazy loading is enabled', () => {
    expect(config.i18n.lazy).toBe(true)
  })

  it('locales use file references (not inline)', () => {
    const locales = config.i18n.locales
    const esLocale = locales.find((l: any) => l.code === 'es')
    const enLocale = locales.find((l: any) => l.code === 'en')
    expect(esLocale.file).toBe('es.json')
    expect(enLocale.file).toBe('en.json')
  })

  it('langDir points to i18n directory', () => {
    expect(config.i18n.langDir).toBe('../i18n')
  })

  it('default locale is ES', () => {
    expect(config.i18n.defaultLocale).toBe('es')
  })

  it('uses prefix_except_default strategy', () => {
    expect(config.i18n.strategy).toBe('prefix_except_default')
  })

  it('has browser language detection', () => {
    expect(config.i18n.detectBrowserLanguage).toBeDefined()
    expect(config.i18n.detectBrowserLanguage.fallbackLocale).toBe('es')
  })
})
