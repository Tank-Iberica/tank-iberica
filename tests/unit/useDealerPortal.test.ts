import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDealerPortal } from '../../app/composables/dashboard/useDealerPortal'

// ─── Stubs ────────────────────────────────────────────────────────────────────

const mockUser = { value: { id: 'user-1', email: 'user@test.com' } as unknown }

const sampleDealer = {
  id: 'dealer-1',
  slug: 'mi-concesionario',
  company_name: { es: 'Mi Concesionario', en: 'My Dealership' },
  logo_url: 'https://cdn/logo.png',
  favicon_url: '',
  cover_image_url: '',
  logo_text_config: null,
  theme: { primary: '#23424A', accent: '#7FD1C8' },
  bio: { es: 'Somos expertos', en: 'We are experts' },
  phone: '+34600000000',
  email: 'dealer@test.com',
  address: 'Madrid, Spain',
  whatsapp: '+34600000001',
  contact_config: {
    phone_mode: 'visible',
    working_hours: { es: 'L-V 9-18', en: 'M-F 9-18' },
    cta_text: { es: 'Contactar', en: 'Contact' },
  },
  social_links: { linkedin: 'https://linkedin.com/in/test', instagram: '', facebook: '', youtube: '' },
  certifications: [],
  catalog_sort: 'newest',
  auto_reply_message: { es: '', en: '' },
  notification_config: { email_on_lead: true, email_on_sale: false, email_weekly_stats: true, email_auction_updates: false },
  brokerage_opt_out: false,
}

function makeChain(data: unknown = null, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'order', 'select', 'update', 'insert', 'maybeSingle', 'single'].forEach((m) => { chain[m] = () => chain })
  const resolved = { data, error }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUser.value = { id: 'user-1', email: 'user@test.com' }
  vi.stubGlobal('ref', (v: unknown) => {
    let _v = v
    return { get value() { return _v }, set value(x) { _v = x } }
  })
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  vi.stubGlobal('useSupabaseUser', () => mockUser)
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => makeChain(sampleDealer),
  }))
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('loading starts as true', () => {
    const c = useDealerPortal()
    expect(c.loading.value).toBe(true)
  })

  it('saving starts as false', () => {
    const c = useDealerPortal()
    expect(c.saving.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useDealerPortal()
    expect(c.error.value).toBeNull()
  })

  it('companyName starts with empty es/en', () => {
    const c = useDealerPortal()
    expect(c.companyName.value.es).toBe('')
    expect(c.companyName.value.en).toBe('')
  })

  it('themePrimary starts as #23424A', () => {
    const c = useDealerPortal()
    expect(c.themePrimary.value).toBe('#23424A')
  })

  it('themeAccent starts as #7FD1C8', () => {
    const c = useDealerPortal()
    expect(c.themeAccent.value).toBe('#7FD1C8')
  })

  it('emailOnLead starts as false (default)', () => {
    const c = useDealerPortal()
    expect(c.emailOnLead.value).toBe(false)
  })

  it('phoneModeOptions has 3 options', () => {
    const c = useDealerPortal()
    expect(c.phoneModeOptions.value).toHaveLength(3)
  })

  it('sortOptions has 4 options', () => {
    const c = useDealerPortal()
    expect(c.sortOptions.value).toHaveLength(4)
  })
})

// ─── loadPortal ───────────────────────────────────────────────────────────────

describe('loadPortal', () => {
  it('sets loading to false after load', async () => {
    const c = useDealerPortal()
    await c.loadPortal()
    expect(c.loading.value).toBe(false)
  })

  it('populates companyName from dealer data', async () => {
    const c = useDealerPortal()
    await c.loadPortal()
    expect(c.companyName.value.es).toBe('Mi Concesionario')
    expect(c.companyName.value.en).toBe('My Dealership')
  })

  it('populates theme colors from dealer data', async () => {
    const c = useDealerPortal()
    await c.loadPortal()
    expect(c.themePrimary.value).toBe('#23424A')
  })

  it('populates phone from dealer data', async () => {
    const c = useDealerPortal()
    await c.loadPortal()
    expect(c.phone.value).toBe('+34600000000')
  })

  it('sets loading=false when no user', async () => {
    mockUser.value = null
    vi.stubGlobal('useSupabaseUser', () => mockUser)
    const c = useDealerPortal()
    await c.loadPortal()
    expect(c.loading.value).toBe(false)
  })

  it('sets error when dealer not found', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => makeChain(null, { message: 'not found' }),
    }))
    const c = useDealerPortal()
    await c.loadPortal()
    expect(c.error.value).toBeTruthy()
  })
})

// ─── resetThemeColors ─────────────────────────────────────────────────────────

describe('resetThemeColors', () => {
  it('resets to default petrol colors', () => {
    const c = useDealerPortal()
    c.themePrimary.value = '#FF0000'
    c.themeAccent.value = '#00FF00'
    c.resetThemeColors()
    expect(c.themePrimary.value).toBe('#23424A')
    expect(c.themeAccent.value).toBe('#7FD1C8')
  })
})

// ─── addCertification / removeCertification ───────────────────────────────────

describe('addCertification', () => {
  it('adds a certification to the list', () => {
    const c = useDealerPortal()
    c.addCertification()
    expect(c.certifications.value).toHaveLength(1)
  })

  it('added certification has default values', () => {
    const c = useDealerPortal()
    c.addCertification()
    const cert = c.certifications.value[0]
    expect(cert.icon).toBe('badge')
    expect(cert.verified).toBe(false)
  })
})

describe('removeCertification', () => {
  it('removes certification by id', () => {
    const c = useDealerPortal()
    c.addCertification()
    const certId = c.certifications.value[0].id
    c.removeCertification(certId)
    expect(c.certifications.value).toHaveLength(0)
  })

  it('does nothing for unknown id', () => {
    const c = useDealerPortal()
    c.addCertification()
    c.removeCertification('unknown-id')
    expect(c.certifications.value).toHaveLength(1)
  })
})

// ─── toggleBrokerageOptOut ────────────────────────────────────────────────────

describe('toggleBrokerageOptOut', () => {
  it('sets brokerageOptOut to true when called with true', async () => {
    const c = useDealerPortal()
    c.brokerageOptOut.value = false
    await c.toggleBrokerageOptOut(true)
    expect(c.brokerageOptOut.value).toBe(true)
  })

  it('sets brokerageOptOut to false when called with false', async () => {
    const c = useDealerPortal()
    c.brokerageOptOut.value = true
    await c.toggleBrokerageOptOut(false)
    expect(c.brokerageOptOut.value).toBe(false)
  })
})
