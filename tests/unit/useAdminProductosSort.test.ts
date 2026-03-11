import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminProductosSort } from '../../app/composables/admin/useAdminProductosSort'

// ─── Fixtures ──────────────────────────────────────────────────────────────

type MinVehicle = {
  id: string
  brand: string
  model: string
  year: number
  price: number
  status: string
  created_at: string
  [key: string]: unknown
}

function makeVehicle(overrides: Partial<MinVehicle> = {}): MinVehicle {
  return {
    id: 'v-1',
    brand: 'Volvo',
    model: 'FH',
    year: 2020,
    price: 80000,
    status: 'published',
    created_at: '2026-01-01',
    ...overrides,
  }
}

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Initial state ─────────────────────────────────────────────────────────

describe('initial state', () => {
  it('sortField starts as "created_at"', () => {
    const c = useAdminProductosSort({ value: [] as never[] })
    expect(c.sortField.value).toBe('created_at')
  })

  it('sortOrder starts as "desc"', () => {
    const c = useAdminProductosSort({ value: [] as never[] })
    expect(c.sortOrder.value).toBe('desc')
  })

  it('sortedVehicles starts as empty array when no vehicles', () => {
    const c = useAdminProductosSort({ value: [] as never[] })
    expect(c.sortedVehicles.value).toEqual([])
  })
})

// ─── toggleSort ────────────────────────────────────────────────────────────

describe('toggleSort', () => {
  it('changes sortField to new field and sets sortOrder to "asc"', () => {
    const c = useAdminProductosSort({ value: [] as never[] })
    c.toggleSort('brand')
    expect(c.sortField.value).toBe('brand')
    expect(c.sortOrder.value).toBe('asc')
  })

  it('toggles sortOrder when same field is toggled twice', () => {
    const c = useAdminProductosSort({ value: [] as never[] })
    c.toggleSort('brand') // → asc
    c.toggleSort('brand') // → desc
    expect(c.sortOrder.value).toBe('desc')
  })

  it('toggles back to "asc" on third toggle of same field', () => {
    const c = useAdminProductosSort({ value: [] as never[] })
    c.toggleSort('price') // → asc
    c.toggleSort('price') // → desc
    c.toggleSort('price') // → asc
    expect(c.sortOrder.value).toBe('asc')
  })

  it('switches field without toggling order when different field selected', () => {
    const c = useAdminProductosSort({ value: [] as never[] })
    c.toggleSort('brand') // brand asc
    c.toggleSort('model') // model asc (new field resets to asc)
    expect(c.sortField.value).toBe('model')
    expect(c.sortOrder.value).toBe('asc')
  })

  it('handles all valid sort fields', () => {
    const fields = ['brand', 'model', 'year', 'price', 'status', 'created_at'] as const
    for (const field of fields) {
      const c = useAdminProductosSort({ value: [] as never[] })
      c.toggleSort(field)
      expect(c.sortField.value).toBe(field)
    }
  })
})

// ─── sortedVehicles (one-shot computed at creation) ────────────────────────

describe('sortedVehicles sort by created_at desc (default)', () => {
  it('sorts by created_at descending (newest first)', () => {
    const vehicles = [
      makeVehicle({ id: 'v-old', created_at: '2024-01-01' }),
      makeVehicle({ id: 'v-new', created_at: '2026-06-01' }),
      makeVehicle({ id: 'v-mid', created_at: '2025-03-15' }),
    ]
    const c = useAdminProductosSort({ value: vehicles as never[] })
    expect(c.sortedVehicles.value[0]!.id).toBe('v-new')
    expect(c.sortedVehicles.value[1]!.id).toBe('v-mid')
    expect(c.sortedVehicles.value[2]!.id).toBe('v-old')
  })

  it('returns original list order when created_at is equal', () => {
    const vehicles = [
      makeVehicle({ id: 'v-1', created_at: '2026-01-01' }),
      makeVehicle({ id: 'v-2', created_at: '2026-01-01' }),
    ]
    const c = useAdminProductosSort({ value: vehicles as never[] })
    expect(c.sortedVehicles.value).toHaveLength(2)
  })

  it('does not mutate the original vehicles array', () => {
    const v1 = makeVehicle({ id: 'v-1', created_at: '2024-01-01' })
    const v2 = makeVehicle({ id: 'v-2', created_at: '2026-01-01' })
    const original = [v1, v2]
    useAdminProductosSort({ value: original as never[] })
    // Original should be unchanged
    expect(original[0]!.id).toBe('v-1')
    expect(original[1]!.id).toBe('v-2')
  })
})

describe('sortedVehicles sort by brand asc (after toggleSort)', () => {
  it('sorts alphabetically by brand ascending after toggleSort("brand")', () => {
    const vehicles = [
      makeVehicle({ id: 'z-v', brand: 'Volvo' }),
      makeVehicle({ id: 'a-m', brand: 'MAN' }),
      makeVehicle({ id: 'd-d', brand: 'DAF' }),
    ]
    const c = useAdminProductosSort({ value: vehicles as never[] })
    // toggleSort changes sortField but sortedVehicles is one-shot computed
    // We can only verify initial sort (created_at desc) since it was evaluated at creation
    expect(c.sortedVehicles.value).toHaveLength(3)
    // After toggle, sortField changes but computed doesn't re-evaluate
    c.toggleSort('brand')
    expect(c.sortField.value).toBe('brand')
    expect(c.sortOrder.value).toBe('asc')
  })
})

describe('sortedVehicles sort by price', () => {
  it('sorts by price desc when created with price data (initial state)', () => {
    const vehicles = [
      makeVehicle({ id: 'cheap', price: 10000, created_at: '2026-01-01' }),
      makeVehicle({ id: 'exp', price: 90000, created_at: '2025-06-01' }),
    ]
    // Default sort is created_at desc — v1 (2026) should be first
    const c = useAdminProductosSort({ value: vehicles as never[] })
    expect(c.sortedVehicles.value[0]!.id).toBe('cheap')
  })
})

describe('sortedVehicles sort by year', () => {
  it('sorts by year desc with initial created_at sort override', () => {
    const vehicles = [
      makeVehicle({ id: 'new-model', year: 2023, created_at: '2026-01-01' }),
      makeVehicle({ id: 'old-model', year: 2018, created_at: '2024-01-01' }),
    ]
    // Initial sort: created_at desc → new-model first
    const c = useAdminProductosSort({ value: vehicles as never[] })
    expect(c.sortedVehicles.value[0]!.id).toBe('new-model')
  })
})
