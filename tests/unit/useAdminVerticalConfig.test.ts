import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminVerticalConfig } from '../../app/composables/admin/useAdminVerticalConfig'

// ─── Supabase chain mock ──────────────────────────────────────────────────

function makeChain(result: unknown = { data: null, error: null }) {
  const chain: Record<string, (..._: unknown[]) => unknown> = {}
  for (const m of [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'order', 'limit', 'single', 'match',
  ]) {
    chain[m] = () => chain
  }
  Object.assign(chain, { then: (resolve: (v: unknown) => unknown) => resolve(result) })
  return chain
}

let mockFrom: ReturnType<typeof vi.fn>

vi.stubGlobal('useSupabaseClient', () => ({
  from: (...args: unknown[]) => mockFrom(...args),
}))

vi.stubGlobal('getVerticalSlug', () => 'tracciona')

// useState: returns a plain ref-like object initialized with the init fn
vi.stubGlobal('useState', (_key: string, init: () => unknown) => ({ value: init() }))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom = vi.fn(() => makeChain({ data: null, error: null }))
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('config starts as null', () => {
    const c = useAdminVerticalConfig()
    expect(c.config.value).toBeNull()
  })

  it('loading starts as false', () => {
    const c = useAdminVerticalConfig()
    expect(c.loading.value).toBe(false)
  })

  it('saving starts as false', () => {
    const c = useAdminVerticalConfig()
    expect(c.saving.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useAdminVerticalConfig()
    expect(c.error.value).toBeNull()
  })

  it('saved starts as false', () => {
    const c = useAdminVerticalConfig()
    expect(c.saved.value).toBe(false)
  })
})

// ─── loadConfig ───────────────────────────────────────────────────────────

describe('loadConfig', () => {
  it('returns cached config when already loaded', async () => {
    const c = useAdminVerticalConfig()
    const cached = { id: 'cfg-1', vertical: 'tracciona' }
    c.config.value = cached as never
    const result = await c.loadConfig()
    expect(result).toBe(cached)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('calls supabase.from("vertical_config") when config is null', async () => {
    const c = useAdminVerticalConfig()
    await c.loadConfig()
    expect(mockFrom).toHaveBeenCalledWith('vertical_config')
  })

  it('sets config.value on successful load', async () => {
    const configData = { id: 'cfg-1', vertical: 'tracciona', name: { es: 'Tracciona' } }
    mockFrom.mockReturnValue(makeChain({ data: configData, error: null }))
    const c = useAdminVerticalConfig()
    const result = await c.loadConfig()
    expect(result).toEqual(configData)
    expect(c.config.value).toEqual(configData)
  })

  it('returns null and sets error on failure', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('DB error') }))
    const c = useAdminVerticalConfig()
    const result = await c.loadConfig()
    expect(result).toBeNull()
    expect(c.error.value).toBe('DB error')
  })
})

// ─── saveFields ───────────────────────────────────────────────────────────

describe('saveFields', () => {
  it('returns false when config has no id', async () => {
    const c = useAdminVerticalConfig()
    // config.value is null
    const result = await c.saveFields({ name: { es: 'Test' } } as never)
    expect(result).toBe(false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('calls supabase.from("vertical_config") with update', async () => {
    const c = useAdminVerticalConfig()
    c.config.value = { id: 'cfg-1', vertical: 'tracciona' } as never
    await c.saveFields({ name: { es: 'Updated' } } as never)
    expect(mockFrom).toHaveBeenCalledWith('vertical_config')
  })

  it('returns true on successful save', async () => {
    const c = useAdminVerticalConfig()
    c.config.value = { id: 'cfg-1', vertical: 'tracciona' } as never
    const result = await c.saveFields({ name: { es: 'Updated' } } as never)
    expect(result).toBe(true)
  })

  it('merges saved fields into config', async () => {
    const c = useAdminVerticalConfig()
    c.config.value = { id: 'cfg-1', vertical: 'tracciona', name: { es: 'Old' } } as never
    await c.saveFields({ name: { es: 'New' } } as never)
    expect((c.config.value as Record<string, unknown>)?.name).toEqual({ es: 'New' })
  })

  it('sets saved=true on success', async () => {
    const c = useAdminVerticalConfig()
    c.config.value = { id: 'cfg-1', vertical: 'tracciona' } as never
    await c.saveFields({})
    expect(c.saved.value).toBe(true)
  })

  it('resets saved to false after 3s timeout', async () => {
    vi.useFakeTimers()
    const c = useAdminVerticalConfig()
    c.config.value = { id: 'cfg-1', vertical: 'tracciona' } as never
    await c.saveFields({})
    expect(c.saved.value).toBe(true)
    vi.advanceTimersByTime(3000)
    expect(c.saved.value).toBe(false)
    vi.useRealTimers()
  })

  it('returns false and sets error on save failure', async () => {
    mockFrom.mockReturnValue(makeChain({ error: new Error('write error') }))
    const c = useAdminVerticalConfig()
    c.config.value = { id: 'cfg-1', vertical: 'tracciona' } as never
    const result = await c.saveFields({ name: { es: 'X' } } as never)
    expect(result).toBe(false)
    expect(c.error.value).toBe('write error')
  })
})

// ─── invalidateCache ──────────────────────────────────────────────────────

describe('invalidateCache', () => {
  it('sets config.value to null', () => {
    const c = useAdminVerticalConfig()
    c.config.value = { id: 'cfg-1' } as never
    c.invalidateCache()
    expect(c.config.value).toBeNull()
  })
})
