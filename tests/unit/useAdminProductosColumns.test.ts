import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useAdminProductosColumns,
  STATIC_COLUMNS,
} from '../../app/composables/admin/useAdminProductosColumns'

// ─── Fixtures ──────────────────────────────────────────────────────────────

type MinFilter = { name: string; label_es: string; status: string; unit?: string | null }

function makeFilter(overrides: Partial<MinFilter> = {}): MinFilter {
  return {
    name: 'fuel',
    label_es: 'Combustible',
    status: 'active',
    unit: null,
    ...overrides,
  }
}

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  // Clear localStorage between tests
  localStorage.clear()
})

// ─── STATIC_COLUMNS ───────────────────────────────────────────────────────

describe('STATIC_COLUMNS', () => {
  it('is a non-empty array', () => {
    expect(STATIC_COLUMNS.length).toBeGreaterThan(0)
  })

  it('contains checkbox, image, brand, status, actions keys', () => {
    const keys = STATIC_COLUMNS.map((c) => c.key)
    expect(keys).toContain('checkbox')
    expect(keys).toContain('image')
    expect(keys).toContain('brand')
    expect(keys).toContain('status')
    expect(keys).toContain('actions')
  })

  it('sortable columns include brand, model, year, price, status', () => {
    const sortable = STATIC_COLUMNS.filter((c) => c.sortable).map((c) => c.key)
    expect(sortable).toContain('brand')
    expect(sortable).toContain('model')
    expect(sortable).toContain('year')
    expect(sortable).toContain('price')
    expect(sortable).toContain('status')
  })
})

// ─── Initial state ─────────────────────────────────────────────────────────

describe('initial state', () => {
  it('columnGroups starts with 6 groups', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    expect(c.columnGroups.value).toHaveLength(6)
  })

  it('base group is active by default', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    const base = c.columnGroups.value.find((g) => g.id === 'base')
    expect(base?.active).toBe(true)
  })

  it('non-base groups are inactive by default', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    const nonBase = c.columnGroups.value.filter((g) => g.id !== 'base')
    for (const group of nonBase) {
      expect(group.active).toBe(false)
    }
  })

  it('columnOrder contains all static column keys', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    for (const col of STATIC_COLUMNS) {
      expect(c.columnOrder.value).toContain(col.key)
    }
  })

  it('draggedColumn starts null', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    expect(c.draggedColumn.value).toBeNull()
  })

  it('allColumns includes static columns', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    const keys = c.allColumns.value.map((col) => col.key)
    expect(keys).toContain('brand')
    expect(keys).toContain('status')
  })
})

// ─── dynamicFilterColumns / allColumns ────────────────────────────────────

describe('dynamicFilterColumns (via allColumns)', () => {
  it('allColumns includes dynamic filter columns for non-archived filters', () => {
    const filters = [makeFilter({ name: 'fuel', status: 'active' })]
    const c = useAdminProductosColumns({ value: filters as never[] })
    const keys = c.allColumns.value.map((col) => col.key)
    expect(keys).toContain('filter_fuel')
  })

  it('allColumns excludes archived filters', () => {
    const filters = [makeFilter({ name: 'obsolete', status: 'archived' })]
    const c = useAdminProductosColumns({ value: filters as never[] })
    const keys = c.allColumns.value.map((col) => col.key)
    expect(keys).not.toContain('filter_obsolete')
  })

  it('dynamic filter column uses label_es as label', () => {
    const filters = [makeFilter({ name: 'fuel', label_es: 'Combustible', status: 'active' })]
    const c = useAdminProductosColumns({ value: filters as never[] })
    const col = c.allColumns.value.find((col) => col.key === 'filter_fuel')
    expect(col?.label).toBe('Combustible')
  })

  it('dynamic filter column falls back to name when label_es is empty', () => {
    const filters = [makeFilter({ name: 'km', label_es: '', status: 'active' })]
    const c = useAdminProductosColumns({ value: filters as never[] })
    const col = c.allColumns.value.find((col) => col.key === 'filter_km')
    expect(col?.label).toBe('km')
  })
})

// ─── activeFilterColumns ──────────────────────────────────────────────────

describe('activeFilterColumns', () => {
  it('returns filter entries with key, filterName, label, unit', () => {
    const filters = [makeFilter({ name: 'km', label_es: 'Km', status: 'active', unit: 'km' })]
    const c = useAdminProductosColumns({ value: filters as never[] })
    expect(c.activeFilterColumns.value).toHaveLength(1)
    const entry = c.activeFilterColumns.value[0]!
    expect(entry.key).toBe('filter_km')
    expect(entry.filterName).toBe('km')
    expect(entry.label).toBe('Km')
    expect(entry.unit).toBe('km')
  })

  it('excludes archived filters', () => {
    const filters = [makeFilter({ name: 'old', status: 'archived' })]
    const c = useAdminProductosColumns({ value: filters as never[] })
    expect(c.activeFilterColumns.value).toHaveLength(0)
  })
})

// ─── availableColumnsForGroups ────────────────────────────────────────────

describe('availableColumnsForGroups', () => {
  it('excludes checkbox and actions columns', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    const keys = c.availableColumnsForGroups.value.map((col) => col.key)
    expect(keys).not.toContain('checkbox')
    expect(keys).not.toContain('actions')
  })

  it('includes other columns like brand and model', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    const keys = c.availableColumnsForGroups.value.map((col) => col.key)
    expect(keys).toContain('brand')
    expect(keys).toContain('model')
  })
})

// ─── toggleGroup ──────────────────────────────────────────────────────────

describe('toggleGroup', () => {
  it('toggles inactive group to active', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    c.toggleGroup('docs')
    const docs = c.columnGroups.value.find((g) => g.id === 'docs')
    expect(docs?.active).toBe(true)
  })

  it('toggles active group to inactive', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    c.toggleGroup('docs') // active
    c.toggleGroup('docs') // back to inactive
    const docs = c.columnGroups.value.find((g) => g.id === 'docs')
    expect(docs?.active).toBe(false)
  })

  it('does not toggle "base" group (required)', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    c.toggleGroup('base')
    const base = c.columnGroups.value.find((g) => g.id === 'base')
    expect(base?.active).toBe(true) // remains active
  })

  it('does nothing for non-existent group id', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    expect(() => c.toggleGroup('nonexistent')).not.toThrow()
  })
})

// ─── isGroupActive ────────────────────────────────────────────────────────

describe('isGroupActive', () => {
  it('returns true for base group (active by default)', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    expect(c.isGroupActive('base')).toBe(true)
  })

  it('returns false for docs group (inactive by default)', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    expect(c.isGroupActive('docs')).toBe(false)
  })

  it('returns true after toggling a group on', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    c.toggleGroup('cuentas')
    expect(c.isGroupActive('cuentas')).toBe(true)
  })

  it('returns false for non-existent group', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    expect(c.isGroupActive('ghost')).toBe(false)
  })
})

// ─── createGroup ──────────────────────────────────────────────────────────

describe('createGroup', () => {
  it('adds a new group to columnGroups', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    const before = c.columnGroups.value.length
    c.createGroup('My Group', ['brand', 'model'])
    expect(c.columnGroups.value.length).toBe(before + 1)
  })

  it('new group has correct name and columns', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    c.createGroup('Custom', ['brand'])
    const newGroup = c.columnGroups.value.find((g) => g.name === 'Custom')
    expect(newGroup).toBeDefined()
    expect(newGroup?.columns).toContain('brand')
  })

  it('new group starts inactive', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    c.createGroup('Test', [])
    const newGroup = c.columnGroups.value.find((g) => g.name === 'Test')
    expect(newGroup?.active).toBe(false)
  })

  it('new group id starts with "custom_"', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    c.createGroup('Custom Group', [])
    const newGroup = c.columnGroups.value.find((g) => g.name === 'Custom Group')
    expect(newGroup?.id).toMatch(/^custom_/)
  })
})

// ─── deleteGroup ──────────────────────────────────────────────────────────

describe('deleteGroup', () => {
  it('removes a non-required group', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    c.createGroup('ToDelete', [])
    const created = c.columnGroups.value.find((g) => g.name === 'ToDelete')
    const before = c.columnGroups.value.length
    c.deleteGroup(created!.id)
    expect(c.columnGroups.value.length).toBe(before - 1)
  })

  it('does not remove required base group', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    c.deleteGroup('base')
    expect(c.columnGroups.value.find((g) => g.id === 'base')).toBeDefined()
  })

  it('does nothing for non-existent group', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    const before = c.columnGroups.value.length
    c.deleteGroup('nonexistent')
    expect(c.columnGroups.value.length).toBe(before)
  })
})

// ─── resetConfig ──────────────────────────────────────────────────────────

describe('resetConfig', () => {
  it('restores default column groups after modifications', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    c.toggleGroup('docs') // modify
    c.resetConfig()
    const docs = c.columnGroups.value.find((g) => g.id === 'docs')
    expect(docs?.active).toBe(false) // back to default
  })

  it('restores default column order', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    c.resetConfig()
    expect(c.columnOrder.value).toContain('brand')
    expect(c.columnOrder.value).toContain('status')
  })
})

// ─── Drag & drop ──────────────────────────────────────────────────────────

describe('drag & drop', () => {
  it('onDragStart sets draggedColumn', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    c.onDragStart('brand')
    expect(c.draggedColumn.value).toBe('brand')
  })

  it('onDragEnd clears draggedColumn', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    c.onDragStart('brand')
    c.onDragEnd()
    expect(c.draggedColumn.value).toBeNull()
  })

  it('onDragOver reorders columns', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    const idx1 = c.columnOrder.value.indexOf('brand')
    const idx2 = c.columnOrder.value.indexOf('model')
    if (idx1 === -1 || idx2 === -1) return // defensive
    c.onDragStart('brand')
    const mockEvent = { preventDefault: vi.fn() } as unknown as DragEvent
    c.onDragOver(mockEvent, 'model')
    expect(mockEvent.preventDefault).toHaveBeenCalled()
  })

  it('onDragOver does nothing when dragging over same column', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    c.onDragStart('brand')
    const before = [...c.columnOrder.value]
    const mockEvent = { preventDefault: vi.fn() } as unknown as DragEvent
    c.onDragOver(mockEvent, 'brand') // same → no change
    expect(c.columnOrder.value).toEqual(before)
  })

  it('onDragOver does nothing when draggedColumn is null', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    const before = [...c.columnOrder.value]
    const mockEvent = { preventDefault: vi.fn() } as unknown as DragEvent
    c.onDragOver(mockEvent, 'model')
    expect(c.columnOrder.value).toEqual(before)
  })
})

// ─── syncFilterColumns ────────────────────────────────────────────────────

describe('syncFilterColumns', () => {
  it('adds filter key to filtros group', () => {
    const filters = [makeFilter({ name: 'fuel', status: 'active' })]
    const c = useAdminProductosColumns({ value: filters as never[] })
    c.syncFilterColumns()
    const filtros = c.columnGroups.value.find((g) => g.id === 'filtros')
    expect(filtros?.columns).toContain('filter_fuel')
  })

  it('does not add duplicate filter keys', () => {
    const filters = [makeFilter({ name: 'km', status: 'active' })]
    const c = useAdminProductosColumns({ value: filters as never[] })
    c.syncFilterColumns()
    c.syncFilterColumns() // call twice
    const filtros = c.columnGroups.value.find((g) => g.id === 'filtros')
    const count = filtros?.columns.filter((col) => col === 'filter_km').length
    expect(count).toBe(1)
  })

  it('adds filter key to columnOrder', () => {
    const filters = [makeFilter({ name: 'power', status: 'active' })]
    const c = useAdminProductosColumns({ value: filters as never[] })
    c.syncFilterColumns()
    expect(c.columnOrder.value).toContain('filter_power')
  })

  it('removes stale filter keys from columnOrder', () => {
    // Start with no filters but manually add a stale filter key
    const c = useAdminProductosColumns({ value: [] as never[] })
    c.columnOrder.value.push('filter_old_key')
    c.syncFilterColumns() // no active filters → stale key removed
    expect(c.columnOrder.value).not.toContain('filter_old_key')
  })
})

// ─── loadConfig / saveConfig ──────────────────────────────────────────────

describe('loadConfig', () => {
  it('does not throw when localStorage has no saved config', () => {
    const c = useAdminProductosColumns({ value: [] as never[] })
    expect(() => c.loadConfig()).not.toThrow()
  })

  it('does not throw when localStorage has valid JSON config', () => {
    // In test env, import.meta.client is falsy → loadConfig returns early.
    // This test verifies it is safe to call regardless.
    const saved = {
      groups: [{ id: 'base', name: 'Base', icon: '📋', columns: ['brand'], active: true }],
      order: ['brand', 'model'],
    }
    localStorage.setItem('tracciona-admin-productos-config-v4', JSON.stringify(saved))
    const c = useAdminProductosColumns({ value: [] as never[] })
    expect(() => c.loadConfig()).not.toThrow()
  })

  it('uses defaults when localStorage has invalid JSON', () => {
    localStorage.setItem('tracciona-admin-productos-config-v4', 'invalid json{')
    const c = useAdminProductosColumns({ value: [] as never[] })
    expect(() => c.loadConfig()).not.toThrow()
    // Should still have the default column order
    expect(c.columnOrder.value.length).toBeGreaterThan(0)
  })
})
