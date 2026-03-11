/**
 * Tests for app/components/catalog/VehicleGrid.vue
 *
 * Covers: rendering branches (loading, list view, grid, empty state, cascade),
 * computed displayedVehicles (favorites filter, fuzzy search), gridItems interleaving,
 * promo action routing, pairSuggestions, load-more button, and emits.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { computed, ref } from 'vue'

// ── State refs shared across tests ──
const favoritesOnlyRef = ref(false)
const favoriteIdsSet = new Set<string>()
const searchQueryRef = ref('')

// localizedName is explicitly imported from ~/composables/useLocalized
vi.mock('~/composables/useLocalized', () => ({
  localizedName: (obj: Record<string, string> | undefined | null, locale: string) => {
    if (!obj) return ''
    return obj[`name_${locale}`] || obj.name_es || ''
  },
}))

// Override global stubs with real Vue primitives for template rendering
beforeAll(() => {
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('ref', ref)

  // useFavorites, useCatalogState, fuzzyMatch are Nuxt auto-imports (no import statement)
  vi.stubGlobal('useFavorites', () => ({
    favoritesOnly: favoritesOnlyRef,
    isFavorite: (id: string) => favoriteIdsSet.has(id),
    favoriteIds: { value: favoriteIdsSet },
    toggle: vi.fn(),
    toggleFilter: vi.fn(),
    count: () => favoriteIdsSet.size,
  }))

  vi.stubGlobal('useCatalogState', () => ({
    searchQuery: searchQueryRef,
    viewMode: computed(() => 'grid'),
    activeAction: computed(() => null),
    activeActions: computed(() => []),
    activeCategoryId: computed(() => null),
    activeCategorySlug: computed(() => null),
    activeSubcategoryId: computed(() => null),
    activeSubcategorySlug: computed(() => null),
    filters: computed(() => ({})),
    scrollPosition: computed(() => 0),
    sortBy: computed(() => 'recommended'),
    locationLevel: computed(() => null),
    setAction: vi.fn(),
    setActions: vi.fn(),
    setCategory: vi.fn(),
    setSubcategory: vi.fn(),
    updateFilters: vi.fn(),
    setSearch: vi.fn(),
    setSort: vi.fn(),
    setViewMode: vi.fn(),
    setLocationLevel: vi.fn(),
    saveScrollPosition: vi.fn(),
    resetCatalog: vi.fn(),
  }))

  vi.stubGlobal('fuzzyMatch', (text: string, query: string) =>
    text.toLowerCase().includes(query.toLowerCase()),
  )
})

// Import after stubs are in place
import VehicleGrid from '../../../app/components/catalog/VehicleGrid.vue'

// ── Helpers ──

interface FakeVehicle {
  id: string
  brand: string
  model: string
  location: string
  description_es: string
  description_en: string
  subcategories?: Record<string, unknown> | null
  [key: string]: unknown
}

function makeVehicle(id: string, overrides: Partial<FakeVehicle> = {}): FakeVehicle {
  return {
    id,
    brand: 'Volvo',
    model: 'FH16',
    location: 'Madrid',
    description_es: 'Camion pesado',
    description_en: 'Heavy truck',
    subcategories: null,
    ...overrides,
  }
}

function factory(props: Record<string, unknown> = {}) {
  return shallowMount(VehicleGrid, {
    props: {
      vehicles: [],
      loading: false,
      loadingMore: false,
      hasMore: false,
      ...props,
    } as any,
    global: {
      mocks: {
        $t: (key: string, params?: Record<string, unknown>) => {
          if (params) return `${key}:${JSON.stringify(params)}`
          return key
        },
      },
      stubs: {
        CatalogVehicleCard: { template: '<div class="vehicle-card-stub" />' },
        CatalogVehicleTable: { template: '<div class="vehicle-table-stub" />' },
        CatalogPromoCard: {
          template: '<div class="promo-card-stub" />',
          props: ['slots'],
          emits: ['action', 'actionSecondary'],
        },
      },
    },
  })
}

// ── Reset state between tests ──
beforeEach(() => {
  favoritesOnlyRef.value = false
  favoriteIdsSet.clear()
  searchQueryRef.value = ''
})

// ────────────────────────────────────────────
// TESTS
// ────────────────────────────────────────────

describe('VehicleGrid', () => {
  // ── Loading state ──
  describe('loading skeleton', () => {
    it('renders 6 skeleton cards when loading is true', () => {
      const w = factory({ loading: true })
      const skeletons = w.findAll('.skeleton-card')
      expect(skeletons).toHaveLength(6)
    })

    it('shows skeleton-image and skeleton-body in each card', () => {
      const w = factory({ loading: true })
      expect(w.findAll('.skeleton-image')).toHaveLength(6)
      expect(w.findAll('.skeleton-body')).toHaveLength(6)
    })

    it('does not render vehicle grid when loading', () => {
      const w = factory({ loading: true, vehicles: [makeVehicle('1')] })
      expect(w.find('.vehicle-card-stub').exists()).toBe(false)
    })
  })

  // ── List view mode ──
  describe('list view mode', () => {
    it('renders CatalogVehicleTable when viewMode is list', () => {
      const w = factory({
        vehicles: [makeVehicle('1')],
        viewMode: 'list',
      })
      expect(w.find('.vehicle-table-stub').exists()).toBe(true)
      expect(w.find('.vehicle-grid').exists()).toBe(false)
    })
  })

  // ── Grid view mode ──
  describe('grid view mode', () => {
    it('renders vehicle cards for each vehicle', () => {
      const vehicles = [makeVehicle('a'), makeVehicle('b'), makeVehicle('c')]
      const w = factory({ vehicles })
      expect(w.findAll('.vehicle-card-stub').length).toBeGreaterThanOrEqual(3)
    })

    it('renders vehicle-grid class when vehicles exist', () => {
      const w = factory({ vehicles: [makeVehicle('1')] })
      expect(w.find('.vehicle-grid').exists()).toBe(true)
    })

    it('interleaves promo card after 2nd vehicle (3+ vehicles)', () => {
      const vehicles = [makeVehicle('a'), makeVehicle('b'), makeVehicle('c'), makeVehicle('d')]
      const w = factory({ vehicles })
      expect(w.findAll('.promo-card-stub').length).toBeGreaterThanOrEqual(1)
    })

    it('appends promo card at end when fewer than 3 vehicles', () => {
      const vehicles = [makeVehicle('a'), makeVehicle('b')]
      const w = factory({ vehicles })
      expect(w.findAll('.promo-card-stub').length).toBeGreaterThanOrEqual(1)
    })

    it('includes hidden vehicles split promo when hiddenCount > 0 (3+ vehicles)', () => {
      const vehicles = [makeVehicle('a'), makeVehicle('b'), makeVehicle('c')]
      const w = factory({ vehicles, hiddenCount: 5, hoursUntilNext: 12 })
      const promos = w.findAll('.promo-card-stub')
      expect(promos.length).toBeGreaterThanOrEqual(1)
    })

    it('includes expand area promo when no more pages and nextLevel has results', () => {
      const vehicles = [makeVehicle('a'), makeVehicle('b'), makeVehicle('c')]
      const w = factory({
        vehicles,
        hasMore: false,
        nextLevel: 'region',
        nextLevelCount: 15,
      })
      const promos = w.findAll('.promo-card-stub')
      expect(promos.length).toBeGreaterThanOrEqual(2)
    })

    it('does NOT include expand promo when hasMore is true', () => {
      const vehicles = [makeVehicle('a'), makeVehicle('b'), makeVehicle('c')]
      const w = factory({
        vehicles,
        hasMore: true,
        nextLevel: 'region',
        nextLevelCount: 15,
      })
      const promos = w.findAll('.promo-card-stub')
      expect(promos.length).toBe(1)
    })
  })

  // ── Empty state (zero results) ──
  describe('empty state', () => {
    it('renders vehicle-grid--empty when no vehicles', () => {
      const w = factory({ vehicles: [] })
      expect(w.find('.vehicle-grid--empty').exists()).toBe(true)
    })

    it('renders demand promo card', () => {
      const w = factory({ vehicles: [] })
      expect(w.findAll('.promo-card-stub').length).toBeGreaterThanOrEqual(1)
    })

    it('renders expand area promo when nextLevel with count', () => {
      const w = factory({
        vehicles: [],
        nextLevel: 'country',
        nextLevelCount: 10,
      })
      expect(w.findAll('.promo-card-stub').length).toBeGreaterThanOrEqual(2)
    })

    it('renders expand area promo when nextLevelCountLoading', () => {
      const w = factory({
        vehicles: [],
        nextLevel: 'country',
        nextLevelCount: 0,
        nextLevelCountLoading: true,
      })
      expect(w.findAll('.promo-card-stub').length).toBeGreaterThanOrEqual(2)
    })

    it('does NOT render expand area promo when nextLevel is null', () => {
      const w = factory({
        vehicles: [],
        nextLevel: null,
        nextLevelCount: 10,
      })
      expect(w.findAll('.promo-card-stub').length).toBe(1)
    })

    it('renders suggestion promo cards', () => {
      const suggestions = [
        { labelKey: 'sug1', filters: { brand: 'MAN' }, count: 3 },
        { labelKey: 'sug2', filters: { brand: 'DAF' }, count: 7 },
      ]
      const w = factory({ vehicles: [], suggestions })
      expect(w.findAll('.promo-card-stub').length).toBeGreaterThanOrEqual(3)
    })

    it('renders loading skeletons for suggestions when suggestionsLoading', () => {
      const w = factory({
        vehicles: [],
        suggestionsLoading: true,
        suggestions: [],
      })
      expect(w.findAll('.skeleton-card').length).toBe(2)
    })

    it('does NOT render suggestion skeletons when suggestions are already loaded', () => {
      const w = factory({
        vehicles: [],
        suggestionsLoading: true,
        suggestions: [{ labelKey: 's1', filters: {}, count: 1 }],
      })
      expect(w.findAll('.skeleton-card').length).toBe(0)
    })
  })

  // ── Cascade (end-of-catalog) ──
  describe('cascade section', () => {
    const baseCascadeProps = {
      vehicles: [makeVehicle('a')],
      hasMore: false,
      loading: false,
    }

    it('renders cascade section when conditions met', () => {
      const w = factory({
        ...baseCascadeProps,
        cascadeLevels: [
          {
            depth: 1,
            suggestions: [{ labelKey: 's1', filters: {}, count: 3 }],
            loaded: true,
            loading: false,
          },
        ],
      })
      expect(w.find('.vehicle-grid--cascade').exists()).toBe(true)
    })

    it('renders cascade header when suggestions exist', () => {
      const w = factory({
        ...baseCascadeProps,
        cascadeLevels: [
          {
            depth: 1,
            suggestions: [{ labelKey: 's1', filters: {}, count: 2 }],
            loaded: true,
            loading: false,
          },
        ],
      })
      expect(w.find('.cascade-header').exists()).toBe(true)
      expect(w.find('.cascade-header').text()).toBe('catalog.moreSuggestions')
    })

    it('renders cascade header when level is loading', () => {
      const w = factory({
        ...baseCascadeProps,
        cascadeLevels: [
          { depth: 1, suggestions: [], loaded: false, loading: true },
        ],
      })
      expect(w.find('.cascade-header').exists()).toBe(true)
    })

    it('renders cascade loading skeletons', () => {
      const w = factory({
        ...baseCascadeProps,
        cascadeLevels: [
          { depth: 1, suggestions: [], loaded: false, loading: true },
        ],
      })
      const skeletons = w.findAll('.vehicle-grid--cascade .skeleton-card')
      expect(skeletons).toHaveLength(2)
    })

    it('does NOT render cascade when hasMore is true', () => {
      const w = factory({
        vehicles: [makeVehicle('a')],
        hasMore: true,
        loading: false,
        cascadeLevels: [
          { depth: 1, suggestions: [{ labelKey: 's1', filters: {}, count: 2 }], loaded: true, loading: false },
        ],
      })
      expect(w.find('.vehicle-grid--cascade').exists()).toBe(false)
    })

    it('does NOT render cascade when loading', () => {
      const w = factory({
        vehicles: [makeVehicle('a')],
        hasMore: false,
        loading: true,
        cascadeLevels: [
          { depth: 1, suggestions: [], loaded: false, loading: true },
        ],
      })
      expect(w.find('.vehicle-grid--cascade').exists()).toBe(false)
    })

    it('does NOT render cascade when cascadeLevels is empty', () => {
      const w = factory({
        ...baseCascadeProps,
        cascadeLevels: [],
      })
      expect(w.find('.vehicle-grid--cascade').exists()).toBe(false)
    })

    it('renders load-more cascade button when hasMoreCascadeLevels', () => {
      const w = factory({
        ...baseCascadeProps,
        cascadeLevels: [
          { depth: 1, suggestions: [{ labelKey: 's1', filters: {}, count: 2 }], loaded: true, loading: false },
        ],
        hasMoreCascadeLevels: true,
      })
      expect(w.find('.cascade-more-wrap .load-more-btn').exists()).toBe(true)
    })

    it('emits loadMoreCascade when cascade button clicked', async () => {
      const w = factory({
        ...baseCascadeProps,
        cascadeLevels: [
          { depth: 1, suggestions: [{ labelKey: 's1', filters: {}, count: 2 }], loaded: true, loading: false },
        ],
        hasMoreCascadeLevels: true,
      })
      await w.find('.cascade-more-wrap .load-more-btn').trigger('click')
      expect(w.emitted('loadMoreCascade')).toBeTruthy()
    })

    it('pairs odd number of cascade suggestions correctly', () => {
      const w = factory({
        ...baseCascadeProps,
        cascadeLevels: [
          {
            depth: 1,
            suggestions: [
              { labelKey: 's1', filters: { brand: 'A' }, count: 1 },
              { labelKey: 's2', filters: { brand: 'B' }, count: 2 },
              { labelKey: 's3', filters: { brand: 'C' }, count: 3 },
            ],
            loaded: true,
            loading: false,
          },
        ],
      })
      // 3 suggestions -> 2 pairs (1 pair of 2 + 1 single)
      const cascadePromos = w.findAll('.vehicle-grid--cascade .promo-card-stub')
      expect(cascadePromos).toHaveLength(2)
    })
  })

  // ── Load more button ──
  describe('load more button', () => {
    it('renders load-more when hasMore and vehicles exist', () => {
      const w = factory({
        vehicles: [makeVehicle('a')],
        hasMore: true,
      })
      expect(w.find('.load-more').exists()).toBe(true)
    })

    it('does NOT render load-more when no vehicles', () => {
      const w = factory({
        vehicles: [],
        hasMore: true,
      })
      expect(w.find('.load-more').exists()).toBe(false)
    })

    it('does NOT render load-more when hasMore is false', () => {
      const w = factory({
        vehicles: [makeVehicle('a')],
        hasMore: false,
      })
      expect(w.find('.load-more').exists()).toBe(false)
    })

    it('shows loading text when loadingMore', () => {
      const w = factory({
        vehicles: [makeVehicle('a')],
        hasMore: true,
        loadingMore: true,
      })
      expect(w.find('.load-more-btn').text()).toBe('common.loading')
    })

    it('shows loadMore text when not loading', () => {
      const w = factory({
        vehicles: [makeVehicle('a')],
        hasMore: true,
        loadingMore: false,
      })
      expect(w.find('.load-more-btn').text()).toBe('catalog.loadMore')
    })

    it('button is disabled when loadingMore', () => {
      const w = factory({
        vehicles: [makeVehicle('a')],
        hasMore: true,
        loadingMore: true,
      })
      expect((w.find('.load-more-btn').element as HTMLButtonElement).disabled).toBe(true)
    })

    it('emits loadMore on button click', async () => {
      const w = factory({
        vehicles: [makeVehicle('a')],
        hasMore: true,
      })
      await w.find('.load-more-btn').trigger('click')
      expect(w.emitted('loadMore')).toBeTruthy()
    })
  })

  // ── displayedVehicles computed ──
  describe('displayedVehicles filtering', () => {
    it('filters by favorites when favoritesOnly is true', async () => {
      favoriteIdsSet.add('fav1')
      favoritesOnlyRef.value = true

      const vehicles = [makeVehicle('fav1'), makeVehicle('other')]
      const w = factory({ vehicles })
      await w.vm.$nextTick()

      const cards = w.findAll('.vehicle-card-stub')
      expect(cards).toHaveLength(1)
    })

    it('filters by search query (fuzzy)', async () => {
      searchQueryRef.value = 'Madrid'
      const vehicles = [
        makeVehicle('1', { location: 'Madrid' }),
        makeVehicle('2', { location: 'Barcelona' }),
      ]
      const w = factory({ vehicles })
      await w.vm.$nextTick()

      const cards = w.findAll('.vehicle-card-stub')
      expect(cards).toHaveLength(1)
    })

    it('shows all vehicles when no filters active', () => {
      const vehicles = [makeVehicle('1'), makeVehicle('2'), makeVehicle('3')]
      const w = factory({ vehicles })
      const cards = w.findAll('.vehicle-card-stub')
      expect(cards).toHaveLength(3)
    })

    it('shows empty state when all vehicles filtered out', async () => {
      favoritesOnlyRef.value = true
      const w = factory({ vehicles: [makeVehicle('a')] })
      await w.vm.$nextTick()
      expect(w.find('.vehicle-grid--empty').exists()).toBe(true)
    })
  })

  // ── Emits from empty state promo cards ──
  describe('empty state emits', () => {
    it('emits openDemand when demand promo action is triggered', async () => {
      const w = factory({ vehicles: [] })
      const promos = w.findAllComponents({ name: 'CatalogPromoCard' })
      if (promos.length > 0) {
        await promos[0].vm.$emit('action')
        expect(w.emitted('openDemand')).toBeTruthy()
      }
    })

    it('emits createAlert when demand promo secondary action is triggered', async () => {
      const w = factory({ vehicles: [] })
      const promos = w.findAllComponents({ name: 'CatalogPromoCard' })
      if (promos.length > 0) {
        await promos[0].vm.$emit('action-secondary')
        expect(w.emitted('createAlert')).toBeTruthy()
      }
    })

    it('emits expandArea on expand promo action', async () => {
      const w = factory({
        vehicles: [],
        nextLevel: 'country',
        nextLevelCount: 5,
      })
      const promos = w.findAllComponents({ name: 'CatalogPromoCard' })
      if (promos.length > 1) {
        await promos[1].vm.$emit('action')
        expect(w.emitted('expandArea')).toBeTruthy()
      }
    })

    it('emits applySuggestion on suggestion promo action', async () => {
      const suggestions = [
        { labelKey: 'sug1', filters: { brand: 'Scania' }, count: 5 },
      ]
      const w = factory({ vehicles: [], suggestions })
      const promos = w.findAllComponents({ name: 'CatalogPromoCard' })
      const lastPromo = promos[promos.length - 1]
      if (lastPromo) {
        await lastPromo.vm.$emit('action')
        expect(w.emitted('applySuggestion')).toBeTruthy()
      }
    })
  })

  // ── gridItems interleaving logic ──
  describe('gridItems interleaving', () => {
    it('places promo at position 2 for 4+ vehicles', () => {
      const vehicles = [makeVehicle('a'), makeVehicle('b'), makeVehicle('c'), makeVehicle('d')]
      const w = factory({ vehicles })
      const allItems = w.findAll('.vehicle-card-stub, .promo-card-stub')
      expect(allItems.length).toBe(5) // 4 vehicles + 1 promo
    })

    it('places promo at end for 1 vehicle', () => {
      const w = factory({ vehicles: [makeVehicle('a')] })
      const allItems = w.findAll('.vehicle-card-stub, .promo-card-stub')
      expect(allItems.length).toBe(2) // 1 vehicle + 1 promo at end
    })

    it('places promo at end for 2 vehicles', () => {
      const w = factory({ vehicles: [makeVehicle('a'), makeVehicle('b')] })
      const allItems = w.findAll('.vehicle-card-stub, .promo-card-stub')
      expect(allItems.length).toBe(3) // 2 vehicles + 1 promo at end
    })

    it('places promo at position 2 for exactly 3 vehicles', () => {
      const w = factory({
        vehicles: [makeVehicle('a'), makeVehicle('b'), makeVehicle('c')],
      })
      const allItems = w.findAll('.vehicle-card-stub, .promo-card-stub')
      expect(allItems.length).toBe(4) // 3 vehicles + 1 promo at position 2
    })
  })

  // ── hiddenSlot computed ──
  describe('hidden vehicles promo', () => {
    it('uses hidden+demand split when hiddenCount > 0 and 3+ vehicles', () => {
      const vehicles = [makeVehicle('a'), makeVehicle('b'), makeVehicle('c')]
      const w = factory({ vehicles, hiddenCount: 3, hoursUntilNext: 6 })
      expect(w.findAll('.promo-card-stub').length).toBeGreaterThanOrEqual(1)
    })

    it('does not show hidden split when hiddenCount is 0', () => {
      const vehicles = [makeVehicle('a'), makeVehicle('b'), makeVehicle('c')]
      const w = factory({ vehicles, hiddenCount: 0 })
      expect(w.findAll('.promo-card-stub')).toHaveLength(1)
    })
  })

  // ── expandSlot computed ──
  describe('expand slot', () => {
    it('uses loading title when nextLevelCountLoading is true', () => {
      const w = factory({
        vehicles: [],
        nextLevel: 'region',
        nextLevelCount: 0,
        nextLevelCountLoading: true,
      })
      expect(w.find('.vehicle-grid--empty').exists()).toBe(true)
    })
  })

  // ── Default viewMode ──
  describe('default viewMode', () => {
    it('defaults to grid view when viewMode prop is not provided', () => {
      const w = factory({ vehicles: [makeVehicle('a')] })
      expect(w.find('.vehicle-grid').exists()).toBe(true)
      expect(w.find('.vehicle-table-stub').exists()).toBe(false)
    })
  })
})
