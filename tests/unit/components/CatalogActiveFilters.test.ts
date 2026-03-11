/**
 * Tests for app/components/catalog/CatalogActiveFilters.vue
 *
 * Covers: chip rendering, static chips (location/price/brand/year),
 * dynamic chips (value, array, range, boolean), chip removal,
 * clear all, emits, conditional v-if rendering.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { computed, ref } from 'vue'

// ── Mock composables via stubGlobal (Nuxt auto-imports) ──

const mockActiveFilters = ref<Record<string, unknown>>({})
const mockVisibleFilters = ref<{ name: string; label_es: string; label_en: string }[]>([])
const mockClearFilter = vi.fn()
const mockClearAllDynamic = vi.fn()

const mockFilters = ref<Record<string, unknown>>({})
const mockLocationLevel = ref<string | null>(null)
const mockUpdateFilters = vi.fn()
const mockSetLocationLevel = vi.fn()

// Mock geoData utility (explicit import in the component)
vi.mock('~/utils/geoData', () => ({
  getSortedEuropeanCountries: (_locale: string) => ({
    priority: [{ code: 'ES', name: 'Espana', flag: '\uD83C\uDDEA\uD83C\uDDF8' }],
    rest: [
      { code: 'DE', name: 'Alemania', flag: '\uD83C\uDDE9\uD83C\uDDEA' },
      { code: 'FR', name: 'Francia', flag: '\uD83C\uDDEB\uD83C\uDDF7' },
    ],
  }),
}))

// Use real Vue computed/ref and stub Nuxt auto-imports
beforeAll(() => {
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('ref', ref)

  vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
    locale: { value: 'es' },
  }))

  vi.stubGlobal('useFilters', () => ({
    activeFilters: computed(() => mockActiveFilters.value),
    visibleFilters: computed(() => mockVisibleFilters.value),
    clearFilter: mockClearFilter,
    clearAll: mockClearAllDynamic,
  }))

  vi.stubGlobal('useCatalogState', () => ({
    filters: computed(() => mockFilters.value),
    locationLevel: computed(() => mockLocationLevel.value),
    updateFilters: mockUpdateFilters,
    setLocationLevel: mockSetLocationLevel,
  }))
})

import CatalogActiveFilters from '../../../app/components/catalog/CatalogActiveFilters.vue'

// ── Helpers ──

function resetMocks() {
  mockActiveFilters.value = {}
  mockVisibleFilters.value = []
  mockFilters.value = {}
  mockLocationLevel.value = null
  mockClearFilter.mockClear()
  mockClearAllDynamic.mockClear()
  mockUpdateFilters.mockClear()
  mockSetLocationLevel.mockClear()
}

beforeEach(() => {
  resetMocks()
})

const factory = () =>
  shallowMount(CatalogActiveFilters, {
    global: {
      mocks: {
        $t: (key: string) => key,
      },
      stubs: {
        TransitionGroup: {
          template: '<div class="chips-row"><slot /></div>',
        },
      },
    },
  })

// ────────────────────────────
// CONDITIONAL RENDERING
// ────────────────────────────
describe('CatalogActiveFilters', () => {
  describe('conditional rendering', () => {
    it('does not render when no filters are active', () => {
      const w = factory()
      expect(w.find('.active-filters').exists()).toBe(false)
    })

    it('renders when price filter is active', () => {
      mockFilters.value = { price_min: 5000 }
      const w = factory()
      expect(w.find('.active-filters').exists()).toBe(true)
    })

    it('renders when brand filter is active', () => {
      mockFilters.value = { brand: 'Volvo' }
      const w = factory()
      expect(w.find('.active-filters').exists()).toBe(true)
    })

    it('renders when location filter is active', () => {
      mockLocationLevel.value = 'nacional'
      mockFilters.value = { location_countries: ['ES'] }
      const w = factory()
      expect(w.find('.active-filters').exists()).toBe(true)
    })
  })

  // ────────────────────────────
  // PRICE CHIPS
  // ────────────────────────────
  describe('price chips', () => {
    it('renders price chip with min and max', () => {
      mockFilters.value = { price_min: 5000, price_max: 50000 }
      const w = factory()
      const labels = w.findAll('.chip-label').map((c) => c.text())
      expect(labels.some((l) => l.includes('5k') && l.includes('50k'))).toBe(true)
    })

    it('renders price chip with only min', () => {
      mockFilters.value = { price_min: 10000 }
      const w = factory()
      const labels = w.findAll('.chip-label').map((c) => c.text())
      expect(labels.some((l) => l.includes('10k') && l.includes('200k'))).toBe(true)
    })

    it('renders price chip with only max', () => {
      mockFilters.value = { price_max: 30000 }
      const w = factory()
      const labels = w.findAll('.chip-label').map((c) => c.text())
      expect(labels.some((l) => l.includes('0') && l.includes('30k'))).toBe(true)
    })

    it('formats price below 1000 as plain number', () => {
      mockFilters.value = { price_min: 500, price_max: 800 }
      const w = factory()
      const labels = w.findAll('.chip-label').map((c) => c.text())
      expect(labels.some((l) => l.includes('500') && l.includes('800'))).toBe(true)
    })
  })

  // ────────────────────────────
  // BRAND CHIPS
  // ────────────────────────────
  describe('brand chips', () => {
    it('renders brand chip', () => {
      mockFilters.value = { brand: 'Scania' }
      const w = factory()
      const labels = w.findAll('.chip-label').map((c) => c.text())
      expect(labels).toContain('Scania')
    })
  })

  // ────────────────────────────
  // YEAR CHIPS
  // ────────────────────────────
  describe('year chips', () => {
    it('renders year range chip', () => {
      mockFilters.value = { year_min: 2015, year_max: 2023 }
      const w = factory()
      const labels = w.findAll('.chip-label').map((c) => c.text())
      expect(labels.some((l) => l.includes('2015') && l.includes('2023'))).toBe(true)
    })

    it('renders year chip with only min', () => {
      mockFilters.value = { year_min: 2018 }
      const w = factory()
      const labels = w.findAll('.chip-label').map((c) => c.text())
      expect(labels.some((l) => l.includes('2018'))).toBe(true)
    })
  })

  // ────────────────────────────
  // LOCATION CHIPS
  // ────────────────────────────
  describe('location chips', () => {
    it('renders location chip for province', () => {
      mockLocationLevel.value = 'provincia'
      mockFilters.value = { location_province_eq: 'Madrid' }
      const w = factory()
      const labels = w.findAll('.chip-label').map((c) => c.text())
      expect(labels).toContain('Madrid')
    })

    it('renders location chip for single country with flag', () => {
      mockLocationLevel.value = 'nacional'
      mockFilters.value = { location_countries: ['ES'] }
      const w = factory()
      const labels = w.findAll('.chip-label').map((c) => c.text())
      expect(labels.some((l) => l.includes('Espana'))).toBe(true)
    })

    it('renders location chip for multiple countries with count', () => {
      mockLocationLevel.value = 'europa'
      mockFilters.value = { location_countries: ['ES', 'FR', 'DE'] }
      const w = factory()
      const labels = w.findAll('.chip-label').map((c) => c.text())
      expect(labels.some((l) => l.includes('3') && l.includes('catalog.countries'))).toBe(true)
    })

    it('does not render location chip when level is mundo', () => {
      mockLocationLevel.value = 'mundo'
      const w = factory()
      expect(w.find('.active-filters').exists()).toBe(false)
    })

    it('does not render location chip when level is null', () => {
      mockLocationLevel.value = null
      const w = factory()
      expect(w.find('.active-filters').exists()).toBe(false)
    })

    it('falls back to country code when country not found', () => {
      mockLocationLevel.value = 'nacional'
      mockFilters.value = { location_countries: ['XX'] }
      const w = factory()
      const labels = w.findAll('.chip-label').map((c) => c.text())
      expect(labels.some((l) => l.includes('XX'))).toBe(true)
    })

    it('shows locationAll label when no countries', () => {
      mockLocationLevel.value = 'nacional'
      mockFilters.value = { location_countries: [] }
      const w = factory()
      const labels = w.findAll('.chip-label').map((c) => c.text())
      expect(labels.some((l) => l.includes('catalog.locationAll'))).toBe(true)
    })
  })

  // ────────────────────────────
  // DYNAMIC CHIPS — VALUE / ARRAY / BOOLEAN
  // ────────────────────────────
  describe('dynamic chips', () => {
    it('renders dynamic value chip', () => {
      mockActiveFilters.value = { color: 'Rojo' }
      mockVisibleFilters.value = [
        { name: 'color', label_es: 'Color', label_en: 'Color' },
      ]
      const w = factory()
      const labels = w.findAll('.chip-label').map((c) => c.text())
      expect(labels.some((l) => l.includes('Color') && l.includes('Rojo'))).toBe(true)
    })

    it('renders dynamic array chip with joined values', () => {
      mockActiveFilters.value = { ejes: ['2', '3'] }
      mockVisibleFilters.value = [
        { name: 'ejes', label_es: 'Ejes', label_en: 'Axes' },
      ]
      const w = factory()
      const labels = w.findAll('.chip-label').map((c) => c.text())
      expect(labels.some((l) => l.includes('Ejes') && l.includes('2, 3'))).toBe(true)
    })

    it('renders dynamic boolean chip with just the label', () => {
      mockActiveFilters.value = { adr: true }
      mockVisibleFilters.value = [
        { name: 'adr', label_es: 'ADR', label_en: 'ADR' },
      ]
      const w = factory()
      const labels = w.findAll('.chip-label').map((c) => c.text())
      expect(labels).toContain('ADR')
    })

    it('skips dynamic filters with falsy values', () => {
      mockActiveFilters.value = { color: '', ejes: null }
      const w = factory()
      expect(w.find('.active-filters').exists()).toBe(false)
    })
  })

  // ────────────────────────────
  // DYNAMIC CHIPS — RANGE
  // ────────────────────────────
  describe('dynamic range chips', () => {
    it('renders range chip from _min and _max values', () => {
      mockActiveFilters.value = { potencia_min: 200, potencia_max: 500 }
      mockVisibleFilters.value = [
        { name: 'potencia', label_es: 'Potencia', label_en: 'Power' },
      ]
      const w = factory()
      const labels = w.findAll('.chip-label').map((c) => c.text())
      expect(labels.some((l) => l.includes('Potencia') && l.includes('200') && l.includes('500'))).toBe(true)
    })

    it('renders range chip with only min', () => {
      mockActiveFilters.value = { peso_min: 3500 }
      mockVisibleFilters.value = [
        { name: 'peso', label_es: 'Peso', label_en: 'Weight' },
      ]
      const w = factory()
      const labels = w.findAll('.chip-label').map((c) => c.text())
      expect(labels.some((l) => l.includes('Peso') && l.includes('3500') && l.includes('...'))).toBe(true)
    })

    it('renders range chip with only max', () => {
      mockActiveFilters.value = { peso_max: 7500 }
      mockVisibleFilters.value = [
        { name: 'peso', label_es: 'Peso', label_en: 'Weight' },
      ]
      const w = factory()
      const labels = w.findAll('.chip-label').map((c) => c.text())
      expect(labels.some((l) => l.includes('Peso') && l.includes('...') && l.includes('7500'))).toBe(true)
    })

    it('does not duplicate range chip for _min and _max of same base', () => {
      mockActiveFilters.value = { potencia_min: 200, potencia_max: 500 }
      mockVisibleFilters.value = [
        { name: 'potencia', label_es: 'Potencia', label_en: 'Power' },
      ]
      const w = factory()
      const chips = w.findAll('.filter-chip')
      const rangeChips = chips.filter((c) => c.find('.chip-label').text().includes('Potencia'))
      expect(rangeChips).toHaveLength(1)
    })
  })

  // ────────────────────────────
  // FALLBACK LABELS
  // ────────────────────────────
  describe('filter label fallback', () => {
    it('falls back to filter name when definition not found', () => {
      mockActiveFilters.value = { unknownFilter: 'val' }
      mockVisibleFilters.value = []
      const w = factory()
      const labels = w.findAll('.chip-label').map((c) => c.text())
      expect(labels.some((l) => l.includes('unknownFilter'))).toBe(true)
    })
  })

  // ────────────────────────────
  // CHIP REMOVAL
  // ────────────────────────────
  describe('chip removal', () => {
    it('calls updateFilters to clear price when price chip removed', async () => {
      mockFilters.value = { price_min: 1000, price_max: 5000 }
      const w = factory()

      await w.find('.chip-remove').trigger('click')

      expect(mockUpdateFilters).toHaveBeenCalledWith({
        price_min: undefined,
        price_max: undefined,
      })
    })

    it('calls setLocationLevel to clear location when location chip removed', async () => {
      mockLocationLevel.value = 'nacional'
      mockFilters.value = { location_countries: ['ES'] }
      const w = factory()

      await w.find('.chip-remove').trigger('click')

      expect(mockSetLocationLevel).toHaveBeenCalledWith(null, '', null, null)
    })

    it('calls updateFilters to clear brand when brand chip removed', async () => {
      mockFilters.value = { brand: 'Volvo' }
      const w = factory()

      await w.find('.chip-remove').trigger('click')

      expect(mockUpdateFilters).toHaveBeenCalledWith({ brand: undefined })
    })

    it('calls updateFilters to clear year when year chip removed', async () => {
      mockFilters.value = { year_min: 2018, year_max: 2023 }
      const w = factory()

      await w.find('.chip-remove').trigger('click')

      expect(mockUpdateFilters).toHaveBeenCalledWith({
        year_min: undefined,
        year_max: undefined,
      })
    })

    it('calls clearFilter for dynamic chip removal', async () => {
      mockActiveFilters.value = { color: 'Rojo' }
      mockVisibleFilters.value = [
        { name: 'color', label_es: 'Color', label_en: 'Color' },
      ]
      const w = factory()

      await w.find('.chip-remove').trigger('click')

      expect(mockClearFilter).toHaveBeenCalledWith('color')
      expect(mockClearFilter).toHaveBeenCalledWith('color_min')
      expect(mockClearFilter).toHaveBeenCalledWith('color_max')
    })

    it('emits change event when chip is removed', async () => {
      mockFilters.value = { brand: 'MAN' }
      const w = factory()

      await w.find('.chip-remove').trigger('click')

      expect(w.emitted('change')).toHaveLength(1)
    })
  })

  // ────────────────────────────
  // CLEAR ALL
  // ────────────────────────────
  describe('clear all', () => {
    it('does not show clear-all button with fewer than 2 chips', () => {
      mockFilters.value = { brand: 'Volvo' }
      const w = factory()
      expect(w.find('.clear-all-link').exists()).toBe(false)
    })

    it('shows clear-all button when 2 or more chips exist', () => {
      mockFilters.value = { brand: 'Volvo', price_min: 1000 }
      const w = factory()
      expect(w.find('.clear-all-link').exists()).toBe(true)
    })

    it('clears all filters when clear-all is clicked', async () => {
      mockFilters.value = { brand: 'Volvo', price_min: 1000 }
      const w = factory()

      await w.find('.clear-all-link').trigger('click')

      expect(mockClearAllDynamic).toHaveBeenCalled()
      expect(mockUpdateFilters).toHaveBeenCalledWith({
        price_min: undefined,
        price_max: undefined,
        year_min: undefined,
        year_max: undefined,
        brand: undefined,
      })
      expect(mockSetLocationLevel).toHaveBeenCalledWith(null, '', null, null)
    })

    it('emits change event when clear-all is clicked', async () => {
      mockFilters.value = { brand: 'Volvo', price_min: 1000 }
      const w = factory()

      await w.find('.clear-all-link').trigger('click')

      expect(w.emitted('change')).toHaveLength(1)
    })

    it('clear-all link text uses i18n key', () => {
      mockFilters.value = { brand: 'Volvo', price_min: 1000 }
      const w = factory()
      expect(w.find('.clear-all-link').text()).toBe('catalog.clearAll')
    })
  })

  // ────────────────────────────
  // CHIP REMOVE ARIA
  // ────────────────────────────
  describe('chip remove accessibility', () => {
    it('remove button has aria-label', () => {
      mockFilters.value = { brand: 'Volvo' }
      const w = factory()
      expect(w.find('.chip-remove').attributes('aria-label')).toBe('catalog.clearFilters')
    })

    it('remove button has type=button', () => {
      mockFilters.value = { brand: 'Volvo' }
      const w = factory()
      expect(w.find('.chip-remove').attributes('type')).toBe('button')
    })
  })

  // ────────────────────────────
  // MIXED STATIC + DYNAMIC
  // ────────────────────────────
  describe('mixed chips', () => {
    it('renders both static and dynamic chips together', () => {
      mockFilters.value = { brand: 'DAF', price_min: 2000 }
      mockActiveFilters.value = { potencia_min: 150, potencia_max: 400 }
      mockVisibleFilters.value = [
        { name: 'potencia', label_es: 'Potencia', label_en: 'Power' },
      ]
      const w = factory()
      const chips = w.findAll('.filter-chip')
      expect(chips.length).toBe(3) // price + brand + potencia range
    })

    it('has unique keys for each chip', () => {
      mockFilters.value = { brand: 'DAF', price_min: 2000, year_min: 2020 }
      mockLocationLevel.value = 'nacional'
      mockFilters.value = {
        ...mockFilters.value,
        location_countries: ['ES'],
      }
      mockActiveFilters.value = { adr: true }
      mockVisibleFilters.value = [
        { name: 'adr', label_es: 'ADR', label_en: 'ADR' },
      ]
      const w = factory()
      const chips = w.findAll('.filter-chip')
      expect(chips.length).toBeGreaterThanOrEqual(2)
    })
  })
})
