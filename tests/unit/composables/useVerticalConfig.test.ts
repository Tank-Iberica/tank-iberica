import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// Mock Nuxt auto-imports
vi.stubGlobal('ref', ref)
vi.stubGlobal(
  'useState',
  vi.fn((_key: string, init?: () => unknown) => ref(init ? init() : null)),
)
vi.stubGlobal(
  'useRuntimeConfig',
  vi.fn(() => ({
    public: { vertical: 'tracciona' },
  })),
)
vi.stubGlobal(
  'useI18n',
  vi.fn(() => ({
    locale: { value: 'es' },
  })),
)

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  })),
}
vi.stubGlobal(
  'useSupabaseClient',
  vi.fn(() => mockSupabase),
)

import { useVerticalConfig, getVerticalSlug } from '../../../app/composables/useVerticalConfig'

describe('Vertical config composable (#248, #249)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRuntimeConfig).mockReturnValue({
      public: { vertical: 'tracciona' },
    } as any)
    vi.mocked(useState).mockImplementation(
      (_key: string, init?: () => unknown) => ref(init ? init() : null) as any,
    )
  })

  describe('getVerticalSlug', () => {
    it('returns slug from runtime config', () => {
      expect(getVerticalSlug()).toBe('tracciona')
    })

    it('defaults to tracciona when config is empty', () => {
      vi.mocked(useRuntimeConfig).mockReturnValue({ public: { vertical: '' } } as any)
      expect(getVerticalSlug()).toBe('tracciona')
    })

    it('defaults to tracciona when useRuntimeConfig throws', () => {
      vi.mocked(useRuntimeConfig).mockImplementation(() => {
        throw new Error('config unavailable')
      })
      expect(getVerticalSlug()).toBe('tracciona')
    })
  })

  describe('useVerticalConfig return shape', () => {
    it('returns config, loadConfig, helpers, and localizedTerm', () => {
      const result = useVerticalConfig()
      expect(result).toHaveProperty('config')
      expect(result).toHaveProperty('loadConfig')
      expect(result).toHaveProperty('applyTheme')
      expect(result).toHaveProperty('isSectionActive')
      expect(result).toHaveProperty('isLocaleActive')
      expect(result).toHaveProperty('isActionActive')
      expect(result).toHaveProperty('getCurrency')
      expect(result).toHaveProperty('localizedTerm')
    })

    it('config starts as null', () => {
      const { config } = useVerticalConfig()
      expect(config.value).toBeNull()
    })
  })

  describe('isSectionActive', () => {
    it('returns false when config is null', () => {
      const { isSectionActive } = useVerticalConfig()
      expect(isSectionActive('hero')).toBe(false)
    })

    it('returns true when section is active in config', () => {
      const configRef = ref({ homepage_sections: { hero: true, testimonials: false } })
      vi.mocked(useState).mockReturnValue(configRef as any)
      const { isSectionActive } = useVerticalConfig()
      expect(isSectionActive('hero')).toBe(true)
      expect(isSectionActive('testimonials')).toBe(false)
    })
  })

  describe('isLocaleActive', () => {
    it('returns false when config is null', () => {
      const { isLocaleActive } = useVerticalConfig()
      expect(isLocaleActive('es')).toBe(false)
    })

    it('checks active_locales array', () => {
      const configRef = ref({ active_locales: ['es', 'en'] })
      vi.mocked(useState).mockReturnValue(configRef as any)
      const { isLocaleActive } = useVerticalConfig()
      expect(isLocaleActive('es')).toBe(true)
      expect(isLocaleActive('fr')).toBe(false)
    })
  })

  describe('isActionActive', () => {
    it('returns false when config is null', () => {
      const { isActionActive } = useVerticalConfig()
      expect(isActionActive('sell')).toBe(false)
    })

    it('checks active_actions array', () => {
      const configRef = ref({ active_actions: ['sell', 'rent'] })
      vi.mocked(useState).mockReturnValue(configRef as any)
      const { isActionActive } = useVerticalConfig()
      expect(isActionActive('sell')).toBe(true)
      expect(isActionActive('auction')).toBe(false)
    })
  })

  describe('getCurrency', () => {
    it('defaults to EUR when config is null', () => {
      const { getCurrency } = useVerticalConfig()
      expect(getCurrency()).toBe('EUR')
    })

    it('returns configured currency', () => {
      const configRef = ref({ default_currency: 'USD' })
      vi.mocked(useState).mockReturnValue(configRef as any)
      const { getCurrency } = useVerticalConfig()
      expect(getCurrency()).toBe('USD')
    })

    it('falls back to EUR when default_currency is null', () => {
      const configRef = ref({ default_currency: null })
      vi.mocked(useState).mockReturnValue(configRef as any)
      const { getCurrency } = useVerticalConfig()
      expect(getCurrency()).toBe('EUR')
    })
  })

  describe('localizedTerm', () => {
    it('returns default Tracciona term in Spanish', () => {
      const { localizedTerm } = useVerticalConfig()
      expect(localizedTerm('product')).toBe('vehículo')
    })

    it('returns plural form when specified', () => {
      const { localizedTerm } = useVerticalConfig()
      expect(localizedTerm('product', 'plural')).toBe('vehículos')
    })

    it('returns English term when locale specified', () => {
      const { localizedTerm } = useVerticalConfig()
      expect(localizedTerm('product', 'singular', 'en')).toBe('vehicle')
      expect(localizedTerm('product', 'plural', 'en')).toBe('vehicles')
    })

    it('returns Horecaria defaults for horecaria vertical', () => {
      vi.mocked(useRuntimeConfig).mockReturnValue({ public: { vertical: 'horecaria' } } as any)
      const { localizedTerm } = useVerticalConfig()
      expect(localizedTerm('product')).toBe('equipo')
      expect(localizedTerm('product', 'plural')).toBe('equipos')
    })

    it('falls back to Tracciona defaults for unknown verticals', () => {
      vi.mocked(useRuntimeConfig).mockReturnValue({ public: { vertical: 'unknown' } } as any)
      const { localizedTerm } = useVerticalConfig()
      expect(localizedTerm('product')).toBe('vehículo')
    })

    it('falls back to key name for unknown terms', () => {
      const { localizedTerm } = useVerticalConfig()
      expect(localizedTerm('nonexistent')).toBe('nonexistent')
    })

    it('reads from vertical_config.terms when available', () => {
      const configRef = ref({
        terms: {
          product: {
            singular: { es: 'máquina', en: 'machine' },
            plural: { es: 'máquinas', en: 'machines' },
          },
        },
      })
      vi.mocked(useState).mockReturnValue(configRef as any)
      const { localizedTerm } = useVerticalConfig()
      expect(localizedTerm('product')).toBe('máquina')
      expect(localizedTerm('product', 'plural', 'en')).toBe('machines')
    })
  })

  describe('loadConfig', () => {
    it('queries vertical_config table', async () => {
      const mockSingle = vi.fn(() =>
        Promise.resolve({
          data: { name: { es: 'Tracciona' }, theme: {}, active_locales: ['es'] },
          error: null,
        }),
      )
      const mockEq = vi.fn(() => ({ single: mockSingle }))
      const mockSelect = vi.fn(() => ({ eq: mockEq }))
      mockSupabase.from.mockReturnValue({ select: mockSelect } as any)

      const { loadConfig } = useVerticalConfig()
      await loadConfig()

      expect(mockSupabase.from).toHaveBeenCalledWith('vertical_config')
    })

    it('skips query if config already loaded', async () => {
      const configRef = ref({ name: { es: 'Already loaded' } })
      vi.mocked(useState).mockReturnValue(configRef as any)

      const { loadConfig } = useVerticalConfig()
      await loadConfig()

      expect(mockSupabase.from).not.toHaveBeenCalled()
    })
  })
})
