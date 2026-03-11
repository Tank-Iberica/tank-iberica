import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useVehicleVerification,
  VERIFICATION_LEVELS,
  LEVEL_ORDER,
} from '../../app/composables/useVehicleVerification'
import type { VerificationDocument } from '../../app/composables/useVehicleVerification'

// ─── Stubs ────────────────────────────────────────────────────────────────────

function makeChain(data: unknown = [], error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'order', 'select'].forEach((m) => { chain[m] = () => chain })
  chain.single = () => Promise.resolve({ data: Array.isArray(data) ? (data[0] ?? null) : data, error })
  const resolved = { data, error }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  chain.insert = (row: unknown) => ({
    select: () => ({
      single: () => Promise.resolve({ data: { id: 'doc-new' }, error: null }),
    }),
  })
  return chain
}

function stubClient(data: unknown = []) {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => makeChain(data),
      update: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
      insert: (row: unknown) => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: 'doc-new' }, error: null }),
        }),
      }),
    }),
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  stubClient()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('documents starts as empty array', () => {
    const c = useVehicleVerification('v-1')
    expect(c.documents.value).toHaveLength(0)
  })

  it('loading starts as false', () => {
    const c = useVehicleVerification('v-1')
    expect(c.loading.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useVehicleVerification('v-1')
    expect(c.error.value).toBeNull()
  })

  it('currentLevel starts as none', () => {
    const c = useVehicleVerification('v-1')
    expect(c.currentLevel.value).toBe('none')
  })

  it('pendingDocuments starts empty', () => {
    const c = useVehicleVerification('v-1')
    expect(c.pendingDocuments.value).toHaveLength(0)
  })

  it('approvedDocuments starts empty', () => {
    const c = useVehicleVerification('v-1')
    expect(c.approvedDocuments.value).toHaveLength(0)
  })

  it('rejectedDocuments starts empty', () => {
    const c = useVehicleVerification('v-1')
    expect(c.rejectedDocuments.value).toHaveLength(0)
  })
})

// ─── calculateLevelFromDocuments ─────────────────────────────────────────────

describe('calculateLevelFromDocuments', () => {
  function makeDoc(doc_type: string, status = 'verified'): VerificationDocument {
    return {
      id: `d-${doc_type}`, vehicle_id: 'v-1', doc_type: doc_type as never,
      file_url: null, data: null, verified_by: null, status: status as never,
      level: 1, generated_at: null, expires_at: null, price_cents: null,
      submitted_by: null, rejection_reason: null, notes: null,
    }
  }

  it('returns none when no documents', () => {
    const c = useVehicleVerification('v-1')
    expect(c.calculateLevelFromDocuments([])).toBe('none')
  })

  it('returns verified with basic docs', () => {
    const c = useVehicleVerification('v-1')
    const docs = [makeDoc('ficha_tecnica'), makeDoc('foto_km'), makeDoc('fotos_exteriores')]
    expect(c.calculateLevelFromDocuments(docs)).toBe('verified')
  })

  it('returns extended with all extended docs', () => {
    const c = useVehicleVerification('v-1')
    const docs = [
      makeDoc('ficha_tecnica'), makeDoc('foto_km'), makeDoc('fotos_exteriores'),
      makeDoc('placa_fabricante'), makeDoc('permiso_circulacion'), makeDoc('tarjeta_itv'),
    ]
    expect(c.calculateLevelFromDocuments(docs)).toBe('extended')
  })

  it('returns audited with dgt_report', () => {
    const c = useVehicleVerification('v-1')
    expect(c.calculateLevelFromDocuments([makeDoc('dgt_report')])).toBe('audited')
  })

  it('returns certified with inspection_report', () => {
    const c = useVehicleVerification('v-1')
    expect(c.calculateLevelFromDocuments([makeDoc('inspection_report')])).toBe('certified')
  })

  it('ignores rejected docs in level calculation', () => {
    const c = useVehicleVerification('v-1')
    const docs = [makeDoc('ficha_tecnica', 'rejected'), makeDoc('foto_km'), makeDoc('fotos_exteriores')]
    // ficha_tecnica rejected → basic set incomplete → none
    expect(c.calculateLevelFromDocuments(docs)).toBe('none')
  })
})

// ─── currentLevel reactive computed ──────────────────────────────────────────

describe('currentLevel computed', () => {
  it('updates when documents are set', () => {
    const c = useVehicleVerification('v-1')
    c.documents.value = [
      { id: 'd1', vehicle_id: 'v-1', doc_type: 'dgt_report', file_url: null, data: null,
        verified_by: null, status: 'verified', level: 4, generated_at: null, expires_at: null,
        price_cents: null, submitted_by: null, rejection_reason: null, notes: null },
    ]
    expect(c.currentLevel.value).toBe('audited')
  })
})

// ─── pendingDocuments / approvedDocuments / rejectedDocuments ─────────────────

describe('document filters', () => {
  beforeEach(() => {
    // Use getter-based computed (already set in outer beforeEach)
  })

  it('pendingDocuments returns only pending docs', () => {
    const c = useVehicleVerification('v-1')
    c.documents.value = [
      { id: 'd1', vehicle_id: 'v-1', doc_type: 'ficha_tecnica', file_url: null, data: null,
        verified_by: null, status: 'pending', level: 1, generated_at: null, expires_at: null,
        price_cents: null, submitted_by: null, rejection_reason: null, notes: null },
      { id: 'd2', vehicle_id: 'v-1', doc_type: 'foto_km', file_url: null, data: null,
        verified_by: null, status: 'verified', level: 1, generated_at: null, expires_at: null,
        price_cents: null, submitted_by: null, rejection_reason: null, notes: null },
    ]
    expect(c.pendingDocuments.value).toHaveLength(1)
    expect(c.pendingDocuments.value[0].id).toBe('d1')
  })

  it('approvedDocuments returns only verified docs', () => {
    const c = useVehicleVerification('v-1')
    c.documents.value = [
      { id: 'd1', vehicle_id: 'v-1', doc_type: 'ficha_tecnica', file_url: null, data: null,
        verified_by: null, status: 'verified', level: 1, generated_at: null, expires_at: null,
        price_cents: null, submitted_by: null, rejection_reason: null, notes: null },
      { id: 'd2', vehicle_id: 'v-1', doc_type: 'foto_km', file_url: null, data: null,
        verified_by: null, status: 'rejected', level: 1, generated_at: null, expires_at: null,
        price_cents: null, submitted_by: null, rejection_reason: null, notes: null },
    ]
    expect(c.approvedDocuments.value).toHaveLength(1)
    expect(c.approvedDocuments.value[0].id).toBe('d1')
  })
})

// ─── getLevelDefinition ───────────────────────────────────────────────────────

describe('getLevelDefinition', () => {
  it('returns definition for verified level', () => {
    const c = useVehicleVerification('v-1')
    const def = c.getLevelDefinition('verified')
    expect(def).not.toBeNull()
    expect(def?.level).toBe('verified')
  })

  it('returns null for unknown level', () => {
    const c = useVehicleVerification('v-1')
    const def = c.getLevelDefinition('unknown' as never)
    expect(def).toBeUndefined()
  })
})

// ─── isLevelHigherThan ────────────────────────────────────────────────────────

describe('isLevelHigherThan', () => {
  it('extended is higher than verified', () => {
    const c = useVehicleVerification('v-1')
    expect(c.isLevelHigherThan('extended', 'verified')).toBe(true)
  })

  it('verified is NOT higher than extended', () => {
    const c = useVehicleVerification('v-1')
    expect(c.isLevelHigherThan('verified', 'extended')).toBe(false)
  })

  it('certified is higher than none', () => {
    const c = useVehicleVerification('v-1')
    expect(c.isLevelHigherThan('certified', 'none')).toBe(true)
  })
})

// ─── getRequiredDocsForLevel ──────────────────────────────────────────────────

describe('getRequiredDocsForLevel', () => {
  it('returns empty for none level', () => {
    const c = useVehicleVerification('v-1')
    expect(c.getRequiredDocsForLevel('none')).toHaveLength(0)
  })

  it('returns 3 docs for verified level', () => {
    const c = useVehicleVerification('v-1')
    const docs = c.getRequiredDocsForLevel('verified')
    expect(docs.length).toBeGreaterThanOrEqual(3)
  })
})

// ─── fetchDocuments ───────────────────────────────────────────────────────────

describe('fetchDocuments', () => {
  it('sets loading to false after success', async () => {
    const c = useVehicleVerification('v-1')
    await c.fetchDocuments()
    expect(c.loading.value).toBe(false)
  })

  it('sets documents from DB', async () => {
    const doc = {
      id: 'd1', vehicle_id: 'v-1', doc_type: 'ficha_tecnica', file_url: null, data: null,
      verified_by: null, status: 'pending', level: 1, generated_at: null, expires_at: null,
      price_cents: null, submitted_by: null, rejection_reason: null, notes: null,
    }
    stubClient([doc])
    const c = useVehicleVerification('v-1')
    await c.fetchDocuments()
    expect(c.documents.value).toHaveLength(1)
  })

  it('sets error on DB failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, new Error('DB error')),
      }),
    }))
    const c = useVehicleVerification('v-1')
    await c.fetchDocuments()
    expect(c.error.value).toBeTruthy()
  })
})

// ─── VERIFICATION_LEVELS exported constant ────────────────────────────────────

describe('VERIFICATION_LEVELS constant', () => {
  it('has 6 levels', () => {
    expect(VERIFICATION_LEVELS).toHaveLength(6)
  })

  it('first level is none', () => {
    expect(VERIFICATION_LEVELS[0]?.level).toBe('none')
  })

  it('last level is certified', () => {
    expect(VERIFICATION_LEVELS[VERIFICATION_LEVELS.length - 1]?.level).toBe('certified')
  })
})

// ─── LEVEL_ORDER ──────────────────────────────────────────────────────────────

describe('LEVEL_ORDER constant', () => {
  it('has 6 entries (record with 6 keys)', () => {
    expect(Object.keys(LEVEL_ORDER)).toHaveLength(6)
  })

  it('none has the lowest order value', () => {
    expect(LEVEL_ORDER.none).toBe(0)
  })
})

// ─── calculateLevelFromDocuments — detailed level ────────────────────────────

describe('calculateLevelFromDocuments — detailed level', () => {
  function makeDoc(doc_type: string, status = 'verified'): VerificationDocument {
    return {
      id: `d-${doc_type}`, vehicle_id: 'v-1', doc_type: doc_type as never,
      file_url: null, data: null, verified_by: null, status: status as never,
      level: 1, generated_at: null, expires_at: null, price_cents: null,
      submitted_by: null, rejection_reason: null, notes: null,
    }
  }

  it('returns detailed with extended docs plus one sector-specific doc', () => {
    const c = useVehicleVerification('v-1')
    const docs = [
      makeDoc('ficha_tecnica'), makeDoc('foto_km'), makeDoc('fotos_exteriores'),
      makeDoc('placa_fabricante'), makeDoc('permiso_circulacion'), makeDoc('tarjeta_itv'),
      makeDoc('adr'),
    ]
    expect(c.calculateLevelFromDocuments(docs)).toBe('detailed')
  })

  it('returns none when only pending docs exist', () => {
    const c = useVehicleVerification('v-1')
    const docs = [makeDoc('ficha_tecnica', 'pending'), makeDoc('foto_km', 'pending')]
    expect(c.calculateLevelFromDocuments(docs)).toBe('none')
  })

  it('certified takes priority even with basic docs', () => {
    const c = useVehicleVerification('v-1')
    const docs = [
      makeDoc('ficha_tecnica'), makeDoc('foto_km'), makeDoc('fotos_exteriores'),
      makeDoc('inspection_report'),
    ]
    expect(c.calculateLevelFromDocuments(docs)).toBe('certified')
  })
})

// ─── getMissingDocs ──────────────────────────────────────────────────────────

describe('getMissingDocs', () => {
  function makeDoc(doc_type: string, status = 'verified'): VerificationDocument {
    return {
      id: `d-${doc_type}`, vehicle_id: 'v-1', doc_type: doc_type as never,
      file_url: null, data: null, verified_by: null, status: status as never,
      level: 1, generated_at: null, expires_at: null, price_cents: null,
      submitted_by: null, rejection_reason: null, notes: null,
    }
  }

  it('returns all required docs for verified when no docs exist', () => {
    const c = useVehicleVerification('v-1')
    const missing = c.getMissingDocs('verified')
    expect(missing).toContain('ficha_tecnica')
    expect(missing).toContain('foto_km')
    expect(missing).toContain('fotos_exteriores')
  })

  it('returns only missing docs when some are approved', () => {
    const c = useVehicleVerification('v-1')
    c.documents.value = [makeDoc('ficha_tecnica')]
    const missing = c.getMissingDocs('verified')
    expect(missing).not.toContain('ficha_tecnica')
    expect(missing).toContain('foto_km')
  })

  it('returns empty for none level', () => {
    const c = useVehicleVerification('v-1')
    expect(c.getMissingDocs('none')).toHaveLength(0)
  })

  it('for detailed level with no sector doc, includes all sector docs', () => {
    const c = useVehicleVerification('v-1')
    c.documents.value = [
      makeDoc('ficha_tecnica'), makeDoc('foto_km'), makeDoc('fotos_exteriores'),
      makeDoc('placa_fabricante'), makeDoc('permiso_circulacion'), makeDoc('tarjeta_itv'),
    ]
    const missing = c.getMissingDocs('detailed')
    expect(missing).toContain('adr')
    expect(missing).toContain('atp')
    expect(missing).toContain('exolum')
    expect(missing).toContain('estanqueidad')
  })

  it('for detailed level with one sector doc, excludes sector docs', () => {
    const c = useVehicleVerification('v-1')
    c.documents.value = [
      makeDoc('ficha_tecnica'), makeDoc('foto_km'), makeDoc('fotos_exteriores'),
      makeDoc('placa_fabricante'), makeDoc('permiso_circulacion'), makeDoc('tarjeta_itv'),
      makeDoc('adr'),
    ]
    const missing = c.getMissingDocs('detailed')
    expect(missing).not.toContain('adr')
    expect(missing).not.toContain('atp')
    expect(missing).toHaveLength(0)
  })

  it('returns dgt_report for audited level when not present', () => {
    const c = useVehicleVerification('v-1')
    const missing = c.getMissingDocs('audited')
    expect(missing).toContain('dgt_report')
  })

  it('returns inspection_report for certified level when not present', () => {
    const c = useVehicleVerification('v-1')
    const missing = c.getMissingDocs('certified')
    expect(missing).toContain('inspection_report')
  })
})

// ─── uploadDocument ──────────────────────────────────────────────────────────

describe('uploadDocument', () => {
  it('returns new doc id on success', async () => {
    stubClient()
    const c = useVehicleVerification('v-1')
    const id = await c.uploadDocument('ficha_tecnica', 'https://example.com/file.pdf')
    expect(id).toBe('doc-new')
  })

  it('sets loading to false after success', async () => {
    stubClient()
    const c = useVehicleVerification('v-1')
    await c.uploadDocument('ficha_tecnica', 'https://example.com/file.pdf')
    expect(c.loading.value).toBe(false)
  })

  it('sets error on failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, new Error('Upload failed')),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Insert failed' } }),
          }),
        }),
      }),
    }))
    const c = useVehicleVerification('v-1')
    const id = await c.uploadDocument('ficha_tecnica', 'https://example.com/file.pdf')
    expect(id).toBeNull()
    expect(c.error.value).toBeTruthy()
  })

  it('includes submittedBy when provided', async () => {
    stubClient()
    const c = useVehicleVerification('v-1')
    const id = await c.uploadDocument('ficha_tecnica', 'https://example.com/file.pdf', 'user-42')
    expect(id).toBe('doc-new')
  })
})

// ─── approveDocument ─────────────────────────────────────────────────────────

describe('approveDocument', () => {
  it('returns true on success', async () => {
    stubClient()
    const c = useVehicleVerification('v-1')
    const result = await c.approveDocument('doc-1', 'admin-1')
    expect(result).toBe(true)
  })

  it('sets loading to false after success', async () => {
    stubClient()
    const c = useVehicleVerification('v-1')
    await c.approveDocument('doc-1', 'admin-1')
    expect(c.loading.value).toBe(false)
  })

  it('returns false on error', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'Approve failed' } }) }),
      }),
    }))
    const c = useVehicleVerification('v-1')
    const result = await c.approveDocument('doc-1', 'admin-1')
    expect(result).toBe(false)
    expect(c.error.value).toBeTruthy()
  })
})

// ─── rejectDocument ──────────────────────────────────────────────────────────

describe('rejectDocument', () => {
  it('returns true on success', async () => {
    stubClient()
    const c = useVehicleVerification('v-1')
    const result = await c.rejectDocument('doc-1', 'admin-1', 'Blurry photo')
    expect(result).toBe(true)
  })

  it('returns false on error', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'Reject failed' } }) }),
      }),
    }))
    const c = useVehicleVerification('v-1')
    const result = await c.rejectDocument('doc-1', 'admin-1', 'Bad quality')
    expect(result).toBe(false)
    expect(c.error.value).toBeTruthy()
  })

  it('sets loading to false after rejection', async () => {
    stubClient()
    const c = useVehicleVerification('v-1')
    await c.rejectDocument('doc-1', 'admin-1', 'Bad quality')
    expect(c.loading.value).toBe(false)
  })
})
