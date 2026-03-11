import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminHomepage, sectionDefinitions } from '../../app/composables/admin/useAdminHomepage'

// ─── Hoisted mock functions ───────────────────────────────────────────────

const { mockLoadConfig, mockSaveFields, configRef } = vi.hoisted(() => ({
  mockLoadConfig: vi.fn().mockResolvedValue(undefined),
  mockSaveFields: vi.fn().mockResolvedValue(undefined),
  configRef: { value: null as unknown },
}))

// ─── Mock useAdminVerticalConfig ──────────────────────────────────────────

vi.mock('~/composables/admin/useAdminVerticalConfig', () => ({
  useAdminVerticalConfig: () => ({
    config: configRef,
    loading: { value: false },
    saving: { value: false },
    error: { value: null },
    saved: { value: false },
    loadConfig: mockLoadConfig,
    saveFields: mockSaveFields,
  }),
}))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  configRef.value = null
})

// ─── sectionDefinitions (exported constant) ───────────────────────────────

describe('sectionDefinitions', () => {
  it('has 8 sections', () => {
    expect(sectionDefinitions).toHaveLength(8)
  })

  it('includes featured_vehicles', () => {
    expect(sectionDefinitions.some((s) => s.key === 'featured_vehicles')).toBe(true)
  })

  it('includes newsletter_cta', () => {
    expect(sectionDefinitions.some((s) => s.key === 'newsletter_cta')).toBe(true)
  })

  it('each definition has key, label, description', () => {
    for (const def of sectionDefinitions) {
      expect(def).toHaveProperty('key')
      expect(def).toHaveProperty('label')
      expect(def).toHaveProperty('description')
    }
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('heroTitle starts with empty es and en', () => {
    const c = useAdminHomepage()
    expect(c.heroTitle.value).toEqual({ es: '', en: '' })
  })

  it('heroSubtitle starts with empty es and en', () => {
    const c = useAdminHomepage()
    expect(c.heroSubtitle.value).toEqual({ es: '', en: '' })
  })

  it('heroCtaUrl starts as empty string', () => {
    const c = useAdminHomepage()
    expect(c.heroCtaUrl.value).toBe('')
  })

  it('heroImageUrl starts as empty string', () => {
    const c = useAdminHomepage()
    expect(c.heroImageUrl.value).toBe('')
  })

  it('banners starts as empty array', () => {
    const c = useAdminHomepage()
    expect(c.banners.value).toEqual([])
  })

  it('homepageSections starts as empty object', () => {
    const c = useAdminHomepage()
    expect(c.homepageSections.value).toEqual({})
  })
})

// ─── Hero update helpers ──────────────────────────────────────────────────

describe('updateHeroTitle', () => {
  it('updates es lang', () => {
    const c = useAdminHomepage()
    c.updateHeroTitle('es', 'Compra y Vende')
    expect(c.heroTitle.value['es']).toBe('Compra y Vende')
  })

  it('updates en lang', () => {
    const c = useAdminHomepage()
    c.updateHeroTitle('en', 'Buy and Sell')
    expect(c.heroTitle.value['en']).toBe('Buy and Sell')
  })
})

describe('updateHeroSubtitle', () => {
  it('updates subtitle for es', () => {
    const c = useAdminHomepage()
    c.updateHeroSubtitle('es', 'Tu marketplace')
    expect(c.heroSubtitle.value['es']).toBe('Tu marketplace')
  })
})

describe('updateHeroCtaText', () => {
  it('updates CTA text for es', () => {
    const c = useAdminHomepage()
    c.updateHeroCtaText('es', 'Ver vehículos')
    expect(c.heroCtaText.value['es']).toBe('Ver vehículos')
  })
})

describe('updateHeroCtaUrl', () => {
  it('updates heroCtaUrl', () => {
    const c = useAdminHomepage()
    c.updateHeroCtaUrl('/catalogo')
    expect(c.heroCtaUrl.value).toBe('/catalogo')
  })
})

describe('updateHeroImageUrl', () => {
  it('updates heroImageUrl', () => {
    const c = useAdminHomepage()
    c.updateHeroImageUrl('https://cdn.example.com/hero.jpg')
    expect(c.heroImageUrl.value).toBe('https://cdn.example.com/hero.jpg')
  })
})

// ─── toggleSection ────────────────────────────────────────────────────────

describe('toggleSection', () => {
  it('enables a section', () => {
    const c = useAdminHomepage()
    c.toggleSection('featured_vehicles', true)
    expect(c.homepageSections.value['featured_vehicles']).toBe(true)
  })

  it('disables a section', () => {
    const c = useAdminHomepage()
    c.toggleSection('featured_vehicles', true)
    c.toggleSection('featured_vehicles', false)
    expect(c.homepageSections.value['featured_vehicles']).toBe(false)
  })
})

// ─── addBanner / removeBanner ─────────────────────────────────────────────

describe('addBanner', () => {
  it('adds a new banner to the list', () => {
    const c = useAdminHomepage()
    c.addBanner()
    expect(c.banners.value).toHaveLength(1)
  })

  it('new banner has default bg_color #23424A', () => {
    const c = useAdminHomepage()
    c.addBanner()
    expect(c.banners.value[0]?.bg_color).toBe('#23424A')
  })

  it('new banner has active = true', () => {
    const c = useAdminHomepage()
    c.addBanner()
    expect(c.banners.value[0]?.active).toBe(true)
  })

  it('new banner has unique id', () => {
    const c = useAdminHomepage()
    c.addBanner()
    c.addBanner()
    const ids = c.banners.value.map((b) => b.id)
    expect(new Set(ids).size).toBe(2)
  })
})

describe('removeBanner', () => {
  it('removes banner at the given index', () => {
    const c = useAdminHomepage()
    c.addBanner()
    c.addBanner()
    c.removeBanner(0)
    expect(c.banners.value).toHaveLength(1)
  })
})

// ─── updateBannerField ────────────────────────────────────────────────────

describe('updateBannerField', () => {
  it('updates content_es', () => {
    const c = useAdminHomepage()
    c.addBanner()
    c.updateBannerField(0, 'content_es', 'Oferta especial')
    expect(c.banners.value[0]?.content_es).toBe('Oferta especial')
  })

  it('updates url', () => {
    const c = useAdminHomepage()
    c.addBanner()
    c.updateBannerField(0, 'url', '/promo')
    expect(c.banners.value[0]?.url).toBe('/promo')
  })

  it('updates active (boolean)', () => {
    const c = useAdminHomepage()
    c.addBanner()
    c.updateBannerField(0, 'active', false)
    expect(c.banners.value[0]?.active).toBe(false)
  })

  it('does nothing for out-of-range index', () => {
    const c = useAdminHomepage()
    c.updateBannerField(5, 'content_es', 'test')
    expect(c.banners.value).toHaveLength(0)
  })
})

// ─── init / populateForm ──────────────────────────────────────────────────

describe('init', () => {
  it('calls loadConfig', async () => {
    const c = useAdminHomepage()
    await c.init()
    expect(mockLoadConfig).toHaveBeenCalled()
  })

  it('does nothing extra when config is null', async () => {
    configRef.value = null
    const c = useAdminHomepage()
    await c.init()
    expect(c.heroTitle.value).toEqual({ es: '', en: '' })
  })

  it('populates heroTitle from config', async () => {
    configRef.value = {
      hero_title: { es: 'Bienvenido', en: 'Welcome' },
      hero_subtitle: {},
      hero_cta_text: {},
      hero_cta_url: null,
      hero_image_url: null,
      homepage_sections: null,
      banners: null,
    }
    const c = useAdminHomepage()
    await c.init()
    expect(c.heroTitle.value['es']).toBe('Bienvenido')
    expect(c.heroTitle.value['en']).toBe('Welcome')
  })

  it('populates heroCtaUrl from config', async () => {
    configRef.value = {
      hero_title: {},
      hero_subtitle: {},
      hero_cta_text: {},
      hero_cta_url: '/catalogo',
      hero_image_url: null,
      homepage_sections: null,
      banners: null,
    }
    const c = useAdminHomepage()
    await c.init()
    expect(c.heroCtaUrl.value).toBe('/catalogo')
  })

  it('initializes homepageSections with all sectionDefinition keys defaulting to false', async () => {
    configRef.value = {
      hero_title: {},
      hero_subtitle: {},
      hero_cta_text: {},
      hero_cta_url: null,
      hero_image_url: null,
      homepage_sections: null,
      banners: null,
    }
    const c = useAdminHomepage()
    await c.init()
    for (const def of sectionDefinitions) {
      expect(c.homepageSections.value[def.key]).toBe(false)
    }
  })

  it('overlays saved homepage_sections values', async () => {
    configRef.value = {
      hero_title: {},
      hero_subtitle: {},
      hero_cta_text: {},
      hero_cta_url: null,
      hero_image_url: null,
      homepage_sections: { featured_vehicles: true, auctions: true },
      banners: null,
    }
    const c = useAdminHomepage()
    await c.init()
    expect(c.homepageSections.value['featured_vehicles']).toBe(true)
    expect(c.homepageSections.value['auctions']).toBe(true)
    expect(c.homepageSections.value['latest_news']).toBe(false)
  })

  it('populates banners from config', async () => {
    configRef.value = {
      hero_title: {},
      hero_subtitle: {},
      hero_cta_text: {},
      hero_cta_url: null,
      hero_image_url: null,
      homepage_sections: null,
      banners: [
        {
          id: 'b-1',
          content_es: 'Promo',
          content_en: 'Promo EN',
          url: '/promo',
          bg_color: '#FF0000',
          text_color: '#FFFFFF',
          active: true,
          starts_at: '',
          ends_at: '',
        },
      ],
    }
    const c = useAdminHomepage()
    await c.init()
    expect(c.banners.value).toHaveLength(1)
    expect(c.banners.value[0]?.content_es).toBe('Promo')
    expect(c.banners.value[0]?.bg_color).toBe('#FF0000')
  })

  it('banner with missing id gets a generated id', async () => {
    configRef.value = {
      hero_title: {},
      hero_subtitle: {},
      hero_cta_text: {},
      hero_cta_url: null,
      hero_image_url: null,
      homepage_sections: null,
      banners: [{ content_es: 'X' }],
    }
    const c = useAdminHomepage()
    await c.init()
    expect(c.banners.value[0]?.id).toMatch(/^banner_/)
  })
})

// ─── handleSave ───────────────────────────────────────────────────────────

describe('handleSave', () => {
  it('calls saveFields with all required keys', async () => {
    const c = useAdminHomepage()
    await c.handleSave()
    expect(mockSaveFields).toHaveBeenCalledWith(
      expect.objectContaining({
        hero_title: expect.any(Object),
        hero_subtitle: expect.any(Object),
        hero_cta_text: expect.any(Object),
        homepage_sections: expect.any(Object),
        banners: expect.any(Array),
      }),
    )
  })

  it('sends null for empty heroCtaUrl', async () => {
    const c = useAdminHomepage()
    c.updateHeroCtaUrl('')
    await c.handleSave()
    const fields = mockSaveFields.mock.calls[0][0] as Record<string, unknown>
    expect(fields['hero_cta_url']).toBeNull()
  })

  it('sends null for empty heroImageUrl', async () => {
    const c = useAdminHomepage()
    c.updateHeroImageUrl('')
    await c.handleSave()
    const fields = mockSaveFields.mock.calls[0][0] as Record<string, unknown>
    expect(fields['hero_image_url']).toBeNull()
  })
})
