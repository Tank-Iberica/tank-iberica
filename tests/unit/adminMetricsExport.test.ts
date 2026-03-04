import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportMetricsCSV, type MetricsExportData } from '~/utils/adminMetricsExport'

// ─── Mock browser download APIs ──────────────────────────────────────────────
// Capture CSV content by intercepting Blob constructor

let lastCsvContent = ''

vi.stubGlobal('Blob', function MockBlob(parts: BlobPart[], _options?: BlobPropertyBag) {
  lastCsvContent = (parts as string[]).join('')
})

// Spy on URL static methods without replacing the URL constructor
vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

// In happy-dom, document.createElement('a').click() is a no-op, which is fine.

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeData(overrides: Partial<MetricsExportData> = {}): MetricsExportData {
  return {
    kpiSummary: {
      monthlyRevenue: { current: 1000000, previousMonth: 900000, changePercent: 11.1 },
      activeVehicles: { current: 250, previousMonth: 230, changePercent: 8.7 },
      activeDealers: { current: 45, previousMonth: 42, changePercent: 7.1 },
      monthlyLeads: { current: 120, previousMonth: 100, changePercent: 20 },
    },
    revenueSeries: [
      { month: '2026-01', revenue: 950000, tax: 190000 },
      { month: '2026-02', revenue: 1000000, tax: 200000 },
    ],
    vehicleActivity: [
      { month: '2026-01', published: 80, sold: 30 },
      { month: '2026-02', published: 90, sold: 35 },
    ],
    leadsSeries: [
      { month: '2026-01', leads: 100 },
      { month: '2026-02', leads: 120 },
    ],
    topDealers: [
      { dealerId: 'dealer-1', name: 'Trucks SL', vehicleCount: 50, leadCount: 80 },
      { dealerId: 'dealer-2', name: 'Heavy Machinery', vehicleCount: 30, leadCount: 45 },
    ],
    topVehicles: [
      { vehicleId: 'v-001', title: 'Volvo FH16 2020', views: 1200 },
      { vehicleId: 'v-002', title: 'Scania R500', views: 980 },
    ],
    conversionFunnel: { visits: 5000, vehicleViews: 2000, leads: 200, sales: 40 },
    churnRate: { totalDealers: 45, cancelledDealers: 3, churnRate: 6.67 },
    ...overrides,
  }
}

beforeEach(() => {
  lastCsvContent = ''
  vi.clearAllMocks()
})

// ─── UTF-8 BOM ────────────────────────────────────────────────────────────────

describe('exportMetricsCSV — UTF-8 BOM', () => {
  it('starts with UTF-8 BOM for Excel compatibility', () => {
    exportMetricsCSV(makeData())
    expect(lastCsvContent.startsWith('\uFEFF')).toBe(true)
  })
})

// ─── CSV structure: KPI section ───────────────────────────────────────────────

describe('exportMetricsCSV — KPI section', () => {
  it('includes KPI header row', () => {
    exportMetricsCSV(makeData())
    expect(lastCsvContent).toContain('"Metric","Current","Previous Month","Change %"')
  })

  it('includes Monthly Revenue row with correct values', () => {
    exportMetricsCSV(makeData())
    expect(lastCsvContent).toContain('"Monthly Revenue (cents)","1000000","900000","11.1"')
  })

  it('includes Active Vehicles row', () => {
    exportMetricsCSV(makeData())
    expect(lastCsvContent).toContain('"Active Vehicles","250","230","8.7"')
  })

  it('includes Active Dealers row', () => {
    exportMetricsCSV(makeData())
    expect(lastCsvContent).toContain('"Active Dealers","45","42","7.1"')
  })

  it('includes Monthly Leads row', () => {
    exportMetricsCSV(makeData())
    expect(lastCsvContent).toContain('"Monthly Leads","120","100","20"')
  })
})

// ─── CSV structure: Revenue series ───────────────────────────────────────────

describe('exportMetricsCSV — revenue series section', () => {
  it('includes Revenue series header', () => {
    exportMetricsCSV(makeData())
    expect(lastCsvContent).toContain('"Month","Revenue (cents)","Tax (cents)"')
  })

  it('includes revenue data rows', () => {
    exportMetricsCSV(makeData())
    expect(lastCsvContent).toContain('"2026-01","950000","190000"')
    expect(lastCsvContent).toContain('"2026-02","1000000","200000"')
  })
})

// ─── CSV structure: Vehicle activity ─────────────────────────────────────────

describe('exportMetricsCSV — vehicle activity section', () => {
  it('includes vehicle activity header', () => {
    exportMetricsCSV(makeData())
    expect(lastCsvContent).toContain('"Month","Published","Sold"')
  })

  it('includes vehicle activity data rows', () => {
    exportMetricsCSV(makeData())
    expect(lastCsvContent).toContain('"2026-01","80","30"')
    expect(lastCsvContent).toContain('"2026-02","90","35"')
  })
})

// ─── CSV structure: Leads series ─────────────────────────────────────────────

describe('exportMetricsCSV — leads series section', () => {
  it('includes leads header', () => {
    exportMetricsCSV(makeData())
    expect(lastCsvContent).toContain('"Month","Leads"')
  })

  it('includes leads data rows', () => {
    exportMetricsCSV(makeData())
    expect(lastCsvContent).toContain('"2026-01","100"')
    expect(lastCsvContent).toContain('"2026-02","120"')
  })
})

// ─── CSV structure: Top dealers ───────────────────────────────────────────────

describe('exportMetricsCSV — top dealers section', () => {
  it('includes dealers header', () => {
    exportMetricsCSV(makeData())
    expect(lastCsvContent).toContain('"Dealer ID","Name","Vehicle Count","Lead Count"')
  })

  it('includes dealer data rows', () => {
    exportMetricsCSV(makeData())
    expect(lastCsvContent).toContain('"dealer-1","Trucks SL","50","80"')
    expect(lastCsvContent).toContain('"dealer-2","Heavy Machinery","30","45"')
  })
})

// ─── CSV structure: Top vehicles ─────────────────────────────────────────────

describe('exportMetricsCSV — top vehicles section', () => {
  it('includes vehicles header', () => {
    exportMetricsCSV(makeData())
    expect(lastCsvContent).toContain('"Vehicle ID","Title","Views"')
  })

  it('includes vehicle data rows', () => {
    exportMetricsCSV(makeData())
    expect(lastCsvContent).toContain('"v-001","Volvo FH16 2020","1200"')
  })
})

// ─── CSV structure: Conversion funnel ────────────────────────────────────────

describe('exportMetricsCSV — conversion funnel section', () => {
  it('includes funnel header', () => {
    exportMetricsCSV(makeData())
    expect(lastCsvContent).toContain('"Funnel Stage","Count"')
  })

  it('includes all funnel stages', () => {
    exportMetricsCSV(makeData())
    expect(lastCsvContent).toContain('"Visits (total views)","5000"')
    expect(lastCsvContent).toContain('"Vehicle Views (unique vehicles)","2000"')
    expect(lastCsvContent).toContain('"Leads","200"')
    expect(lastCsvContent).toContain('"Sales","40"')
  })
})

// ─── CSV structure: Churn metrics ────────────────────────────────────────────

describe('exportMetricsCSV — churn section', () => {
  it('includes churn header', () => {
    exportMetricsCSV(makeData())
    expect(lastCsvContent).toContain('"Churn Metric","Value"')
  })

  it('includes churn data rows', () => {
    exportMetricsCSV(makeData())
    expect(lastCsvContent).toContain('"Total Dealers (subscriptions)","45"')
    expect(lastCsvContent).toContain('"Cancelled Dealers","3"')
    expect(lastCsvContent).toContain('"Churn Rate (%)","6.67"')
  })
})

// ─── CSV escaping ─────────────────────────────────────────────────────────────

describe('exportMetricsCSV — CSV escaping', () => {
  it('escapes double quotes inside cell values', () => {
    const data = makeData({
      topDealers: [
        { dealerId: 'dealer-x', name: 'He said "Hello"', vehicleCount: 1, leadCount: 1 },
      ],
    })
    exportMetricsCSV(data)
    // Double quotes should be escaped as ""
    expect(lastCsvContent).toContain('He said ""Hello""')
  })

  it('wraps all cells in double quotes', () => {
    exportMetricsCSV(makeData())
    // Every value in CSV should be wrapped in "..."
    const lines = lastCsvContent.replace('\uFEFF', '').split('\n').filter(Boolean)
    for (const line of lines) {
      // Each cell should start with " and end with "
      const cells = line.split(',')
      for (const cell of cells) {
        expect(cell.startsWith('"')).toBe(true)
        expect(cell.endsWith('"')).toBe(true)
      }
    }
  })
})

// ─── Download trigger ─────────────────────────────────────────────────────────

describe('exportMetricsCSV — download trigger', () => {
  it('calls URL.createObjectURL once', () => {
    exportMetricsCSV(makeData())
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
  })

  it('calls URL.revokeObjectURL to clean up', () => {
    exportMetricsCSV(makeData())
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
  })
})
