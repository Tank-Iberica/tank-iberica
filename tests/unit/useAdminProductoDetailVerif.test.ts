import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminProductoDetailVerif } from '../../app/composables/admin/useAdminProductoDetailVerif'

// ─── Module mocks ─────────────────────────────────────────────────────────

let mockFetchDocuments: ReturnType<typeof vi.fn>
let mockUploadDocument: ReturnType<typeof vi.fn>

vi.mock('~/composables/useVehicleVerification', () => ({
  useVehicleVerification: () => ({
    VERIFICATION_LEVELS: [
      { level: 'none', badge: '' },
      { level: 'basic', badge: 'Básico' },
      { level: 'advanced', badge: 'Avanzado' },
    ],
    fetchDocuments: (...args: unknown[]) => mockFetchDocuments(...args),
    uploadDocument: (...args: unknown[]) => mockUploadDocument(...args),
    documents: { value: [] },
    currentLevel: { value: 'none' },
    error: { value: null },
  }),
}))

// ─── Setup ────────────────────────────────────────────────────────────────

let mockUploadToCloudinary: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockFetchDocuments = vi.fn().mockResolvedValue(undefined)
  mockUploadDocument = vi.fn().mockResolvedValue(undefined)
  mockUploadToCloudinary = vi.fn().mockResolvedValue(null)
})

function makeParams(vehicleId = 'vehicle-1') {
  return {
    vehicleId: { value: vehicleId },
    uploadToCloudinary: (...args: unknown[]) => mockUploadToCloudinary(...args),
  }
}

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('verifDocType starts as "ficha_tecnica"', () => {
    const c = useAdminProductoDetailVerif(makeParams())
    expect(c.verifDocType.value).toBe('ficha_tecnica')
  })

  it('verifDocs starts as empty array', () => {
    const c = useAdminProductoDetailVerif(makeParams())
    expect(c.verifDocs.value).toEqual([])
  })

  it('verifLoading starts as false', () => {
    const c = useAdminProductoDetailVerif(makeParams())
    expect(c.verifLoading.value).toBe(false)
  })

  it('verifError starts as null', () => {
    const c = useAdminProductoDetailVerif(makeParams())
    expect(c.verifError.value).toBeNull()
  })

  it('verifCurrentLevel starts as "none"', () => {
    const c = useAdminProductoDetailVerif(makeParams())
    expect(c.verifCurrentLevel.value).toBe('none')
  })

  it('verifDocTypes is a non-empty array', () => {
    const c = useAdminProductoDetailVerif(makeParams())
    expect(Array.isArray(c.verifDocTypes)).toBe(true)
    expect(c.verifDocTypes.length).toBeGreaterThan(0)
  })

  it('verifDocTypes includes ficha_tecnica', () => {
    const c = useAdminProductoDetailVerif(makeParams())
    expect(c.verifDocTypes).toContain('ficha_tecnica')
  })

  it('verifLevelBadge starts as "" for "none" level', () => {
    const c = useAdminProductoDetailVerif(makeParams())
    expect(c.verifLevelBadge.value).toBe('')
  })
})

// ─── initVerification ─────────────────────────────────────────────────────

describe('initVerification', () => {
  it('calls fetchDocuments', async () => {
    const c = useAdminProductoDetailVerif(makeParams())
    await c.initVerification()
    expect(mockFetchDocuments).toHaveBeenCalled()
  })

  it('sets verifLoading to false after init', async () => {
    const c = useAdminProductoDetailVerif(makeParams())
    await c.initVerification()
    expect(c.verifLoading.value).toBe(false)
  })

  it('sets verifCurrentLevel from composable currentLevel', async () => {
    const c = useAdminProductoDetailVerif(makeParams())
    await c.initVerification()
    expect(c.verifCurrentLevel.value).toBe('none')
  })

  it('sets verifError from composable error', async () => {
    const c = useAdminProductoDetailVerif(makeParams())
    await c.initVerification()
    expect(c.verifError.value).toBeNull()
  })
})

// ─── verifDocType mutation ─────────────────────────────────────────────────

describe('verifDocType', () => {
  it('can be updated to a different doc type', () => {
    const c = useAdminProductoDetailVerif(makeParams())
    c.verifDocType.value = 'foto_km'
    expect(c.verifDocType.value).toBe('foto_km')
  })
})
