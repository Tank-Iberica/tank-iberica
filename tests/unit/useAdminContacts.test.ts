import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminContacts, CONTACT_TYPES } from '../../app/composables/admin/useAdminContacts'

// ─── Chain builder ────────────────────────────────────────────────────────

const CHAIN_METHODS = ['select', 'eq', 'or', 'order', 'limit', 'insert', 'update', 'delete', 'single']

function makeChain(result: { data?: unknown; error?: unknown; count?: number | null } = {}) {
  const resolved = { data: result.data ?? null, error: result.error ?? null, count: result.count ?? null }
  const chain: Record<string, unknown> = {}
  for (const m of CHAIN_METHODS) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain.then = (resolve: (v: typeof resolved) => unknown) =>
    Promise.resolve(resolve(resolved))
  return chain
}

// ─── Fixtures ─────────────────────────────────────────────────────────────

function makeContact(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c-1',
    contact_type: 'client' as const,
    company: 'Empresa SA',
    contact_name: 'Juan',
    phone: '600000000',
    email: 'juan@empresa.com',
    location: 'Madrid',
    products: 'camiones',
    notes: '',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  }
}

function makeFormData() {
  return {
    contact_type: 'client' as const,
    company: 'Test SA',
    contact_name: 'Test User',
    phone: '600000001',
    email: 'test@test.com',
    location: 'Barcelona',
    products: 'semirremolques',
    notes: '',
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────

const mockFrom = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockReturnValue(makeChain())
  vi.stubGlobal('useSupabaseClient', () => ({ from: mockFrom }))
})

// ─── CONTACT_TYPES constant ───────────────────────────────────────────────

describe('CONTACT_TYPES', () => {
  it('has 3 entries', () => {
    expect(CONTACT_TYPES).toHaveLength(3)
  })

  it('contains provider, client, other values', () => {
    const values = CONTACT_TYPES.map((t) => t.value)
    expect(values).toContain('provider')
    expect(values).toContain('client')
    expect(values).toContain('other')
  })

  it('each entry has value, label, color', () => {
    for (const entry of CONTACT_TYPES) {
      expect(entry).toHaveProperty('value')
      expect(entry).toHaveProperty('label')
      expect(entry).toHaveProperty('color')
    }
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('contacts starts as empty array', () => {
    const c = useAdminContacts()
    expect(c.contacts.value).toEqual([])
  })

  it('loading starts as false', () => {
    const c = useAdminContacts()
    expect(c.loading.value).toBe(false)
  })

  it('saving starts as false', () => {
    const c = useAdminContacts()
    expect(c.saving.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useAdminContacts()
    expect(c.error.value).toBeNull()
  })

  it('total starts as 0', () => {
    const c = useAdminContacts()
    expect(c.total.value).toBe(0)
  })
})

// ─── fetchContacts ────────────────────────────────────────────────────────

describe('fetchContacts', () => {
  it('sets contacts and total on success', async () => {
    const contact = makeContact()
    mockFrom.mockReturnValue(makeChain({ data: [contact], error: null, count: 1 }))
    const c = useAdminContacts()
    await c.fetchContacts()
    expect(c.contacts.value).toHaveLength(1)
    expect(c.total.value).toBe(1)
    expect(c.loading.value).toBe(false)
  })

  it('sets error and empties contacts on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' }, count: null }))
    const c = useAdminContacts()
    await c.fetchContacts()
    expect(c.error.value).toBe('DB error')
    expect(c.contacts.value).toEqual([])
  })

  it('applies contact_type filter (eq)', async () => {
    const chain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue(chain)
    const c = useAdminContacts()
    await c.fetchContacts({ contact_type: 'provider' })
    expect(chain.eq).toHaveBeenCalledWith('contact_type', 'provider')
  })

  it('applies search filter (or)', async () => {
    const chain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue(chain)
    const c = useAdminContacts()
    await c.fetchContacts({ search: 'empresa' })
    expect(chain.or).toHaveBeenCalledWith(expect.stringContaining('company.ilike.%empresa%'))
  })

  it('defaults total to 0 when count is null', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null, count: null }))
    const c = useAdminContacts()
    await c.fetchContacts()
    expect(c.total.value).toBe(0)
  })
})

// ─── createContact ────────────────────────────────────────────────────────

describe('createContact', () => {
  it('returns new id on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: { id: 'new-c' }, error: null }))
    const c = useAdminContacts()
    const id = await c.createContact(makeFormData())
    expect(id).toBe('new-c')
    expect(c.saving.value).toBe(false)
  })

  it('returns null and sets error on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Duplicate email' } }))
    const c = useAdminContacts()
    const id = await c.createContact(makeFormData())
    expect(id).toBeNull()
    expect(c.error.value).toBe('Duplicate email')
  })
})

// ─── updateContact ────────────────────────────────────────────────────────

describe('updateContact', () => {
  it('returns true on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminContacts()
    const ok = await c.updateContact('c-1', { company: 'New SA' })
    expect(ok).toBe(true)
    expect(c.saving.value).toBe(false)
  })

  it('returns false and sets error on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Not found' } }))
    const c = useAdminContacts()
    const ok = await c.updateContact('c-1', { company: 'New SA' })
    expect(ok).toBe(false)
    expect(c.error.value).toBe('Not found')
  })
})

// ─── deleteContact ────────────────────────────────────────────────────────

describe('deleteContact', () => {
  it('returns true and removes contact from local list', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminContacts()
    c.contacts.value.push(makeContact({ id: 'c-1' }) as never)
    c.contacts.value.push(makeContact({ id: 'c-2' }) as never)
    c.total.value = 2
    const ok = await c.deleteContact('c-1')
    expect(ok).toBe(true)
    expect(c.contacts.value).toHaveLength(1)
    expect(c.contacts.value[0]!.id).toBe('c-2')
  })

  it('decrements total on success', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminContacts()
    c.contacts.value.push(makeContact({ id: 'c-1' }) as never)
    c.total.value = 1
    await c.deleteContact('c-1')
    expect(c.total.value).toBe(0)
  })

  it('returns false and sets error on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'FK violation' } }))
    const c = useAdminContacts()
    const ok = await c.deleteContact('c-1')
    expect(ok).toBe(false)
    expect(c.error.value).toBe('FK violation')
  })
})
