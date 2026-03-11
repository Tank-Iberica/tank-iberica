import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDashboardImportar } from '../../app/composables/dashboard/useDashboardImportar'

// ─── Stubs ────────────────────────────────────────────────────────────────────

const mockDealerProfile = { value: { id: 'dealer-1' } as unknown }

function makeChain(data: unknown = [], count = 0) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'order', 'select', 'insert'].forEach((m) => { chain[m] = () => chain })
  const resolved = { data, error: null, count }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDealerProfile.value = { id: 'dealer-1' }
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  vi.stubGlobal('ref', (v: unknown) => {
    let _v = v
    return { get value() { return _v }, set value(x) { _v = x } }
  })
  vi.stubGlobal('watch', vi.fn())
  vi.stubGlobal('useI18n', () => ({ t: (k: string, _opts?: unknown) => k }))
  vi.stubGlobal('useAuth', () => ({ userId: { value: 'user-1' } }))
  vi.stubGlobal('useRouter', () => ({ push: vi.fn() }))
  vi.stubGlobal('useDealerDashboard', () => ({
    dealerProfile: mockDealerProfile,
    loadDealer: vi.fn().mockResolvedValue(mockDealerProfile.value),
  }))
  vi.stubGlobal('useSubscriptionPlan', () => ({
    canPublish: vi.fn().mockReturnValue(true),
    fetchSubscription: vi.fn().mockResolvedValue(undefined),
  }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => makeChain([]),
  }))
  vi.stubGlobal('getVerticalSlug', () => 'tracciona')
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('step starts at 1', () => {
    const c = useDashboardImportar()
    expect(c.step.value).toBe(1)
  })

  it('file starts as null', () => {
    const c = useDashboardImportar()
    expect(c.file.value).toBeNull()
  })

  it('parsedRows starts as empty array', () => {
    const c = useDashboardImportar()
    expect(c.parsedRows.value).toHaveLength(0)
  })

  it('publishing starts as false', () => {
    const c = useDashboardImportar()
    expect(c.publishing.value).toBe(false)
  })

  it('progress starts at 0', () => {
    const c = useDashboardImportar()
    expect(c.progress.value).toBe(0)
  })

  it('error starts as null', () => {
    const c = useDashboardImportar()
    expect(c.error.value).toBeNull()
  })
})

// ─── validRowsCount / invalidRowsCount ───────────────────────────────────────

describe('validRowsCount / invalidRowsCount', () => {
  it('validRowsCount counts rows with isValid=true', () => {
    const c = useDashboardImportar()
    c.parsedRows.value = [
      { brand: 'A', model: 'M', year: 2020, km: 0, price: 1000, category: '', subcategory: '', description: '', location: '', isValid: true, errors: [] },
      { brand: 'B', model: 'N', year: 2021, km: 0, price: -1, category: '', subcategory: '', description: '', location: '', isValid: false, errors: ['bad price'] },
    ]
    expect(c.validRowsCount.value).toBe(1)
    expect(c.invalidRowsCount.value).toBe(1)
  })

  it('both return 0 when parsedRows is empty', () => {
    const c = useDashboardImportar()
    expect(c.validRowsCount.value).toBe(0)
    expect(c.invalidRowsCount.value).toBe(0)
  })
})

// ─── handleFileUpload ─────────────────────────────────────────────────────────

describe('handleFileUpload', () => {
  it('rejects xlsx files and sets error', () => {
    const c = useDashboardImportar()
    const fakeEvent = {
      target: { files: [{ name: 'data.xlsx' }] },
    } as unknown as Event
    c.handleFileUpload(fakeEvent)
    expect(c.error.value).toBeTruthy()
    expect(c.file.value).toBeNull()
  })

  it('rejects non-csv files and sets error', () => {
    const c = useDashboardImportar()
    const fakeEvent = {
      target: { files: [{ name: 'data.txt' }] },
    } as unknown as Event
    c.handleFileUpload(fakeEvent)
    expect(c.error.value).toBeTruthy()
    expect(c.file.value).toBeNull()
  })

  it('accepts csv files', () => {
    const c = useDashboardImportar()
    const csvFile = { name: 'data.csv' } as File
    const fakeEvent = {
      target: { files: [csvFile] },
    } as unknown as Event
    c.handleFileUpload(fakeEvent)
    expect(c.error.value).toBeNull()
    expect(c.file.value).toBe(csvFile)
  })

  it('does nothing when no files selected', () => {
    const c = useDashboardImportar()
    const fakeEvent = { target: { files: [] } } as unknown as Event
    c.handleFileUpload(fakeEvent)
    expect(c.file.value).toBeNull()
  })
})

// ─── parseFile ────────────────────────────────────────────────────────────────

describe('parseFile', () => {
  it('does nothing when file is null', async () => {
    const c = useDashboardImportar()
    await c.parseFile()
    expect(c.parsedRows.value).toHaveLength(0)
  })

  it('parses valid CSV and moves to step 2', async () => {
    const csvContent = 'marca;modelo;año;km;precio;categoría;subcategoría;descripción;ubicación\nSchmitz;S.KO;2018;350000;25000;semitrailers;refrigerated;Desc;Madrid'
    const mockFile = {
      name: 'data.csv',
      text: vi.fn().mockResolvedValue(csvContent),
    } as unknown as File
    const c = useDashboardImportar()
    c.file.value = mockFile
    await c.parseFile()
    expect(c.step.value).toBe(2)
    expect(c.parsedRows.value).toHaveLength(1)
    expect(c.parsedRows.value[0].brand).toBe('Schmitz')
  })

  it('sets error for file with only header row', async () => {
    const csvContent = 'marca;modelo;año'
    const mockFile = {
      name: 'data.csv',
      text: vi.fn().mockResolvedValue(csvContent),
    } as unknown as File
    const c = useDashboardImportar()
    c.file.value = mockFile
    await c.parseFile()
    expect(c.error.value).toBeTruthy()
    expect(c.step.value).toBe(1)
  })

  it('marks row as invalid when brand is missing', async () => {
    const csvContent = 'marca;modelo\n;FH'
    const mockFile = {
      name: 'data.csv',
      text: vi.fn().mockResolvedValue(csvContent),
    } as unknown as File
    const c = useDashboardImportar()
    c.file.value = mockFile
    await c.parseFile()
    expect(c.parsedRows.value[0].isValid).toBe(false)
    expect(c.parsedRows.value[0].errors.length).toBeGreaterThan(0)
  })
})

// ─── goToStep ─────────────────────────────────────────────────────────────────

describe('goToStep', () => {
  it('sets step to target value', () => {
    const c = useDashboardImportar()
    c.goToStep(2)
    expect(c.step.value).toBe(2)
  })

  it('can go back to step 1', () => {
    const c = useDashboardImportar()
    c.step.value = 2
    c.goToStep(1)
    expect(c.step.value).toBe(1)
  })
})

// ─── publishVehicles ──────────────────────────────────────────────────────────

describe('publishVehicles', () => {
  it('does nothing when no dealer profile', async () => {
    mockDealerProfile.value = null
    vi.stubGlobal('useDealerDashboard', () => ({
      dealerProfile: mockDealerProfile,
      loadDealer: vi.fn().mockResolvedValue(null),
    }))
    const c = useDashboardImportar()
    await c.publishVehicles(false)
    expect(c.publishing.value).toBe(false)
  })

  it('sets error when no valid rows', async () => {
    const c = useDashboardImportar()
    c.parsedRows.value = [
      { brand: '', model: '', year: null, km: null, price: null, category: '', subcategory: '', description: '', location: '', isValid: false, errors: ['missing brand'] },
    ]
    await c.publishVehicles(false)
    expect(c.error.value).toBeTruthy()
  })

  it('publishes valid rows and updates progress', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        insert: () => makeChain([]),
        select: () => makeChain([]),
        eq: () => ({
          eq: () => makeChain([], 0),
        }),
        order: () => makeChain([]),
      }),
    }))
    const c = useDashboardImportar()
    c.parsedRows.value = [
      { brand: 'Volvo', model: 'FH', year: 2020, km: 100000, price: 50000, category: 'trucks', subcategory: '', description: '', location: 'Madrid', isValid: true, errors: [] },
    ]
    await c.publishVehicles(false)
    expect(c.publishedCount.value).toBe(1)
    expect(c.progress.value).toBe(100)
  })

  it('counts errors when insert fails', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        insert: () => ({ error: { message: 'DB error' } }),
        select: () => makeChain([]),
        eq: () => ({ eq: () => makeChain([], 0) }),
        order: () => makeChain([]),
      }),
    }))
    const c = useDashboardImportar()
    c.parsedRows.value = [
      { brand: 'Volvo', model: 'FH', year: 2020, km: 0, price: 50000, category: '', subcategory: '', description: '', location: '', isValid: true, errors: [] },
    ]
    await c.publishVehicles(false)
    expect(c.errorCount.value).toBe(1)
  })
})

// ─── init ─────────────────────────────────────────────────────────────────────

describe('init', () => {
  it('calls loadFormData without throwing', async () => {
    const c = useDashboardImportar()
    await expect(c.init()).resolves.toBeUndefined()
  })
})
