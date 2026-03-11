import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (before import) ─────────────────────────────────────────────────

vi.stubGlobal('useAuth', () => ({ userId: { value: 'user-1' } }))

const mockDealerProfile = { value: null as { id: string } | null }
const mockLoadDealer = vi.fn()

vi.stubGlobal('useDealerDashboard', () => ({
  dealerProfile: mockDealerProfile,
  loadDealer: mockLoadDealer,
}))

const mockCanExport = { value: false }
const mockFetchSubscription = vi.fn()

vi.stubGlobal('useSubscriptionPlan', () => ({
  canExport: mockCanExport,
  fetchSubscription: mockFetchSubscription,
}))

const mockFrom = vi.fn()
vi.stubGlobal('useSupabaseClient', () => ({ from: mockFrom }))

import {
  useDashboardMantenimientos,
  type MaintenanceRecord,
  type MaintenanceFormData,
} from '../../app/composables/dashboard/useDashboardMantenimientos'

// ─── Chain builder ─────────────────────────────────────────────────────────

function makeChain(result: unknown = { data: [], error: null }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'order', 'update', 'delete', 'insert', 'gte', 'lte']
  methods.forEach((m) => {
    chain[m] = () => chain
  })
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain
}

// ─── Fixtures ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<MaintenanceRecord> = {}): MaintenanceRecord {
  return {
    id: 'rec-1',
    dealer_id: 'dealer-1',
    vehicle_id: 'v-1',
    vehicle_brand: 'Volvo',
    vehicle_model: 'FH',
    vehicle_year: 2020,
    date: '2026-01-15',
    type: 'preventivo',
    description: 'Oil change',
    cost: 250,
    km: 150000,
    created_at: '2026-01-15',
    ...overrides,
  }
}

const currentYear = new Date().getFullYear()

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockDealerProfile.value = null
  mockLoadDealer.mockResolvedValue(null)
  mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
})

// ─── getTypeBadgeClass ────────────────────────────────────────────────────

describe('getTypeBadgeClass', () => {
  it('returns badge-preventivo for preventivo', () => {
    const c = useDashboardMantenimientos()
    expect(c.getTypeBadgeClass('preventivo')).toBe('badge-preventivo')
  })

  it('returns badge-correctivo for correctivo', () => {
    const c = useDashboardMantenimientos()
    expect(c.getTypeBadgeClass('correctivo')).toBe('badge-correctivo')
  })

  it('returns badge-itv for itv', () => {
    const c = useDashboardMantenimientos()
    expect(c.getTypeBadgeClass('itv')).toBe('badge-itv')
  })

  it('returns empty string for unknown type', () => {
    const c = useDashboardMantenimientos()
    expect(c.getTypeBadgeClass('unknown')).toBe('')
  })
})

// ─── Form helpers ─────────────────────────────────────────────────────────

describe('openCreateForm', () => {
  it('clears editingId and shows form', () => {
    const c = useDashboardMantenimientos()
    c.editingId.value = 'existing-id'
    c.openCreateForm()
    expect(c.editingId.value).toBeNull()
    expect(c.showForm.value).toBe(true)
    expect(c.successMsg.value).toBeNull()
  })

  it('sets form defaults (type=preventivo, empty description)', () => {
    const c = useDashboardMantenimientos()
    c.openCreateForm()
    expect(c.form.type).toBe('preventivo')
    expect(c.form.description).toBe('')
    expect(c.form.cost).toBeNull()
    expect(c.form.km).toBeNull()
  })

  it('uses first vehicle option as default vehicle_id', () => {
    const c = useDashboardMantenimientos()
    c.vehicleOptions.value = [{ id: 'v-1', brand: 'Volvo', model: 'FH', year: 2020 }]
    c.openCreateForm()
    expect(c.form.vehicle_id).toBe('v-1')
  })

  it('sets vehicle_id to empty string when no vehicle options', () => {
    const c = useDashboardMantenimientos()
    c.vehicleOptions.value = []
    c.openCreateForm()
    expect(c.form.vehicle_id).toBe('')
  })
})

describe('openEditForm', () => {
  it('populates form from record and sets editingId', () => {
    const c = useDashboardMantenimientos()
    const record = makeRecord({
      id: 'rec-edit',
      vehicle_id: 'v-2',
      type: 'correctivo',
      description: 'Brake fix',
      cost: 500,
      km: 200000,
    })
    c.openEditForm(record)
    expect(c.editingId.value).toBe('rec-edit')
    expect(c.form.vehicle_id).toBe('v-2')
    expect(c.form.type).toBe('correctivo')
    expect(c.form.description).toBe('Brake fix')
    expect(c.form.cost).toBe(500)
    expect(c.form.km).toBe(200000)
    expect(c.showForm.value).toBe(true)
  })
})

describe('updateForm', () => {
  it('updates all form fields from provided object', () => {
    const c = useDashboardMantenimientos()
    const updated: MaintenanceFormData = {
      vehicle_id: 'v-99',
      date: '2026-06-01',
      type: 'itv',
      description: 'ITV check',
      cost: 120,
      km: 300000,
    }
    c.updateForm(updated)
    expect(c.form.vehicle_id).toBe('v-99')
    expect(c.form.date).toBe('2026-06-01')
    expect(c.form.type).toBe('itv')
    expect(c.form.description).toBe('ITV check')
    expect(c.form.cost).toBe(120)
    expect(c.form.km).toBe(300000)
  })
})

// ─── confirmDelete ────────────────────────────────────────────────────────

describe('confirmDelete', () => {
  it('sets deleteTarget and shows modal', () => {
    const c = useDashboardMantenimientos()
    const record = makeRecord()
    c.confirmDelete(record)
    expect(c.deleteTarget.value).toBe(record)
    expect(c.showDeleteModal.value).toBe(true)
  })
})

// ─── Filters ─────────────────────────────────────────────────────────────

describe('clearFilters', () => {
  it('resets filterVehicle and filterType to null', () => {
    const c = useDashboardMantenimientos()
    c.filterVehicle.value = 'v-1'
    c.filterType.value = 'preventivo'
    c.clearFilters()
    expect(c.filterVehicle.value).toBeNull()
    expect(c.filterType.value).toBeNull()
  })
})

// ─── Sort helpers ─────────────────────────────────────────────────────────

describe('toggleSort', () => {
  it('same column toggles sortAsc', () => {
    const c = useDashboardMantenimientos()
    c.toggleSort('date') // initial: date, asc=false → true
    expect(c.sortAsc.value).toBe(true)
    c.toggleSort('date') // true → false
    expect(c.sortAsc.value).toBe(false)
  })

  it('different column sets new col with sortAsc=false', () => {
    const c = useDashboardMantenimientos()
    c.toggleSort('cost')
    expect(c.sortCol.value).toBe('cost')
    expect(c.sortAsc.value).toBe(false)
  })

  it('toggles all sort columns', () => {
    const c = useDashboardMantenimientos()
    for (const col of ['date', 'cost', 'vehicle', 'type'] as const) {
      c.toggleSort(col)
      expect(c.sortCol.value).toBe(col)
    }
  })
})

describe('getSortIcon', () => {
  it('returns empty string for non-active column', () => {
    const c = useDashboardMantenimientos()
    expect(c.getSortIcon('cost')).toBe('')
  })

  it('returns down arrow for active column in desc mode', () => {
    const c = useDashboardMantenimientos()
    expect(c.getSortIcon('date')).toBe(' \u2193')
  })

  it('returns up arrow when asc=true', () => {
    const c = useDashboardMantenimientos()
    c.toggleSort('date') // toggles to asc
    expect(c.getSortIcon('date')).toBe(' \u2191')
  })
})

// ─── Formatting ────────────────────────────────────────────────────────────

describe('fmt', () => {
  it('formats a number as EUR currency', () => {
    const c = useDashboardMantenimientos()
    const result = c.fmt(500)
    expect(result).toBeTruthy()
    expect(result).toContain('500')
  })
})

describe('fmtDate', () => {
  it('formats a valid date string', () => {
    const c = useDashboardMantenimientos()
    const result = c.fmtDate('2026-01-15')
    expect(result).toBeTruthy()
  })
})

describe('fmtKm', () => {
  it('returns -- for null km', () => {
    const c = useDashboardMantenimientos()
    expect(c.fmtKm(null)).toBe('--')
  })

  it('returns -- for 0 (falsy)', () => {
    const c = useDashboardMantenimientos()
    expect(c.fmtKm(0)).toBe('--')
  })

  it('formats positive km with unit', () => {
    const c = useDashboardMantenimientos()
    const result = c.fmtKm(150000)
    expect(result).toContain('km')
    expect(result).toContain('150')
  })
})

// ─── Computed initial state ────────────────────────────────────────────────

describe('computed initial state', () => {
  it('filteredRecords starts empty', () => {
    const c = useDashboardMantenimientos()
    expect(c.filteredRecords.value).toEqual([])
  })

  it('sortedRecords starts empty', () => {
    const c = useDashboardMantenimientos()
    expect(c.sortedRecords.value).toEqual([])
  })

  it('summaryTotalCostThisYear starts at 0', () => {
    const c = useDashboardMantenimientos()
    expect(c.summaryTotalCostThisYear.value).toBe(0)
  })

  it('summaryTotalRecords starts at 0', () => {
    const c = useDashboardMantenimientos()
    expect(c.summaryTotalRecords.value).toBe(0)
  })

  it('summaryAvgCost starts at 0', () => {
    const c = useDashboardMantenimientos()
    expect(c.summaryAvgCost.value).toBe(0)
  })

  it('isFormValid starts as false (empty vehicle_id and description)', () => {
    const c = useDashboardMantenimientos()
    expect(c.isFormValid.value).toBe(false)
  })
})

// ─── loadData ─────────────────────────────────────────────────────────────

describe('loadData', () => {
  it('sets error when no dealer', async () => {
    mockDealerProfile.value = null
    mockLoadDealer.mockResolvedValue(null)
    const c = useDashboardMantenimientos()
    await c.loadData()
    expect(c.error.value).toBe('dashboard.tools.maintenance.errorNoDealer')
    expect(c.loading.value).toBe(false)
  })

  it('calls loadDealer when dealerProfile is null', async () => {
    mockDealerProfile.value = null
    mockLoadDealer.mockResolvedValue({ id: 'dealer-1' })
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
    const c = useDashboardMantenimientos()
    await c.loadData()
    expect(mockLoadDealer).toHaveBeenCalledOnce()
  })

  it('loads vehicles and records for dealer', async () => {
    mockDealerProfile.value = { id: 'dealer-1' }
    let callCount = 0
    mockFrom.mockImplementation((table: string) => {
      callCount++
      if (table === 'vehicles') {
        return makeChain({
          data: [{ id: 'v-1', brand: 'Volvo', model: 'FH', year: 2020 }],
          error: null,
        })
      }
      if (table === 'maintenance_records') {
        return makeChain({
          data: [
            {
              id: 'rec-1',
              dealer_id: 'dealer-1',
              vehicle_id: 'v-1',
              date: `${currentYear}-02-01`,
              type: 'preventivo',
              description: 'Oil change',
              cost: 250,
              km: 100000,
              created_at: `${currentYear}-02-01`,
              vehicles: { brand: 'Volvo', model: 'FH', year: 2020 },
            },
          ],
          error: null,
        })
      }
      return makeChain({ data: [], error: null })
    })
    const c = useDashboardMantenimientos()
    await c.loadData()
    expect(c.vehicleOptions.value).toHaveLength(1)
    expect(c.records.value).toHaveLength(1)
    expect(c.loading.value).toBe(false)
  })

  it('handles vehicle fetch error', async () => {
    mockDealerProfile.value = { id: 'dealer-1' }
    mockFrom.mockImplementation(() => makeChain({ data: null, error: { message: 'Vehicle fetch failed' } }))
    const c = useDashboardMantenimientos()
    await c.loadData()
    expect(c.error.value).toBe('Vehicle fetch failed')
    expect(c.loading.value).toBe(false)
  })

  it('maps records with vehicle sub-object', async () => {
    mockDealerProfile.value = { id: 'dealer-1' }
    let callCount = 0
    mockFrom.mockImplementation((table: string) => {
      callCount++
      if (callCount === 1 && table === 'vehicles') {
        return makeChain({ data: [], error: null })
      }
      return makeChain({
        data: [
          {
            id: 'rec-1', dealer_id: 'dealer-1', vehicle_id: 'v-1',
            date: '2026-01-15', type: 'correctivo', description: 'Brakes',
            cost: 400, km: null, created_at: '2026-01-15',
            vehicles: null, // null vehicle join
          },
        ],
        error: null,
      })
    })
    const c = useDashboardMantenimientos()
    await c.loadData()
    const rec = c.records.value[0]
    expect(rec?.vehicle_brand).toBe('')
    expect(rec?.vehicle_model).toBe('')
    expect(rec?.vehicle_year).toBeNull()
  })
})

// ─── handleSave ───────────────────────────────────────────────────────────

describe('handleSave', () => {
  it('does nothing when isFormValid is false', async () => {
    const c = useDashboardMantenimientos()
    await c.handleSave()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('creates record when editingId is null and form valid', async () => {
    mockDealerProfile.value = { id: 'dealer-1' }
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
    const c = useDashboardMantenimientos()
    c.form.vehicle_id = 'v-1'
    c.form.description = 'Oil change'
    c.form.cost = 250
    c.isFormValid.value = true // override one-shot computed
    c.editingId.value = null
    await c.handleSave()
    expect(c.successMsg.value).toBe('dashboard.tools.maintenance.created')
    expect(c.saving.value).toBe(false)
  })

  it('updates record when editingId is set', async () => {
    mockDealerProfile.value = { id: 'dealer-1' }
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
    const c = useDashboardMantenimientos()
    c.form.vehicle_id = 'v-1'
    c.form.description = 'Repair'
    c.form.cost = 500
    c.isFormValid.value = true
    c.editingId.value = 'rec-existing'
    await c.handleSave()
    expect(c.successMsg.value).toBe('dashboard.tools.maintenance.updated')
    expect(c.saving.value).toBe(false)
  })

  it('sets error when no dealer profile during save', async () => {
    mockDealerProfile.value = null
    const c = useDashboardMantenimientos()
    c.isFormValid.value = true
    await c.handleSave()
    expect(c.error.value).toBeTruthy()
    expect(c.saving.value).toBe(false)
  })

  it('sets error on insert failure', async () => {
    mockDealerProfile.value = { id: 'dealer-1' }
    mockFrom.mockImplementation(() => makeChain({ error: { message: 'Insert failed' } }))
    const c = useDashboardMantenimientos()
    c.form.vehicle_id = 'v-1'
    c.form.description = 'desc'
    c.form.cost = 100
    c.isFormValid.value = true
    c.editingId.value = null
    await c.handleSave()
    expect(c.error.value).toBe('Insert failed')
    expect(c.saving.value).toBe(false)
  })
})

// ─── handleDelete ─────────────────────────────────────────────────────────

describe('handleDelete', () => {
  it('does nothing when no deleteTarget', async () => {
    const c = useDashboardMantenimientos()
    await c.handleDelete()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('deletes record and updates local list', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: null }))
    const c = useDashboardMantenimientos()
    const record = makeRecord({ id: 'rec-delete' })
    c.records.value = [record]
    c.deleteTarget.value = record
    await c.handleDelete()
    expect(c.records.value).toHaveLength(0)
    expect(c.showDeleteModal.value).toBe(false)
    expect(c.deleteTarget.value).toBeNull()
    expect(c.successMsg.value).toBe('dashboard.tools.maintenance.deleted')
  })

  it('sets error on delete failure', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: { message: 'Delete failed' } }))
    const c = useDashboardMantenimientos()
    c.deleteTarget.value = makeRecord()
    await c.handleDelete()
    expect(c.error.value).toBe('Delete failed')
    expect(c.saving.value).toBe(false)
  })
})
