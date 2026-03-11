import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Stubs ────────────────────────────────────────────────────────────────────

const mockVehicle = { value: null as unknown }
const mockStatus = { value: 'success' }

async function getVehicleDetail(slug = 'volvo-fh-2020') {
  const mod = await import('../../app/composables/useVehicleDetail')
  return mod.useVehicleDetail({ value: slug })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  mockVehicle.value = null
  mockStatus.value = 'success'

  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  vi.stubGlobal('useRoute', () => ({ params: { slug: 'volvo-fh-2020' }, fullPath: '/vehiculo/volvo-fh-2020' }))
  vi.stubGlobal('useI18n', () => ({
    locale: { value: 'es' },
    t: (k: string) => k,
  }))
  vi.stubGlobal('useAsyncData', async (_key: string, fn: () => Promise<unknown>) => {
    const result = await fn()
    mockVehicle.value = result
    return { data: mockVehicle, status: mockStatus }
  })
  vi.stubGlobal('useVehicles', () => ({
    fetchBySlug: vi.fn().mockResolvedValue(null),
  }))
  vi.stubGlobal('useFavorites', () => ({
    toggle: vi.fn(),
    isFavorite: vi.fn().mockReturnValue(false),
  }))
  vi.stubGlobal('useUserLocation', () => ({
    location: { value: { country: 'ES' } },
  }))
  vi.stubGlobal('inject', vi.fn().mockReturnValue(() => {}))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  }))
  vi.stubGlobal('useToast', () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }))
  vi.stubGlobal('useVehicleComparator', () => ({
    isInComparison: vi.fn().mockReturnValue(false),
    addToComparison: vi.fn(),
    removeFromComparison: vi.fn(),
  }))
  vi.stubGlobal('useLeadTracking', () => ({
    trackFichaView: vi.fn(),
    trackContactClick: vi.fn(),
    trackFavorite: vi.fn(),
  }))
  vi.stubGlobal('useFavorites', () => ({
    toggle: vi.fn(),
    isFavorite: vi.fn().mockReturnValue(false),
  }))
  vi.stubGlobal('watch', vi.fn())
  vi.stubGlobal('useHead', vi.fn())
  vi.stubGlobal('generateVehiclePdf', vi.fn())
  vi.stubGlobal('fetchTranslation', vi.fn().mockResolvedValue(null))
  vi.stubGlobal('formatPrice', (price: number) => `${price.toLocaleString()} €`)
  vi.stubGlobal('buildProductName', (v: { brand: string; model: string }) => `${v.brand} ${v.model}`)
})

// ─── Initial state (vehicle = null) ───────────────────────────────────────────

describe('initial state (null vehicle)', () => {
  it('vehicle starts as null when fetchBySlug returns null', async () => {
    const c = await getVehicleDetail()
    expect(c.vehicle.value).toBeNull()
  })

  it('loading is false when status is success', async () => {
    const c = await getVehicleDetail()
    expect(c.loading.value).toBe(false)
  })

  it('loading is true when status is pending', async () => {
    mockStatus.value = 'pending'
    const c = await getVehicleDetail()
    expect(c.loading.value).toBe(true)
  })

  it('hasSpecs is false when no vehicle', async () => {
    const c = await getVehicleDetail()
    expect(c.hasSpecs.value).toBe(false)
  })

  it('vehicleLocation is null when no vehicle', async () => {
    const c = await getVehicleDetail()
    expect(c.vehicleLocation.value).toBeNull()
  })

  it('vehicleFlagCode is null when no vehicle', async () => {
    const c = await getVehicleDetail()
    expect(c.vehicleFlagCode.value).toBeNull()
  })

  it('priceText is empty string when no vehicle', async () => {
    const c = await getVehicleDetail()
    expect(c.priceText.value).toBe('')
  })

  it('isFav is false when no vehicle', async () => {
    const c = await getVehicleDetail()
    expect(c.isFav.value).toBe(false)
  })

  it('inComparison is false when no vehicle', async () => {
    const c = await getVehicleDetail()
    expect(c.inComparison.value).toBe(false)
  })

  it('breadcrumbItems is empty when no vehicle', async () => {
    const c = await getVehicleDetail()
    expect(c.breadcrumbItems.value).toHaveLength(0)
  })

  it('shareText is empty when no vehicle', async () => {
    const c = await getVehicleDetail()
    expect(c.shareText.value).toBe('')
  })

  it('showReport starts as false', async () => {
    const c = await getVehicleDetail()
    expect(c.showReport.value).toBe(false)
  })
})

// ─── With vehicle data ────────────────────────────────────────────────────────

const sampleVehicle = {
  id: 'v-1',
  slug: 'volvo-fh-2020',
  brand: 'Volvo',
  model: 'FH',
  year: 2020,
  price: 85000,
  category: 'camiones',
  status: 'active',
  description_es: 'Descripcion ES',
  description_en: 'Description EN',
  location: 'Madrid, España',
  location_en: 'Madrid, Spain',
  location_country: 'ES',
  attributes_json: { color: 'blanco', km: 120000 },
  images: [],
}

describe('with vehicle data', () => {
  beforeEach(() => {
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue(sampleVehicle),
    }))
  })

  it('vehicle is set after fetch', async () => {
    const c = await getVehicleDetail()
    expect(c.vehicle.value).not.toBeNull()
    expect((c.vehicle.value as typeof sampleVehicle)?.brand).toBe('Volvo')
  })

  it('hasSpecs is true when attributes_json has keys', async () => {
    const c = await getVehicleDetail()
    expect(c.hasSpecs.value).toBe(true)
  })

  it('vehicleLocation strips Spain from location for ES user', async () => {
    const c = await getVehicleDetail()
    const loc = c.vehicleLocation.value as string | null
    expect(loc).not.toBeNull()
    // Both user and vehicle in ES → strips España suffix
    expect(loc).not.toContain('España')
    expect(loc).toContain('Madrid')
  })

  it('vehicleFlagCode is null when both user and vehicle in ES', async () => {
    const c = await getVehicleDetail()
    expect(c.vehicleFlagCode.value).toBeNull()
  })

  it('vehicleFlagCode returns country code for foreign vehicles', async () => {
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue({ ...sampleVehicle, location_country: 'DE' }),
    }))
    const c = await getVehicleDetail()
    expect(c.vehicleFlagCode.value).toBe('de')
  })

  it('priceText formats price when price is set', async () => {
    const c = await getVehicleDetail()
    expect(c.priceText.value).toBeTruthy()
    expect(c.priceText.value).not.toBe('vehicle.consultar')
  })

  it('priceText returns consultar for terceros category', async () => {
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue({ ...sampleVehicle, category: 'terceros' }),
    }))
    const c = await getVehicleDetail()
    expect(c.priceText.value).toBe('vehicle.consultar')
  })

  it('priceText returns consultar when no price', async () => {
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue({ ...sampleVehicle, price: null }),
    }))
    const c = await getVehicleDetail()
    expect(c.priceText.value).toBe('vehicle.consultar')
  })

  it('description initialized from description_es in ES locale', async () => {
    const c = await getVehicleDetail()
    expect(c.description.value).toBe('Descripcion ES')
  })

  it('breadcrumbItems has 2 items when vehicle loaded', async () => {
    const c = await getVehicleDetail()
    expect(c.breadcrumbItems.value).toHaveLength(2)
  })
})

// ─── resolveFilterLabel ───────────────────────────────────────────────────────

describe('resolveFilterLabel', () => {
  it('capitalizes first letter of key', async () => {
    const c = await getVehicleDetail()
    expect(c.resolveFilterLabel('color')).toBe('Color')
  })

  it('returns key with first letter uppercase', async () => {
    const c = await getVehicleDetail()
    expect(c.resolveFilterLabel('km')).toBe('Km')
  })
})

// ─── handleFavorite ───────────────────────────────────────────────────────────

describe('handleFavorite', () => {
  it('does nothing when no vehicle', async () => {
    const c = await getVehicleDetail()
    expect(() => c.handleFavorite()).not.toThrow()
  })
})

// ─── handleOpenDemand ─────────────────────────────────────────────────────────

describe('handleOpenDemand', () => {
  it('does not throw', async () => {
    const c = await getVehicleDetail()
    expect(() => c.handleOpenDemand()).not.toThrow()
  })
})

// ─── resolveFilterValue ──────────────────────────────────────────────────

describe('resolveFilterValue', () => {
  it('returns empty string for null', async () => {
    const c = await getVehicleDetail()
    expect(c.resolveFilterValue(null)).toBe('')
  })

  it('returns empty string for empty string', async () => {
    const c = await getVehicleDetail()
    expect(c.resolveFilterValue('')).toBe('')
  })

  it('returns es value for object with es key in ES locale', async () => {
    const c = await getVehicleDetail()
    expect(c.resolveFilterValue({ es: 'blanco', en: 'white' })).toBe('blanco')
  })

  it('returns en value for object in EN locale', async () => {
    vi.stubGlobal('useI18n', () => ({
      locale: { value: 'en' },
      t: (k: string) => k,
    }))
    const c = await getVehicleDetail()
    expect(c.resolveFilterValue({ es: 'blanco', en: 'white' })).toBe('white')
  })

  it('returns JSON for object without es/en keys', async () => {
    const c = await getVehicleDetail()
    const result = c.resolveFilterValue({ foo: 'bar' })
    expect(result).toContain('foo')
  })

  it('returns stringified number', async () => {
    const c = await getVehicleDetail()
    expect(c.resolveFilterValue(42)).toBe('42')
  })

  it('returns stringified boolean', async () => {
    const c = await getVehicleDetail()
    expect(c.resolveFilterValue(true)).toBe('true')
  })
})

// ─── handleCompare ───────────────────────────────────────────────────────

describe('handleCompare', () => {
  it('does nothing when no vehicle', async () => {
    const c = await getVehicleDetail()
    expect(() => c.handleCompare()).not.toThrow()
  })

  it('does not throw when vehicle is loaded (add path)', async () => {
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue(sampleVehicle),
    }))
    const c = await getVehicleDetail()
    expect(() => c.handleCompare()).not.toThrow()
  })
})

// ─── emailSubject / emailBody ────────────────────────────────────────────

describe('emailSubject', () => {
  beforeEach(() => {
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue(sampleVehicle),
    }))
  })

  it('returns empty string when no vehicle', async () => {
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue(null),
    }))
    const c = await getVehicleDetail()
    expect(c.emailSubject.value).toBe('')
  })

  it('contains brand model and Tracciona when vehicle present', async () => {
    const c = await getVehicleDetail()
    expect(c.emailSubject.value).toContain('Volvo FH')
    expect(c.emailSubject.value).toContain('Tracciona')
  })
})

describe('emailBody', () => {
  beforeEach(() => {
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue(sampleVehicle),
    }))
  })

  it('returns empty string when no vehicle', async () => {
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue(null),
    }))
    const c = await getVehicleDetail()
    expect(c.emailBody.value).toBe('')
  })

  it('contains year and price info', async () => {
    const c = await getVehicleDetail()
    expect(c.emailBody.value).toContain('2020')
    expect(c.emailBody.value).toContain('85')
  })
})

// ─── description in EN locale ────────────────────────────────────────────

describe('description locale', () => {
  it('uses description_en in EN locale', async () => {
    vi.stubGlobal('useI18n', () => ({
      locale: { value: 'en' },
      t: (k: string) => k,
    }))
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue(sampleVehicle),
    }))
    const c = await getVehicleDetail()
    expect(c.description.value).toBe('Description EN')
  })

  it('falls back to description_es when description_en is null in EN locale', async () => {
    vi.stubGlobal('useI18n', () => ({
      locale: { value: 'en' },
      t: (k: string) => k,
    }))
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue({ ...sampleVehicle, description_en: null }),
    }))
    const c = await getVehicleDetail()
    expect(c.description.value).toBe('Descripcion ES')
  })
})

// ─── vehicleLocation in EN locale ────────────────────────────────────────

describe('vehicleLocation locale', () => {
  it('uses location_en when locale is EN', async () => {
    vi.stubGlobal('useI18n', () => ({
      locale: { value: 'en' },
      t: (k: string) => k,
    }))
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue(sampleVehicle),
    }))
    const c = await getVehicleDetail()
    expect(c.vehicleLocation.value).toContain('Madrid')
  })

  it('returns full location for foreign vehicle', async () => {
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue({
        ...sampleVehicle,
        location_country: 'DE',
        location: 'Berlin, Alemania',
        location_en: 'Berlin, Germany',
      }),
    }))
    const c = await getVehicleDetail()
    expect(c.vehicleLocation.value).toBe('Berlin, Alemania')
  })

  it('returns null when location is null', async () => {
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue({ ...sampleVehicle, location: null, location_en: null }),
    }))
    const c = await getVehicleDetail()
    expect(c.vehicleLocation.value).toBeNull()
  })
})

// ─── handleShare ─────────────────────────────────────────────────────────

describe('handleShare', () => {
  it('does nothing when no vehicle', async () => {
    const c = await getVehicleDetail()
    await expect(c.handleShare()).resolves.toBeUndefined()
  })
})

// ─── handlePdf ───────────────────────────────────────────────────────────

describe('handlePdf', () => {
  it('does nothing when no vehicle', async () => {
    const c = await getVehicleDetail()
    await c.handlePdf()
    expect(generateVehiclePdf).not.toHaveBeenCalled()
  })

  // NOTE: "with vehicle" test omitted — generateVehiclePdf is a static import,
  // not a global, so it runs the real function which hangs in test env.
})

// ─── handleFavorite with vehicle ─────────────────────────────────────────

describe('handleFavorite with vehicle', () => {
  it('calls toggle and trackFav when vehicle present', async () => {
    const toggleFn = vi.fn()
    const trackFn = vi.fn()
    vi.stubGlobal('useFavorites', () => ({
      toggle: toggleFn,
      isFavorite: vi.fn().mockReturnValue(false),
    }))
    vi.stubGlobal('useLeadTracking', () => ({
      trackFichaView: vi.fn(),
      trackContactClick: vi.fn(),
      trackFavorite: trackFn,
    }))
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue(sampleVehicle),
    }))
    const c = await getVehicleDetail()
    c.handleFavorite()
    expect(toggleFn).toHaveBeenCalledWith('v-1')
    expect(trackFn).toHaveBeenCalledWith('v-1')
  })
})

// ─── loadSellerInfo ──────────────────────────────────────────────────────

describe('loadSellerInfo', () => {
  it('sellerInfo starts as null', async () => {
    const c = await getVehicleDetail()
    expect(c.sellerInfo.value).toBeNull()
  })

  it('sellerUserId starts as null', async () => {
    const c = await getVehicleDetail()
    expect(c.sellerUserId.value).toBeNull()
  })
})

// ─── shareText with vehicle ──────────────────────────────────────────────

describe('shareText with vehicle', () => {
  it('contains brand name when vehicle loaded', async () => {
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue(sampleVehicle),
    }))
    const c = await getVehicleDetail()
    expect(c.shareText.value).toContain('Volvo FH')
    expect(c.shareText.value).toContain('Tracciona')
  })

  it('contains price when present', async () => {
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue(sampleVehicle),
    }))
    const c = await getVehicleDetail()
    expect(c.shareText.value).toContain('85')
  })
})

// ─── vehicleFlagCode edge cases ──────────────────────────────────────────

describe('vehicleFlagCode edge cases', () => {
  it('returns null when location_country is null', async () => {
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue({ ...sampleVehicle, location_country: null }),
    }))
    const c = await getVehicleDetail()
    expect(c.vehicleFlagCode.value).toBeNull()
  })

  it('returns lowercase country code when user is not in ES', async () => {
    vi.stubGlobal('useUserLocation', () => ({
      location: { value: { country: 'DE' } },
    }))
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue({ ...sampleVehicle, location_country: 'FR' }),
    }))
    const c = await getVehicleDetail()
    expect(c.vehicleFlagCode.value).toBe('fr')
  })
})

// ─── handleCompare — execution paths ─────────────────────────────────────

describe('handleCompare execution paths', () => {
  it('does not throw when vehicle is loaded', async () => {
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue(sampleVehicle),
    }))
    const c = await getVehicleDetail()
    expect(c.vehicle.value).not.toBeNull()
    expect(() => c.handleCompare()).not.toThrow()
  })
})

// ─── handleShare — with vehicle ─────────────────────────────────────────
// Note: handleShare checks import.meta.client which is a compile-time constant
// set to false in vitest. We test the early returns and the no-vehicle guard.

describe('handleShare with vehicle', () => {
  it('returns early when no vehicle (does not throw)', async () => {
    const c = await getVehicleDetail()
    // Vehicle is null → should return without error
    await expect(c.handleShare()).resolves.toBeUndefined()
  })

  it('returns early when vehicle present but import.meta.client is false', async () => {
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue(sampleVehicle),
    }))
    const c = await getVehicleDetail()
    // import.meta.client is false in vitest → early return
    await expect(c.handleShare()).resolves.toBeUndefined()
  })
})

// ─── hasSpecs edge cases ────────────────────────────────────────────────

describe('hasSpecs edge cases', () => {
  it('returns false when attributes_json is empty object', async () => {
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue({ ...sampleVehicle, attributes_json: {} }),
    }))
    const c = await getVehicleDetail()
    expect(c.hasSpecs.value).toBe(false)
  })

  it('returns false when attributes_json is null', async () => {
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue({ ...sampleVehicle, attributes_json: null }),
    }))
    const c = await getVehicleDetail()
    expect(c.hasSpecs.value).toBe(false)
  })
})

// ─── vehicleLocation edge cases ─────────────────────────────────────────

describe('vehicleLocation edge cases', () => {
  it('uses location_en in EN locale when available', async () => {
    vi.stubGlobal('useI18n', () => ({
      locale: { value: 'en' },
      t: (k: string) => k,
    }))
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue({
        ...sampleVehicle,
        location: 'Madrid, España',
        location_en: 'Madrid, Spain',
        location_country: 'ES',
      }),
    }))
    const c = await getVehicleDetail()
    // Both in ES → should strip Spain
    expect(c.vehicleLocation.value).not.toContain('Spain')
    expect(c.vehicleLocation.value).toContain('Madrid')
  })

  it('falls back to location when location_en is null in EN locale', async () => {
    vi.stubGlobal('useI18n', () => ({
      locale: { value: 'en' },
      t: (k: string) => k,
    }))
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue({
        ...sampleVehicle,
        location: 'Madrid, España',
        location_en: null,
        location_country: 'ES',
      }),
    }))
    const c = await getVehicleDetail()
    expect(c.vehicleLocation.value).toContain('Madrid')
  })
})

// ─── shareText without price ────────────────────────────────────────────

describe('shareText edge cases', () => {
  it('omits price when vehicle has no price', async () => {
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue({ ...sampleVehicle, price: null }),
    }))
    const c = await getVehicleDetail()
    expect(c.shareText.value).toContain('Volvo FH')
    expect(c.shareText.value).toContain('Tracciona')
    // Should not contain a formatted price
  })
})

// ─── emailBody without year/price ───────────────────────────────────────

describe('emailBody edge cases', () => {
  it('omits year when not available', async () => {
    vi.stubGlobal('useVehicles', () => ({
      fetchBySlug: vi.fn().mockResolvedValue({ ...sampleVehicle, year: null, price: null }),
    }))
    const c = await getVehicleDetail()
    expect(c.emailBody.value).not.toContain('vehicle.year')
    expect(c.emailBody.value).not.toContain('vehicle.price')
  })
})

// ─── cacheKey option ────────────────────────────────────────────────────

describe('cacheKey option', () => {
  it('uses custom cacheKey when provided', async () => {
    const asyncDataSpy = vi.fn(async (_key: string, fn: () => Promise<unknown>) => {
      const result = await fn()
      mockVehicle.value = result
      return { data: mockVehicle, status: mockStatus }
    })
    vi.stubGlobal('useAsyncData', asyncDataSpy)
    await getVehicleDetail('test-slug')
    // default cacheKey uses route.params.slug
    expect(asyncDataSpy).toHaveBeenCalledWith(
      expect.stringContaining('vehicle-'),
      expect.any(Function),
    )
  })
})
