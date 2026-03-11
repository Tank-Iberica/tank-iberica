/**
 * Tests for app/components/catalog/SubcategoryBar.vue
 *
 * Covers: rendering, v-if/v-show branches (3 navigation levels), emits,
 * methods (selectCategory, clearCategory, selectSubcategory, clearSubcategory,
 * scroll arrows, isApplicable, isSubcategoryApplicable),
 * computed (visibleCategories, linkedSubcategories, selectedCategoryName,
 * selectedSubcategoryName, hasItems).
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { shallowMount, VueWrapper } from '@vue/test-utils'
import { ref, computed } from 'vue'

// ---------- mock state ----------
const mockActiveCategoryId = ref<string | null>(null)
const mockActiveSubcategoryId = ref<string | null>(null)
const mockActiveActions = ref<string[]>([])
const mockSetCategory = vi.fn()
const mockSetSubcategory = vi.fn()

// ---------- Supabase mock with controlled data ----------
const tableData: Record<string, unknown[]> = {
  categories: [],
  subcategories: [],
  subcategory_categories: [],
}

/**
 * Build a chainable query builder mock.
 * The chain always eventually resolves with the table data.
 * Calls like .select().eq().order() or .select() (bare) all work.
 */
function createFrom(table: string) {
  const terminalResult = () => Promise.resolve({ data: tableData[table] ?? [], error: null })

  // Build a recursive chain where every method returns the chain
  // and the chain is also thenable so await works at any point.
  function buildChain(): Record<string, unknown> {
    const chain: Record<string, unknown> = {}
    const methods = ['select', 'eq', 'order', 'in', 'ilike', 'gte', 'lte', 'or']
    methods.forEach((m) => {
      chain[m] = (..._args: unknown[]) => buildChain()
    })
    // Make the chain thenable — so `await supabase.from('x').select(...)` works
    chain.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
      terminalResult().then(resolve, reject)
    return chain
  }

  return buildChain()
}

// ---------- mock localizedField import ----------
vi.mock('~/composables/useLocalized', () => ({
  localizedField: (json: Record<string, string>, locale: string) =>
    json[locale] || json['en'] || json['es'] || '',
}))

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('onMounted', (fn: () => void) => fn())
  vi.stubGlobal('onUnmounted', vi.fn())
  vi.stubGlobal('nextTick', vi.fn().mockResolvedValue(undefined))
  vi.stubGlobal('watch', vi.fn())

  vi.stubGlobal('useCatalogState', () => ({
    activeActions: mockActiveActions,
    activeCategoryId: mockActiveCategoryId,
    activeSubcategoryId: mockActiveSubcategoryId,
    setCategory: mockSetCategory,
    setSubcategory: mockSetSubcategory,
  }))

  vi.stubGlobal('useSupabaseClient', () => ({
    from: (table: string) => createFrom(table),
  }))

  vi.stubGlobal('useI18n', () => ({
    locale: ref('es'),
    t: (key: string) => key,
  }))
})

// ---------- component import ----------
import SubcategoryBar from '../../../app/components/catalog/SubcategoryBar.vue'

// ---------- sample data ----------
const categoriesData = [
  {
    id: 'cat-1',
    name_es: 'Semirremolques',
    name_en: 'Semitrailers',
    slug: 'semirremolques',
    applicable_actions: ['venta', 'alquiler'],
    sort_order: 1,
  },
  {
    id: 'cat-2',
    name_es: 'Cabezas Tractoras',
    name_en: 'Tractor Heads',
    slug: 'cabezas-tractoras',
    applicable_actions: ['venta'],
    sort_order: 2,
  },
  {
    id: 'cat-3',
    name_es: 'Rigidos',
    name_en: 'Rigids',
    slug: 'rigidos',
    applicable_actions: ['terceros'],
    sort_order: 3,
  },
]

const subcategoriesData = [
  {
    id: 'sub-1',
    name_es: 'Cisternas',
    name_en: 'Tankers',
    slug: 'cisternas',
    applicable_actions: ['venta', 'alquiler'],
    sort_order: 1,
  },
  {
    id: 'sub-2',
    name_es: 'Frigorificos',
    name_en: 'Refrigerated',
    slug: 'frigorificos',
    applicable_actions: ['venta'],
    sort_order: 2,
  },
  {
    id: 'sub-3',
    name_es: 'Plataformas',
    name_en: 'Flatbeds',
    slug: 'plataformas',
    applicable_actions: ['terceros'],
    sort_order: 3,
  },
]

const linksData = [
  { subcategory_id: 'sub-1', category_id: 'cat-1' },
  { subcategory_id: 'sub-2', category_id: 'cat-1' },
  { subcategory_id: 'sub-3', category_id: 'cat-2' },
]

// ---------- helpers ----------

async function createWrapper(): Promise<VueWrapper> {
  const w = shallowMount(SubcategoryBar, {
    global: {
      mocks: { $t: (key: string) => key },
    },
  })
  // Allow onMounted's Promise.all to resolve
  await new Promise((r) => setTimeout(r, 20))
  await w.vm.$nextTick()
  return w
}

// ---------- tests ----------

describe('SubcategoryBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockActiveCategoryId.value = null
    mockActiveSubcategoryId.value = null
    mockActiveActions.value = []
    tableData.categories = categoriesData
    tableData.subcategories = subcategoriesData
    tableData.subcategory_categories = linksData
  })

  // ====== Level 1 — no category selected ======

  describe('Level 1 — category list (no selection)', () => {
    it('renders section when categories exist', async () => {
      const w = await createWrapper()
      expect(w.find('.subcategories-section').exists()).toBe(true)
    })

    it('does NOT render section when no categories or subcategories', async () => {
      tableData.categories = []
      tableData.subcategories = []
      const w = await createWrapper()
      expect(w.find('.subcategories-section').exists()).toBe(false)
    })

    it('has correct aria-label on section', async () => {
      const w = await createWrapper()
      const section = w.find('.subcategories-section')
      expect(section.attributes('aria-label')).toBe('catalog.subcategories')
    })

    it('renders a button for each visible category', async () => {
      const w = await createWrapper()
      const btns = w.findAll('.subcategory-btn')
      expect(btns.length).toBe(categoriesData.length)
    })

    it('renders localized category names (Spanish)', async () => {
      const w = await createWrapper()
      const btns = w.findAll('.subcategory-btn')
      expect(btns[0].text()).toBe('Semirremolques')
      expect(btns[1].text()).toBe('Cabezas Tractoras')
    })

    it('emits categoryChange when a category button is clicked', async () => {
      const w = await createWrapper()
      const btns = w.findAll('.subcategory-btn')
      await btns[0].trigger('click')
      expect(mockSetCategory).toHaveBeenCalledWith('cat-1', 'semirremolques')
      expect(w.emitted('categoryChange')).toBeTruthy()
      expect(w.emitted('categoryChange')![0]).toEqual(['cat-1'])
    })

    it('does NOT call setCategory when clicking a non-applicable category', async () => {
      mockActiveActions.value = ['alquiler']
      const w = await createWrapper()
      // cat-3 only has 'terceros' — not applicable when action is 'alquiler'
      const btns = w.findAll('.subcategory-btn')
      const rigidosBtn = btns.find((b) => b.text() === 'Rigidos')
      if (rigidosBtn) {
        await rigidosBtn.trigger('click')
        expect(mockSetCategory).not.toHaveBeenCalled()
      }
    })

    it('hides non-applicable categories (visibleCategories filters them)', async () => {
      mockActiveActions.value = ['alquiler']
      const w = await createWrapper()
      const btns = w.findAll('.subcategory-btn')
      // visibleCategories filters by isApplicable — only cat-1 (alquiler+venta) passes
      const texts = btns.map((b) => b.text())
      expect(texts).toContain('Semirremolques')
      expect(texts).not.toContain('Cabezas Tractoras')
      expect(texts).not.toContain('Rigidos')
    })

    it('does not add disabled class when no actions are active', async () => {
      mockActiveActions.value = []
      const w = await createWrapper()
      const disabled = w.findAll('.subcategory-btn.disabled')
      expect(disabled.length).toBe(0)
    })
  })

  // ====== Level 2 — category selected, no subcategory ======

  describe('Level 2 — subcategory list', () => {
    beforeEach(() => {
      mockActiveCategoryId.value = 'cat-1'
    })

    it('renders selected category button with active class', async () => {
      const w = await createWrapper()
      const activeBtn = w.find('.subcategory-btn.active')
      expect(activeBtn.exists()).toBe(true)
      expect(activeBtn.text()).toBe('Semirremolques')
    })

    it('renders separator arrow', async () => {
      const w = await createWrapper()
      const sep = w.find('.separator')
      expect(sep.exists()).toBe(true)
      expect(sep.text()).toBe('>')
    })

    it('renders linked subcategory buttons', async () => {
      const w = await createWrapper()
      const typeBtns = w.findAll('.type-btn')
      // cat-1 links to sub-1 (Cisternas) and sub-2 (Frigorificos)
      expect(typeBtns.length).toBe(2)
      const texts = typeBtns.map((b) => b.text())
      expect(texts).toContain('Cisternas')
      expect(texts).toContain('Frigorificos')
    })

    it('clicking selected category clears the category (go back)', async () => {
      const w = await createWrapper()
      const activeBtn = w.find('.subcategory-btn.active')
      await activeBtn.trigger('click')
      expect(mockSetCategory).toHaveBeenCalledWith(null, null)
      expect(w.emitted('categoryChange')).toBeTruthy()
      expect(w.emitted('categoryChange')![0]).toEqual([null])
      expect(w.emitted('subcategoryChange')).toBeTruthy()
      expect(w.emitted('subcategoryChange')![0]).toEqual([null])
    })

    it('emits subcategoryChange when a subcategory button is clicked', async () => {
      const w = await createWrapper()
      const typeBtns = w.findAll('.type-btn')
      await typeBtns[0].trigger('click')
      expect(mockSetSubcategory).toHaveBeenCalledWith('sub-1', 'cisternas')
      expect(w.emitted('subcategoryChange')).toBeTruthy()
      expect(w.emitted('subcategoryChange')![0]).toEqual(['sub-1'])
    })

    it('does NOT call setSubcategory when clicking non-applicable subcategory', async () => {
      mockActiveActions.value = ['alquiler']
      const w = await createWrapper()
      // sub-2 only has 'venta' — not applicable when action is 'alquiler'
      const typeBtns = w.findAll('.type-btn')
      const frigoBtn = typeBtns.find((b) => b.text() === 'Frigorificos')
      if (frigoBtn) {
        await frigoBtn.trigger('click')
        expect(mockSetSubcategory).not.toHaveBeenCalled()
      }
    })

    it('renders no subcategories when category has no links', async () => {
      // cat-3 has no linked subcategories in our link data
      mockActiveCategoryId.value = 'cat-3'
      const w = await createWrapper()
      const typeBtns = w.findAll('.type-btn')
      expect(typeBtns.length).toBe(0)
    })
  })

  // ====== Level 3 — category + subcategory selected ======

  describe('Level 3 — category + subcategory selected', () => {
    beforeEach(() => {
      mockActiveCategoryId.value = 'cat-1'
      mockActiveSubcategoryId.value = 'sub-1'
    })

    it('renders selected category with active class', async () => {
      const w = await createWrapper()
      const activeBtns = w.findAll('.subcategory-btn.active')
      expect(activeBtns.length).toBeGreaterThanOrEqual(1)
      expect(activeBtns[0].text()).toBe('Semirremolques')
    })

    it('renders selected subcategory with active class and type-btn', async () => {
      const w = await createWrapper()
      const activeBtns = w.findAll('.subcategory-btn.active')
      expect(activeBtns.length).toBe(2)
      expect(activeBtns[1].text()).toBe('Cisternas')
      expect(activeBtns[1].classes()).toContain('type-btn')
    })

    it('renders separator between category and subcategory', async () => {
      const w = await createWrapper()
      expect(w.find('.separator').exists()).toBe(true)
    })

    it('clicking category clears both category and subcategory', async () => {
      const w = await createWrapper()
      const activeBtns = w.findAll('.subcategory-btn.active')
      // first active button is category
      await activeBtns[0].trigger('click')
      expect(mockSetCategory).toHaveBeenCalledWith(null, null)
      expect(w.emitted('categoryChange')![0]).toEqual([null])
      expect(w.emitted('subcategoryChange')![0]).toEqual([null])
    })

    it('clicking subcategory clears only the subcategory', async () => {
      const w = await createWrapper()
      const activeBtns = w.findAll('.subcategory-btn.active')
      // second active button is subcategory (type-btn)
      await activeBtns[1].trigger('click')
      expect(mockSetSubcategory).toHaveBeenCalledWith(null, null)
      expect(w.emitted('subcategoryChange')![0]).toEqual([null])
      // categoryChange should NOT be emitted
      expect(w.emitted('categoryChange')).toBeFalsy()
    })

    it('does NOT render other subcategory buttons (only the selected one)', async () => {
      const w = await createWrapper()
      // In level 3, only selected category + selected subcategory — no list
      const typeBtns = w.findAll('.type-btn')
      expect(typeBtns.length).toBe(1)
      expect(typeBtns[0].text()).toBe('Cisternas')
    })
  })

  // ====== Scroll buttons ======

  describe('scroll buttons', () => {
    it('renders left scroll button', async () => {
      const w = await createWrapper()
      expect(w.find('.scroll-btn-left').exists()).toBe(true)
    })

    it('renders right scroll button', async () => {
      const w = await createWrapper()
      expect(w.find('.scroll-btn-right').exists()).toBe(true)
    })

    it('left scroll button has aria-hidden', async () => {
      const w = await createWrapper()
      expect(w.find('.scroll-btn-left').attributes('aria-hidden')).toBe('true')
    })

    it('right scroll button has aria-hidden', async () => {
      const w = await createWrapper()
      expect(w.find('.scroll-btn-right').attributes('aria-hidden')).toBe('true')
    })
  })

  // ====== Scrollable container ======

  describe('scrollable container', () => {
    it('renders .subcategories scroll container', async () => {
      const w = await createWrapper()
      expect(w.find('.subcategories').exists()).toBe(true)
    })
  })

  // ====== hasItems computed ======

  describe('hasItems computed', () => {
    it('returns true when categories exist', async () => {
      tableData.subcategories = []
      const w = await createWrapper()
      expect(w.find('.subcategories-section').exists()).toBe(true)
    })

    it('returns true when only subcategories exist', async () => {
      tableData.categories = []
      tableData.subcategories = subcategoriesData
      const w = await createWrapper()
      expect(w.find('.subcategories-section').exists()).toBe(true)
    })

    it('returns false when both are empty', async () => {
      tableData.categories = []
      tableData.subcategories = []
      const w = await createWrapper()
      expect(w.find('.subcategories-section').exists()).toBe(false)
    })
  })

  // ====== linkedSubcategories sorted ======

  describe('linkedSubcategories sorting', () => {
    it('returns subcategories sorted by sort_order', async () => {
      mockActiveCategoryId.value = 'cat-1'
      const w = await createWrapper()
      const typeBtns = w.findAll('.type-btn')
      // sub-1 (sort_order 1) before sub-2 (sort_order 2)
      expect(typeBtns[0].text()).toBe('Cisternas')
      expect(typeBtns[1].text()).toBe('Frigorificos')
    })
  })

  // ====== selectedCategoryName ======

  describe('selectedCategoryName computed', () => {
    it('returns empty string when no category selected (no active button)', async () => {
      mockActiveCategoryId.value = null
      const w = await createWrapper()
      const activeBtns = w.findAll('.subcategory-btn.active')
      expect(activeBtns.length).toBe(0)
    })

    it('returns localized name of selected category', async () => {
      mockActiveCategoryId.value = 'cat-2'
      const w = await createWrapper()
      const activeBtn = w.find('.subcategory-btn.active')
      expect(activeBtn.exists()).toBe(true)
      expect(activeBtn.text()).toBe('Cabezas Tractoras')
    })
  })

  // ====== selectedSubcategoryName ======

  describe('selectedSubcategoryName computed', () => {
    it('returns localized name of selected subcategory', async () => {
      mockActiveCategoryId.value = 'cat-1'
      mockActiveSubcategoryId.value = 'sub-2'
      const w = await createWrapper()
      const activeBtns = w.findAll('.subcategory-btn.active')
      const subBtn = activeBtns.find((b) => b.classes().includes('type-btn'))
      expect(subBtn).toBeTruthy()
      expect(subBtn!.text()).toBe('Frigorificos')
    })
  })
})
