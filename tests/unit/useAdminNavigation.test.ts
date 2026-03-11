import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminNavigation } from '../../app/composables/admin/useAdminNavigation'

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

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('headerLinks starts as empty array', () => {
    const c = useAdminNavigation()
    expect(c.headerLinks.value).toEqual([])
  })

  it('footerLinks starts as empty array', () => {
    const c = useAdminNavigation()
    expect(c.footerLinks.value).toEqual([])
  })

  it('footerText starts with es and en keys', () => {
    const c = useAdminNavigation()
    expect(c.footerText.value).toHaveProperty('es', '')
    expect(c.footerText.value).toHaveProperty('en', '')
  })

  it('socialLinks starts with linkedin, instagram, facebook, x keys', () => {
    const c = useAdminNavigation()
    expect(c.socialLinks.value).toHaveProperty('linkedin', '')
    expect(c.socialLinks.value).toHaveProperty('instagram', '')
    expect(c.socialLinks.value).toHaveProperty('facebook', '')
    expect(c.socialLinks.value).toHaveProperty('x', '')
  })
})

// ─── addHeaderLink / removeHeaderLink ─────────────────────────────────────

describe('addHeaderLink', () => {
  it('adds a new empty link to headerLinks', () => {
    const c = useAdminNavigation()
    c.addHeaderLink()
    expect(c.headerLinks.value).toHaveLength(1)
  })

  it('new link has default visible=true', () => {
    const c = useAdminNavigation()
    c.addHeaderLink()
    expect(c.headerLinks.value[0]?.visible).toBe(true)
  })

  it('new link has empty label_es', () => {
    const c = useAdminNavigation()
    c.addHeaderLink()
    expect(c.headerLinks.value[0]?.label_es).toBe('')
  })

  it('can add multiple links', () => {
    const c = useAdminNavigation()
    c.addHeaderLink()
    c.addHeaderLink()
    expect(c.headerLinks.value).toHaveLength(2)
  })
})

describe('removeHeaderLink', () => {
  it('removes link at the given index', () => {
    const c = useAdminNavigation()
    c.addHeaderLink()
    c.addHeaderLink()
    c.removeHeaderLink(0)
    expect(c.headerLinks.value).toHaveLength(1)
  })

  it('removes the correct link', () => {
    const c = useAdminNavigation()
    c.addHeaderLink()
    c.headerLinks.value[0]!.label_es = 'First'
    c.addHeaderLink()
    c.headerLinks.value[1]!.label_es = 'Second'
    c.removeHeaderLink(0)
    expect(c.headerLinks.value[0]?.label_es).toBe('Second')
  })
})

// ─── moveHeaderLink ───────────────────────────────────────────────────────

describe('moveHeaderLink', () => {
  it('moves link down (direction +1)', () => {
    const c = useAdminNavigation()
    c.addHeaderLink()
    c.headerLinks.value[0]!.label_es = 'A'
    c.addHeaderLink()
    c.headerLinks.value[1]!.label_es = 'B'
    c.moveHeaderLink(0, 1)
    expect(c.headerLinks.value[0]?.label_es).toBe('B')
    expect(c.headerLinks.value[1]?.label_es).toBe('A')
  })

  it('moves link up (direction -1)', () => {
    const c = useAdminNavigation()
    c.addHeaderLink()
    c.headerLinks.value[0]!.label_es = 'A'
    c.addHeaderLink()
    c.headerLinks.value[1]!.label_es = 'B'
    c.moveHeaderLink(1, -1)
    expect(c.headerLinks.value[0]?.label_es).toBe('B')
    expect(c.headerLinks.value[1]?.label_es).toBe('A')
  })

  it('does nothing when moving first link up', () => {
    const c = useAdminNavigation()
    c.addHeaderLink()
    c.headerLinks.value[0]!.label_es = 'Only'
    c.moveHeaderLink(0, -1)
    expect(c.headerLinks.value[0]?.label_es).toBe('Only')
  })

  it('does nothing when moving last link down', () => {
    const c = useAdminNavigation()
    c.addHeaderLink()
    c.headerLinks.value[0]!.label_es = 'Only'
    c.moveHeaderLink(0, 1)
    expect(c.headerLinks.value[0]?.label_es).toBe('Only')
  })
})

// ─── updateHeaderLinkField ────────────────────────────────────────────────

describe('updateHeaderLinkField', () => {
  it('updates label_es of link at index', () => {
    const c = useAdminNavigation()
    c.addHeaderLink()
    c.updateHeaderLinkField(0, 'label_es', 'Inicio')
    expect(c.headerLinks.value[0]?.label_es).toBe('Inicio')
  })

  it('updates url of link at index', () => {
    const c = useAdminNavigation()
    c.addHeaderLink()
    c.updateHeaderLinkField(0, 'url', '/inicio')
    expect(c.headerLinks.value[0]?.url).toBe('/inicio')
  })

  it('updates visible (boolean) of link at index', () => {
    const c = useAdminNavigation()
    c.addHeaderLink()
    c.updateHeaderLinkField(0, 'visible', false)
    expect(c.headerLinks.value[0]?.visible).toBe(false)
  })

  it('does nothing for out-of-range index', () => {
    const c = useAdminNavigation()
    // no links added — index 0 does not exist
    c.updateHeaderLinkField(0, 'label_es', 'Test')
    expect(c.headerLinks.value).toHaveLength(0)
  })
})

// ─── addFooterLink / removeFooterLink / moveFooterLink ────────────────────

describe('addFooterLink', () => {
  it('adds a new empty link to footerLinks', () => {
    const c = useAdminNavigation()
    c.addFooterLink()
    expect(c.footerLinks.value).toHaveLength(1)
  })
})

describe('removeFooterLink', () => {
  it('removes footer link at the given index', () => {
    const c = useAdminNavigation()
    c.addFooterLink()
    c.addFooterLink()
    c.removeFooterLink(0)
    expect(c.footerLinks.value).toHaveLength(1)
  })
})

describe('moveFooterLink', () => {
  it('swaps footer links (direction +1)', () => {
    const c = useAdminNavigation()
    c.addFooterLink()
    c.footerLinks.value[0]!.label_es = 'X'
    c.addFooterLink()
    c.footerLinks.value[1]!.label_es = 'Y'
    c.moveFooterLink(0, 1)
    expect(c.footerLinks.value[0]?.label_es).toBe('Y')
    expect(c.footerLinks.value[1]?.label_es).toBe('X')
  })
})

// ─── updateFooterLinkField ────────────────────────────────────────────────

describe('updateFooterLinkField', () => {
  it('updates label_en of footer link', () => {
    const c = useAdminNavigation()
    c.addFooterLink()
    c.updateFooterLinkField(0, 'label_en', 'Home')
    expect(c.footerLinks.value[0]?.label_en).toBe('Home')
  })
})

// ─── updateFooterText ─────────────────────────────────────────────────────

describe('updateFooterText', () => {
  it('updates footer text for "es"', () => {
    const c = useAdminNavigation()
    c.updateFooterText('es', 'Pie de página')
    expect(c.footerText.value['es']).toBe('Pie de página')
  })

  it('updates footer text for "en"', () => {
    const c = useAdminNavigation()
    c.updateFooterText('en', 'Footer text')
    expect(c.footerText.value['en']).toBe('Footer text')
  })
})

// ─── updateSocialLink ─────────────────────────────────────────────────────

describe('updateSocialLink', () => {
  it('updates linkedin', () => {
    const c = useAdminNavigation()
    c.updateSocialLink('linkedin', 'https://linkedin.com/company/tracciona')
    expect(c.socialLinks.value['linkedin']).toBe('https://linkedin.com/company/tracciona')
  })

  it('updates instagram', () => {
    const c = useAdminNavigation()
    c.updateSocialLink('instagram', '@tracciona')
    expect(c.socialLinks.value['instagram']).toBe('@tracciona')
  })
})

// ─── init / populateForm ──────────────────────────────────────────────────

describe('init', () => {
  it('calls loadConfig', async () => {
    const c = useAdminNavigation()
    await c.init()
    expect(mockLoadConfig).toHaveBeenCalled()
  })

  it('does nothing extra when config is null', async () => {
    configRef.value = null
    const c = useAdminNavigation()
    await c.init()
    expect(c.headerLinks.value).toEqual([])
  })

  it('populates headerLinks from config', async () => {
    configRef.value = {
      header_links: [{ label_es: 'Inicio', label_en: 'Home', url: '/', visible: true }],
      footer_text: {},
      footer_links: [],
      social_links: {},
    }
    const c = useAdminNavigation()
    await c.init()
    expect(c.headerLinks.value).toHaveLength(1)
    expect(c.headerLinks.value[0]?.label_es).toBe('Inicio')
  })

  it('populates footerText from config', async () => {
    configRef.value = {
      header_links: [],
      footer_text: { es: 'Tracciona', en: 'Tracciona EN' },
      footer_links: [],
      social_links: {},
    }
    const c = useAdminNavigation()
    await c.init()
    expect(c.footerText.value['es']).toBe('Tracciona')
    expect(c.footerText.value['en']).toBe('Tracciona EN')
  })

  it('populates socialLinks from config', async () => {
    configRef.value = {
      header_links: [],
      footer_text: {},
      footer_links: [],
      social_links: { linkedin: 'https://li.com', instagram: '', facebook: '', x: '' },
    }
    const c = useAdminNavigation()
    await c.init()
    expect(c.socialLinks.value['linkedin']).toBe('https://li.com')
  })

  it('defaults visible to true when not specified in config', async () => {
    configRef.value = {
      header_links: [{ label_es: 'Test', label_en: '', url: '/test' }],
      footer_text: {},
      footer_links: [],
      social_links: {},
    }
    const c = useAdminNavigation()
    await c.init()
    expect(c.headerLinks.value[0]?.visible).toBe(true)
  })
})

// ─── handleSave ───────────────────────────────────────────────────────────

describe('handleSave', () => {
  it('calls saveFields with header_links, footer_text, footer_links, social_links', async () => {
    const c = useAdminNavigation()
    c.addHeaderLink()
    c.headerLinks.value[0]!.label_es = 'Inicio'
    await c.handleSave()
    expect(mockSaveFields).toHaveBeenCalledWith(
      expect.objectContaining({
        header_links: expect.any(Array),
        footer_text: expect.any(Object),
        footer_links: expect.any(Array),
        social_links: expect.any(Object),
      }),
    )
  })
})
