/**
 * Tests for app/components/ui/ConfigurableTable.vue
 *
 * Covers: rendering, column group toggling, localStorage persistence,
 * sorting (asc/desc/reset, numeric, string, nulls), empty state,
 * loading skeleton, scoped slots, chip colors, aria attributes.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { computed, ref, watch, onMounted, nextTick } from 'vue'

// Mock vue-i18n — ConfigurableTable imports useI18n from 'vue-i18n'
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: 'es' },
  }),
}))

// Use real Vue reactivity so the component's internals work correctly
beforeAll(() => {
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('onMounted', onMounted)
  vi.stubGlobal('nextTick', nextTick)
})

import ConfigurableTable from '../../../app/components/ui/ConfigurableTable.vue'

// ── Helpers ──

interface ColumnDef {
  key: string
  label: string
  width?: string
}

interface ColumnGroup {
  key: string
  label: string
  columns: ColumnDef[]
  required?: boolean
}

function makeGroups(overrides: Partial<ColumnGroup>[] = []): ColumnGroup[] {
  const base: ColumnGroup[] = [
    {
      key: 'basic',
      label: 'Basic',
      required: true,
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
      ],
    },
    {
      key: 'extra',
      label: 'Extra',
      columns: [{ key: 'email', label: 'Email' }],
    },
    {
      key: 'meta',
      label: 'Meta',
      columns: [{ key: 'score', label: 'Score' }],
    },
  ]
  return base.map((g, i) => ({ ...g, ...(overrides[i] || {}) }))
}

function makeData(count = 3): Record<string, unknown>[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `User ${i}`,
    age: 30 + i,
    email: `user${i}@test.com`,
    score: (i + 1) * 10,
  }))
}

// localStorage mock
let storageMap: Record<string, string> = {}

beforeEach(() => {
  storageMap = {}
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => storageMap[key] ?? null),
    setItem: vi.fn((key: string, val: string) => {
      storageMap[key] = val
    }),
    removeItem: vi.fn((key: string) => {
      delete storageMap[key]
    }),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

/**
 * Factory that mounts and awaits nextTick so onMounted's loadVisibility()
 * has time to populate visibleGroupKeys before assertions.
 */
async function factory(
  overrides: {
    groups?: ColumnGroup[]
    data?: Record<string, unknown>[]
    loading?: boolean
    emptyText?: string
    storageKey?: string
    slots?: Record<string, string>
  } = {},
) {
  const w = shallowMount(ConfigurableTable, {
    props: {
      groups: overrides.groups ?? makeGroups(),
      data: overrides.data ?? makeData(),
      loading: overrides.loading ?? false,
      emptyText: overrides.emptyText ?? '',
      storageKey: overrides.storageKey ?? 'test-table',
    },
    slots: overrides.slots,
    global: {
      mocks: {
        $t: (key: string) => key,
      },
    },
  })
  await nextTick()
  return w
}

// ────────────────────────────
// RENDERING
// ────────────────────────────
describe('ConfigurableTable', () => {
  describe('rendering', () => {
    it('renders the wrapper element', async () => {
      const w = await factory()
      expect(w.find('.ct-wrapper').exists()).toBe(true)
    })

    it('renders toggle chips for each group', async () => {
      const w = await factory()
      const chips = w.findAll('.ct-chip')
      expect(chips).toHaveLength(3)
    })

    it('renders the data table when data is present and not loading', async () => {
      const w = await factory()
      expect(w.findAll('.ct-table')).toHaveLength(1)
      expect(w.find('.ct-empty').exists()).toBe(false)
    })

    it('renders column headers for all visible columns', async () => {
      const w = await factory()
      const headers = w.findAll('.ct-th-sortable')
      // All 3 groups visible => 4 columns (name, age, email, score)
      expect(headers).toHaveLength(4)
    })

    it('renders data rows matching data length', async () => {
      const w = await factory({ data: makeData(5) })
      const rows = w.findAll('.ct-row')
      expect(rows).toHaveLength(5)
    })

    it('renders actions column header', async () => {
      const w = await factory()
      expect(w.find('.ct-th-actions').exists()).toBe(true)
    })

    it('displays cell values from data', async () => {
      const w = await factory({ data: [{ name: 'Alice', age: 25, email: 'a@b.com', score: 90 }] })
      const cells = w.findAll('.ct-row td')
      expect(cells[0].text()).toBe('Alice')
      expect(cells[1].text()).toBe('25')
    })

    it('renders empty string for null/undefined cell values', async () => {
      const w = await factory({ data: [{ name: null, age: undefined, email: '', score: 0 }] })
      const cells = w.findAll('.ct-row td')
      expect(cells[0].text()).toBe('')
    })
  })

  // ────────────────────────────
  // EMPTY STATE
  // ────────────────────────────
  describe('empty state', () => {
    it('shows empty state when data is empty', async () => {
      const w = await factory({ data: [] })
      expect(w.find('.ct-empty').exists()).toBe(true)
      expect(w.find('.ct-table').exists()).toBe(false)
    })

    it('uses emptyText prop when provided', async () => {
      const w = await factory({ data: [], emptyText: 'No items found' })
      expect(w.find('.ct-empty-text').text()).toBe('No items found')
    })

    it('falls back to i18n key when emptyText is empty', async () => {
      const w = await factory({ data: [], emptyText: '' })
      expect(w.find('.ct-empty-text').text()).toBe('configurableTable.empty')
    })

    it('renders empty icon svg', async () => {
      const w = await factory({ data: [] })
      expect(w.find('.ct-empty-icon').exists()).toBe(true)
    })
  })

  // ────────────────────────────
  // LOADING SKELETON
  // ────────────────────────────
  describe('loading skeleton', () => {
    it('shows skeleton table when loading is true', async () => {
      const w = await factory({ loading: true })
      expect(w.findAll('.ct-skeleton-header').length).toBeGreaterThan(0)
      expect(w.findAll('.ct-skeleton-cell').length).toBeGreaterThan(0)
    })

    it('renders 5 skeleton rows', async () => {
      const w = await factory({ loading: true })
      const skeletonRows = w.findAll('tbody tr')
      expect(skeletonRows).toHaveLength(5)
    })

    it('hides data table when loading', async () => {
      const w = await factory({ loading: true })
      expect(w.find('.ct-row').exists()).toBe(false)
      expect(w.find('.ct-empty').exists()).toBe(false)
    })

    it('skeleton header cells match visible columns count', async () => {
      const w = await factory({ loading: true })
      const headerCells = w.findAll('.ct-skeleton-header')
      // All 4 visible columns
      expect(headerCells).toHaveLength(4)
    })
  })

  // ────────────────────────────
  // COLUMN GROUP TOGGLING
  // ────────────────────────────
  describe('column group toggling', () => {
    it('marks required groups with ct-chip-required class', async () => {
      const w = await factory()
      const requiredChip = w.findAll('.ct-chip')[0]
      expect(requiredChip.classes()).toContain('ct-chip-required')
    })

    it('disables required group chips', async () => {
      const w = await factory()
      const requiredChip = w.findAll('.ct-chip')[0]
      expect(requiredChip.attributes('disabled')).toBeDefined()
    })

    it('does not toggle required group when clicked', async () => {
      const w = await factory()
      const headersBefore = w.findAll('.ct-th-sortable').length
      await w.findAll('.ct-chip')[0].trigger('click')
      await nextTick()
      const headersAfter = w.findAll('.ct-th-sortable').length
      expect(headersAfter).toBe(headersBefore)
    })

    it('hides columns when a non-required group is toggled off', async () => {
      const w = await factory()
      // Initially 4 columns visible
      expect(w.findAll('.ct-th-sortable')).toHaveLength(4)

      // Click 'extra' group (index 1) to toggle it off
      await w.findAll('.ct-chip')[1].trigger('click')
      await nextTick()

      // Now 3 columns visible (email hidden)
      expect(w.findAll('.ct-th-sortable')).toHaveLength(3)
    })

    it('shows columns when a hidden group is toggled on', async () => {
      const w = await factory()

      // Toggle off extra
      await w.findAll('.ct-chip')[1].trigger('click')
      await nextTick()
      expect(w.findAll('.ct-th-sortable')).toHaveLength(3)

      // Toggle on extra again
      await w.findAll('.ct-chip')[1].trigger('click')
      await nextTick()
      expect(w.findAll('.ct-th-sortable')).toHaveLength(4)
    })

    it('sets aria-pressed attribute on chips', async () => {
      const w = await factory()
      const chips = w.findAll('.ct-chip')
      chips.forEach((chip) => {
        expect(chip.attributes('aria-pressed')).toBeDefined()
      })
    })

    it('active chip has ct-chip-active class', async () => {
      const w = await factory()
      const chips = w.findAll('.ct-chip')
      // All groups start visible
      chips.forEach((chip) => {
        expect(chip.classes()).toContain('ct-chip-active')
      })
    })
  })

  // ────────────────────────────
  // LOCALSTORAGE PERSISTENCE
  // ────────────────────────────
  describe('localStorage persistence', () => {
    it('saves visibility state to localStorage when group is toggled', async () => {
      const w = await factory({ storageKey: 'my-table' })
      await w.findAll('.ct-chip')[1].trigger('click')
      await nextTick()

      expect(localStorage.setItem).toHaveBeenCalledWith('my-table', expect.any(String))
    })

    it('loads stored visibility from localStorage on mount', async () => {
      // Pre-store that only 'meta' is visible (non-required)
      storageMap['test-table'] = JSON.stringify(['meta'])

      const w = await factory()
      // basic (required) + meta visible = 3 columns (name, age, score)
      // extra should be hidden
      const headers = w.findAll('.ct-th-sortable')
      expect(headers).toHaveLength(3)
    })

    it('handles invalid localStorage JSON gracefully', async () => {
      storageMap['test-table'] = 'not-json{'

      // Should not throw, defaults to all groups visible
      const w = await factory()
      expect(w.findAll('.ct-th-sortable')).toHaveLength(4)
    })

    it('always includes required groups even if not in localStorage', async () => {
      storageMap['test-table'] = JSON.stringify([])

      const w = await factory()
      // Required 'basic' group always visible => 2 columns (name, age)
      const headers = w.findAll('.ct-th-sortable')
      expect(headers).toHaveLength(2)
    })
  })

  // ────────────────────────────
  // SORTING
  // ────────────────────────────
  describe('sorting', () => {
    it('sorts ascending on first header click', async () => {
      const data = [
        { name: 'Charlie', age: 35, email: 'c@c.com', score: 30 },
        { name: 'Alice', age: 25, email: 'a@a.com', score: 10 },
        { name: 'Bob', age: 30, email: 'b@b.com', score: 20 },
      ]
      const w = await factory({ data })

      // Click 'Name' header
      await w.findAll('.ct-th-sortable')[0].trigger('click')
      await nextTick()

      const rows = w.findAll('.ct-row')
      expect(rows[0].findAll('td')[0].text()).toBe('Alice')
      expect(rows[1].findAll('td')[0].text()).toBe('Bob')
      expect(rows[2].findAll('td')[0].text()).toBe('Charlie')
    })

    it('sorts descending on second click', async () => {
      const data = [
        { name: 'Alice', age: 25, email: 'a@a.com', score: 10 },
        { name: 'Bob', age: 30, email: 'b@b.com', score: 20 },
      ]
      const w = await factory({ data })

      const header = w.findAll('.ct-th-sortable')[0]
      await header.trigger('click') // asc
      await header.trigger('click') // desc
      await nextTick()

      const rows = w.findAll('.ct-row')
      expect(rows[0].findAll('td')[0].text()).toBe('Bob')
      expect(rows[1].findAll('td')[0].text()).toBe('Alice')
    })

    it('resets sort on third click', async () => {
      const data = [
        { name: 'Bob', age: 30, email: 'b@b.com', score: 20 },
        { name: 'Alice', age: 25, email: 'a@a.com', score: 10 },
      ]
      const w = await factory({ data })

      const header = w.findAll('.ct-th-sortable')[0]
      await header.trigger('click') // asc
      await header.trigger('click') // desc
      await header.trigger('click') // reset
      await nextTick()

      // Original order restored
      const rows = w.findAll('.ct-row')
      expect(rows[0].findAll('td')[0].text()).toBe('Bob')
    })

    it('sorts numerically for number values', async () => {
      const data = [
        { name: 'A', age: 100, email: '', score: 0 },
        { name: 'B', age: 5, email: '', score: 0 },
        { name: 'C', age: 50, email: '', score: 0 },
      ]
      const w = await factory({ data })

      // Click 'Age' header (index 1)
      await w.findAll('.ct-th-sortable')[1].trigger('click')
      await nextTick()

      const rows = w.findAll('.ct-row')
      expect(rows[0].findAll('td')[1].text()).toBe('5')
      expect(rows[1].findAll('td')[1].text()).toBe('50')
      expect(rows[2].findAll('td')[1].text()).toBe('100')
    })

    it('handles null values in sort (nulls first ascending)', async () => {
      const data = [
        { name: 'B', age: 20, email: '', score: 0 },
        { name: null, age: null, email: '', score: 0 },
        { name: 'A', age: 10, email: '', score: 0 },
      ]
      const w = await factory({ data })

      await w.findAll('.ct-th-sortable')[0].trigger('click') // asc
      await nextTick()

      const rows = w.findAll('.ct-row')
      // null comes first in asc
      expect(rows[0].findAll('td')[0].text()).toBe('')
      expect(rows[1].findAll('td')[0].text()).toBe('A')
    })

    it('clicking a different column resets to asc sort on new column', async () => {
      const data = [
        { name: 'B', age: 20, email: 'z@z.com', score: 5 },
        { name: 'A', age: 10, email: 'a@a.com', score: 15 },
      ]
      const w = await factory({ data })

      // Sort by name asc
      await w.findAll('.ct-th-sortable')[0].trigger('click')
      await nextTick()

      // Then sort by age
      await w.findAll('.ct-th-sortable')[1].trigger('click')
      await nextTick()

      const rows = w.findAll('.ct-row')
      expect(rows[0].findAll('td')[1].text()).toBe('10')
      expect(rows[1].findAll('td')[1].text()).toBe('20')
    })

    it('sets aria-sort attribute on sorted column', async () => {
      const w = await factory()

      // Initially no sort
      const th = w.findAll('.ct-th-sortable')[0]
      expect(th.attributes('aria-sort')).toBe('none')

      await th.trigger('click')
      await nextTick()
      expect(th.attributes('aria-sort')).toBe('ascending')

      await th.trigger('click')
      await nextTick()
      expect(th.attributes('aria-sort')).toBe('descending')
    })

    it('adds ct-sort-active class to active sort icon', async () => {
      const w = await factory()

      await w.findAll('.ct-th-sortable')[0].trigger('click')
      await nextTick()

      expect(w.find('.ct-sort-active').exists()).toBe(true)
    })

    it('adds ct-sort-desc class when descending', async () => {
      const w = await factory()

      const th = w.findAll('.ct-th-sortable')[0]
      await th.trigger('click') // asc
      await th.trigger('click') // desc
      await nextTick()

      expect(w.find('.ct-sort-desc').exists()).toBe(true)
    })

    it('handles both null values (returns 0)', async () => {
      const data = [
        { name: null, age: null, email: '', score: 0 },
        { name: null, age: null, email: '', score: 0 },
      ]
      const w = await factory({ data })

      await w.findAll('.ct-th-sortable')[0].trigger('click')
      await nextTick()

      // Both rows should still render
      expect(w.findAll('.ct-row')).toHaveLength(2)
    })
  })

  // ────────────────────────────
  // CHIP COLORS
  // ────────────────────────────
  describe('chip colors', () => {
    it('applies --chip-color style to chips', async () => {
      const w = await factory()
      const chip = w.findAll('.ct-chip')[0]
      const style = chip.attributes('style')
      expect(style).toContain('--chip-color')
    })

    it('applies --chip-text style to chips', async () => {
      const w = await factory()
      const chip = w.findAll('.ct-chip')[0]
      const style = chip.attributes('style')
      expect(style).toContain('--chip-text')
    })

    it('cycles colors for groups beyond chipColors length', async () => {
      // Create 10 groups (more than 8 colors)
      const groups: ColumnGroup[] = Array.from({ length: 10 }, (_, i) => ({
        key: `g${i}`,
        label: `Group ${i}`,
        columns: [{ key: `col${i}`, label: `Col ${i}` }],
      }))
      const data = [
        Object.fromEntries(groups.map((g) => [g.columns[0].key, `val-${g.key}`])),
      ]
      const w = await factory({ groups, data })
      const chips = w.findAll('.ct-chip')
      expect(chips).toHaveLength(10)

      // First and 9th chip should have same color (index 0 and 8 => 8 % 8 = 0)
      const style0 = chips[0].attributes('style') ?? ''
      const style8 = chips[8].attributes('style') ?? ''
      // Extract color value
      const color0 = style0.match(/--chip-color:\s*([^;]+)/)?.[1]?.trim()
      const color8 = style8.match(/--chip-color:\s*([^;]+)/)?.[1]?.trim()
      expect(color0).toBe(color8)
    })
  })

  // ────────────────────────────
  // COLUMN WIDTH
  // ────────────────────────────
  describe('column width', () => {
    it('applies width style to column header when defined', async () => {
      const groups: ColumnGroup[] = [
        {
          key: 'sized',
          label: 'Sized',
          required: true,
          columns: [{ key: 'id', label: 'ID', width: '80px' }],
        },
      ]
      const w = await factory({ groups, data: [{ id: 1 }] })
      const th = w.find('.ct-th-sortable')
      expect(th.attributes('style')).toContain('width: 80px')
    })

    it('does not set width style when column has no width', async () => {
      const w = await factory()
      const th = w.findAll('.ct-th-sortable')[0]
      const style = th.attributes('style') ?? ''
      expect(style).not.toContain('width')
    })
  })

  // ────────────────────────────
  // TOOLBAR ARIA
  // ────────────────────────────
  describe('toolbar aria', () => {
    it('has role toolbar on chips container', async () => {
      const w = await factory()
      const toolbar = w.find('.ct-chips')
      expect(toolbar.attributes('role')).toBe('toolbar')
    })

    it('has aria-label on chips container', async () => {
      const w = await factory()
      const toolbar = w.find('.ct-chips')
      expect(toolbar.attributes('aria-label')).toBe('configurableTable.columns')
    })
  })

  // ────────────────────────────
  // GROUPS WATCHER
  // ────────────────────────────
  describe('groups watcher', () => {
    it('reloads visibility when groups prop changes', async () => {
      const w = await factory()

      // Change groups to only one
      const newGroups: ColumnGroup[] = [
        {
          key: 'only',
          label: 'Only',
          required: true,
          columns: [{ key: 'x', label: 'X' }],
        },
      ]
      await w.setProps({ groups: newGroups })
      await nextTick()

      expect(w.findAll('.ct-chip')).toHaveLength(1)
    })
  })
})
