import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (before import) ─────────────────────────────────────────────────

const mockDealerProfile = { value: null as { id: string } | null }
const mockLoadDealer = vi.fn()

vi.stubGlobal('useDealerDashboard', () => ({
  dealerProfile: mockDealerProfile,
  loadDealer: mockLoadDealer,
}))

const mockFrom = vi.fn()
vi.stubGlobal('useSupabaseClient', () => ({ from: mockFrom }))

import {
  getProfit,
  getMarginPercent,
  getTotalCost,
  useDashboardHistorico,
  type SoldVehicle,
} from '../../app/composables/dashboard/useDashboardHistorico'

// ─── Chain builder ─────────────────────────────────────────────────────────

function makeChain(result: unknown = { data: [], error: null }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'order', 'gte', 'lte', 'ilike', 'or', 'update', 'delete', 'insert']
  methods.forEach((m) => {
    chain[m] = () => chain
  })
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain
}

function makeSoldVehicle(overrides: Partial<SoldVehicle> = {}): SoldVehicle {
  return {
    id: 'v-1',
    brand: 'Volvo',
    model: 'FH',
    year: 2020,
    price: 80000,
    sale_price: 75000,
    sale_date: '2026-01-15',
    acquisition_cost: 50000,
    total_maintenance: 5000,
    total_rental_income: 2000,
    buyer_name: 'Transportes SA',
    buyer_contact: '600000000',
    status: 'sold',
    ...overrides,
  }
}

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockDealerProfile.value = null
  mockLoadDealer.mockResolvedValue(null)
  mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
})

// ─── Exported pure functions ───────────────────────────────────────────────

describe('getProfit', () => {
  it('calculates profit: salePrice - acquisition - maintenance + rentalIncome', () => {
    const v = makeSoldVehicle({
      sale_price: 75000,
      acquisition_cost: 50000,
      total_maintenance: 5000,
      total_rental_income: 2000,
    })
    expect(getProfit(v)).toBe(22000)
  })

  it('treats null fields as 0', () => {
    const v = makeSoldVehicle({
      sale_price: 10000,
      acquisition_cost: null,
      total_maintenance: null,
      total_rental_income: null,
    })
    expect(getProfit(v)).toBe(10000)
  })

  it('returns negative profit when costs exceed sale price', () => {
    const v = makeSoldVehicle({
      sale_price: 5000,
      acquisition_cost: 10000,
      total_maintenance: 0,
      total_rental_income: 0,
    })
    expect(getProfit(v)).toBe(-5000)
  })
})

describe('getMarginPercent', () => {
  it('calculates margin percent correctly', () => {
    const v = makeSoldVehicle({
      sale_price: 10000,
      acquisition_cost: 8000,
      total_maintenance: 0,
      total_rental_income: 0,
    })
    expect(getMarginPercent(v)).toBe(20) // 2000/10000 * 100
  })

  it('returns 0 when sale_price is 0', () => {
    const v = makeSoldVehicle({ sale_price: 0, acquisition_cost: 5000 })
    expect(getMarginPercent(v)).toBe(0)
  })

  it('returns 0 when sale_price is null', () => {
    const v = makeSoldVehicle({ sale_price: null, acquisition_cost: 5000 })
    expect(getMarginPercent(v)).toBe(0)
  })
})

describe('getTotalCost', () => {
  it('calculates total cost correctly (acquisition + maintenance - rental)', () => {
    const v = makeSoldVehicle({
      acquisition_cost: 50000,
      total_maintenance: 5000,
      total_rental_income: 2000,
    })
    expect(getTotalCost(v)).toBe(53000)
  })

  it('treats null fields as 0', () => {
    const v = makeSoldVehicle({
      acquisition_cost: null,
      total_maintenance: null,
      total_rental_income: null,
    })
    expect(getTotalCost(v)).toBe(0)
  })
})

// ─── Filter helpers ────────────────────────────────────────────────────────

describe('filter helpers', () => {
  it('setFilterYear sets filters.year', () => {
    const c = useDashboardHistorico()
    c.setFilterYear(2025)
    expect(c.filters.year).toBe(2025)
  })

  it('setFilterBrand sets filters.brand', () => {
    const c = useDashboardHistorico()
    c.setFilterBrand('Volvo')
    expect(c.filters.brand).toBe('Volvo')
  })

  it('setFilterSearch sets filters.search', () => {
    const c = useDashboardHistorico()
    c.setFilterSearch('transport')
    expect(c.filters.search).toBe('transport')
  })

  it('clearFilters resets all filter fields', () => {
    const c = useDashboardHistorico()
    c.setFilterYear(2024)
    c.setFilterBrand('DAF')
    c.setFilterSearch('query')
    c.clearFilters()
    expect(c.filters.year).toBeNull()
    expect(c.filters.brand).toBeNull()
    expect(c.filters.search).toBe('')
  })
})

// ─── Restore helpers ───────────────────────────────────────────────────────

describe('restore helpers', () => {
  it('setRestoreConfirm updates restoreConfirm.value', () => {
    const c = useDashboardHistorico()
    c.setRestoreConfirm('restaurar')
    expect(c.restoreConfirm.value).toBe('restaurar')
  })

  it('setExportDataScope updates exportDataScope.value', () => {
    const c = useDashboardHistorico()
    c.setExportDataScope('all')
    expect(c.exportDataScope.value).toBe('all')
  })

  it('canRestore is false initially', () => {
    const c = useDashboardHistorico()
    expect(c.canRestore.value).toBe(false)
  })
})

// ─── Modal helpers ─────────────────────────────────────────────────────────

describe('modal helpers', () => {
  it('openDetailModal sets entry and shows modal', () => {
    const c = useDashboardHistorico()
    const entry = makeSoldVehicle()
    c.openDetailModal(entry)
    expect(c.showDetailModal.value).toBe(true)
    expect(c.detailEntry.value).toBe(entry)
  })

  it('closeDetailModal hides modal', () => {
    const c = useDashboardHistorico()
    c.openDetailModal(makeSoldVehicle())
    c.closeDetailModal()
    expect(c.showDetailModal.value).toBe(false)
  })

  it('openRestoreModal sets target and resets confirm', () => {
    const c = useDashboardHistorico()
    c.setRestoreConfirm('previous')
    const entry = makeSoldVehicle()
    c.openRestoreModal(entry)
    expect(c.showRestoreModal.value).toBe(true)
    expect(c.restoreTarget.value).toBe(entry)
    expect(c.restoreConfirm.value).toBe('')
  })

  it('closeRestoreModal hides modal', () => {
    const c = useDashboardHistorico()
    c.openRestoreModal(makeSoldVehicle())
    c.closeRestoreModal()
    expect(c.showRestoreModal.value).toBe(false)
  })

  it('openExportModal shows modal', () => {
    const c = useDashboardHistorico()
    c.openExportModal()
    expect(c.showExportModal.value).toBe(true)
  })

  it('closeExportModal hides modal', () => {
    const c = useDashboardHistorico()
    c.openExportModal()
    c.closeExportModal()
    expect(c.showExportModal.value).toBe(false)
  })
})

// ─── Sort helpers ──────────────────────────────────────────────────────────

describe('toggleSort', () => {
  it('same column toggles sortAsc', () => {
    const c = useDashboardHistorico()
    c.toggleSort('sale_date') // was false → true
    expect(c.sortAsc.value).toBe(true)
    c.toggleSort('sale_date') // true → false
    expect(c.sortAsc.value).toBe(false)
  })

  it('different column sets new col with sortAsc=false', () => {
    const c = useDashboardHistorico()
    c.toggleSort('sale_price')
    expect(c.sortCol.value).toBe('sale_price')
    expect(c.sortAsc.value).toBe(false)
  })

  it('toggleSort all valid columns', () => {
    const c = useDashboardHistorico()
    for (const col of ['sale_date', 'sale_price', 'profit', 'brand'] as const) {
      c.toggleSort(col)
      expect(c.sortCol.value).toBe(col)
    }
  })
})

describe('getSortIcon', () => {
  it('returns empty string for non-active column', () => {
    const c = useDashboardHistorico()
    expect(c.getSortIcon('sale_price')).toBe('')
  })

  it('returns down arrow for active column in desc mode', () => {
    const c = useDashboardHistorico()
    expect(c.getSortIcon('sale_date')).toBe(' \u2193')
  })

  it('returns up arrow when sortAsc is true', () => {
    const c = useDashboardHistorico()
    c.toggleSort('sale_date')
    expect(c.getSortIcon('sale_date')).toBe(' \u2191')
  })
})

// ─── Formatting ────────────────────────────────────────────────────────────

describe('fmt', () => {
  it('returns -- for null', () => {
    const c = useDashboardHistorico()
    expect(c.fmt(null)).toBe('--')
  })

  it('returns -- for undefined', () => {
    const c = useDashboardHistorico()
    expect(c.fmt(undefined)).toBe('--')
  })

  it('formats positive number as EUR currency', () => {
    const c = useDashboardHistorico()
    const result = c.fmt(1000)
    expect(result).toContain('1')
    expect(result).toContain('000')
  })
})

describe('fmtDate', () => {
  it('returns -- for null', () => {
    const c = useDashboardHistorico()
    expect(c.fmtDate(null)).toBe('--')
  })

  it('formats a valid date string', () => {
    const c = useDashboardHistorico()
    const result = c.fmtDate('2026-01-15')
    expect(result).toBeTruthy()
    expect(result).not.toBe('--')
  })
})

// ─── Computed initial state ────────────────────────────────────────────────

describe('computed initial state', () => {
  it('summary starts with all zeros', () => {
    const c = useDashboardHistorico()
    expect(c.summary.value.totalSales).toBe(0)
    expect(c.summary.value.totalRevenue).toBe(0)
    expect(c.summary.value.totalProfit).toBe(0)
    expect(c.summary.value.avgMarginPercent).toBe(0)
  })

  it('sortedEntries is empty initially', () => {
    const c = useDashboardHistorico()
    expect(c.sortedEntries.value).toEqual([])
  })
})

// ─── fetchEntries ──────────────────────────────────────────────────────────

describe('fetchEntries', () => {
  it('sets error when no dealer found', async () => {
    mockDealerProfile.value = null
    mockLoadDealer.mockResolvedValue(null)
    const c = useDashboardHistorico()
    await c.fetchEntries()
    expect(c.error.value).toBe('dashboard.historico.error')
    expect(c.loading.value).toBe(false)
  })

  it('loads entries from supabase when dealer available', async () => {
    mockDealerProfile.value = { id: 'dealer-1' }
    const vehicles = [
      {
        id: 'v-1', brand: 'Volvo', model: 'FH', year: 2020,
        price: 80000, sale_price: 75000, sale_date: '2026-01-01',
        acquisition_cost: 50000, total_maintenance: 0, total_rental_income: 0,
        buyer_name: null, buyer_contact: null, status: 'sold',
      },
    ]
    mockFrom.mockImplementation(() => makeChain({ data: vehicles, error: null }))
    const c = useDashboardHistorico()
    await c.fetchEntries()
    expect(c.entries.value).toHaveLength(1)
    expect(c.loading.value).toBe(false)
  })

  it('calls loadDealer when dealerProfile is null', async () => {
    mockDealerProfile.value = null
    mockLoadDealer.mockResolvedValue({ id: 'dealer-2' })
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
    const c = useDashboardHistorico()
    await c.fetchEntries()
    expect(mockLoadDealer).toHaveBeenCalledOnce()
  })

  it('sets error and clears entries on supabase error', async () => {
    mockDealerProfile.value = { id: 'dealer-1' }
    mockFrom.mockImplementation(() => makeChain({ data: null, error: { message: 'DB error' } }))
    const c = useDashboardHistorico()
    await c.fetchEntries()
    expect(c.error.value).toBe('DB error')
    expect(c.entries.value).toEqual([])
  })
})

// ─── handleRestore ─────────────────────────────────────────────────────────

describe('handleRestore', () => {
  it('does nothing when restoreTarget is null', async () => {
    const c = useDashboardHistorico()
    await c.handleRestore()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('does nothing when canRestore is false (no confirm text)', async () => {
    const c = useDashboardHistorico()
    c.restoreTarget.value = makeSoldVehicle()
    await c.handleRestore()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('restores vehicle successfully when canRestore is true', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: null }))
    const c = useDashboardHistorico()
    const entry = makeSoldVehicle({ id: 'v-restore' })
    c.entries.value = [entry]
    c.restoreTarget.value = entry
    c.canRestore.value = true
    await c.handleRestore()
    expect(c.entries.value).toHaveLength(0)
    expect(c.showRestoreModal.value).toBe(false)
    expect(c.restoreTarget.value).toBeNull()
    expect(c.saving.value).toBe(false)
  })

  it('sets error on restore failure', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: { message: 'Restore failed' } }))
    const c = useDashboardHistorico()
    c.restoreTarget.value = makeSoldVehicle()
    c.canRestore.value = true
    await c.handleRestore()
    expect(c.error.value).toBe('Restore failed')
    expect(c.saving.value).toBe(false)
  })
})
