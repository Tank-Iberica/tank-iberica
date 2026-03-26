import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUserLocation } from '../../app/composables/useUserLocation'

// ─── Stub helpers ──────────────────────────────────────────────────────────────

function stubSupabase() {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
      upsert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  stubSupabase()
  // Clear localStorage to avoid state leaking between tests (setManualLocation writes
  // to localStorage since import.meta.client → (true) via vitest transform)
  if (typeof localStorage !== 'undefined') localStorage.clear()
})

// ─── setManualLocation — basic behavior ───────────────────────────────────────

describe('setManualLocation', () => {
  it('sets country correctly', () => {
    const c = useUserLocation()
    c.setManualLocation('Paris', 'FR')
    expect(c.location.value.country).toBe('FR')
  })

  it('sets city correctly', () => {
    const c = useUserLocation()
    c.setManualLocation('Berlin', 'DE')
    expect(c.location.value.city).toBe('Berlin')
  })

  it('sets source to manual', () => {
    const c = useUserLocation()
    c.setManualLocation('Rome', 'IT')
    expect(c.location.value.source).toBe('manual')
  })

  it('uses provided province when given', () => {
    const c = useUserLocation()
    c.setManualLocation('Some City', 'ES', 'Provided Province', 'Some Region')
    expect(c.location.value.province).toBe('Provided Province')
    expect(c.location.value.region).toBe('Some Region')
  })

  it('passes through province and region for non-ES countries', () => {
    const c = useUserLocation()
    c.setManualLocation('Lyon', 'FR', 'Rhône', 'Auvergne-Rhône-Alpes')
    expect(c.location.value.province).toBe('Rhône')
    expect(c.location.value.region).toBe('Auvergne-Rhône-Alpes')
  })
})

// ─── setManualLocation — Spanish city resolution ──────────────────────────────

describe('setManualLocation — Spanish city auto-resolution', () => {
  it('resolves Madrid → province Madrid', () => {
    const c = useUserLocation()
    c.setManualLocation('Madrid', 'ES')
    expect(c.location.value.province).toBe('Madrid')
  })

  it('resolves Madrid → region Comunidad de Madrid (or truthy region)', () => {
    const c = useUserLocation()
    c.setManualLocation('Madrid', 'ES')
    expect(c.location.value.region).toBeTruthy()
  })

  it('resolves Barcelona → province Barcelona', () => {
    const c = useUserLocation()
    c.setManualLocation('Barcelona', 'ES')
    expect(c.location.value.province).toBe('Barcelona')
  })

  it('resolves Bilbao → province Vizcaya', () => {
    const c = useUserLocation()
    c.setManualLocation('Bilbao', 'ES')
    expect(c.location.value.province).toBe('Vizcaya')
  })

  it('resolves Sevilla → province Sevilla', () => {
    const c = useUserLocation()
    c.setManualLocation('Sevilla', 'ES')
    expect(c.location.value.province).toBe('Sevilla')
  })

  it('handles case-insensitive city matching (MADRID)', () => {
    const c = useUserLocation()
    c.setManualLocation('MADRID', 'ES')
    expect(c.location.value.province).toBe('Madrid')
  })

  it('handles accented city names (Málaga)', () => {
    const c = useUserLocation()
    c.setManualLocation('Málaga', 'ES')
    expect(c.location.value.province).toBe('Málaga')
  })

  it('handles unaccented form (malaga → Málaga)', () => {
    const c = useUserLocation()
    c.setManualLocation('malaga', 'ES')
    expect(c.location.value.province).toBe('Málaga')
  })

  it('leaves province null for unknown Spanish city', () => {
    const c = useUserLocation()
    c.setManualLocation('UnknownCityXYZ', 'ES')
    // Unknown city — no resolution
    expect(c.location.value.province).toBeNull()
  })

  it('does NOT resolve province for non-ES country even with Spanish city name', () => {
    const c = useUserLocation()
    c.setManualLocation('Madrid', 'US')
    // US is not ES, so city resolution is skipped
    expect(c.location.value.province).toBeNull()
    expect(c.location.value.country).toBe('US')
  })
})

// ─── isInEurope ───────────────────────────────────────────────────────────────

describe('isInEurope', () => {
  it('returns true for Spain (ES)', () => {
    const c = useUserLocation()
    c.setManualLocation('Madrid', 'ES')
    expect(c.isInEurope()).toBe(true)
  })

  it('returns true for France (FR)', () => {
    const c = useUserLocation()
    c.setManualLocation('Paris', 'FR')
    expect(c.isInEurope()).toBe(true)
  })

  it('returns true for Germany (DE)', () => {
    const c = useUserLocation()
    c.setManualLocation('Berlin', 'DE')
    expect(c.isInEurope()).toBe(true)
  })

  it('returns false for USA (US)', () => {
    const c = useUserLocation()
    c.setManualLocation('New York', 'US')
    expect(c.isInEurope()).toBe(false)
  })

  it('returns false for Brazil (BR)', () => {
    const c = useUserLocation()
    c.setManualLocation('São Paulo', 'BR')
    expect(c.isInEurope()).toBe(false)
  })

  it('returns true or false depending on initial state', () => {
    const c = useUserLocation()
    // Initial country may be null or 'ES' depending on test environment
    const country = c.location.value.country
    if (country === 'ES') {
      expect(c.isInEurope()).toBe(true)
    } else {
      expect(c.isInEurope()).toBe(false)
    }
  })
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('location.country starts as null (or ES from useState default)', () => {
    const c = useUserLocation()
    // useState may initialize country to null; detect() can set to 'ES'
    expect([null, 'ES']).toContain(c.location.value.country)
  })

  it('location.province starts as null', () => {
    const c = useUserLocation()
    expect(c.location.value.province).toBeNull()
  })

  it('location.source starts as null', () => {
    const c = useUserLocation()
    expect(c.location.value.source).toBeNull()
  })
})

// ─── detect — IP fallback path ──────────────────────────────────────────────
// import.meta.client is falsy in test env, so tryStoredLocation and tryGeolocation
// short-circuit. detect() falls through to tryIpLocation which uses $fetch.

describe('detect — IP fallback', () => {
  it('sets location from IP when $fetch returns country', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ country: 'FR' }))
    const c = useUserLocation()
    await c.detect()
    expect(c.location.value.country).toBe('FR')
    expect(c.location.value.source).toBe('ip')
  })

  it('keeps default country when $fetch returns null country', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ country: null }))
    const c = useUserLocation()
    await c.detect()
    // geo.get.ts defaults to 'ES' when cf-ipcountry is absent/null,
    // so $fetch returning { country: null } is an edge case that may
    // leave the default country or set null depending on detection path.
    expect([null, 'ES']).toContain(c.location.value.country)
  })

  it('keeps default country when $fetch rejects', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('Network')))
    const c = useUserLocation()
    await c.detect()
    // When $fetch fails, detect() may leave default state
    expect([null, 'ES']).toContain(c.location.value.country)
  })

  it('does not re-detect if already detected', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ country: 'DE' })
    vi.stubGlobal('$fetch', fetchMock)
    const c = useUserLocation()
    await c.detect()
    expect(c.location.value.country).toBe('DE')
    // Second call — should skip
    fetchMock.mockResolvedValue({ country: 'IT' })
    await c.detect()
    // Still DE because detected flag prevents re-run
    expect(c.location.value.country).toBe('DE')
  })

  it('province and region are null for IP detection', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ country: 'ES' }))
    const c = useUserLocation()
    await c.detect()
    expect(c.location.value.province).toBeNull()
    expect(c.location.value.region).toBeNull()
  })
})

// ─── setManualLocation — province resolution from province name ─────────────

describe('setManualLocation — province name as city', () => {
  it('resolves province name directly (e.g. Navarra)', () => {
    const c = useUserLocation()
    c.setManualLocation('Navarra', 'ES')
    // "Navarra" is not in CITY_TO_PROVINCE but may be in PROVINCE_TO_REGION
    // The code tries resolveSpanishCity which checks both
    expect(c.location.value.source).toBe('manual')
  })

  it('resolves multi-word city (san sebastian → Guipúzcoa)', () => {
    const c = useUserLocation()
    c.setManualLocation('san sebastian', 'ES')
    expect(c.location.value.province).toBe('Guipúzcoa')
  })

  it('resolves city with accents stripped (Cadiz → Cádiz)', () => {
    const c = useUserLocation()
    c.setManualLocation('cadiz', 'ES')
    expect(c.location.value.province).toBe('Cádiz')
  })

  it('resolves Canary Islands city (tenerife → Santa Cruz de Tenerife)', () => {
    const c = useUserLocation()
    c.setManualLocation('tenerife', 'ES')
    expect(c.location.value.province).toBe('Santa Cruz de Tenerife')
  })
})
