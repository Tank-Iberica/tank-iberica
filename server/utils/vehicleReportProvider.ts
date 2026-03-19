/**
 * Vehicle report provider with adapter pattern (#56).
 *
 * Adapters: InfoCar primary → CarVertical fallback → mock dev.
 * Active adapter selected via VEHICLE_REPORT_PROVIDER env var.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface ITVRecord {
  date: string
  result: 'favorable' | 'desfavorable' | 'negativa' | 'unknown'
  station: string | null
  km: number | null
}

export interface OwnershipRecord {
  from: string
  to: string | null
  province: string | null
  type: 'private' | 'company' | 'leasing' | 'unknown'
}

export interface EncumbranceRecord {
  type: string
  entity: string | null
  date: string | null
  amount: number | null
}

export interface VehicleReport {
  plate: string
  vin: string | null
  brand: string | null
  model: string | null
  registrationDate: string | null
  itvHistory: ITVRecord[]
  kmHistory: Array<{ date: string; km: number }>
  ownershipHistory: OwnershipRecord[]
  encumbrances: EncumbranceRecord[]
  totalOwners: number
  lastITV: ITVRecord | null
  reportDate: string
  provider: string
}

export interface ReportAdapter {
  readonly name: string
  fetchReport(plate: string, vin?: string): Promise<VehicleReport>
  isAvailable(): Promise<boolean>
}

// ── InfoCar Adapter ──────────────────────────────────────────────────────────

export class InfoCarAdapter implements ReportAdapter {
  readonly name = 'infocar'
  private apiKey: string
  private apiUrl: string

  constructor(config?: { apiKey?: string; apiUrl?: string }) {
    this.apiKey = config?.apiKey || process.env.INFOCAR_API_KEY || ''
    this.apiUrl = config?.apiUrl || process.env.INFOCAR_API_URL || ''
  }

  async isAvailable(): Promise<boolean> {
    return !!(this.apiKey && this.apiUrl)
  }

  async fetchReport(plate: string, _vin?: string): Promise<VehicleReport> {
    const res = await fetch(`${this.apiUrl}/vehicles/${encodeURIComponent(plate)}/report`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      throw new Error(`InfoCar report failed: ${res.status}`)
    }

    const data = (await res.json()) as Record<string, unknown>
    return this.parseResponse(plate, data)
  }

  private parseResponse(plate: string, data: Record<string, unknown>): VehicleReport {
    const vehicle = (data.vehicle || {}) as Record<string, unknown>
    const inspections = (data.inspections || []) as Array<Record<string, unknown>>
    const owners = (data.owners || []) as Array<Record<string, unknown>>
    const charges = (data.charges || []) as Array<Record<string, unknown>>
    const kmRecords = (data.km_history || []) as Array<Record<string, unknown>>

    const itvHistory: ITVRecord[] = inspections.map((i) => ({
      date: String(i.date ?? ''),
      result: parseITVResult(String(i.result ?? '')),
      station: i.station ? String(i.station) : null,
      km: typeof i.km === 'number' ? i.km : null,
    }))

    const ownershipHistory: OwnershipRecord[] = owners.map((o) => ({
      from: String(o.from_date ?? ''),
      to: o.to_date ? String(o.to_date) : null,
      province: o.province ? String(o.province) : null,
      type: parseOwnerType(String(o.type ?? '')),
    }))

    const encumbrances: EncumbranceRecord[] = charges.map((c) => ({
      type: String(c.type ?? ''),
      entity: c.entity ? String(c.entity) : null,
      date: c.date ? String(c.date) : null,
      amount: typeof c.amount === 'number' ? c.amount : null,
    }))

    const kmHistory = kmRecords.map((k) => ({
      date: String(k.date ?? ''),
      km: Number(k.km ?? 0),
    }))

    return {
      plate,
      vin: vehicle.vin ? String(vehicle.vin) : null,
      brand: vehicle.brand ? String(vehicle.brand) : null,
      model: vehicle.model ? String(vehicle.model) : null,
      registrationDate: vehicle.registration_date ? String(vehicle.registration_date) : null,
      itvHistory,
      kmHistory,
      ownershipHistory,
      encumbrances,
      totalOwners: ownershipHistory.length,
      lastITV: itvHistory.length > 0 ? itvHistory[itvHistory.length - 1]! : null,
      reportDate: new Date().toISOString(),
      provider: this.name,
    }
  }
}

// ── CarVertical Adapter ──────────────────────────────────────────────────────

export class CarVerticalAdapter implements ReportAdapter {
  readonly name = 'carvertical'
  private apiKey: string
  private apiUrl: string

  constructor(config?: { apiKey?: string; apiUrl?: string }) {
    this.apiKey = config?.apiKey || process.env.CARVERTICAL_API_KEY || ''
    this.apiUrl = config?.apiUrl || process.env.CARVERTICAL_API_URL || ''
  }

  async isAvailable(): Promise<boolean> {
    return !!(this.apiKey && this.apiUrl)
  }

  async fetchReport(plate: string, vin?: string): Promise<VehicleReport> {
    const identifier = vin || plate
    const res = await fetch(`${this.apiUrl}/reports/${encodeURIComponent(identifier)}`, {
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      throw new Error(`CarVertical report failed: ${res.status}`)
    }

    const data = (await res.json()) as Record<string, unknown>
    return this.parseResponse(plate, data)
  }

  private parseResponse(plate: string, data: Record<string, unknown>): VehicleReport {
    const vehicle = (data.vehicle || {}) as Record<string, unknown>
    const mileage = (data.mileage_records || []) as Array<Record<string, unknown>>
    const ownership = (data.ownership || []) as Array<Record<string, unknown>>
    const damages = (data.damages || []) as Array<Record<string, unknown>>

    const kmHistory = mileage.map((m) => ({
      date: String(m.date ?? ''),
      km: Number(m.value ?? 0),
    }))

    const ownershipHistory: OwnershipRecord[] = ownership.map((o) => ({
      from: String(o.start_date ?? ''),
      to: o.end_date ? String(o.end_date) : null,
      province: o.region ? String(o.region) : null,
      type: parseOwnerType(String(o.owner_type ?? '')),
    }))

    const encumbrances: EncumbranceRecord[] = damages.map((d) => ({
      type: String(d.type ?? 'damage'),
      entity: d.source ? String(d.source) : null,
      date: d.date ? String(d.date) : null,
      amount: typeof d.cost === 'number' ? d.cost : null,
    }))

    return {
      plate,
      vin: vehicle.vin ? String(vehicle.vin) : null,
      brand: vehicle.make ? String(vehicle.make) : null,
      model: vehicle.model ? String(vehicle.model) : null,
      registrationDate: vehicle.first_registration ? String(vehicle.first_registration) : null,
      itvHistory: [], // CarVertical doesn't provide ITV data
      kmHistory,
      ownershipHistory,
      encumbrances,
      totalOwners: ownershipHistory.length,
      lastITV: null,
      reportDate: new Date().toISOString(),
      provider: this.name,
    }
  }
}

// ── Mock Dev Adapter ─────────────────────────────────────────────────────────

export class MockReportAdapter implements ReportAdapter {
  readonly name = 'mock'

  async isAvailable(): Promise<boolean> {
    return true
  }

  async fetchReport(plate: string, vin?: string): Promise<VehicleReport> {
    return {
      plate,
      vin: vin || 'WVWZZZ3CZWE123456',
      brand: 'Volvo',
      model: 'FH 500',
      registrationDate: '2020-03-15',
      itvHistory: [
        { date: '2022-03-10', result: 'favorable', station: 'ITV Madrid Sur', km: 120000 },
        { date: '2024-03-12', result: 'favorable', station: 'ITV Madrid Sur', km: 240000 },
      ],
      kmHistory: [
        { date: '2020-03-15', km: 0 },
        { date: '2022-03-10', km: 120000 },
        { date: '2024-03-12', km: 240000 },
      ],
      ownershipHistory: [
        { from: '2020-03-15', to: '2023-01-01', province: 'Madrid', type: 'company' },
        { from: '2023-01-01', to: null, province: 'Barcelona', type: 'company' },
      ],
      encumbrances: [],
      totalOwners: 2,
      lastITV: { date: '2024-03-12', result: 'favorable', station: 'ITV Madrid Sur', km: 240000 },
      reportDate: new Date().toISOString(),
      provider: this.name,
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseITVResult(raw: string): ITVRecord['result'] {
  const lower = raw.toLowerCase()
  if (lower.includes('favorable') && !lower.includes('des')) return 'favorable'
  if (lower.includes('desfavorable')) return 'desfavorable'
  if (lower.includes('negativ')) return 'negativa'
  return 'unknown'
}

function parseOwnerType(raw: string): OwnershipRecord['type'] {
  const lower = raw.toLowerCase()
  if (lower.includes('company') || lower.includes('empresa')) return 'company'
  if (lower.includes('leasing') || lower.includes('renting')) return 'leasing'
  if (lower.includes('private') || lower.includes('particular')) return 'private'
  return 'unknown'
}

export { parseITVResult, parseOwnerType }

// ── Factory ──────────────────────────────────────────────────────────────────

export type ReportProviderType = 'infocar' | 'carvertical' | 'mock'

/**
 * Create the appropriate report adapter.
 * Priority: explicit type → VEHICLE_REPORT_PROVIDER env → auto-detect → mock.
 */
export async function createReportAdapter(type?: ReportProviderType): Promise<ReportAdapter> {
  const providerType =
    type || (process.env.VEHICLE_REPORT_PROVIDER as ReportProviderType) || undefined

  if (providerType === 'infocar') {
    const adapter = new InfoCarAdapter()
    if (await adapter.isAvailable()) return adapter
    console.info('[vehicleReport] InfoCar configured but not available, falling back')
  }

  if (providerType === 'carvertical') {
    const adapter = new CarVerticalAdapter()
    if (await adapter.isAvailable()) return adapter
    console.info('[vehicleReport] CarVertical configured but not available, falling back')
  }

  // Auto-detect
  if (!providerType) {
    if (process.env.INFOCAR_API_KEY && process.env.INFOCAR_API_URL) {
      return new InfoCarAdapter()
    }
    if (process.env.CARVERTICAL_API_KEY && process.env.CARVERTICAL_API_URL) {
      return new CarVerticalAdapter()
    }
  }

  // Mock fallback (always available in dev)
  return new MockReportAdapter()
}
