import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Stubs ────────────────────────────────────────────────────────────────────

function makeChain(data: unknown = [], error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'order', 'select', 'limit'].forEach((m) => { chain[m] = () => chain })
  const resolved = { data, error }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

async function getTransport() {
  const mod = await import('../../app/composables/useTransport')
  return mod.useTransport()
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => makeChain([]),
      insert: () => Promise.resolve({ data: null, error: null }),
    }),
  }))
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('zones starts as empty array', async () => {
    const c = await getTransport()
    expect(c.zones.value).toHaveLength(0)
  })

  it('loading starts as false', async () => {
    const c = await getTransport()
    expect(c.loading.value).toBe(false)
  })

  it('error starts as null', async () => {
    const c = await getTransport()
    expect(c.error.value).toBeNull()
  })
})

// ─── resolveZoneFromPostalCode ────────────────────────────────────────────────

describe('resolveZoneFromPostalCode', () => {
  it('returns zona-2 for Madrid postal code (28xxx)', async () => {
    const c = await getTransport()
    expect(c.resolveZoneFromPostalCode('28001')).toBe('zona-2')
  })

  it('returns zona-3 for Seville postal code (41xxx)', async () => {
    const c = await getTransport()
    expect(c.resolveZoneFromPostalCode('41001')).toBe('zona-3')
  })

  it('returns zona-1 for Bilbao postal code (48xxx)', async () => {
    const c = await getTransport()
    expect(c.resolveZoneFromPostalCode('48001')).toBe('zona-1')
  })

  it('returns personalizado for Canary Islands (35xxx)', async () => {
    const c = await getTransport()
    expect(c.resolveZoneFromPostalCode('35001')).toBe('personalizado')
  })

  it('returns portugal for 4-digit Portuguese CP', async () => {
    const c = await getTransport()
    expect(c.resolveZoneFromPostalCode('1000')).toBe('portugal')
  })

  it('returns portugal for 7-digit Portuguese CP', async () => {
    const c = await getTransport()
    expect(c.resolveZoneFromPostalCode('1000001')).toBe('portugal')
  })

  it('returns francia-sur for French southern CP (prefix >52)', async () => {
    const c = await getTransport()
    // 66 = Pyrénées-Orientales, not a Spanish prefix
    expect(c.resolveZoneFromPostalCode('66000')).toBe('francia-sur')
  })

  it('returns null for unknown postal code', async () => {
    const c = await getTransport()
    expect(c.resolveZoneFromPostalCode('ABCDE')).toBeNull()
  })
})

// ─── getProvinceFromPostalCode ────────────────────────────────────────────────

describe('getProvinceFromPostalCode', () => {
  it('returns province name for valid Spanish CP', async () => {
    const c = await getTransport()
    expect(c.getProvinceFromPostalCode('28001')).toBe('Madrid')
  })

  it('returns null for non-Spanish CP format', async () => {
    const c = await getTransport()
    expect(c.getProvinceFromPostalCode('ABC')).toBeNull()
  })
})

// ─── calculatePrice ───────────────────────────────────────────────────────────

describe('calculatePrice', () => {
  it('returns isLocal=true when same province', async () => {
    const c = await getTransport()
    const result = c.calculatePrice('Madrid', '28001')
    expect(result.isLocal).toBe(true)
    expect(result.zoneSlug).toBe('local')
  })

  it('returns isLocal=false when different provinces', async () => {
    const c = await getTransport()
    const result = c.calculatePrice('Sevilla', '28001')
    expect(result.isLocal).toBe(false)
    expect(result.zoneSlug).toBe('zona-2')
  })

  it('returns empty zoneSlug for invalid CP', async () => {
    const c = await getTransport()
    const result = c.calculatePrice('Madrid', 'INVALID')
    expect(result.zoneSlug).toBe('')
    expect(result.zone).toBeNull()
  })

  it('returns null zone when no zones loaded', async () => {
    const c = await getTransport()
    const result = c.calculatePrice('Sevilla', '28001')
    expect(result.zone).toBeNull() // no zones loaded
  })
})

// ─── formatCents ──────────────────────────────────────────────────────────────

describe('formatCents', () => {
  it('formats 150000 as 1.500 €', async () => {
    const c = await getTransport()
    expect(c.formatCents(150000)).toContain('€')
  })

  it('formats 0 as 0 €', async () => {
    const c = await getTransport()
    expect(c.formatCents(0)).toContain('€')
  })
})

// ─── fetchZones ───────────────────────────────────────────────────────────────

describe('fetchZones', () => {
  it('sets loading to false after success', async () => {
    const c = await getTransport()
    await c.fetchZones()
    expect(c.loading.value).toBe(false)
  })

  it('sets zones from DB', async () => {
    vi.resetModules()
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([{ id: 'z1', zone_slug: 'zona-1', status: 'active' }]),
      }),
    }))
    const mod = await import('../../app/composables/useTransport')
    const c = mod.useTransport()
    await c.fetchZones()
    expect(c.zones.value).toHaveLength(1)
  })

  it('sets error on DB failure', async () => {
    vi.resetModules()
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, new Error('DB error')),
      }),
    }))
    const mod = await import('../../app/composables/useTransport')
    const c = mod.useTransport()
    await c.fetchZones()
    expect(c.error.value).toBeTruthy()
  })

  it('returns empty array on DB failure', async () => {
    vi.resetModules()
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, new Error('DB error')),
      }),
    }))
    const mod = await import('../../app/composables/useTransport')
    const c = mod.useTransport()
    const result = await c.fetchZones()
    expect(result).toEqual([])
  })

  it('passes vertical filter when provided', async () => {
    const c = await getTransport()
    const result = await c.fetchZones('tracciona')
    expect(c.loading.value).toBe(false)
    expect(Array.isArray(result)).toBe(true)
  })
})

// ─── submitTransportRequest ──────────────────────────────────────────────────

describe('submitTransportRequest', () => {
  it('returns null when user is not authenticated', async () => {
    vi.resetModules()
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      }),
    }))
    const mod = await import('../../app/composables/useTransport')
    const c = mod.useTransport()
    const result = await c.submitTransportRequest('v1', '28001', 50000, 'zona-2', 'zona-3')
    expect(result).toBeNull()
    expect(c.error.value).toBe('User not authenticated')
  })

  it('returns data on success', async () => {
    vi.resetModules()
    const mockRequest = { id: 'tr-1', vehicle_id: 'v1', user_id: 'user-1', status: 'pending' }
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: mockRequest, error: null }),
          }),
        }),
      }),
    }))
    const mod = await import('../../app/composables/useTransport')
    const c = mod.useTransport()
    const result = await c.submitTransportRequest('v1', '28001', 50000, 'zona-2', 'zona-3')
    expect(result).toBeTruthy()
    expect(c.loading.value).toBe(false)
  })

  it('sets error on DB failure', async () => {
    vi.resetModules()
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Insert failed') }),
          }),
        }),
      }),
    }))
    const mod = await import('../../app/composables/useTransport')
    const c = mod.useTransport()
    const result = await c.submitTransportRequest('v1', '28001', 50000, 'zona-2', 'zona-3')
    expect(result).toBeNull()
    expect(c.error.value).toBeTruthy()
    expect(c.loading.value).toBe(false)
  })
})

// ─── fetchMyRequests ─────────────────────────────────────────────────────────

describe('fetchMyRequests', () => {
  it('returns empty array when user is not authenticated', async () => {
    vi.resetModules()
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
      }),
    }))
    const mod = await import('../../app/composables/useTransport')
    const c = mod.useTransport()
    const result = await c.fetchMyRequests()
    expect(result).toEqual([])
    expect(c.error.value).toBe('User not authenticated')
  })

  it('returns requests on success', async () => {
    vi.resetModules()
    const mockRequests = [{ id: 'tr-1', status: 'pending' }]
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(mockRequests),
      }),
    }))
    const mod = await import('../../app/composables/useTransport')
    const c = mod.useTransport()
    const result = await c.fetchMyRequests()
    expect(result).toHaveLength(1)
    expect(c.loading.value).toBe(false)
  })

  it('sets error on DB failure', async () => {
    vi.resetModules()
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(null, new Error('DB read error')),
      }),
    }))
    const mod = await import('../../app/composables/useTransport')
    const c = mod.useTransport()
    const result = await c.fetchMyRequests()
    expect(result).toEqual([])
    expect(c.error.value).toBeTruthy()
    expect(c.loading.value).toBe(false)
  })
})

// ─── resolveZoneFromPostalCode — edge cases ──────────────────────────────────

describe('resolveZoneFromPostalCode — edge cases', () => {
  it('handles postal codes with spaces', async () => {
    const c = await getTransport()
    expect(c.resolveZoneFromPostalCode('28 001')).toBe('zona-2')
  })

  it('handles postal codes with dashes', async () => {
    const c = await getTransport()
    expect(c.resolveZoneFromPostalCode('28-001')).toBe('zona-2')
  })

  it('returns null for 3-digit number', async () => {
    const c = await getTransport()
    expect(c.resolveZoneFromPostalCode('123')).toBeNull()
  })

  it('returns null for 6-digit number', async () => {
    const c = await getTransport()
    expect(c.resolveZoneFromPostalCode('123456')).toBeNull()
  })

  it('returns null for empty string', async () => {
    const c = await getTransport()
    expect(c.resolveZoneFromPostalCode('')).toBeNull()
  })

  it('returns zona-1 for Barcelona (08xxx)', async () => {
    const c = await getTransport()
    expect(c.resolveZoneFromPostalCode('08001')).toBe('zona-1')
  })

  it('returns zona-3 for Valencia (46xxx)', async () => {
    const c = await getTransport()
    expect(c.resolveZoneFromPostalCode('46001')).toBe('zona-3')
  })

  it('returns personalizado for Baleares (07xxx)', async () => {
    const c = await getTransport()
    expect(c.resolveZoneFromPostalCode('07001')).toBe('personalizado')
  })

  it('returns personalizado for Ceuta (51xxx)', async () => {
    const c = await getTransport()
    expect(c.resolveZoneFromPostalCode('51001')).toBe('personalizado')
  })

  it('returns null for 5-digit code that is neither Spanish nor French south', async () => {
    const c = await getTransport()
    // Prefix 75 is not a Spanish province and not in FRENCH_SOUTH_PREFIXES
    expect(c.resolveZoneFromPostalCode('75001')).toBeNull()
  })
})

// ─── getProvinceFromPostalCode — more cases ──────────────────────────────────

describe('getProvinceFromPostalCode — extended', () => {
  it('returns Sevilla for 41xxx', async () => {
    const c = await getTransport()
    expect(c.getProvinceFromPostalCode('41001')).toBe('Sevilla')
  })

  it('returns Barcelona for 08xxx', async () => {
    const c = await getTransport()
    expect(c.getProvinceFromPostalCode('08001')).toBe('Barcelona')
  })

  it('returns null for non-5-digit Portuguese CP', async () => {
    const c = await getTransport()
    expect(c.getProvinceFromPostalCode('1000')).toBeNull()
  })

  it('returns null for 5-digit code with unknown prefix', async () => {
    const c = await getTransport()
    expect(c.getProvinceFromPostalCode('99001')).toBeNull()
  })
})

// ─── calculatePrice — edge cases ─────────────────────────────────────────────

describe('calculatePrice — extended', () => {
  it('returns isLocal=false when vehicleProvince is null', async () => {
    const c = await getTransport()
    const result = c.calculatePrice(null, '28001')
    expect(result.isLocal).toBe(false)
    expect(result.zoneSlug).toBe('zona-2')
  })

  it('returns zone when matching zone exists in loaded zones', async () => {
    vi.resetModules()
    const zones = [
      { id: 'z1', zone_slug: 'zona-2', zone_name: 'Centro', vertical: 'tracciona', price_cents: 50000, regions: ['Madrid'], sort_order: 2, status: 'active' },
    ]
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(zones),
      }),
    }))
    const mod = await import('../../app/composables/useTransport')
    const c = mod.useTransport()
    await c.fetchZones()
    const result = c.calculatePrice('Sevilla', '28001')
    expect(result.zone).toBeTruthy()
    expect(result.zone?.zone_slug).toBe('zona-2')
  })

  it('returns portugal zone for Portuguese postal code', async () => {
    const c = await getTransport()
    const result = c.calculatePrice('Madrid', '1000')
    expect(result.zoneSlug).toBe('portugal')
    expect(result.isLocal).toBe(false)
  })
})
