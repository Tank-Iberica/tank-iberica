import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Stub helpers ──────────────────────────────────────────────────────────────

function makeChain(data: unknown = null, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'neq', 'order', 'select', 'filter'].forEach((m) => {
    chain[m] = () => chain
  })
  const resolved = { data, error }
  chain.maybeSingle = () => Promise.resolve(resolved)
  chain.single = () => Promise.resolve(resolved)
  chain.range = () => Promise.resolve({ data: Array.isArray(data) ? data : [], error, count: 0 })
  chain.limit = () => Promise.resolve({ data: Array.isArray(data) ? data : [], error, count: 0 })
  chain.then = (resolve: (v: unknown) => void) =>
    Promise.resolve({ data: Array.isArray(data) ? data : [], error }).then(resolve)
  chain.catch = (reject: (e: unknown) => void) =>
    Promise.resolve({ data: Array.isArray(data) ? data : [], error }).catch(reject)
  return chain
}

function stubClient({
  singleData = null as unknown,
  singleError = null as unknown,
  insertError = null as unknown,
  updateError = null as unknown,
  listData = [] as unknown[],
} = {}) {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => makeChain(singleData ?? listData, singleError),
      insert: () => Promise.resolve({ data: null, error: insertError }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: updateError }),
      }),
    }),
  }))
}

async function getRegistration(auctionId = 'a1') {
  const mod = await import('../../app/composables/useAuctionRegistration')
  return mod.useAuctionRegistration(auctionId)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
  vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ clientSecret: 'secret-123' }))
  stubClient()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('registration starts as null', async () => {
    const c = await getRegistration()
    expect(c.registration.value).toBeNull()
  })

  it('loading starts as false', async () => {
    const c = await getRegistration()
    expect(c.loading.value).toBe(false)
  })

  it('error starts as null', async () => {
    const c = await getRegistration()
    expect(c.error.value).toBeNull()
  })

  it('isRegistered starts as false', async () => {
    const c = await getRegistration()
    expect(c.isRegistered.value).toBe(false)
  })

  it('canBid starts as false', async () => {
    const c = await getRegistration()
    expect(c.canBid.value).toBe(false)
  })
})

// ─── computed: isRegistered ────────────────────────────────────────────────────

describe('isRegistered', () => {
  it('returns true when registration is set', async () => {
    stubClient({ singleData: { id: 'r1', status: 'pending', deposit_status: 'pending' } })
    const c = await getRegistration()
    await c.fetchRegistration()
    expect(c.isRegistered.value).toBe(true)
  })

  it('isApproved returns true when status is approved', async () => {
    stubClient({ singleData: { id: 'r1', status: 'approved', deposit_status: 'pending' } })
    const c = await getRegistration()
    await c.fetchRegistration()
    expect(c.isApproved.value).toBe(true)
  })
})

// ─── computed: canBid ─────────────────────────────────────────────────────────

describe('canBid', () => {
  it('returns true when approved and deposit held', async () => {
    stubClient({ singleData: { id: 'r1', status: 'approved', deposit_status: 'held' } })
    const c = await getRegistration()
    await c.fetchRegistration()
    expect(c.canBid.value).toBe(true)
  })

  it('returns false when approved but deposit not held', async () => {
    stubClient({ singleData: { id: 'r1', status: 'approved', deposit_status: 'pending' } })
    const c = await getRegistration()
    await c.fetchRegistration()
    expect(c.canBid.value).toBe(false)
  })

  it('returns false when pending status', async () => {
    stubClient({ singleData: { id: 'r1', status: 'pending', deposit_status: 'held' } })
    const c = await getRegistration()
    await c.fetchRegistration()
    expect(c.canBid.value).toBe(false)
  })
})

// ─── fetchRegistration ────────────────────────────────────────────────────────

describe('fetchRegistration', () => {
  it('does nothing when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = await getRegistration()
    await c.fetchRegistration()
    expect(c.registration.value).toBeNull()
  })

  it('sets registration on success', async () => {
    const reg = { id: 'r1', status: 'pending', deposit_status: 'pending' }
    stubClient({ singleData: reg })
    const c = await getRegistration()
    await c.fetchRegistration()
    expect(c.registration.value).not.toBeNull()
  })

  it('sets loading to false after success', async () => {
    const c = await getRegistration()
    await c.fetchRegistration()
    expect(c.loading.value).toBe(false)
  })

  it('sets error on DB failure', async () => {
    stubClient({ singleError: new Error('DB error') })
    const c = await getRegistration()
    await c.fetchRegistration()
    expect(c.error.value).toBeTruthy()
  })

  it('sets loading to false after error', async () => {
    stubClient({ singleError: new Error('DB error') })
    const c = await getRegistration()
    await c.fetchRegistration()
    expect(c.loading.value).toBe(false)
  })
})

// ─── submitRegistration ───────────────────────────────────────────────────────

describe('submitRegistration', () => {
  const form = {
    id_type: 'dni' as const,
    id_number: '12345678A',
    id_document_url: null,
    company_name: null,
    transport_license_url: null,
  }

  it('returns false when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = await getRegistration()
    const result = await c.submitRegistration(form)
    expect(result).toBe(false)
  })

  it('sets error when no user', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = await getRegistration()
    await c.submitRegistration(form)
    expect(c.error.value).toBeTruthy()
  })

  it('returns true on success', async () => {
    const c = await getRegistration()
    const result = await c.submitRegistration(form)
    expect(result).toBe(true)
  })

  it('sets loading to false after success', async () => {
    const c = await getRegistration()
    await c.submitRegistration(form)
    expect(c.loading.value).toBe(false)
  })

  it('returns false on insert error', async () => {
    stubClient({ insertError: new Error('Insert failed') })
    const c = await getRegistration()
    const result = await c.submitRegistration(form)
    expect(result).toBe(false)
  })

  it('sets error on insert failure', async () => {
    stubClient({ insertError: new Error('Insert failed') })
    const c = await getRegistration()
    await c.submitRegistration(form)
    expect(c.error.value).toBeTruthy()
  })

  it('sets loading to false after error', async () => {
    stubClient({ insertError: new Error('Insert failed') })
    const c = await getRegistration()
    await c.submitRegistration(form)
    expect(c.loading.value).toBe(false)
  })
})

// ─── initiateDeposit ──────────────────────────────────────────────────────────

describe('initiateDeposit', () => {
  it('returns null when no registration', async () => {
    const c = await getRegistration()
    const result = await c.initiateDeposit()
    expect(result).toBeNull()
  })

  it('sets error when no registration', async () => {
    const c = await getRegistration()
    await c.initiateDeposit()
    expect(c.error.value).toBeTruthy()
  })

  it('returns clientSecret on success', async () => {
    stubClient({ singleData: { id: 'r1', status: 'pending', deposit_status: 'pending' } })
    const c = await getRegistration()
    await c.fetchRegistration()
    const result = await c.initiateDeposit()
    expect(result).toBe('secret-123')
  })

  it('returns null on $fetch error', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    stubClient({ singleData: { id: 'r1', status: 'pending', deposit_status: 'pending' } })
    const c = await getRegistration()
    await c.fetchRegistration()
    const result = await c.initiateDeposit()
    expect(result).toBeNull()
  })

  it('sets error on $fetch failure', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    stubClient({ singleData: { id: 'r1', status: 'pending', deposit_status: 'pending' } })
    const c = await getRegistration()
    await c.fetchRegistration()
    await c.initiateDeposit()
    expect(c.error.value).toBeTruthy()
  })
})

// ─── approveRegistration ──────────────────────────────────────────────────────

describe('approveRegistration', () => {
  it('returns true on success', async () => {
    const c = await getRegistration()
    const result = await c.approveRegistration('r1')
    expect(result).toBe(true)
  })

  it('returns false on DB error', async () => {
    stubClient({ updateError: new Error('Update failed') })
    const c = await getRegistration()
    const result = await c.approveRegistration('r1')
    expect(result).toBe(false)
  })

  it('sets error on DB failure', async () => {
    stubClient({ updateError: new Error('Update failed') })
    const c = await getRegistration()
    await c.approveRegistration('r1')
    expect(c.error.value).toBeTruthy()
  })
})

// ─── rejectRegistration ───────────────────────────────────────────────────────

describe('rejectRegistration', () => {
  it('returns true on success', async () => {
    const c = await getRegistration()
    const result = await c.rejectRegistration('r1', 'Docs missing')
    expect(result).toBe(true)
  })

  it('returns false on DB error', async () => {
    stubClient({ updateError: new Error('Update failed') })
    const c = await getRegistration()
    const result = await c.rejectRegistration('r1', 'Docs missing')
    expect(result).toBe(false)
  })
})

// ─── fetchAllRegistrations ────────────────────────────────────────────────────

describe('fetchAllRegistrations', () => {
  it('returns empty array when DB returns empty', async () => {
    stubClient({ listData: [] })
    const c = await getRegistration()
    const result = await c.fetchAllRegistrations('a1')
    expect(result).toHaveLength(0)
  })

  it('returns registrations from DB', async () => {
    const regs = [
      { id: 'r1', auction_id: 'a1', status: 'pending' },
      { id: 'r2', auction_id: 'a1', status: 'approved' },
    ]
    stubClient({ listData: regs })
    const c = await getRegistration()
    const result = await c.fetchAllRegistrations('a1')
    expect(result).toHaveLength(2)
  })

  it('returns empty array and sets error on DB failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => {
          const chain: Record<string, unknown> = {}
          ;['eq', 'order'].forEach((m) => { chain[m] = () => chain })
          chain.then = (resolve: (v: unknown) => void) =>
            Promise.resolve({ data: null, error: new Error('DB error') }).then(resolve)
          chain.catch = (reject: (e: unknown) => void) =>
            Promise.resolve({ data: null, error: new Error('DB error') }).catch(reject)
          return chain
        },
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }))
    const c = await getRegistration()
    const result = await c.fetchAllRegistrations('a1')
    expect(result).toHaveLength(0)
    expect(c.error.value).toBeTruthy()
  })
})
