import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  InfoCarAdapter,
  CarVerticalAdapter,
  MockReportAdapter,
  createReportAdapter,
  parseITVResult,
  parseOwnerType,
} from '../../../server/utils/vehicleReportProvider'

// ── Fetch mock ───────────────────────────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// ── Mock data ────────────────────────────────────────────────────────────────

const infocarResponse = {
  vehicle: { vin: 'VIN123', brand: 'Volvo', model: 'FH', registration_date: '2020-01-01' },
  inspections: [
    { date: '2022-06-01', result: 'Favorable', station: 'ITV Madrid', km: 100000 },
    { date: '2024-06-01', result: 'Desfavorable', station: 'ITV Barcelona', km: 200000 },
  ],
  owners: [
    { from_date: '2020-01-01', to_date: '2023-01-01', province: 'Madrid', type: 'empresa' },
    { from_date: '2023-01-01', to_date: null, province: 'Barcelona', type: 'particular' },
  ],
  charges: [{ type: 'leasing', entity: 'Bank SA', date: '2020-01-01', amount: 50000 }],
  km_history: [
    { date: '2022-06-01', km: 100000 },
    { date: '2024-06-01', km: 200000 },
  ],
}

const carverticalResponse = {
  vehicle: { vin: 'VIN456', make: 'MAN', model: 'TGX', first_registration: '2019-05-01' },
  mileage_records: [
    { date: '2021-01-01', value: 80000 },
    { date: '2023-01-01', value: 160000 },
  ],
  ownership: [
    { start_date: '2019-05-01', end_date: '2022-01-01', region: 'Valencia', owner_type: 'company' },
  ],
  damages: [{ type: 'collision', source: 'Insurance', date: '2021-06-01', cost: 5000 }],
}

// ── InfoCarAdapter ───────────────────────────────────────────────────────────

describe('InfoCarAdapter', () => {
  let adapter: InfoCarAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new InfoCarAdapter({
      apiKey: 'test-key',
      apiUrl: 'https://api.infocar.test',
    })
  })

  describe('isAvailable', () => {
    it('returns true when configured', async () => {
      expect(await adapter.isAvailable()).toBe(true)
    })

    it('returns false without apiKey', async () => {
      adapter = new InfoCarAdapter({ apiKey: '', apiUrl: 'http://x' })
      expect(await adapter.isAvailable()).toBe(false)
    })

    it('returns false without apiUrl', async () => {
      adapter = new InfoCarAdapter({ apiKey: 'key', apiUrl: '' })
      expect(await adapter.isAvailable()).toBe(false)
    })
  })

  describe('fetchReport', () => {
    it('parses InfoCar response into VehicleReport', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(infocarResponse),
      })

      const report = await adapter.fetchReport('1234ABC')

      expect(report.plate).toBe('1234ABC')
      expect(report.vin).toBe('VIN123')
      expect(report.brand).toBe('Volvo')
      expect(report.model).toBe('FH')
      expect(report.provider).toBe('infocar')
      expect(report.itvHistory).toHaveLength(2)
      expect(report.itvHistory[0].result).toBe('favorable')
      expect(report.itvHistory[1].result).toBe('desfavorable')
      expect(report.ownershipHistory).toHaveLength(2)
      expect(report.ownershipHistory[0].type).toBe('company')
      expect(report.ownershipHistory[1].type).toBe('private')
      expect(report.encumbrances).toHaveLength(1)
      expect(report.kmHistory).toHaveLength(2)
      expect(report.totalOwners).toBe(2)
      expect(report.lastITV).toBeTruthy()
      expect(report.lastITV!.date).toBe('2024-06-01')
    })

    it('throws on non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })
      await expect(adapter.fetchReport('9999ZZZ')).rejects.toThrow('InfoCar report failed: 404')
    })

    it('handles empty response fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            vehicle: {},
            inspections: [],
            owners: [],
            charges: [],
            km_history: [],
          }),
      })

      const report = await adapter.fetchReport('0000XXX')
      expect(report.itvHistory).toHaveLength(0)
      expect(report.ownershipHistory).toHaveLength(0)
      expect(report.encumbrances).toHaveLength(0)
      expect(report.lastITV).toBeNull()
      expect(report.totalOwners).toBe(0)
    })

    it('encodes plate in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            vehicle: {},
            inspections: [],
            owners: [],
            charges: [],
            km_history: [],
          }),
      })

      await adapter.fetchReport('ABC 123')
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('ABC%20123')
    })
  })
})

// ── CarVerticalAdapter ───────────────────────────────────────────────────────

describe('CarVerticalAdapter', () => {
  let adapter: CarVerticalAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new CarVerticalAdapter({
      apiKey: 'cv-key',
      apiUrl: 'https://api.carvertical.test',
    })
  })

  describe('isAvailable', () => {
    it('returns true when configured', async () => {
      expect(await adapter.isAvailable()).toBe(true)
    })

    it('returns false without both keys', async () => {
      adapter = new CarVerticalAdapter({ apiKey: '', apiUrl: '' })
      expect(await adapter.isAvailable()).toBe(false)
    })
  })

  describe('fetchReport', () => {
    it('parses CarVertical response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(carverticalResponse),
      })

      const report = await adapter.fetchReport('5678DEF', 'VIN456')

      expect(report.plate).toBe('5678DEF')
      expect(report.vin).toBe('VIN456')
      expect(report.brand).toBe('MAN')
      expect(report.model).toBe('TGX')
      expect(report.provider).toBe('carvertical')
      expect(report.kmHistory).toHaveLength(2)
      expect(report.ownershipHistory).toHaveLength(1)
      expect(report.ownershipHistory[0].type).toBe('company')
      expect(report.encumbrances).toHaveLength(1)
      expect(report.itvHistory).toHaveLength(0) // CarVertical no ITV
      expect(report.lastITV).toBeNull()
    })

    it('uses VIN as identifier when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(carverticalResponse),
      })

      await adapter.fetchReport('PLATE', 'VIN456')
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('VIN456')
    })

    it('falls back to plate when no VIN', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(carverticalResponse),
      })

      await adapter.fetchReport('1234ABC')
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('1234ABC')
    })

    it('throws on failed request', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
      await expect(adapter.fetchReport('XXX')).rejects.toThrow('CarVertical report failed')
    })
  })
})

// ── MockReportAdapter ────────────────────────────────────────────────────────

describe('MockReportAdapter', () => {
  let adapter: MockReportAdapter

  beforeEach(() => {
    adapter = new MockReportAdapter()
  })

  it('is always available', async () => {
    expect(await adapter.isAvailable()).toBe(true)
  })

  it('returns mock data with correct structure', async () => {
    const report = await adapter.fetchReport('TEST123')

    expect(report.plate).toBe('TEST123')
    expect(report.vin).toBeTruthy()
    expect(report.brand).toBe('Volvo')
    expect(report.itvHistory.length).toBeGreaterThan(0)
    expect(report.kmHistory.length).toBeGreaterThan(0)
    expect(report.ownershipHistory.length).toBeGreaterThan(0)
    expect(report.totalOwners).toBe(2)
    expect(report.lastITV).toBeTruthy()
    expect(report.provider).toBe('mock')
  })

  it('uses provided VIN', async () => {
    const report = await adapter.fetchReport('PLATE', 'CUSTOM-VIN')
    expect(report.vin).toBe('CUSTOM-VIN')
  })

  it('has name mock', () => {
    expect(adapter.name).toBe('mock')
  })
})

// ── Helper functions ─────────────────────────────────────────────────────────

describe('parseITVResult', () => {
  it('parses favorable', () => {
    expect(parseITVResult('Favorable')).toBe('favorable')
    expect(parseITVResult('FAVORABLE')).toBe('favorable')
  })

  it('parses desfavorable', () => {
    expect(parseITVResult('Desfavorable')).toBe('desfavorable')
    expect(parseITVResult('DESFAVORABLE')).toBe('desfavorable')
  })

  it('parses negativa', () => {
    expect(parseITVResult('Negativa')).toBe('negativa')
    expect(parseITVResult('negative')).toBe('negativa')
  })

  it('returns unknown for unrecognized', () => {
    expect(parseITVResult('other')).toBe('unknown')
    expect(parseITVResult('')).toBe('unknown')
  })
})

describe('parseOwnerType', () => {
  it('parses company types', () => {
    expect(parseOwnerType('company')).toBe('company')
    expect(parseOwnerType('empresa')).toBe('company')
  })

  it('parses private types', () => {
    expect(parseOwnerType('private')).toBe('private')
    expect(parseOwnerType('particular')).toBe('private')
  })

  it('parses leasing types', () => {
    expect(parseOwnerType('leasing')).toBe('leasing')
    expect(parseOwnerType('renting')).toBe('leasing')
  })

  it('returns unknown for unrecognized', () => {
    expect(parseOwnerType('other')).toBe('unknown')
    expect(parseOwnerType('')).toBe('unknown')
  })
})

// ── createReportAdapter factory ──────────────────────────────────────────────

describe('createReportAdapter', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  it('returns mock when no providers configured', async () => {
    delete process.env.VEHICLE_REPORT_PROVIDER
    delete process.env.INFOCAR_API_KEY
    delete process.env.CARVERTICAL_API_KEY

    const adapter = await createReportAdapter()
    expect(adapter.name).toBe('mock')
  })

  it('returns infocar when explicitly set', async () => {
    process.env.INFOCAR_API_KEY = 'key'
    process.env.INFOCAR_API_URL = 'http://api.infocar'

    const adapter = await createReportAdapter('infocar')
    expect(adapter.name).toBe('infocar')
  })

  it('returns carvertical when explicitly set', async () => {
    process.env.CARVERTICAL_API_KEY = 'key'
    process.env.CARVERTICAL_API_URL = 'http://api.cv'

    const adapter = await createReportAdapter('carvertical')
    expect(adapter.name).toBe('carvertical')
  })

  it('auto-detects infocar from env', async () => {
    process.env.INFOCAR_API_KEY = 'key'
    process.env.INFOCAR_API_URL = 'http://api.infocar'

    const adapter = await createReportAdapter()
    expect(adapter.name).toBe('infocar')
  })

  it('auto-detects carvertical from env', async () => {
    delete process.env.INFOCAR_API_KEY
    process.env.CARVERTICAL_API_KEY = 'key'
    process.env.CARVERTICAL_API_URL = 'http://api.cv'

    const adapter = await createReportAdapter()
    expect(adapter.name).toBe('carvertical')
  })

  it('falls back to mock when infocar unavailable', async () => {
    process.env.INFOCAR_API_KEY = ''
    process.env.INFOCAR_API_URL = ''

    const adapter = await createReportAdapter('infocar')
    expect(adapter.name).toBe('mock')
  })
})
