import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminProductoDetailRecords } from '../../app/composables/admin/useAdminProductoDetailRecords'

// ─── Module mocks ─────────────────────────────────────────────────────────

let mockConnect: ReturnType<typeof vi.fn>
let mockDriveUploadDocument: ReturnType<typeof vi.fn>
let mockDriveUploadInvoice: ReturnType<typeof vi.fn>

vi.mock('~/composables/admin/useGoogleDrive', () => ({
  useGoogleDrive: () => ({
    connected: { value: false },
    loading: { value: false },
    error: { value: null },
    connect: (...args: unknown[]) => mockConnect(...args),
    uploadDocument: (...args: unknown[]) => mockDriveUploadDocument(...args),
    uploadInvoice: (...args: unknown[]) => mockDriveUploadInvoice(...args),
    openDocumentsFolder: vi.fn(),
    openVehicleFolder: vi.fn(),
  }),
}))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockConnect = vi.fn().mockResolvedValue(true)
  mockDriveUploadDocument = vi.fn().mockResolvedValue({ name: 'doc.pdf', url: 'https://drive.google.com/doc.pdf' })
  mockDriveUploadInvoice = vi.fn().mockResolvedValue({ name: 'invoice.pdf', url: 'https://drive.google.com/inv.pdf' })
})

function makeFormData(overrides: Record<string, unknown> = {}) {
  return {
    value: {
      maintenance_records: [] as { id: string; date: string; reason: string; cost: number; invoice_url?: string }[],
      rental_records: [] as { id: string; from_date: string; to_date: string; amount: number; notes: string }[],
      acquisition_cost: null as number | null,
      is_online: true,
      ...overrides,
    },
  }
}

function makeParams(formDataOverrides: Record<string, unknown> = {}) {
  return {
    formData: makeFormData(formDataOverrides),
    fileNamingData: {
      value: { id: 'v1', brand: 'Volvo', year: 2020, plate: null, subcategory: null, type: null },
    },
    documents: { value: [] as { id: string; name: string; url: string; type: string; uploaded_at: string }[] },
  }
}

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('driveConnected starts as false', () => {
    const c = useAdminProductoDetailRecords(makeParams())
    expect(c.driveConnected.value).toBe(false)
  })

  it('driveLoading starts as false', () => {
    const c = useAdminProductoDetailRecords(makeParams())
    expect(c.driveLoading.value).toBe(false)
  })

  it('driveError starts as null', () => {
    const c = useAdminProductoDetailRecords(makeParams())
    expect(c.driveError.value).toBeNull()
  })

  it('docTypeToUpload starts as "ITV"', () => {
    const c = useAdminProductoDetailRecords(makeParams())
    expect(c.docTypeToUpload.value).toBe('ITV')
  })

  it('docTypeOptions has 6 entries', () => {
    const c = useAdminProductoDetailRecords(makeParams())
    expect(c.docTypeOptions).toHaveLength(6)
  })

  it('totalMaint starts as 0', () => {
    const c = useAdminProductoDetailRecords(makeParams())
    expect(c.totalMaint.value).toBe(0)
  })

  it('totalRental starts as 0', () => {
    const c = useAdminProductoDetailRecords(makeParams())
    expect(c.totalRental.value).toBe(0)
  })

  it('totalCost starts as 0', () => {
    const c = useAdminProductoDetailRecords(makeParams())
    expect(c.totalCost.value).toBe(0)
  })

  it('driveSection starts as "Vehiculos" when is_online=true', () => {
    const c = useAdminProductoDetailRecords(makeParams())
    expect(c.driveSection.value).toBe('Vehiculos')
  })

  it('driveSection is "Intermediacion" when is_online=false', () => {
    const c = useAdminProductoDetailRecords(makeParams({ is_online: false }))
    expect(c.driveSection.value).toBe('Intermediacion')
  })
})

// ─── removeDocument ───────────────────────────────────────────────────────

describe('removeDocument', () => {
  it('removes document by id', () => {
    const params = makeParams()
    params.documents.value.push({ id: 'doc-1', name: 'test.pdf', url: 'url-1', type: 'ITV', uploaded_at: '2026-01-01' })
    const c = useAdminProductoDetailRecords(params)
    c.removeDocument('doc-1')
    expect(params.documents.value).toHaveLength(0)
  })

  it('only removes matching document', () => {
    const params = makeParams()
    params.documents.value.push({ id: 'doc-1', name: 'a.pdf', url: 'url-1', type: 'ITV', uploaded_at: '2026-01-01' })
    params.documents.value.push({ id: 'doc-2', name: 'b.pdf', url: 'url-2', type: 'ITV', uploaded_at: '2026-01-01' })
    const c = useAdminProductoDetailRecords(params)
    c.removeDocument('doc-1')
    expect(params.documents.value).toHaveLength(1)
    expect(params.documents.value[0]!.id).toBe('doc-2')
  })
})

// ─── addMaint / removeMaint / updateMaint ─────────────────────────────────

describe('addMaint', () => {
  it('adds a maintenance record', () => {
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    c.addMaint()
    expect(params.formData.value.maintenance_records).toHaveLength(1)
  })

  it('sets initial cost to 0', () => {
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    c.addMaint()
    expect(params.formData.value.maintenance_records[0]!.cost).toBe(0)
  })

  it('sets initial reason to empty string', () => {
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    c.addMaint()
    expect(params.formData.value.maintenance_records[0]!.reason).toBe('')
  })

  it('generates unique ids for multiple records', () => {
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    c.addMaint()
    c.addMaint()
    const ids = params.formData.value.maintenance_records.map((r) => r.id)
    expect(new Set(ids).size).toBe(2)
  })
})

describe('removeMaint', () => {
  it('removes maintenance record by id', () => {
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    c.addMaint()
    const id = params.formData.value.maintenance_records[0]!.id
    c.removeMaint(id)
    expect(params.formData.value.maintenance_records).toHaveLength(0)
  })
})

describe('updateMaint', () => {
  it('updates cost field', () => {
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    c.addMaint()
    const id = params.formData.value.maintenance_records[0]!.id
    c.updateMaint(id, 'cost', 800)
    expect(params.formData.value.maintenance_records[0]!.cost).toBe(800)
  })

  it('updates reason field', () => {
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    c.addMaint()
    const id = params.formData.value.maintenance_records[0]!.id
    c.updateMaint(id, 'reason', 'Oil change')
    expect(params.formData.value.maintenance_records[0]!.reason).toBe('Oil change')
  })
})

// ─── addRental / removeRental / updateRental ──────────────────────────────

describe('addRental', () => {
  it('adds a rental record', () => {
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    c.addRental()
    expect(params.formData.value.rental_records).toHaveLength(1)
  })

  it('sets initial amount to 0', () => {
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    c.addRental()
    expect(params.formData.value.rental_records[0]!.amount).toBe(0)
  })

  it('sets initial notes to empty string', () => {
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    c.addRental()
    expect(params.formData.value.rental_records[0]!.notes).toBe('')
  })

  it('generates unique ids for multiple records', () => {
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    c.addRental()
    c.addRental()
    const ids = params.formData.value.rental_records.map((r) => r.id)
    expect(new Set(ids).size).toBe(2)
  })
})

describe('removeRental', () => {
  it('removes rental record by id', () => {
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    c.addRental()
    const id = params.formData.value.rental_records[0]!.id
    c.removeRental(id)
    expect(params.formData.value.rental_records).toHaveLength(0)
  })
})

describe('updateRental', () => {
  it('updates amount field', () => {
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    c.addRental()
    const id = params.formData.value.rental_records[0]!.id
    c.updateRental(id, 'amount', 1500)
    expect(params.formData.value.rental_records[0]!.amount).toBe(1500)
  })

  it('updates notes field', () => {
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    c.addRental()
    const id = params.formData.value.rental_records[0]!.id
    c.updateRental(id, 'notes', 'Seasonal')
    expect(params.formData.value.rental_records[0]!.notes).toBe('Seasonal')
  })
})

// ─── handleDocUpload ─────────────────────────────────────────────────────────

describe('handleDocUpload', () => {
  function makeFileEvent(files: File[] | null) {
    return {
      target: {
        files: files && files.length > 0 ? files : null,
        value: '',
      },
    } as unknown as Event
  }

  it('does nothing when no files selected', async () => {
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    await c.handleDocUpload(makeFileEvent(null))
    expect(params.documents.value).toHaveLength(0)
  })

  it('uploads file and pushes to documents', async () => {
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    await c.handleDocUpload(makeFileEvent([file]))
    expect(mockDriveUploadDocument).toHaveBeenCalled()
    expect(params.documents.value).toHaveLength(1)
    expect(params.documents.value[0]!.name).toBe('doc.pdf')
    expect(params.documents.value[0]!.type).toBe('ITV')
  })

  it('connects to Drive first if not connected', async () => {
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    await c.handleDocUpload(makeFileEvent([file]))
    expect(mockConnect).toHaveBeenCalled()
  })

  it('aborts if Drive connect fails', async () => {
    mockConnect.mockResolvedValue(false)
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    await c.handleDocUpload(makeFileEvent([file]))
    expect(mockDriveUploadDocument).not.toHaveBeenCalled()
    expect(params.documents.value).toHaveLength(0)
  })

  it('handles upload error gracefully', async () => {
    mockDriveUploadDocument.mockRejectedValue(new Error('Upload failed'))
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    await c.handleDocUpload(makeFileEvent([file]))
    expect(params.documents.value).toHaveLength(0)
  })
})

// ─── handleMaintInvoiceUpload ────────────────────────────────────────────────

describe('handleMaintInvoiceUpload', () => {
  function makeFileEvent(files: File[] | null) {
    return {
      target: {
        files: files && files.length > 0 ? files : null,
        value: '',
      },
    } as unknown as Event
  }

  it('does nothing when no files selected', async () => {
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    await c.handleMaintInvoiceUpload('m-1', makeFileEvent(null))
    expect(mockDriveUploadInvoice).not.toHaveBeenCalled()
  })

  it('uploads invoice and updates maint record', async () => {
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    c.addMaint()
    const maintId = params.formData.value.maintenance_records[0]!.id
    const file = new File(['content'], 'invoice.pdf', { type: 'application/pdf' })
    await c.handleMaintInvoiceUpload(maintId, makeFileEvent([file]))
    expect(mockDriveUploadInvoice).toHaveBeenCalled()
  })
})

// ─── handleRentalInvoiceUpload ───────────────────────────────────────────────

describe('handleRentalInvoiceUpload', () => {
  function makeFileEvent(files: File[] | null) {
    return {
      target: {
        files: files && files.length > 0 ? files : null,
        value: '',
      },
    } as unknown as Event
  }

  it('does nothing when no files selected', async () => {
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    await c.handleRentalInvoiceUpload('r-1', makeFileEvent(null))
    expect(mockDriveUploadInvoice).not.toHaveBeenCalled()
  })

  it('uploads invoice and updates rental record', async () => {
    const params = makeParams()
    const c = useAdminProductoDetailRecords(params)
    c.addRental()
    const rentalId = params.formData.value.rental_records[0]!.id
    const file = new File(['content'], 'invoice.pdf', { type: 'application/pdf' })
    await c.handleRentalInvoiceUpload(rentalId, makeFileEvent([file]))
    expect(mockDriveUploadInvoice).toHaveBeenCalled()
  })
})

// ─── totalCost with acquisition_cost ─────────────────────────────────────────

describe('totalCost with data', () => {
  it('includes acquisition cost in total', () => {
    const params = makeParams({ acquisition_cost: 50000 })
    const c = useAdminProductoDetailRecords(params)
    expect(c.totalCost.value).toBe(50000)
  })

  it('formula is acquisition_cost + totalMaint - totalRental', () => {
    // With initial values (no maint/rental records), totalCost = acquisition_cost
    const params = makeParams({ acquisition_cost: 50000 })
    const c = useAdminProductoDetailRecords(params)
    expect(c.totalCost.value).toBe(50000)
  })

  it('totalMaint sums maintenance costs from records', () => {
    const params = makeParams({
      maintenance_records: [
        { id: 'm1', date: '2026-01-01', reason: 'Oil', cost: 500, invoice_url: undefined },
        { id: 'm2', date: '2026-02-01', reason: 'Tires', cost: 1500, invoice_url: undefined },
      ],
    })
    const c = useAdminProductoDetailRecords(params)
    expect(c.totalMaint.value).toBe(2000)
  })

  it('totalRental sums rental amounts from records', () => {
    const params = makeParams({
      rental_records: [
        { id: 'r1', from_date: '2026-01-01', to_date: '2026-01-31', amount: 3000, notes: '' },
        { id: 'r2', from_date: '2026-02-01', to_date: '2026-02-28', amount: 2000, notes: '' },
      ],
    })
    const c = useAdminProductoDetailRecords(params)
    expect(c.totalRental.value).toBe(5000)
  })
})
