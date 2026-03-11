import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminDealerConfig } from '../../app/composables/admin/useAdminDealerConfig'

// ─── Supabase chain mock ──────────────────────────────────────────────────

function makeChain(result: unknown = { data: null, error: null }) {
  const chain: Record<string, (..._: unknown[]) => unknown> = {}
  for (const m of [
    'select', 'insert', 'update', 'delete',
    'eq', 'neq', 'not', 'in', 'or', 'order', 'limit', 'match',
  ]) {
    chain[m] = () => chain
  }
  chain['single'] = () => ({ then: (resolve: (v: unknown) => unknown) => resolve(result) })
  Object.assign(chain, { then: (resolve: (v: unknown) => unknown) => resolve(result) })
  return chain
}

let mockFrom: ReturnType<typeof vi.fn>

vi.stubGlobal('useSupabaseClient', () => ({
  from: (...args: unknown[]) => mockFrom(...args),
}))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom = vi.fn(() => makeChain({ data: null, error: null }))
  vi.stubGlobal('useSupabaseUser', () => ({
    value: { id: 'test-user-id', email: 'test@test.com' },
  }))
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('loading starts as true', () => {
    const c = useAdminDealerConfig()
    expect(c.loading.value).toBe(true)
  })

  it('saving starts as false', () => {
    const c = useAdminDealerConfig()
    expect(c.saving.value).toBe(false)
  })

  it('saved starts as false', () => {
    const c = useAdminDealerConfig()
    expect(c.saved.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useAdminDealerConfig()
    expect(c.error.value).toBeNull()
  })

  it('dealerExists starts as true', () => {
    const c = useAdminDealerConfig()
    expect(c.dealerExists.value).toBe(true)
  })

  it('dealerId starts as null', () => {
    const c = useAdminDealerConfig()
    expect(c.dealerId.value).toBeNull()
  })

  it('logoUrl starts as empty string', () => {
    const c = useAdminDealerConfig()
    expect(c.logoUrl.value).toBe('')
  })

  it('themePrimary starts as #23424A', () => {
    const c = useAdminDealerConfig()
    expect(c.themePrimary.value).toBe('#23424A')
  })

  it('themeAccent starts as #7FD1C8', () => {
    const c = useAdminDealerConfig()
    expect(c.themeAccent.value).toBe('#7FD1C8')
  })

  it('certifications starts as empty array', () => {
    const c = useAdminDealerConfig()
    expect(c.certifications.value).toEqual([])
  })

  it('pinnedVehicles starts as empty array', () => {
    const c = useAdminDealerConfig()
    expect(c.pinnedVehicles.value).toEqual([])
  })

  it('emailOnLead starts as false', () => {
    const c = useAdminDealerConfig()
    expect(c.emailOnLead.value).toBe(false)
  })

  it('phoneMode starts as "visible"', () => {
    const c = useAdminDealerConfig()
    expect(c.phoneMode.value).toBe('visible')
  })

  it('catalogSort starts as "newest"', () => {
    const c = useAdminDealerConfig()
    expect(c.catalogSort.value).toBe('newest')
  })

  it('iconOptions has 3 options', () => {
    const c = useAdminDealerConfig()
    expect(c.iconOptions).toHaveLength(3)
  })

  it('sortOptions has 4 options', () => {
    const c = useAdminDealerConfig()
    expect(c.sortOptions).toHaveLength(4)
  })

  it('phoneModeOptions has 3 options', () => {
    const c = useAdminDealerConfig()
    expect(c.phoneModeOptions).toHaveLength(3)
  })
})

// ─── init ─────────────────────────────────────────────────────────────────

describe('init', () => {
  it('sets dealerExists=false and loading=false when user is null', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const c = useAdminDealerConfig()
    await c.init()
    expect(c.dealerExists.value).toBe(false)
    expect(c.loading.value).toBe(false)
  })

  it('calls supabase.from("dealers") when user exists', async () => {
    const c = useAdminDealerConfig()
    await c.init()
    expect(mockFrom).toHaveBeenCalledWith('dealers')
  })

  it('sets dealerExists=false on fetch error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('not found') }))
    const c = useAdminDealerConfig()
    await c.init()
    expect(c.dealerExists.value).toBe(false)
  })

  it('sets loading=false after fetch', async () => {
    const c = useAdminDealerConfig()
    await c.init()
    expect(c.loading.value).toBe(false)
  })

  it('sets dealerId from dealer data', async () => {
    const dealerData = {
      id: 'dealer-1',
      slug: 'my-dealer',
      logo_url: null,
      cover_image_url: null,
      company_name: { es: 'Mi Dealer', en: 'My Dealer' },
      theme: null,
      bio: null,
      phone: '+34600000000',
      email: 'dealer@test.com',
      website: null,
      address: null,
      whatsapp: null,
      contact_config: null,
      social_links: null,
      certifications: null,
      catalog_sort: null,
      pinned_vehicles: null,
      auto_reply_message: null,
      notification_config: null,
    }
    mockFrom.mockReturnValue(makeChain({ data: dealerData, error: null }))
    const c = useAdminDealerConfig()
    await c.init()
    expect(c.dealerId.value).toBe('dealer-1')
  })

  it('populates form fields from dealer data', async () => {
    const dealerData = {
      id: 'dealer-1',
      slug: 'my-dealer',
      phone: '+34600000000',
      email: 'dealer@test.com',
      company_name: { es: 'Mi Dealer', en: 'My Dealer' },
      theme: { primary: '#FF0000', accent: '#00FF00' },
    }
    mockFrom.mockReturnValue(makeChain({ data: dealerData, error: null }))
    const c = useAdminDealerConfig()
    await c.init()
    expect(c.phone.value).toBe('+34600000000')
    expect(c.email.value).toBe('dealer@test.com')
    expect(c.themePrimary.value).toBe('#FF0000')
    expect(c.themeAccent.value).toBe('#00FF00')
  })
})

// ─── addCertification ─────────────────────────────────────────────────────

describe('addCertification', () => {
  it('adds a certification with default values', () => {
    const c = useAdminDealerConfig()
    c.addCertification()
    expect(c.certifications.value).toHaveLength(1)
    expect(c.certifications.value[0]).toMatchObject({
      label: { es: '', en: '' },
      icon: 'badge',
      verified: false,
    })
  })

  it('generates a unique id for each certification', () => {
    const c = useAdminDealerConfig()
    c.addCertification()
    c.addCertification()
    const ids = c.certifications.value.map((cert) => cert.id)
    expect(new Set(ids).size).toBe(2)
  })

  it('can add multiple certifications', () => {
    const c = useAdminDealerConfig()
    c.addCertification()
    c.addCertification()
    c.addCertification()
    expect(c.certifications.value).toHaveLength(3)
  })
})

// ─── removeCertification ──────────────────────────────────────────────────

describe('removeCertification', () => {
  it('removes certification by id', () => {
    const c = useAdminDealerConfig()
    c.addCertification()
    const certId = c.certifications.value[0]!.id
    c.removeCertification(certId)
    expect(c.certifications.value).toHaveLength(0)
  })

  it('only removes the matching certification', () => {
    const c = useAdminDealerConfig()
    c.addCertification()
    c.addCertification()
    const firstId = c.certifications.value[0]!.id
    c.removeCertification(firstId)
    expect(c.certifications.value).toHaveLength(1)
    expect(c.certifications.value[0]!.id).not.toBe(firstId)
  })

  it('does nothing for unknown id', () => {
    const c = useAdminDealerConfig()
    c.addCertification()
    c.removeCertification('nonexistent-id')
    expect(c.certifications.value).toHaveLength(1)
  })
})

// ─── updateCertificationIcon ──────────────────────────────────────────────

describe('updateCertificationIcon', () => {
  it('updates the icon of an existing certification', () => {
    const c = useAdminDealerConfig()
    c.addCertification()
    const certId = c.certifications.value[0]!.id
    c.updateCertificationIcon(certId, 'star')
    expect(c.certifications.value[0]!.icon).toBe('star')
  })

  it('does nothing for unknown id', () => {
    const c = useAdminDealerConfig()
    c.addCertification()
    c.updateCertificationIcon('unknown', 'star')
    expect(c.certifications.value[0]!.icon).toBe('badge')
  })
})

// ─── updateCertificationVerified ─────────────────────────────────────────

describe('updateCertificationVerified', () => {
  it('sets verified to true', () => {
    const c = useAdminDealerConfig()
    c.addCertification()
    const certId = c.certifications.value[0]!.id
    c.updateCertificationVerified(certId, true)
    expect(c.certifications.value[0]!.verified).toBe(true)
  })

  it('sets verified to false', () => {
    const c = useAdminDealerConfig()
    c.addCertification()
    const certId = c.certifications.value[0]!.id
    c.updateCertificationVerified(certId, true)
    c.updateCertificationVerified(certId, false)
    expect(c.certifications.value[0]!.verified).toBe(false)
  })
})

// ─── updateCertificationLabel ─────────────────────────────────────────────

describe('updateCertificationLabel', () => {
  it('updates label in specified language', () => {
    const c = useAdminDealerConfig()
    c.addCertification()
    const certId = c.certifications.value[0]!.id
    c.updateCertificationLabel(certId, 'es', 'Certificado Oficial')
    expect(c.certifications.value[0]!.label['es']).toBe('Certificado Oficial')
  })

  it('does not affect other language labels', () => {
    const c = useAdminDealerConfig()
    c.addCertification()
    const certId = c.certifications.value[0]!.id
    c.updateCertificationLabel(certId, 'es', 'ES Label')
    expect(c.certifications.value[0]!.label['en']).toBe('')
  })
})

// ─── addPinnedVehicle ─────────────────────────────────────────────────────

describe('addPinnedVehicle', () => {
  const validUuid = '00000000-0000-0000-0000-000000000001'

  it('adds a valid UUID to pinnedVehicles', () => {
    const c = useAdminDealerConfig()
    c.newPinnedUuid.value = validUuid
    c.addPinnedVehicle()
    expect(c.pinnedVehicles.value).toContain(validUuid)
  })

  it('clears newPinnedUuid after adding', () => {
    const c = useAdminDealerConfig()
    c.newPinnedUuid.value = validUuid
    c.addPinnedVehicle()
    expect(c.newPinnedUuid.value).toBe('')
  })

  it('sets error for invalid UUID format', () => {
    const c = useAdminDealerConfig()
    c.newPinnedUuid.value = 'not-a-uuid'
    c.addPinnedVehicle()
    expect(c.error.value).toBeTruthy()
    expect(c.pinnedVehicles.value).toHaveLength(0)
  })

  it('does not add if empty input', () => {
    const c = useAdminDealerConfig()
    c.newPinnedUuid.value = '   '
    c.addPinnedVehicle()
    expect(c.pinnedVehicles.value).toHaveLength(0)
  })

  it('sets error for duplicate UUID', () => {
    const c = useAdminDealerConfig()
    c.pinnedVehicles.value = [validUuid]
    c.newPinnedUuid.value = validUuid
    c.addPinnedVehicle()
    expect(c.error.value).toBeTruthy()
    expect(c.pinnedVehicles.value).toHaveLength(1)
  })

  it('clears error on successful add', () => {
    const c = useAdminDealerConfig()
    c.error.value = 'previous error'
    c.newPinnedUuid.value = validUuid
    c.addPinnedVehicle()
    expect(c.error.value).toBeNull()
  })
})

// ─── removePinnedVehicle ──────────────────────────────────────────────────

describe('removePinnedVehicle', () => {
  const uuid1 = '00000000-0000-0000-0000-000000000001'
  const uuid2 = '00000000-0000-0000-0000-000000000002'

  it('removes the specified UUID', () => {
    const c = useAdminDealerConfig()
    c.pinnedVehicles.value = [uuid1, uuid2]
    c.removePinnedVehicle(uuid1)
    expect(c.pinnedVehicles.value).not.toContain(uuid1)
    expect(c.pinnedVehicles.value).toContain(uuid2)
  })

  it('does nothing for unknown UUID', () => {
    const c = useAdminDealerConfig()
    c.pinnedVehicles.value = [uuid1]
    c.removePinnedVehicle('not-in-list')
    expect(c.pinnedVehicles.value).toHaveLength(1)
  })
})

// ─── resetThemeColors ─────────────────────────────────────────────────────

describe('resetThemeColors', () => {
  it('resets themePrimary to #23424A', () => {
    const c = useAdminDealerConfig()
    c.themePrimary.value = '#FF0000'
    c.resetThemeColors()
    expect(c.themePrimary.value).toBe('#23424A')
  })

  it('resets themeAccent to #7FD1C8', () => {
    const c = useAdminDealerConfig()
    c.themeAccent.value = '#FF0000'
    c.resetThemeColors()
    expect(c.themeAccent.value).toBe('#7FD1C8')
  })
})

// ─── handleSave ───────────────────────────────────────────────────────────

describe('handleSave', () => {
  it('does not call supabase when dealerId is null', async () => {
    const c = useAdminDealerConfig()
    // dealerId.value = null initially
    await c.handleSave()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('calls supabase.from("dealers") when dealerId is set', async () => {
    const c = useAdminDealerConfig()
    c.dealerId.value = 'dealer-1'
    await c.handleSave()
    expect(mockFrom).toHaveBeenCalledWith('dealers')
  })

  it('sets saved=true on success', async () => {
    mockFrom.mockReturnValue(makeChain({ error: null }))
    const c = useAdminDealerConfig()
    c.dealerId.value = 'dealer-1'
    await c.handleSave()
    expect(c.saved.value).toBe(true)
  })

  it('sets saving=false after completion', async () => {
    const c = useAdminDealerConfig()
    c.dealerId.value = 'dealer-1'
    await c.handleSave()
    expect(c.saving.value).toBe(false)
  })

  it('sets error message on update failure', async () => {
    mockFrom.mockReturnValue(makeChain({ error: { message: 'update error' } }))
    const c = useAdminDealerConfig()
    c.dealerId.value = 'dealer-1'
    await c.handleSave()
    expect(c.error.value).toBe('update error')
    expect(c.saved.value).toBe(false)
  })
})
