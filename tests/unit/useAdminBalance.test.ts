import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (before import) ─────────────────────────────────────────────────

const mockFrom = vi.fn()
vi.stubGlobal('useSupabaseClient', () => ({ from: mockFrom }))

import {
  useAdminBalance,
  BALANCE_REASONS,
  BALANCE_STATUS_LABELS,
  type BalanceEntry,
  type BalanceFormData,
} from '../../app/composables/admin/useAdminBalance'

// ─── Chain builder ─────────────────────────────────────────────────────────

function makeChain(result: unknown = { data: [], error: null, count: 0 }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'order', 'gte', 'lte', 'or', 'insert', 'update', 'delete', 'single', 'in']
  methods.forEach((m) => {
    chain[m] = () => chain
  })
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain
}

// ─── Fixtures ──────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<BalanceEntry> = {}): BalanceEntry {
  return {
    id: 'entry-1',
    tipo: 'ingreso',
    fecha: '2026-01-15',
    razon: 'venta',
    detalle: 'Sale of truck',
    importe: 50000,
    estado: 'cobrado',
    notas: null,
    factura_url: null,
    coste_asociado: null,
    vehicle_id: null,
    subcategory_id: null,
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
    ...overrides,
  }
}

function makeFormData(overrides: Partial<BalanceFormData> = {}): BalanceFormData {
  return {
    tipo: 'ingreso',
    fecha: '2026-01-15',
    razon: 'venta',
    detalle: 'Sale',
    importe: 50000,
    estado: 'cobrado',
    notas: null,
    factura_url: null,
    coste_asociado: null,
    vehicle_id: null,
    subcategory_id: null,
    ...overrides,
  }
}

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockImplementation(() => makeChain({ data: [], error: null, count: 0 }))
})

// ─── Exported constants ───────────────────────────────────────────────────

describe('BALANCE_REASONS', () => {
  it('has 14 reasons', () => {
    expect(Object.keys(BALANCE_REASONS)).toHaveLength(14)
  })

  it('has correct Spanish label for common reasons', () => {
    expect(BALANCE_REASONS.venta).toBe('Venta')
    expect(BALANCE_REASONS.alquiler).toBe('Alquiler')
    expect(BALANCE_REASONS.otros).toBe('Otros')
    expect(BALANCE_REASONS.compra).toBe('Compra')
  })
})

describe('BALANCE_STATUS_LABELS', () => {
  it('has 3 statuses', () => {
    expect(Object.keys(BALANCE_STATUS_LABELS)).toHaveLength(3)
  })

  it('has correct labels', () => {
    expect(BALANCE_STATUS_LABELS.pendiente).toBe('Pendiente')
    expect(BALANCE_STATUS_LABELS.pagado).toBe('Pagado')
    expect(BALANCE_STATUS_LABELS.cobrado).toBe('Cobrado')
  })
})

// ─── Initial state ─────────────────────────────────────────────────────────

describe('initial state', () => {
  it('entries starts empty', () => {
    const c = useAdminBalance()
    expect(c.entries.value).toEqual([])
  })

  it('loading starts false', () => {
    const c = useAdminBalance()
    expect(c.loading.value).toBe(false)
  })

  it('saving starts false', () => {
    const c = useAdminBalance()
    expect(c.saving.value).toBe(false)
  })

  it('error starts null', () => {
    const c = useAdminBalance()
    expect(c.error.value).toBeNull()
  })

  it('total starts 0', () => {
    const c = useAdminBalance()
    expect(c.total.value).toBe(0)
  })

  it('availableYears starts empty', () => {
    const c = useAdminBalance()
    expect(c.availableYears.value).toEqual([])
  })
})

// ─── summary computed ──────────────────────────────────────────────────────

describe('summary', () => {
  it('starts with zeros when entries is empty', () => {
    const c = useAdminBalance()
    const s = c.summary.value
    expect(s.totalIngresos).toBe(0)
    expect(s.totalGastos).toBe(0)
    expect(s.balanceNeto).toBe(0)
    expect(s.byReason).toEqual({})
    expect(s.byType).toEqual({})
  })
})

// ─── calculateProfit ──────────────────────────────────────────────────────

describe('calculateProfit', () => {
  it('returns null when coste is null', () => {
    const c = useAdminBalance()
    expect(c.calculateProfit(50000, null)).toBeNull()
  })

  it('returns null when coste is 0', () => {
    const c = useAdminBalance()
    expect(c.calculateProfit(50000, 0)).toBeNull()
  })

  it('calculates profit percentage correctly', () => {
    const c = useAdminBalance()
    // (50000 - 40000) / 40000 * 100 = 25
    expect(c.calculateProfit(50000, 40000)).toBe(25)
  })

  it('handles negative profit (loss)', () => {
    const c = useAdminBalance()
    // (30000 - 40000) / 40000 * 100 = -25
    expect(c.calculateProfit(30000, 40000)).toBe(-25)
  })

  it('returns 0 when importe equals coste', () => {
    const c = useAdminBalance()
    expect(c.calculateProfit(40000, 40000)).toBe(0)
  })
})

// ─── fetchEntries ──────────────────────────────────────────────────────────

describe('fetchEntries', () => {
  it('calls from("balance") and updates entries', async () => {
    const entries = [makeEntry()]
    let callIndex = 0
    mockFrom.mockImplementation(() => {
      callIndex++
      // first = fetchEntries main query, second = fetchAvailableYears
      if (callIndex === 1) return makeChain({ data: entries, error: null, count: 1 })
      return makeChain({ data: [{ fecha: '2026-01-15' }], error: null })
    })
    const c = useAdminBalance()
    await c.fetchEntries()
    expect(mockFrom).toHaveBeenCalledWith('balance')
    expect(c.entries.value).toEqual(entries)
    expect(c.total.value).toBe(1)
    expect(c.loading.value).toBe(false)
  })

  it('sets error when Supabase returns error', async () => {
    mockFrom.mockImplementation(() =>
      makeChain({ data: null, error: { message: 'DB error' }, count: 0 }),
    )
    const c = useAdminBalance()
    await c.fetchEntries()
    expect(c.error.value).toBe('DB error')
    expect(c.entries.value).toEqual([])
  })

  it('applies year filter', async () => {
    const c = useAdminBalance()
    await c.fetchEntries({ year: 2026 })
    expect(mockFrom).toHaveBeenCalledWith('balance')
  })

  it('applies tipo filter', async () => {
    const c = useAdminBalance()
    await c.fetchEntries({ tipo: 'ingreso' })
    expect(mockFrom).toHaveBeenCalledWith('balance')
  })

  it('applies search filter', async () => {
    const c = useAdminBalance()
    await c.fetchEntries({ search: 'truck' })
    expect(mockFrom).toHaveBeenCalledWith('balance')
  })

  it('applies razon filter', async () => {
    const c = useAdminBalance()
    await c.fetchEntries({ razon: 'venta' })
    expect(mockFrom).toHaveBeenCalledWith('balance')
  })

  it('applies estado filter', async () => {
    const c = useAdminBalance()
    await c.fetchEntries({ estado: 'cobrado' })
    expect(mockFrom).toHaveBeenCalledWith('balance')
  })

  it('resets entries to [] when data is null', async () => {
    mockFrom.mockImplementation(() =>
      makeChain({ data: null, error: { message: 'fail' }, count: 0 }),
    )
    const c = useAdminBalance()
    c.entries.value = [makeEntry()]
    await c.fetchEntries()
    expect(c.entries.value).toEqual([])
  })
})

// ─── fetchById ────────────────────────────────────────────────────────────

describe('fetchById', () => {
  it('returns entry when found', async () => {
    const entry = makeEntry({ id: 'specific-id' })
    mockFrom.mockImplementation(() => makeChain({ data: entry, error: null }))
    const c = useAdminBalance()
    const result = await c.fetchById('specific-id')
    expect(result).toEqual(entry)
  })

  it('returns null on error', async () => {
    mockFrom.mockImplementation(() =>
      makeChain({ data: null, error: { message: 'Not found' } }),
    )
    const c = useAdminBalance()
    const result = await c.fetchById('bad-id')
    expect(result).toBeNull()
    expect(c.error.value).toBe('Not found')
  })

  it('sets loading false after successful call', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: makeEntry(), error: null }))
    const c = useAdminBalance()
    await c.fetchById('id-1')
    expect(c.loading.value).toBe(false)
  })

  it('sets loading false after error', async () => {
    mockFrom.mockImplementation(() =>
      makeChain({ data: null, error: { message: 'err' } }),
    )
    const c = useAdminBalance()
    await c.fetchById('id-1')
    expect(c.loading.value).toBe(false)
  })
})

// ─── createEntry ──────────────────────────────────────────────────────────

describe('createEntry', () => {
  it('returns the new entry id on success', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: { id: 'new-id' }, error: null }))
    const c = useAdminBalance()
    const id = await c.createEntry(makeFormData())
    expect(id).toBe('new-id')
    expect(c.saving.value).toBe(false)
  })

  it('returns null on error', async () => {
    mockFrom.mockImplementation(() =>
      makeChain({ data: null, error: { message: 'Insert failed' } }),
    )
    const c = useAdminBalance()
    const id = await c.createEntry(makeFormData())
    expect(id).toBeNull()
    expect(c.error.value).toBe('Insert failed')
    expect(c.saving.value).toBe(false)
  })

  it('calls from("balance")', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: { id: 'x' }, error: null }))
    const c = useAdminBalance()
    await c.createEntry(makeFormData())
    expect(mockFrom).toHaveBeenCalledWith('balance')
  })

  it('returns null when data has no id', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: null, error: null }))
    const c = useAdminBalance()
    const id = await c.createEntry(makeFormData())
    expect(id).toBeNull()
  })
})

// ─── updateEntry ──────────────────────────────────────────────────────────

describe('updateEntry', () => {
  it('returns true on success', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: null }))
    const c = useAdminBalance()
    const result = await c.updateEntry('entry-1', { detalle: 'Updated' })
    expect(result).toBe(true)
    expect(c.saving.value).toBe(false)
  })

  it('returns false on error', async () => {
    mockFrom.mockImplementation(() =>
      makeChain({ error: { message: 'Update failed' } }),
    )
    const c = useAdminBalance()
    const result = await c.updateEntry('entry-1', { importe: 9999 })
    expect(result).toBe(false)
    expect(c.error.value).toBe('Update failed')
    expect(c.saving.value).toBe(false)
  })

  it('calls from("balance")', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: null }))
    const c = useAdminBalance()
    await c.updateEntry('entry-1', { estado: 'pagado' })
    expect(mockFrom).toHaveBeenCalledWith('balance')
  })
})

// ─── deleteEntry ──────────────────────────────────────────────────────────

describe('deleteEntry', () => {
  it('removes entry locally and returns true on success', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: null }))
    const c = useAdminBalance()
    c.entries.value = [makeEntry({ id: 'del-1' }), makeEntry({ id: 'del-2' })]
    c.total.value = 2
    const result = await c.deleteEntry('del-1')
    expect(result).toBe(true)
    expect(c.entries.value).toHaveLength(1)
    expect(c.entries.value[0]!.id).toBe('del-2')
    expect(c.total.value).toBe(1)
    expect(c.saving.value).toBe(false)
  })

  it('returns false on error and keeps entries intact', async () => {
    mockFrom.mockImplementation(() =>
      makeChain({ error: { message: 'Delete failed' } }),
    )
    const c = useAdminBalance()
    c.entries.value = [makeEntry({ id: 'keep-1' })]
    const result = await c.deleteEntry('keep-1')
    expect(result).toBe(false)
    expect(c.error.value).toBe('Delete failed')
    expect(c.entries.value).toHaveLength(1)
  })

  it('decrements total on success', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: null }))
    const c = useAdminBalance()
    c.entries.value = [makeEntry({ id: 'e1' })]
    c.total.value = 5
    await c.deleteEntry('e1')
    expect(c.total.value).toBe(4)
  })

  it('calls from("balance")', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: null }))
    const c = useAdminBalance()
    c.entries.value = [makeEntry({ id: 'e1' })]
    await c.deleteEntry('e1')
    expect(mockFrom).toHaveBeenCalledWith('balance')
  })
})
