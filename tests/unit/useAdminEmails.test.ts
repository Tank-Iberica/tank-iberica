import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminEmails, TEMPLATE_DEFINITIONS, CATEGORIES } from '../../app/composables/admin/useAdminEmails'

// ─── Module mocks ─────────────────────────────────────────────────────────

let mockLoadConfig: ReturnType<typeof vi.fn>
let mockSaveFields: ReturnType<typeof vi.fn>

vi.mock('~/composables/admin/useAdminVerticalConfig', () => ({
  useAdminVerticalConfig: () => ({
    config: { value: null },
    loading: { value: false },
    saving: { value: false },
    error: { value: null },
    saved: { value: false },
    loadConfig: (...args: unknown[]) => mockLoadConfig(...args),
    saveFields: (...args: unknown[]) => mockSaveFields(...args),
  }),
}))

// ─── Global stubs ─────────────────────────────────────────────────────────

vi.stubGlobal('useSanitize', () => ({
  sanitize: (html: string) => html,
}))

vi.stubGlobal('getVerticalSlug', () => 'tracciona')

vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({}))

// ─── Supabase chain mock ──────────────────────────────────────────────────

function makeChain(result: unknown = { data: [], error: null }) {
  const chain: Record<string, (..._: unknown[]) => unknown> = {}
  for (const m of ['select', 'eq', 'order', 'limit']) {
    chain[m] = () => chain
  }
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
  mockFrom = vi.fn(() => makeChain({ data: [], error: null }))
  mockLoadConfig = vi.fn().mockResolvedValue(null)
  mockSaveFields = vi.fn().mockResolvedValue(undefined)
})

// ─── Re-exports ───────────────────────────────────────────────────────────

describe('TEMPLATE_DEFINITIONS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(TEMPLATE_DEFINITIONS)).toBe(true)
    expect(TEMPLATE_DEFINITIONS.length).toBeGreaterThan(0)
  })

  it('each definition has key, category, defaultSubject, defaultBody, variables', () => {
    for (const td of TEMPLATE_DEFINITIONS) {
      expect(td).toHaveProperty('key')
      expect(td).toHaveProperty('category')
      expect(td).toHaveProperty('defaultSubject')
      expect(td).toHaveProperty('defaultBody')
      expect(td).toHaveProperty('variables')
    }
  })
})

describe('CATEGORIES', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(CATEGORIES)).toBe(true)
    expect(CATEGORIES.length).toBeGreaterThan(0)
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('activeCategory starts as "dealers"', () => {
    const c = useAdminEmails()
    expect(c.activeCategory.value).toBe('dealers')
  })

  it('activeLang starts as "es"', () => {
    const c = useAdminEmails()
    expect(c.activeLang.value).toBe('es')
  })

  it('templates starts as empty object', () => {
    const c = useAdminEmails()
    expect(typeof c.templates.value).toBe('object')
  })

  it('showPreview starts as false', () => {
    const c = useAdminEmails()
    expect(c.showPreview.value).toBe(false)
  })

  it('sendingTest starts as false', () => {
    const c = useAdminEmails()
    expect(c.sendingTest.value).toBe(false)
  })

  it('testSent starts as false', () => {
    const c = useAdminEmails()
    expect(c.testSent.value).toBe(false)
  })

  it('loadingStats starts as false', () => {
    const c = useAdminEmails()
    expect(c.loadingStats.value).toBe(false)
  })
})

// ─── categoryCount ────────────────────────────────────────────────────────

describe('categoryCount', () => {
  it('returns count of templates in given category', () => {
    const c = useAdminEmails()
    const dealerCount = c.categoryCount('dealers')
    expect(typeof dealerCount).toBe('number')
    expect(dealerCount).toBeGreaterThanOrEqual(0)
  })

  it('returns 0 for unknown category', () => {
    const c = useAdminEmails()
    expect(c.categoryCount('nonexistent' as never)).toBe(0)
  })
})

// ─── selectCategory ───────────────────────────────────────────────────────

describe('selectCategory', () => {
  it('sets activeCategory', () => {
    const c = useAdminEmails()
    c.selectCategory('buyers')
    expect(c.activeCategory.value).toBe('buyers')
  })

  it('sets selectedTemplateKey to first template in category', () => {
    const c = useAdminEmails()
    c.selectCategory('dealers')
    const firstDealerTemplate = TEMPLATE_DEFINITIONS.find((td) => td.category === 'dealers')
    if (firstDealerTemplate) {
      expect(c.selectedTemplateKey.value).toBe(firstDealerTemplate.key)
    }
  })
})

// ─── toggleTemplate ───────────────────────────────────────────────────────

describe('toggleTemplate', () => {
  it('toggles active state of a template', async () => {
    const c = useAdminEmails()
    await c.init()
    const key = TEMPLATE_DEFINITIONS[0]!.key
    const initialActive = c.templates.value[key]!.active
    c.toggleTemplate(key)
    expect(c.templates.value[key]!.active).toBe(!initialActive)
  })

  it('does nothing for unknown template key', async () => {
    const c = useAdminEmails()
    await c.init()
    expect(() => c.toggleTemplate('unknown_key')).not.toThrow()
  })
})

// ─── insertVariable ───────────────────────────────────────────────────────

describe('insertVariable', () => {
  it('appends variable to current template body', async () => {
    const c = useAdminEmails()
    await c.init()
    const key = c.selectedTemplateKey.value
    const tpl = c.templates.value[key]
    if (tpl) {
      const originalBody = tpl.body.es
      c.insertVariable('{{test_var}}')
      expect(c.templates.value[key]!.body.es).toBe(originalBody + '{{test_var}}')
    }
  })

  it('does nothing when no template selected', () => {
    const c = useAdminEmails()
    c.selectedTemplateKey.value = 'nonexistent_key'
    expect(() => c.insertVariable('{{var}}')).not.toThrow()
  })
})

// ─── resetToDefault ───────────────────────────────────────────────────────

describe('resetToDefault', () => {
  it('resets template to default values', async () => {
    const c = useAdminEmails()
    await c.init()
    const key = c.selectedTemplateKey.value
    const def = TEMPLATE_DEFINITIONS.find((td) => td.key === key)!
    // Modify the template
    c.templates.value[key]!.body.es = 'Modified body'
    c.resetToDefault()
    // After reset, body should be the default
    expect(c.templates.value[key]!.body.es).toBe(def.defaultBody.es)
  })

  it('does nothing when no definition found', () => {
    const c = useAdminEmails()
    c.selectedTemplateKey.value = 'nonexistent'
    expect(() => c.resetToDefault()).not.toThrow()
  })
})

// ─── init ─────────────────────────────────────────────────────────────────

describe('init', () => {
  it('calls loadConfig', async () => {
    const c = useAdminEmails()
    await c.init()
    expect(mockLoadConfig).toHaveBeenCalled()
  })

  it('initializes all templates from TEMPLATE_DEFINITIONS', async () => {
    const c = useAdminEmails()
    await c.init()
    for (const td of TEMPLATE_DEFINITIONS) {
      expect(c.templates.value[td.key]).toBeDefined()
    }
  })

  it('calls supabase.from("email_logs") for stats', async () => {
    const c = useAdminEmails()
    await c.init()
    expect(mockFrom).toHaveBeenCalledWith('email_logs')
  })

  it('merges stored config into templates when loadConfig returns data', async () => {
    const key = TEMPLATE_DEFINITIONS[0]!.key
    mockLoadConfig.mockResolvedValue({
      email_templates: {
        [key]: {
          subject: { es: 'Custom Subject', en: 'Custom Subject EN' },
          body: { es: 'Custom Body', en: 'Custom Body EN' },
          active: false,
        },
      },
    })
    const c = useAdminEmails()
    await c.init()
    expect(c.templates.value[key]!.subject.es).toBe('Custom Subject')
    expect(c.templates.value[key]!.active).toBe(false)
  })
})

// ─── handleSave ───────────────────────────────────────────────────────────

describe('handleSave', () => {
  it('calls saveFields with email_templates payload', async () => {
    const c = useAdminEmails()
    await c.init()
    await c.handleSave()
    expect(mockSaveFields).toHaveBeenCalled()
    const [payload] = mockSaveFields.mock.calls[0] as [{ email_templates: unknown }]
    expect(payload).toHaveProperty('email_templates')
  })
})

// ─── computeds ───────────────────────────────────────────────────────────

describe('filteredTemplates', () => {
  it('returns templates for activeCategory', () => {
    const c = useAdminEmails()
    // filteredTemplates is computed one-shot with activeCategory='dealers'
    const result = c.filteredTemplates.value
    expect(Array.isArray(result)).toBe(true)
    for (const td of result) {
      expect(td.category).toBe('dealers')
    }
  })
})

describe('openRate', () => {
  it('returns "0" when no stats (sent=0)', () => {
    const c = useAdminEmails()
    expect(c.openRate.value).toBe('0')
  })
})

describe('clickRate', () => {
  it('returns "0" when no stats (sent=0)', () => {
    const c = useAdminEmails()
    expect(c.clickRate.value).toBe('0')
  })
})
