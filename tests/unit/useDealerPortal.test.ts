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
  social_links: {
    linkedin: 'https://linkedin.com/in/test',
    instagram: '',
    facebook: '',
    youtube: '',
  },
  certifications: [],
  catalog_sort: 'newest',
  auto_reply_message: { es: '', en: '' },
  notification_config: {
    email_on_lead: true,
    email_on_sale: false,
    email_weekly_stats: true,
    email_auction_updates: false,
  },
  brokerage_opt_out: false,
}

function makeChain(data: unknown = null, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'order', 'select', 'update', 'insert', 'maybeSingle', 'single'].forEach((m) => {
    chain[m] = () => chain
  })
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
    return {
      get value() {
        return _v
      },
      set value(x) {
        _v = x
      },
    }
  })
  vi.stubGlobal('computed', (fn: () => unknown) => ({
    get value() {
      return fn()
    },
  }))
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

  it('sets needsProfile when dealer not found', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => makeChain(null, { message: 'not found' }),
    }))
    const c = useDealerPortal()
    await c.loadPortal()
    // Source sets needsProfile=true instead of error when dealer not found
    expect(c.needsProfile.value).toBe(true)
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

// ─── createDealerProfile ──────────────────────────────────────────────────────

describe('createDealerProfile', () => {
  it('returns false when no user', async () => {
    mockUser.value = null
    vi.stubGlobal('useSupabaseUser', () => mockUser)
    const c = useDealerPortal()
    const result = await c.createDealerProfile('Test Dealer')
    expect(result).toBe(false)
  })

  it('generates slug from name (lowercase, hyphens)', async () => {
    const insertMock = vi.fn()
    const selectMock = vi.fn()
    const singleMock = vi.fn().mockResolvedValue({ data: { id: 'new-dealer-1' }, error: null })

    selectMock.mockReturnValue({ single: singleMock })
    insertMock.mockReturnValue({ select: selectMock })

    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'dealers') {
          return {
            insert: insertMock,
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: sampleDealer, error: null }),
          }
        }
        return makeChain()
      },
    }))

    const c = useDealerPortal()
    await c.createDealerProfile('Mi Concesionario Especial')

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'mi-concesionario-especial',
        user_id: 'user-1',
        company_name: { es: 'Mi Concesionario Especial', en: 'Mi Concesionario Especial' },
        status: 'active',
      }),
    )
  })

  it('strips leading/trailing hyphens from slug', async () => {
    const insertMock = vi.fn()
    const selectMock = vi.fn()
    const singleMock = vi.fn().mockResolvedValue({ data: { id: 'new-dealer-2' }, error: null })

    selectMock.mockReturnValue({ single: singleMock })
    insertMock.mockReturnValue({ select: selectMock })

    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'dealers') {
          return {
            insert: insertMock,
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: sampleDealer, error: null }),
          }
        }
        return makeChain()
      },
    }))

    const c = useDealerPortal()
    await c.createDealerProfile('---Special Name---')

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'special-name',
      }),
    )
  })

  it('sets needsProfile to false on success', async () => {
    const singleMock = vi.fn().mockResolvedValue({ data: { id: 'new-dealer-3' }, error: null })

    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single: singleMock }),
        }),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: sampleDealer, error: null }),
      }),
    }))

    const c = useDealerPortal()
    c.needsProfile.value = true
    const result = await c.createDealerProfile('New Dealer')
    expect(result).toBe(true)
    expect(c.needsProfile.value).toBe(false)
  })

  it('sets error and returns false on insert failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'unique_violation' },
            }),
          }),
        }),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      }),
    }))

    const c = useDealerPortal()
    const result = await c.createDealerProfile('Duplicate Dealer')
    expect(result).toBe(false)
    expect(c.error.value).toBeTruthy()
  })

  it('sets saving to true during creation and false after', async () => {
    let savingDuringInsert = false
    const insertFn = vi.fn().mockImplementation(() => {
      savingDuringInsert = true
      return {
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'new-d' }, error: null }),
        }),
      }
    })

    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        insert: insertFn,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: sampleDealer, error: null }),
      }),
    }))

    const c = useDealerPortal()
    await c.createDealerProfile('Test')
    expect(savingDuringInsert).toBe(true)
    expect(c.saving.value).toBe(false)
  })

  it('replaces non-alphanumeric characters with hyphens in slug', async () => {
    const insertMock = vi.fn()
    insertMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'new-d-4' }, error: null }),
      }),
    })

    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        insert: insertMock,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: sampleDealer, error: null }),
      }),
    }))

    const c = useDealerPortal()
    await c.createDealerProfile('Vehículos & Más S.L.')

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'veh-culos-m-s-s-l',
      }),
    )
  })
})

// ─── save ─────────────────────────────────────────────────────────────────────

describe('save', () => {
  it('does nothing when dealerId is null', async () => {
    const updateMock = vi.fn()
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        update: updateMock,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: sampleDealer, error: null }),
      }),
    }))

    const c = useDealerPortal()
    // dealerId is null by default (not loaded)
    await c.save()
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('calls update with correct payload when dealerId is set', async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        update: updateMock,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: sampleDealer, error: null }),
      }),
    }))

    const c = useDealerPortal()
    await c.loadPortal() // Sets dealerId
    await c.save()

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        company_name: expect.any(Object),
        theme: expect.objectContaining({ primary: '#23424A' }),
        simple_mode: false,
      }),
    )
  })

  it('sets saved to true on success', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: sampleDealer, error: null }),
      }),
    }))

    const c = useDealerPortal()
    await c.loadPortal()
    await c.save()
    expect(c.saved.value).toBe(true)
  })

  it('sets error on update failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'update_failed' } }),
        }),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: sampleDealer, error: null }),
      }),
    }))

    const c = useDealerPortal()
    await c.loadPortal()
    await c.save()
    expect(c.error.value).toBe('update_failed')
  })

  it('sets saving to false after save completes', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: sampleDealer, error: null }),
      }),
    }))

    const c = useDealerPortal()
    await c.loadPortal()
    await c.save()
    expect(c.saving.value).toBe(false)
  })
})

// ─── updateCertificationField ─────────────────────────────────────────────────

describe('updateCertificationField', () => {
  it('updates icon field', () => {
    const c = useDealerPortal()
    c.addCertification()
    const certId = c.certifications.value[0].id
    c.updateCertificationField(certId, 'icon', 'shield')
    expect(c.certifications.value[0].icon).toBe('shield')
  })

  it('updates verified field', () => {
    const c = useDealerPortal()
    c.addCertification()
    const certId = c.certifications.value[0].id
    c.updateCertificationField(certId, 'verified', true)
    expect(c.certifications.value[0].verified).toBe(true)
  })

  it('updates label field', () => {
    const c = useDealerPortal()
    c.addCertification()
    const certId = c.certifications.value[0].id
    c.updateCertificationField(certId, 'label', { es: 'Certificado', en: 'Certified' })
    expect(c.certifications.value[0].label.es).toBe('Certificado')
  })

  it('does nothing for unknown cert id', () => {
    const c = useDealerPortal()
    c.addCertification()
    c.updateCertificationField('unknown', 'icon', 'star')
    expect(c.certifications.value[0].icon).toBe('badge')
  })
})

// ─── simpleMode ───────────────────────────────────────────────────────────────

describe('simpleMode', () => {
  it('defaults to false', () => {
    const c = useDealerPortal()
    expect(c.simpleMode.value).toBe(false)
  })

  it('can be toggled', () => {
    const c = useDealerPortal()
    c.simpleMode.value = true
    expect(c.simpleMode.value).toBe(true)
  })

  it('loads simple_mode from dealer data', async () => {
    const dealerWithSimple = { ...sampleDealer, simple_mode: true }
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => makeChain(dealerWithSimple),
    }))
    const c = useDealerPortal()
    await c.loadPortal()
    expect(c.simpleMode.value).toBe(true)
  })

  it('persists simple_mode in save payload', async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        update: updateMock,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: sampleDealer, error: null }),
      }),
    }))

    const c = useDealerPortal()
    await c.loadPortal()
    c.simpleMode.value = true
    await c.save()

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ simple_mode: true }),
    )
  })

  it('defaults to false when dealer data has no simple_mode field', async () => {
    const dealerWithout = { ...sampleDealer }
    // @ts-ignore
    delete dealerWithout.simple_mode
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => makeChain(dealerWithout),
    }))
    const c = useDealerPortal()
    await c.loadPortal()
    expect(c.simpleMode.value).toBe(false)
  })
})

// ─── portalUrl ────────────────────────────────────────────────────────────────

describe('portalUrl', () => {
  it('returns null when no slug', () => {
    const c = useDealerPortal()
    expect(c.portalUrl.value).toBeNull()
  })

  it('returns /slug when slug is set', async () => {
    const c = useDealerPortal()
    await c.loadPortal()
    expect(c.portalUrl.value).toBe('/mi-concesionario')
  })
})
