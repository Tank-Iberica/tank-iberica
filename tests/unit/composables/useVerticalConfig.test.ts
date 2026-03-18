import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SRC = readFileSync(resolve(ROOT, 'app/composables/useVerticalConfig.ts'), 'utf-8')

describe('i18n genérica por vertical (#248) + localizedTerm (#249)', () => {
  describe('localizedTerm function', () => {
    it('exports localizedTerm in return object', () => {
      expect(SRC).toContain('localizedTerm,')
    })

    it('accepts key and form (singular/plural)', () => {
      expect(SRC).toContain("form: 'singular' | 'plural'")
    })

    it('defaults to singular form', () => {
      expect(SRC).toContain("= 'singular'")
    })

    it('accepts optional locale parameter', () => {
      expect(SRC).toContain('locale?: string')
    })

    it('reads from vertical_config.terms JSONB', () => {
      expect(SRC).toContain('config.value')
      expect(SRC).toContain('terms')
    })

    it('has Tracciona defaults (vehículo/vehicles)', () => {
      expect(SRC).toContain("singular: { es: 'vehículo', en: 'vehicle' }")
      expect(SRC).toContain("plural: { es: 'vehículos', en: 'vehicles' }")
    })

    it('has Horecaria defaults (equipo/equipment)', () => {
      expect(SRC).toContain("singular: { es: 'equipo', en: 'equipment' }")
      expect(SRC).toContain("plural: { es: 'equipos', en: 'equipment' }")
    })

    it('falls back to Tracciona defaults for unknown verticals', () => {
      expect(SRC).toContain('defaults.tracciona')
    })

    it('falls back to key name as last resort', () => {
      expect(SRC).toContain('?? key')
    })
  })

  describe('useVerticalConfig composable', () => {
    it('exports useVerticalConfig function', () => {
      expect(SRC).toContain('export function useVerticalConfig()')
    })

    it('exports getVerticalSlug function', () => {
      expect(SRC).toContain('export function getVerticalSlug()')
    })

    it('reads NUXT_PUBLIC_VERTICAL env', () => {
      expect(SRC).toContain('public.vertical')
    })

    it('defaults to tracciona slug', () => {
      expect(SRC).toContain("|| 'tracciona'")
    })

    it('loads config from vertical_config table', () => {
      expect(SRC).toContain("from('vertical_config')")
    })

    it('caches config in useState', () => {
      expect(SRC).toContain("useState<VerticalConfig | null>('vertical_config'")
    })
  })

  describe('VerticalConfig interface', () => {
    it('has name field (multi-lang)', () => {
      expect(SRC).toContain('name: Record<string, string>')
    })

    it('has theme field', () => {
      expect(SRC).toContain('theme: Record<string, string>')
    })

    it('has active_locales', () => {
      expect(SRC).toContain('active_locales: string[]')
    })

    it('has default_locale', () => {
      expect(SRC).toContain('default_locale: string')
    })

    it('has subscription_prices', () => {
      expect(SRC).toContain('subscription_prices')
    })

    it('has commission_rates', () => {
      expect(SRC).toContain('commission_rates')
    })
  })

  describe('Helper functions', () => {
    it('has isSectionActive', () => {
      expect(SRC).toContain('isSectionActive')
    })

    it('has isLocaleActive', () => {
      expect(SRC).toContain('isLocaleActive')
    })

    it('has isActionActive', () => {
      expect(SRC).toContain('isActionActive')
    })

    it('has getCurrency', () => {
      expect(SRC).toContain('getCurrency')
    })

    it('has applyTheme', () => {
      expect(SRC).toContain('applyTheme')
    })
  })
})
