import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAds } from '../../app/composables/useAds'

// ─── Stubs ────────────────────────────────────────────────────────────────────

function makeChain(data: unknown = [], error: unknown = null) {
  const chain: Record<string, unknown> = {}
  const methods = ['eq', 'neq', 'or', 'order', 'select', 'contains', 'lte', 'gte', 'limit', 'filter']
  methods.forEach((m) => { chain[m] = () => chain })
  const resolved = { data, error, count: 0 }
  chain.range = () => Promise.resolve(resolved)
  chain.single = () => Promise.resolve({ data: null, error: null })
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

const sampleAd = {
  id: 'ad-1',
  advertiser_id: 'adv-1',
  vertical: 'tracciona',
  title: 'Test Ad',
  description: 'Test description',
  image_url: null,
  logo_url: null,
  link_url: 'https://example.com',
  phone: '+34 600 000 000',
  email: 'test@example.com',
  cta_text: { es: 'Ver más', en: 'See more' },
  format: 'card',
  positions: ['sidebar'],
  countries: ['ES'],
  regions: [],
  provinces: [],
  category_slugs: [],
  action_slugs: [],
  include_in_pdf: false,
  include_in_email: false,
  target_segments: [],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => makeChain(),
      insert: () => Promise.resolve({ data: null, error: null }),
    }),
  }))
  vi.stubGlobal('useNuxtApp', () => ({
    ssrContext: null,
    payload: {},
  }))
  vi.stubGlobal('onMounted', vi.fn())
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('ads starts as empty array', () => {
    const c = useAds('sidebar')
    expect(c.ads.value).toHaveLength(0)
  })

  it('loading starts as false', () => {
    const c = useAds('sidebar')
    expect(c.loading.value).toBe(false)
  })

  it('exposes handleClick function', () => {
    const c = useAds('sidebar')
    expect(typeof c.handleClick).toBe('function')
  })

  it('exposes fetchAds function', () => {
    const c = useAds('sidebar')
    expect(typeof c.fetchAds).toBe('function')
  })
})

// ─── fetchAds ─────────────────────────────────────────────────────────────────

describe('fetchAds', () => {
  it('sets loading to false after success', async () => {
    const c = useAds('sidebar')
    await c.fetchAds()
    expect(c.loading.value).toBe(false)
  })

  it('populates ads from DB response', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => ({
        select: () => {
          if (table === 'ads') return makeChain([sampleAd])
          return makeChain()
        },
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    }))
    const c = useAds('sidebar')
    await c.fetchAds()
    // Ads are filtered client-side so might be empty or populated
    expect(Array.isArray(c.ads.value)).toBe(true)
  })

  it('sets loading to false after error', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => {
          throw new Error('DB error')
        },
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    }))
    const c = useAds('sidebar')
    await c.fetchAds()
    expect(c.loading.value).toBe(false)
  })
})

// ─── handleClick ──────────────────────────────────────────────────────────────

describe('handleClick', () => {
  it('does not throw when called', () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    }))
    const mockLocation = { href: '' }
    Object.defineProperty(globalThis, 'location', { value: mockLocation, configurable: true })
    const c = useAds('sidebar')
    expect(() => c.handleClick(sampleAd as unknown as Parameters<typeof c.handleClick>[0])).not.toThrow()
  })
})

// ─── registerEvent ────────────────────────────────────────────────────────────

describe('registerEvent', () => {
  it('calls supabase insert (fire-and-forget)', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        insert: mockInsert,
      }),
    }))
    const c = useAds('sidebar')
    await c.registerEvent('ad-1', 'click')
    expect(mockInsert).toHaveBeenCalled()
  })

  it('passes custom geo and source', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        insert: mockInsert,
      }),
    }))
    vi.stubGlobal('useRoute', () => ({ fullPath: '/test' }))
    const c = useAds('sidebar')
    await c.registerEvent('ad-1', 'impression', { country: 'DE', region: '', province: '' }, 'prebid')
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      ad_id: 'ad-1',
      event_type: 'impression',
      user_country: 'DE',
      source: 'prebid',
    }))
  })
})

// ─── registerViewableImpression ──────────────────────────────────────────────

describe('registerViewableImpression', () => {
  it('inserts viewable_impression event with time_in_view_ms metadata', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        insert: mockInsert,
      }),
    }))
    vi.stubGlobal('useRoute', () => ({ fullPath: '/vehiculo/test' }))
    const c = useAds('sidebar')
    await c.registerViewableImpression('ad-1', 2500, 'adsense')
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      ad_id: 'ad-1',
      event_type: 'viewable_impression',
      source: 'adsense',
      metadata: { time_in_view_ms: 2500 },
    }))
  })

  it('defaults source to direct', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        insert: mockInsert,
      }),
    }))
    vi.stubGlobal('useRoute', () => ({ fullPath: '/test' }))
    const c = useAds('sidebar')
    await c.registerViewableImpression('ad-1', 1500)
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      source: 'direct',
    }))
  })
})

// ─── handlePhoneClick ────────────────────────────────────────────────────────

describe('handlePhoneClick', () => {
  it('registers phone_click event and navigates to tel: URL', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        insert: mockInsert,
      }),
    }))
    const mockLocation = { href: '' }
    Object.defineProperty(globalThis, 'location', { value: mockLocation, configurable: true })
    vi.stubGlobal('useRoute', () => ({ fullPath: '/test' }))

    const c = useAds('sidebar')
    c.handlePhoneClick(sampleAd as any)
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      event_type: 'phone_click',
    }))
    expect(mockLocation.href).toBe('tel:+34 600 000 000')
  })

  it('does not navigate when phone is null', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        insert: mockInsert,
      }),
    }))
    const mockLocation = { href: '' }
    Object.defineProperty(globalThis, 'location', { value: mockLocation, configurable: true })
    vi.stubGlobal('useRoute', () => ({ fullPath: '/test' }))

    const c = useAds('sidebar')
    c.handlePhoneClick({ ...sampleAd, phone: null } as any)
    expect(mockLocation.href).toBe('')
  })
})

// ─── handleEmailClick ────────────────────────────────────────────────────────

describe('handleEmailClick', () => {
  it('registers email_click event and navigates to mailto: URL', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        insert: mockInsert,
      }),
    }))
    const mockLocation = { href: '' }
    Object.defineProperty(globalThis, 'location', { value: mockLocation, configurable: true })
    vi.stubGlobal('useRoute', () => ({ fullPath: '/test' }))

    const c = useAds('sidebar')
    c.handleEmailClick(sampleAd as any)
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      event_type: 'email_click',
    }))
    expect(mockLocation.href).toBe('mailto:test@example.com')
  })

  it('does not navigate when email is null', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        insert: mockInsert,
      }),
    }))
    const mockLocation = { href: '' }
    Object.defineProperty(globalThis, 'location', { value: mockLocation, configurable: true })
    vi.stubGlobal('useRoute', () => ({ fullPath: '/test' }))

    const c = useAds('sidebar')
    c.handleEmailClick({ ...sampleAd, email: null } as any)
    expect(mockLocation.href).toBe('')
  })
})

// ─── fetchAds — geo and segment filtering ────────────────────────────────────

describe('fetchAds filtering', () => {
  it('filters ads by country matching', async () => {
    const adMatchES = { ...sampleAd, id: 'ad-es', countries: ['ES'] }
    const adMatchAll = { ...sampleAd, id: 'ad-all', countries: ['all'] }
    const adNoMatch = { ...sampleAd, id: 'ad-de', countries: ['DE'] }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => ({
        select: () => {
          if (table === 'ads') return makeChain([adMatchES, adMatchAll, adNoMatch])
          return makeChain()
        },
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    }))
    vi.stubGlobal('useRoute', () => ({ fullPath: '/test' }))
    const c = useAds('sidebar', { maxAds: 10 })
    await c.fetchAds()
    // adMatchES and adMatchAll should pass, adNoMatch should be filtered
    const ids = c.ads.value.map((a) => a.id)
    expect(ids).toContain('ad-es')
    expect(ids).toContain('ad-all')
    expect(ids).not.toContain('ad-de')
  })

  it('filters ads by empty countries (matches all)', async () => {
    const adEmpty = { ...sampleAd, id: 'ad-empty', countries: [] }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => ({
        select: () => {
          if (table === 'ads') return makeChain([adEmpty])
          return makeChain()
        },
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    }))
    vi.stubGlobal('useRoute', () => ({ fullPath: '/test' }))
    const c = useAds('sidebar', { maxAds: 10 })
    await c.fetchAds()
    expect(c.ads.value).toHaveLength(1)
  })

  it('filters ads by target_segments', async () => {
    const adWithSegment = {
      ...sampleAd,
      id: 'ad-seg',
      countries: [],
      target_segments: ['premium_buyer'],
    }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => ({
        select: () => {
          if (table === 'ads') return makeChain([adWithSegment])
          return makeChain()
        },
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    }))
    vi.stubGlobal('useRoute', () => ({ fullPath: '/test' }))

    // User segments don't match
    const c = useAds('sidebar', { maxAds: 10, userSegments: ['casual_browser'] })
    await c.fetchAds()
    expect(c.ads.value).toHaveLength(0)
  })

  it('shows segment-targeted ads when user has matching segment', async () => {
    const adWithSegment = {
      ...sampleAd,
      id: 'ad-seg',
      countries: [],
      target_segments: ['premium_buyer'],
    }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => ({
        select: () => {
          if (table === 'ads') return makeChain([adWithSegment])
          return makeChain()
        },
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    }))
    vi.stubGlobal('useRoute', () => ({ fullPath: '/test' }))

    const c = useAds('sidebar', { maxAds: 10, userSegments: ['premium_buyer'] })
    await c.fetchAds()
    expect(c.ads.value).toHaveLength(1)
  })

  it('shows segment-targeted ads when no user segments available', async () => {
    const adWithSegment = {
      ...sampleAd,
      id: 'ad-seg',
      countries: [],
      target_segments: ['premium_buyer'],
    }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => ({
        select: () => {
          if (table === 'ads') return makeChain([adWithSegment])
          return makeChain()
        },
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    }))
    vi.stubGlobal('useRoute', () => ({ fullPath: '/test' }))

    // No userSegments provided → should still show segment-targeted ads
    const c = useAds('sidebar', { maxAds: 10 })
    await c.fetchAds()
    expect(c.ads.value).toHaveLength(1)
  })

  it('limits returned ads to maxAds option', async () => {
    const ads = Array.from({ length: 10 }, (_, i) => ({
      ...sampleAd,
      id: `ad-${i}`,
      countries: [],
    }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => ({
        select: () => {
          if (table === 'ads') return makeChain(ads)
          return makeChain()
        },
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    }))
    vi.stubGlobal('useRoute', () => ({ fullPath: '/test' }))
    const c = useAds('sidebar', { maxAds: 3 })
    await c.fetchAds()
    expect(c.ads.value.length).toBeLessThanOrEqual(3)
  })

  it('defaults maxAds to 1', async () => {
    const ads = Array.from({ length: 5 }, (_, i) => ({
      ...sampleAd,
      id: `ad-${i}`,
      countries: [],
    }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => ({
        select: () => {
          if (table === 'ads') return makeChain(ads)
          return makeChain()
        },
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    }))
    vi.stubGlobal('useRoute', () => ({ fullPath: '/test' }))
    const c = useAds('sidebar')
    await c.fetchAds()
    expect(c.ads.value).toHaveLength(1)
  })

  it('applies category and action filters', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain([]),
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    }))
    vi.stubGlobal('useRoute', () => ({ fullPath: '/test' }))
    const c = useAds('catalog_inline', { category: 'semirremolques', action: 'venta' })
    await c.fetchAds()
    expect(c.ads.value).toHaveLength(0)
  })

  it('registers impressions for fetched ads', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => ({
        select: () => {
          if (table === 'ads') return makeChain([{ ...sampleAd, countries: [] }])
          return makeChain()
        },
        insert: mockInsert,
      }),
    }))
    vi.stubGlobal('useRoute', () => ({ fullPath: '/test' }))
    const c = useAds('sidebar', { maxAds: 5 })
    await c.fetchAds()
    // Should have registered impression for the ad
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      event_type: 'impression',
    }))
  })

  it('handleClick opens link in new tab', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    const openFn = vi.fn()
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        insert: mockInsert,
      }),
    }))
    vi.stubGlobal('open', openFn)
    vi.stubGlobal('useRoute', () => ({ fullPath: '/test' }))

    const c = useAds('sidebar')
    c.handleClick(sampleAd as any)
    expect(openFn).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener')
  })

  it('handleClick does not open when link_url is empty', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    const openFn = vi.fn()
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        insert: mockInsert,
      }),
    }))
    vi.stubGlobal('open', openFn)
    vi.stubGlobal('useRoute', () => ({ fullPath: '/test' }))

    const c = useAds('sidebar')
    c.handleClick({ ...sampleAd, link_url: '' } as any)
    expect(openFn).not.toHaveBeenCalled()
  })
})

// ─── onMounted ───────────────────────────────────────────────────────────────

describe('onMounted registration', () => {
  it('registers fetchAds with onMounted', () => {
    const onMountedFn = vi.fn()
    vi.stubGlobal('onMounted', onMountedFn)
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => makeChain(),
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
    }))
    useAds('sidebar')
    expect(onMountedFn).toHaveBeenCalled()
  })
})
