import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDashboardExportarAnuncio, PLATFORMS } from '../../app/composables/dashboard/useDashboardExportarAnuncio'

// ─── Stubs ────────────────────────────────────────────────────────────────────

const mockDealerProfile = { value: { id: 'dealer-1' } as unknown }

function makeChain(data: unknown = []) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'order', 'select'].forEach((m) => { chain[m] = () => chain })
  const resolved = { data, error: null }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

const sampleVehicle = {
  id: 'v-1',
  brand: 'Schmitz',
  model: 'S.KO',
  year: 2018,
  price: 25000,
  slug: 'schmitz-sko-2018',
  location: 'Madrid',
  description_es: 'Semirremolque frigorfico en excelente estado',
  description_en: null,
  category: 'semitrailers',
  status: 'published',
  vehicle_images: [{ url: 'https://cdn/img.jpg', position: 0 }],
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDealerProfile.value = { id: 'dealer-1' }
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  vi.stubGlobal('ref', (v: unknown) => {
    let _v = v
    return { get value() { return _v }, set value(x) { _v = x } }
  })
  vi.stubGlobal('watch', vi.fn())
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))
  vi.stubGlobal('useAuth', () => ({ userId: { value: 'user-1' } }))
  vi.stubGlobal('useDealerDashboard', () => ({
    dealerProfile: mockDealerProfile,
    loadDealer: vi.fn().mockResolvedValue(mockDealerProfile.value),
  }))
  vi.stubGlobal('useSubscriptionPlan', () => ({
    canExport: vi.fn().mockReturnValue(true),
    fetchSubscription: vi.fn().mockResolvedValue(undefined),
  }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => makeChain([sampleVehicle]),
  }))
  vi.stubGlobal('formatPrice', (n: number) => n.toLocaleString('es-ES'))
})

// ─── PLATFORMS constant ───────────────────────────────────────────────────────

describe('PLATFORMS', () => {
  it('has 5 platforms', () => {
    expect(PLATFORMS).toHaveLength(5)
  })

  it('includes milanuncios, wallapop, facebook, linkedin, instagram', () => {
    const keys = PLATFORMS.map((p) => p.key)
    expect(keys).toContain('milanuncios')
    expect(keys).toContain('wallapop')
    expect(keys).toContain('instagram')
  })

  it('milanuncios has maxChars 4000', () => {
    const m = PLATFORMS.find((p) => p.key === 'milanuncios')
    expect(m?.maxChars).toBe(4000)
  })

  it('wallapop has maxChars 640', () => {
    const w = PLATFORMS.find((p) => p.key === 'wallapop')
    expect(w?.maxChars).toBe(640)
  })
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('vehicles starts as empty array', () => {
    const c = useDashboardExportarAnuncio()
    expect(c.vehicles.value).toHaveLength(0)
  })

  it('selectedVehicleId starts as null', () => {
    const c = useDashboardExportarAnuncio()
    expect(c.selectedVehicleId.value).toBeNull()
  })

  it('selectedPlatform starts as milanuncios', () => {
    const c = useDashboardExportarAnuncio()
    expect(c.selectedPlatform.value).toBe('milanuncios')
  })

  it('generatedText starts as empty string', () => {
    const c = useDashboardExportarAnuncio()
    expect(c.generatedText.value).toBe('')
  })

  it('error starts as null', () => {
    const c = useDashboardExportarAnuncio()
    expect(c.error.value).toBeNull()
  })

  it('copySuccess starts as false', () => {
    const c = useDashboardExportarAnuncio()
    expect(c.copySuccess.value).toBe(false)
  })
})

// ─── selectedVehicle ──────────────────────────────────────────────────────────

describe('selectedVehicle', () => {
  it('returns null when no vehicle selected', () => {
    const c = useDashboardExportarAnuncio()
    expect(c.selectedVehicle.value).toBeNull()
  })

  it('returns matching vehicle when id is set', () => {
    const c = useDashboardExportarAnuncio()
    c.vehicles.value = [sampleVehicle]
    c.selectedVehicleId.value = 'v-1'
    expect(c.selectedVehicle.value?.brand).toBe('Schmitz')
  })

  it('returns null for unknown id', () => {
    const c = useDashboardExportarAnuncio()
    c.vehicles.value = [sampleVehicle]
    c.selectedVehicleId.value = 'unknown'
    expect(c.selectedVehicle.value).toBeNull()
  })
})

// ─── currentPlatformConfig ────────────────────────────────────────────────────

describe('currentPlatformConfig', () => {
  it('returns milanuncios config by default', () => {
    const c = useDashboardExportarAnuncio()
    expect(c.currentPlatformConfig.value.key).toBe('milanuncios')
  })

  it('returns config for selected platform', () => {
    const c = useDashboardExportarAnuncio()
    c.selectedPlatform.value = 'wallapop'
    expect(c.currentPlatformConfig.value.key).toBe('wallapop')
    expect(c.currentPlatformConfig.value.maxChars).toBe(640)
  })
})

// ─── charCount / charCountClass ───────────────────────────────────────────────

describe('charCount and charCountClass', () => {
  it('charCount returns text length', () => {
    const c = useDashboardExportarAnuncio()
    c.generatedText.value = 'Hello world'
    expect(c.charCount.value).toBe(11)
  })

  it('charCountClass returns count-ok for short text', () => {
    const c = useDashboardExportarAnuncio()
    c.generatedText.value = 'Short text'
    expect(c.charCountClass.value).toBe('count-ok')
  })

  it('charCountClass returns count-over when exceeds max', () => {
    const c = useDashboardExportarAnuncio()
    c.selectedPlatform.value = 'wallapop' // maxChars=640
    c.generatedText.value = 'x'.repeat(700)
    expect(c.charCountClass.value).toBe('count-over')
  })

  it('charCountClass returns count-warning when near limit', () => {
    const c = useDashboardExportarAnuncio()
    c.selectedPlatform.value = 'wallapop' // maxChars=640
    c.generatedText.value = 'x'.repeat(610) // >90% of 640
    expect(c.charCountClass.value).toBe('count-warning')
  })
})

// ─── thumbnail ────────────────────────────────────────────────────────────────

describe('thumbnail', () => {
  it('returns null when no vehicle selected', () => {
    const c = useDashboardExportarAnuncio()
    expect(c.thumbnail.value).toBeNull()
  })

  it('returns first image url sorted by position', () => {
    const c = useDashboardExportarAnuncio()
    c.vehicles.value = [sampleVehicle]
    c.selectedVehicleId.value = 'v-1'
    expect(c.thumbnail.value).toBe('https://cdn/img.jpg')
  })

  it('returns null for vehicle with no images', () => {
    const c = useDashboardExportarAnuncio()
    c.vehicles.value = [{ ...sampleVehicle, id: 'v-2', vehicle_images: [] }]
    c.selectedVehicleId.value = 'v-2'
    expect(c.thumbnail.value).toBeNull()
  })
})

// ─── setters ──────────────────────────────────────────────────────────────────

describe('setters', () => {
  it('setSelectedVehicleId updates selectedVehicleId', () => {
    const c = useDashboardExportarAnuncio()
    c.setSelectedVehicleId('v-42')
    expect(c.selectedVehicleId.value).toBe('v-42')
  })

  it('setSelectedPlatform updates selectedPlatform', () => {
    const c = useDashboardExportarAnuncio()
    c.setSelectedPlatform('instagram')
    expect(c.selectedPlatform.value).toBe('instagram')
  })

  it('setGeneratedText updates generatedText', () => {
    const c = useDashboardExportarAnuncio()
    c.setGeneratedText('Custom text')
    expect(c.generatedText.value).toBe('Custom text')
  })
})

// ─── handleGenerate ───────────────────────────────────────────────────────────

describe('handleGenerate', () => {
  it('does nothing when no vehicle selected', () => {
    const c = useDashboardExportarAnuncio()
    c.handleGenerate()
    expect(c.generatedText.value).toBe('')
  })

  it('generates text for milanuncios platform', () => {
    const c = useDashboardExportarAnuncio()
    c.vehicles.value = [sampleVehicle]
    c.selectedVehicleId.value = 'v-1'
    c.selectedPlatform.value = 'milanuncios'
    c.handleGenerate()
    expect(c.generatedText.value).toContain('Schmitz')
    expect(c.generatedText.value).toContain('S.KO')
  })

  it('generates text for wallapop (truncated to 640 chars)', () => {
    const c = useDashboardExportarAnuncio()
    const bigVehicle = { ...sampleVehicle, description_es: 'x'.repeat(1000) }
    c.vehicles.value = [bigVehicle]
    c.selectedVehicleId.value = 'v-1'
    c.selectedPlatform.value = 'wallapop'
    c.handleGenerate()
    expect(c.generatedText.value.length).toBeLessThanOrEqual(640)
  })

  it('generates text for instagram (includes hashtags)', () => {
    const c = useDashboardExportarAnuncio()
    c.vehicles.value = [sampleVehicle]
    c.selectedVehicleId.value = 'v-1'
    c.selectedPlatform.value = 'instagram'
    c.handleGenerate()
    expect(c.generatedText.value).toContain('#tracciona')
  })
})

// ─── init ─────────────────────────────────────────────────────────────────────

describe('init', () => {
  it('loads vehicles on init', async () => {
    const c = useDashboardExportarAnuncio()
    await c.init()
    expect(c.vehicles.value).toHaveLength(1)
    expect(c.vehicles.value[0].brand).toBe('Schmitz')
  })

  it('does not throw when no dealer', async () => {
    mockDealerProfile.value = null
    vi.stubGlobal('useDealerDashboard', () => ({
      dealerProfile: mockDealerProfile,
      loadDealer: vi.fn().mockResolvedValue(null),
    }))
    const c = useDashboardExportarAnuncio()
    await expect(c.init()).resolves.toBeUndefined()
  })
})
