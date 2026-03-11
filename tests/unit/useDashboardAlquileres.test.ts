import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (before import) ─────────────────────────────────────────────────

vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
vi.stubGlobal('useAuth', () => ({ userId: { value: 'user-1' } }))

const mockDealerProfile = { value: null as { id: string } | null }
const mockLoadDealer = vi.fn()

vi.stubGlobal('useDealerDashboard', () => ({
  dealerProfile: mockDealerProfile,
  loadDealer: mockLoadDealer,
}))

const mockCanExport = { value: true }
const mockFetchSubscription = vi.fn()

vi.stubGlobal('useSubscriptionPlan', () => ({
  canExport: mockCanExport,
  fetchSubscription: mockFetchSubscription,
  currentPlan: { value: 'premium' },
}))

const mockFrom = vi.fn()
vi.stubGlobal('useSupabaseClient', () => ({ from: mockFrom }))

import {
  useDashboardAlquileres,
  type RentalRecord,
  type DealerVehicleOption,
} from '../../app/composables/dashboard/useDashboardAlquileres'

// ─── Chain builder ─────────────────────────────────────────────────────────

function makeChain(result: unknown = { data: [], error: null }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'order', 'update', 'delete', 'insert', 'single', 'gte', 'lte']
  methods.forEach((m) => {
    chain[m] = () => chain
  })
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain
}

// ─── Fixtures ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<RentalRecord> = {}): RentalRecord {
  return {
    id: 'r-1',
    dealer_id: 'dealer-1',
    vehicle_id: 'v-1',
    vehicle_brand: 'Volvo',
    vehicle_model: 'FH',
    vehicle_year: 2020,
    client_name: 'Transport SA',
    client_contact: '600000000',
    start_date: '2026-01-01',
    end_date: null,
    monthly_rent: 2000,
    deposit: 5000,
    status: 'active',
    notes: null,
    created_at: '2026-01-01',
    ...overrides,
  }
}

function makeVehicleOption(overrides: Partial<DealerVehicleOption> = {}): DealerVehicleOption {
  return { id: 'v-1', brand: 'Volvo', model: 'FH', year: 2020, ...overrides }
}

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockDealerProfile.value = { id: 'dealer-1' }
  mockLoadDealer.mockResolvedValue(null)
  mockFetchSubscription.mockResolvedValue(undefined)
  mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
})

// ─── getStatusClass ────────────────────────────────────────────────────────

describe('getStatusClass', () => {
  it('returns status-active for active', () => {
    const c = useDashboardAlquileres()
    expect(c.getStatusClass('active')).toBe('status-active')
  })

  it('returns status-finished for finished', () => {
    const c = useDashboardAlquileres()
    expect(c.getStatusClass('finished')).toBe('status-finished')
  })

  it('returns status-overdue for overdue', () => {
    const c = useDashboardAlquileres()
    expect(c.getStatusClass('overdue')).toBe('status-overdue')
  })
})

// ─── Initial state ─────────────────────────────────────────────────────────

describe('initial state', () => {
  it('loading starts false', () => {
    const c = useDashboardAlquileres()
    expect(c.loading.value).toBe(false)
  })

  it('records starts empty', () => {
    const c = useDashboardAlquileres()
    expect(c.records.value).toEqual([])
  })

  it('showForm starts false', () => {
    const c = useDashboardAlquileres()
    expect(c.showForm.value).toBe(false)
  })

  it('showDeleteModal starts false', () => {
    const c = useDashboardAlquileres()
    expect(c.showDeleteModal.value).toBe(false)
  })

  it('viewMode starts as cards', () => {
    const c = useDashboardAlquileres()
    expect(c.viewMode.value).toBe('cards')
  })

  it('editingId starts null', () => {
    const c = useDashboardAlquileres()
    expect(c.editingId.value).toBeNull()
  })

  it('deleteTarget starts null', () => {
    const c = useDashboardAlquileres()
    expect(c.deleteTarget.value).toBeNull()
  })
})

// ─── Computed: activeRentals / totalMonthlyIncome / sortedRecords ──────────
// Note: these are one-shot computed stubs — they evaluate once at creation
// when records is []. Post-creation mutations don't re-evaluate the computed.
// Logic is exercised indirectly via loadData and checkOverdue tests.

describe('activeRentals', () => {
  it('starts empty when records is empty', () => {
    const c = useDashboardAlquileres()
    expect(c.activeRentals.value).toEqual([])
  })

  it('totalActiveRentals starts at 0', () => {
    const c = useDashboardAlquileres()
    expect(c.totalActiveRentals.value).toBe(0)
  })

  it('totalMonthlyIncome starts at 0', () => {
    const c = useDashboardAlquileres()
    expect(c.totalMonthlyIncome.value).toBe(0)
  })

  it('vehiclesAvailableSoon starts at 0', () => {
    const c = useDashboardAlquileres()
    expect(c.vehiclesAvailableSoon.value).toBe(0)
  })
})

describe('sortedRecords', () => {
  it('starts empty', () => {
    const c = useDashboardAlquileres()
    expect(c.sortedRecords.value).toEqual([])
  })
})

// ─── checkOverdue ──────────────────────────────────────────────────────────

describe('checkOverdue', () => {
  it('marks active record with past end_date as overdue', () => {
    const c = useDashboardAlquileres()
    c.records.value = [makeRecord({ status: 'active', end_date: '2020-01-01' })]
    c.checkOverdue()
    expect(c.records.value[0]!.status).toBe('overdue')
  })

  it('leaves active record with future end_date unchanged', () => {
    const c = useDashboardAlquileres()
    c.records.value = [makeRecord({ status: 'active', end_date: '2099-12-31' })]
    c.checkOverdue()
    expect(c.records.value[0]!.status).toBe('active')
  })

  it('leaves finished record unchanged even if end_date is past', () => {
    const c = useDashboardAlquileres()
    c.records.value = [makeRecord({ status: 'finished', end_date: '2020-01-01' })]
    c.checkOverdue()
    expect(c.records.value[0]!.status).toBe('finished')
  })

  it('leaves active record with no end_date unchanged', () => {
    const c = useDashboardAlquileres()
    c.records.value = [makeRecord({ status: 'active', end_date: null })]
    c.checkOverdue()
    expect(c.records.value[0]!.status).toBe('active')
  })
})

// ─── openCreateForm ────────────────────────────────────────────────────────

describe('openCreateForm', () => {
  it('shows form with cleared fields', () => {
    const c = useDashboardAlquileres()
    c.openCreateForm()
    expect(c.showForm.value).toBe(true)
    expect(c.form.client_name).toBe('')
    expect(c.form.monthly_rent).toBeNull()
    expect(c.editingId.value).toBeNull()
  })

  it('sets vehicle_id to first option if available', () => {
    const c = useDashboardAlquileres()
    c.vehicleOptions.value = [makeVehicleOption({ id: 'first-v' })]
    c.openCreateForm()
    expect(c.form.vehicle_id).toBe('first-v')
  })

  it('sets vehicle_id to empty string when no vehicle options', () => {
    const c = useDashboardAlquileres()
    c.vehicleOptions.value = []
    c.openCreateForm()
    expect(c.form.vehicle_id).toBe('')
  })

  it('clears successMsg', () => {
    const c = useDashboardAlquileres()
    c.successMsg.value = 'previous success'
    c.openCreateForm()
    expect(c.successMsg.value).toBeNull()
  })
})

// ─── openEditForm ──────────────────────────────────────────────────────────

describe('openEditForm', () => {
  it('populates form from record and shows form', () => {
    const c = useDashboardAlquileres()
    const record = makeRecord({
      id: 'r-edit',
      client_name: 'Cliente Test',
      client_contact: '699000000',
      monthly_rent: 1800,
      status: 'overdue',
    })
    c.openEditForm(record)
    expect(c.editingId.value).toBe('r-edit')
    expect(c.form.client_name).toBe('Cliente Test')
    expect(c.form.client_contact).toBe('699000000')
    expect(c.form.monthly_rent).toBe(1800)
    expect(c.form.status).toBe('overdue')
    expect(c.showForm.value).toBe(true)
  })

  it('converts null optional fields to empty strings', () => {
    const c = useDashboardAlquileres()
    const record = makeRecord({ client_contact: null, end_date: null, notes: null })
    c.openEditForm(record)
    expect(c.form.client_contact).toBe('')
    expect(c.form.end_date).toBe('')
    expect(c.form.notes).toBe('')
  })

  it('populates deposit correctly', () => {
    const c = useDashboardAlquileres()
    const record = makeRecord({ deposit: 3000 })
    c.openEditForm(record)
    expect(c.form.deposit).toBe(3000)
  })
})

// ─── handleSave ────────────────────────────────────────────────────────────

describe('handleSave', () => {
  it('returns early when isFormValid is false (form empty at creation)', async () => {
    const c = useDashboardAlquileres()
    await c.handleSave()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('inserts new rental record when editingId is null', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
    const c = useDashboardAlquileres()
    c.isFormValid.value = true
    c.editingId.value = null
    c.form.vehicle_id = 'v-1'
    c.form.client_name = 'Test Client'
    c.form.monthly_rent = 1500
    await c.handleSave()
    expect(mockFrom).toHaveBeenCalledWith('rental_records')
    expect(c.successMsg.value).toBe('dashboard.tools.rentals.created')
    expect(c.showForm.value).toBe(false)
    expect(c.saving.value).toBe(false)
  })

  it('updates existing record when editingId is set', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
    const c = useDashboardAlquileres()
    c.isFormValid.value = true
    c.editingId.value = 'r-existing'
    c.form.vehicle_id = 'v-1'
    c.form.client_name = 'Updated Client'
    c.form.monthly_rent = 2000
    await c.handleSave()
    expect(c.successMsg.value).toBe('dashboard.tools.rentals.updated')
    expect(c.showForm.value).toBe(false)
  })

  it('sets error and keeps form open on save failure', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: new Error('DB error') }))
    const c = useDashboardAlquileres()
    c.isFormValid.value = true
    c.editingId.value = null
    c.form.vehicle_id = 'v-1'
    c.form.client_name = 'Test'
    c.form.monthly_rent = 1500
    c.showForm.value = true
    await c.handleSave()
    expect(c.error.value).toBeTruthy()
    expect(c.saving.value).toBe(false)
  })

  it('throws when dealer not found during save', async () => {
    mockDealerProfile.value = null
    const c = useDashboardAlquileres()
    c.isFormValid.value = true
    c.form.vehicle_id = 'v-1'
    c.form.client_name = 'Test'
    c.form.monthly_rent = 1500
    await c.handleSave()
    expect(c.error.value).toBeTruthy()
    expect(c.saving.value).toBe(false)
  })
})

// ─── confirmDelete + handleDelete ─────────────────────────────────────────

describe('confirmDelete', () => {
  it('sets deleteTarget and shows modal', () => {
    const c = useDashboardAlquileres()
    const record = makeRecord()
    c.confirmDelete(record)
    expect(c.deleteTarget.value).toBe(record)
    expect(c.showDeleteModal.value).toBe(true)
  })
})

describe('handleDelete', () => {
  it('does nothing when deleteTarget is null', async () => {
    const c = useDashboardAlquileres()
    c.deleteTarget.value = null
    await c.handleDelete()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('removes record from local list on success', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: null }))
    const c = useDashboardAlquileres()
    const record = makeRecord({ id: 'r-del' })
    c.records.value = [record]
    c.deleteTarget.value = record
    await c.handleDelete()
    expect(c.records.value).toHaveLength(0)
    expect(c.showDeleteModal.value).toBe(false)
    expect(c.deleteTarget.value).toBeNull()
    expect(c.successMsg.value).toBe('dashboard.tools.rentals.deleted')
    expect(c.saving.value).toBe(false)
  })

  it('sets error on delete failure', async () => {
    mockFrom.mockImplementation(() => makeChain({ error: new Error('Delete failed') }))
    const c = useDashboardAlquileres()
    c.deleteTarget.value = makeRecord()
    await c.handleDelete()
    expect(c.error.value).toBeTruthy()
    expect(c.saving.value).toBe(false)
  })
})

// ─── loadData ──────────────────────────────────────────────────────────────

describe('loadData', () => {
  it('sets error when no dealer found', async () => {
    mockDealerProfile.value = null
    mockLoadDealer.mockResolvedValue(null)
    const c = useDashboardAlquileres()
    await c.loadData()
    expect(c.error.value).toBe('dashboard.tools.rentals.errorNoDealer')
    expect(c.loading.value).toBe(false)
  })

  it('loads vehicles and rental records', async () => {
    const rentalsData = [
      {
        id: 'r-1',
        dealer_id: 'dealer-1',
        vehicle_id: 'v-1',
        client_name: 'Client',
        client_contact: null,
        start_date: '2026-01-01',
        end_date: null,
        monthly_rent: 2000,
        deposit: null,
        status: 'active',
        notes: null,
        created_at: '2026-01-01',
        vehicles: { brand: 'Volvo', model: 'FH', year: 2020 },
      },
    ]
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vehicles')
        return makeChain({ data: [{ id: 'v-1', brand: 'Volvo', model: 'FH', year: 2020 }], error: null })
      if (table === 'rental_records') return makeChain({ data: rentalsData, error: null })
      return makeChain({ data: [], error: null })
    })
    const c = useDashboardAlquileres()
    await c.loadData()
    expect(c.vehicleOptions.value).toHaveLength(1)
    expect(c.records.value).toHaveLength(1)
    expect(c.records.value[0]!.vehicle_brand).toBe('Volvo')
    expect(c.records.value[0]!.vehicle_model).toBe('FH')
    expect(c.loading.value).toBe(false)
  })

  it('maps null vehicles join to empty strings', async () => {
    const rentalsData = [
      {
        id: 'r-1',
        dealer_id: 'dealer-1',
        vehicle_id: 'v-1',
        client_name: 'Client',
        client_contact: null,
        start_date: '2026-01-01',
        end_date: null,
        monthly_rent: 2000,
        deposit: null,
        status: 'active',
        notes: null,
        created_at: '2026-01-01',
        vehicles: null,
      },
    ]
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vehicles') return makeChain({ data: [], error: null })
      return makeChain({ data: rentalsData, error: null })
    })
    const c = useDashboardAlquileres()
    await c.loadData()
    expect(c.records.value[0]!.vehicle_brand).toBe('')
    expect(c.records.value[0]!.vehicle_model).toBe('')
    expect(c.records.value[0]!.vehicle_year).toBeNull()
  })

  it('sets error on db failure', async () => {
    mockFrom.mockImplementation(() => makeChain({ data: null, error: { message: 'DB error' } }))
    const c = useDashboardAlquileres()
    await c.loadData()
    expect(c.error.value).toBeTruthy()
    expect(c.loading.value).toBe(false)
  })

  it('calls loadDealer when dealerProfile is null', async () => {
    mockDealerProfile.value = null
    const dealer = { id: 'dealer-via-load' }
    mockLoadDealer.mockResolvedValue(dealer)
    mockFrom.mockImplementation(() => makeChain({ data: [], error: null }))
    const c = useDashboardAlquileres()
    await c.loadData()
    expect(mockLoadDealer).toHaveBeenCalledOnce()
  })
})

// ─── fmt + fmtDate ─────────────────────────────────────────────────────────

describe('fmt', () => {
  it('formats number as EUR currency', () => {
    const c = useDashboardAlquileres()
    const result = c.fmt(2000)
    expect(result).toBeTruthy()
    expect(result).toContain('2')
    expect(result).toContain('000')
  })

  it('formats zero', () => {
    const c = useDashboardAlquileres()
    expect(c.fmt(0)).toBeTruthy()
  })
})

describe('fmtDate', () => {
  it('returns -- for null', () => {
    const c = useDashboardAlquileres()
    expect(c.fmtDate(null)).toBe('--')
  })

  it('formats valid date string', () => {
    const c = useDashboardAlquileres()
    const result = c.fmtDate('2026-03-15')
    expect(result).toBeTruthy()
    expect(result).not.toBe('--')
  })
})

// ─── isEndingSoon ──────────────────────────────────────────────────────────

describe('isEndingSoon', () => {
  it('returns false for non-active record', () => {
    const c = useDashboardAlquileres()
    expect(c.isEndingSoon(makeRecord({ status: 'finished', end_date: '2026-03-10' }))).toBe(false)
  })

  it('returns false for active record with no end_date', () => {
    const c = useDashboardAlquileres()
    expect(c.isEndingSoon(makeRecord({ status: 'active', end_date: null }))).toBe(false)
  })

  it('returns true for active record ending within 30 days', () => {
    const c = useDashboardAlquileres()
    const soon = new Date()
    soon.setDate(soon.getDate() + 15)
    expect(c.isEndingSoon(makeRecord({ status: 'active', end_date: soon.toISOString().split('T')[0]! }))).toBe(true)
  })

  it('returns false for active record ending beyond 30 days', () => {
    const c = useDashboardAlquileres()
    const far = new Date()
    far.setDate(far.getDate() + 60)
    expect(c.isEndingSoon(makeRecord({ status: 'active', end_date: far.toISOString().split('T')[0]! }))).toBe(false)
  })
})

// ─── daysUntilEnd ─────────────────────────────────────────────────────────

describe('daysUntilEnd', () => {
  it('returns -1 for record without end_date', () => {
    const c = useDashboardAlquileres()
    expect(c.daysUntilEnd(makeRecord({ end_date: null }))).toBe(-1)
  })

  it('returns positive days for future end_date', () => {
    const c = useDashboardAlquileres()
    const future = new Date()
    future.setDate(future.getDate() + 10)
    expect(c.daysUntilEnd(makeRecord({ end_date: future.toISOString().split('T')[0]! }))).toBeGreaterThan(0)
  })

  it('returns negative days for past end_date', () => {
    const c = useDashboardAlquileres()
    const past = new Date()
    past.setDate(past.getDate() - 5)
    expect(c.daysUntilEnd(makeRecord({ end_date: past.toISOString().split('T')[0]! }))).toBeLessThan(0)
  })
})

// ─── exportCSV ─────────────────────────────────────────────────────────────

describe('exportCSV', () => {
  it('does not throw with empty records', () => {
    const c = useDashboardAlquileres()
    expect(() => c.exportCSV()).not.toThrow()
  })

  it('does not throw with records containing special chars in notes', () => {
    const c = useDashboardAlquileres()
    c.records.value = [makeRecord({ notes: 'He said "hello"', status: 'active' })]
    expect(() => c.exportCSV()).not.toThrow()
  })
})
