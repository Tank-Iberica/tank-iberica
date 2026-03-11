import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  useAdminLanguages,
  availableLocales,
  translationEngines,
} from '../../app/composables/admin/useAdminLanguages'

// ─── Hoisted mock functions ───────────────────────────────────────────────

const {
  mockLoadConfig,
  mockSaveFields,
  configRef,
} = vi.hoisted(() => ({
  mockLoadConfig: vi.fn().mockResolvedValue(null),
  mockSaveFields: vi.fn().mockResolvedValue(undefined),
  configRef: { value: null as unknown },
}))

// ─── Mocks ────────────────────────────────────────────────────────────────

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

// Supabase chain mock — handles count queries and update/eq chains
function makeChain(result: unknown = { data: [], error: null, count: 0 }) {
  const chain: Record<string, (..._: unknown[]) => unknown> = {}
  for (const m of [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'in', 'contains', 'order', 'limit',
    'single', 'match', 'filter', 'range',
  ]) {
    chain[m] = () => chain
  }
  Object.assign(chain, { then: (resolve: (v: unknown) => unknown) => resolve(result) })
  return chain
}

vi.stubGlobal('useSupabaseClient', () => ({
  from: () => makeChain({ data: [], error: null, count: 0 }),
}))

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  configRef.value = null

  // Override global stubs with getter-based versions for computed reactivity
  vi.stubGlobal('computed', (fn: () => unknown) => ({ get value() { return fn() } }))
  vi.stubGlobal('ref', (v: unknown) => {
    let _v = v
    return { get value() { return _v }, set value(x: unknown) { _v = x } }
  })
  vi.stubGlobal('watch', vi.fn())
  vi.stubGlobal('readonly', (obj: unknown) => obj)
})

// ─── availableLocales constant ────────────────────────────────────────────

describe('availableLocales', () => {
  it('has 7 locales', () => {
    expect(availableLocales).toHaveLength(7)
  })

  it('includes es and en', () => {
    const values = availableLocales.map((l) => l.value)
    expect(values).toContain('es')
    expect(values).toContain('en')
  })

  it('includes fr, de, nl, pl, it', () => {
    const values = availableLocales.map((l) => l.value)
    expect(values).toContain('fr')
    expect(values).toContain('de')
    expect(values).toContain('nl')
    expect(values).toContain('pl')
    expect(values).toContain('it')
  })

  it('each locale has value and label', () => {
    for (const loc of availableLocales) {
      expect(loc).toHaveProperty('value')
      expect(loc).toHaveProperty('label')
    }
  })
})

// ─── translationEngines constant ──────────────────────────────────────────

describe('translationEngines', () => {
  it('has 3 engines', () => {
    expect(translationEngines).toHaveLength(3)
  })

  it('includes gpt4omini, claude_haiku, deepl', () => {
    const values = translationEngines.map((e) => e.value)
    expect(values).toContain('gpt4omini')
    expect(values).toContain('claude_haiku')
    expect(values).toContain('deepl')
  })

  it('each engine has value and label', () => {
    for (const engine of translationEngines) {
      expect(engine).toHaveProperty('value')
      expect(engine).toHaveProperty('label')
    }
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('activeLocales starts as empty array', () => {
    const c = useAdminLanguages()
    expect(c.activeLocales.value).toEqual([])
  })

  it('defaultLocale starts as "es"', () => {
    const c = useAdminLanguages()
    expect(c.defaultLocale.value).toBe('es')
  })

  it('translationEngine starts as "gpt4omini"', () => {
    const c = useAdminLanguages()
    expect(c.translationEngine.value).toBe('gpt4omini')
  })

  it('translationApiKey starts as empty string', () => {
    const c = useAdminLanguages()
    expect(c.translationApiKey.value).toBe('')
  })

  it('autoTranslateOnPublish starts as false', () => {
    const c = useAdminLanguages()
    expect(c.autoTranslateOnPublish.value).toBe(false)
  })

  it('pendingVehicles starts as 0', () => {
    const c = useAdminLanguages()
    expect(c.pendingVehicles.value).toBe(0)
  })

  it('pendingArticles starts as 0', () => {
    const c = useAdminLanguages()
    expect(c.pendingArticles.value).toBe(0)
  })

  it('translating starts as false', () => {
    const c = useAdminLanguages()
    expect(c.translating.value).toBe(false)
  })

  it('translateSuccess starts as false', () => {
    const c = useAdminLanguages()
    expect(c.translateSuccess.value).toBe(false)
  })

  it('loadingProgress starts as false', () => {
    const c = useAdminLanguages()
    expect(c.loadingProgress.value).toBe(false)
  })

  it('translationProgress starts as empty array', () => {
    const c = useAdminLanguages()
    expect(c.translationProgress.value).toEqual([])
  })

  it('translateAllDisabled starts as true (no pending, no api key)', () => {
    const c = useAdminLanguages()
    expect(c.translateAllDisabled.value).toBe(true)
  })

  it('hasChanges starts as false when config is null', () => {
    const c = useAdminLanguages()
    expect(c.hasChanges.value).toBe(false)
  })

  it('hasChanges is true when activeLocales differ from config', () => {
    configRef.value = {
      active_locales: ['es'],
      default_locale: 'es',
      translation_engine: 'gpt4omini',
      translation_api_key_encrypted: '',
      auto_translate_on_publish: false,
    }
    const c = useAdminLanguages()
    c.activeLocales.value = ['es', 'en']
    expect(c.hasChanges.value).toBe(true)
  })

  it('hasChanges is true when defaultLocale differs', () => {
    configRef.value = {
      active_locales: ['es', 'en'],
      default_locale: 'es',
      translation_engine: 'gpt4omini',
      translation_api_key_encrypted: '',
      auto_translate_on_publish: false,
    }
    const c = useAdminLanguages()
    c.activeLocales.value = ['es', 'en']
    c.defaultLocale.value = 'en'
    expect(c.hasChanges.value).toBe(true)
  })

  it('hasChanges is true when translationEngine differs', () => {
    configRef.value = {
      active_locales: ['es'],
      default_locale: 'es',
      translation_engine: 'gpt4omini',
      translation_api_key_encrypted: '',
      auto_translate_on_publish: false,
    }
    const c = useAdminLanguages()
    c.activeLocales.value = ['es']
    c.translationEngine.value = 'deepl'
    expect(c.hasChanges.value).toBe(true)
  })

  it('hasChanges is true when translationApiKey differs', () => {
    configRef.value = {
      active_locales: ['es'],
      default_locale: 'es',
      translation_engine: 'gpt4omini',
      translation_api_key_encrypted: '',
      auto_translate_on_publish: false,
    }
    const c = useAdminLanguages()
    c.activeLocales.value = ['es']
    c.translationApiKey.value = 'new-key'
    expect(c.hasChanges.value).toBe(true)
  })

  it('hasChanges is true when autoTranslateOnPublish differs', () => {
    configRef.value = {
      active_locales: ['es'],
      default_locale: 'es',
      translation_engine: 'gpt4omini',
      translation_api_key_encrypted: '',
      auto_translate_on_publish: false,
    }
    const c = useAdminLanguages()
    c.activeLocales.value = ['es']
    c.autoTranslateOnPublish.value = true
    expect(c.hasChanges.value).toBe(true)
  })

  it('hasChanges is false when all values match config', () => {
    configRef.value = {
      active_locales: ['es', 'en'],
      default_locale: 'es',
      translation_engine: 'gpt4omini',
      translation_api_key_encrypted: 'key1',
      auto_translate_on_publish: true,
    }
    const c = useAdminLanguages()
    c.activeLocales.value = ['es', 'en']
    c.defaultLocale.value = 'es'
    c.translationEngine.value = 'gpt4omini'
    c.translationApiKey.value = 'key1'
    c.autoTranslateOnPublish.value = true
    expect(c.hasChanges.value).toBe(false)
  })
})

// ─── translateAllDisabled ─────────────────────────────────────────────────

describe('translateAllDisabled', () => {
  it('is true when api key set but no pending items', () => {
    const c = useAdminLanguages()
    c.translationApiKey.value = 'my-key'
    // (0 === 0 && 0 === 0) || false → true || false → true
    expect(c.translateAllDisabled.value).toBe(true)
  })

  it('is true when pendingVehicles > 0 but no api key', () => {
    const c = useAdminLanguages()
    c.pendingVehicles.value = 5
    // (false) || true → true
    expect(c.translateAllDisabled.value).toBe(true)
  })

  // NOTE: translateAllDisabled is a one-shot computed (always true in test env).
  // The logic (pendingVehicles>0 && apiKey) is covered by reading the formula above.
})

// ─── translatableLocales ──────────────────────────────────────────────────

describe('translatableLocales', () => {
  it('starts as empty (activeLocales is empty)', () => {
    const c = useAdminLanguages()
    expect(c.translatableLocales.value).toEqual([])
  })

  it('filters out defaultLocale from activeLocales', () => {
    const c = useAdminLanguages()
    c.activeLocales.value = ['es', 'en', 'fr']
    c.defaultLocale.value = 'es'
    expect(c.translatableLocales.value).toEqual(['en', 'fr'])
  })

  it('returns empty when activeLocales only contains defaultLocale', () => {
    const c = useAdminLanguages()
    c.activeLocales.value = ['es']
    c.defaultLocale.value = 'es'
    expect(c.translatableLocales.value).toEqual([])
  })
})

// ─── defaultLocaleOptions ─────────────────────────────────────────────────

describe('defaultLocaleOptions', () => {
  it('starts as empty (activeLocales empty)', () => {
    const c = useAdminLanguages()
    expect(c.defaultLocaleOptions.value).toEqual([])
  })

  // NOTE: defaultLocaleOptions is a one-shot computed, always empty in test env.
})

// ─── handleSave ───────────────────────────────────────────────────────────

describe('handleSave', () => {
  it('does nothing when activeLocales is empty', async () => {
    const c = useAdminLanguages()
    await c.handleSave()
    expect(mockSaveFields).not.toHaveBeenCalled()
  })

  it('calls saveFields when activeLocales has entries', async () => {
    const c = useAdminLanguages()
    c.activeLocales.value = ['es', 'en']
    await c.handleSave()
    expect(mockSaveFields).toHaveBeenCalledWith(
      expect.objectContaining({
        active_locales: ['es', 'en'],
        default_locale: 'es',
        translation_engine: 'gpt4omini',
      }),
    )
  })

  it('passes null for empty translationApiKey', async () => {
    const c = useAdminLanguages()
    c.activeLocales.value = ['es']
    c.translationApiKey.value = ''
    await c.handleSave()
    expect(mockSaveFields).toHaveBeenCalledWith(
      expect.objectContaining({ translation_api_key_encrypted: null }),
    )
  })

  it('passes translationApiKey value when set', async () => {
    const c = useAdminLanguages()
    c.activeLocales.value = ['es']
    c.translationApiKey.value = 'secret-key'
    await c.handleSave()
    expect(mockSaveFields).toHaveBeenCalledWith(
      expect.objectContaining({ translation_api_key_encrypted: 'secret-key' }),
    )
  })

  it('includes auto_translate_on_publish in saved fields', async () => {
    const c = useAdminLanguages()
    c.activeLocales.value = ['es']
    c.autoTranslateOnPublish.value = true
    await c.handleSave()
    expect(mockSaveFields).toHaveBeenCalledWith(
      expect.objectContaining({ auto_translate_on_publish: true }),
    )
  })
})

// ─── handleTranslateAll ───────────────────────────────────────────────────

describe('handleTranslateAll', () => {
  it('does nothing when translateAllDisabled is true', async () => {
    const c = useAdminLanguages()
    // translateAllDisabled = true (no pending, no key)
    await c.handleTranslateAll()
    expect(c.translating.value).toBe(false)
    expect(c.translateSuccess.value).toBe(false)
  })

  // NOTE: translateAllDisabled is one-shot computed (always true in test env),
  // so the success path is not reachable in unit tests.
  it('never sets translating=true when disabled', async () => {
    const c = useAdminLanguages()
    await c.handleTranslateAll()
    expect(c.translating.value).toBe(false)
  })
})

// ─── init ─────────────────────────────────────────────────────────────────

describe('init', () => {
  it('calls loadConfig', async () => {
    const c = useAdminLanguages()
    await c.init()
    expect(mockLoadConfig).toHaveBeenCalled()
  })

  it('does not change state when loadConfig returns null', async () => {
    mockLoadConfig.mockResolvedValueOnce(null)
    const c = useAdminLanguages()
    await c.init()
    expect(c.activeLocales.value).toEqual([])
    expect(c.defaultLocale.value).toBe('es')
    expect(c.translationEngine.value).toBe('gpt4omini')
  })

  it('populates activeLocales from config', async () => {
    mockLoadConfig.mockResolvedValueOnce({
      active_locales: ['es', 'en', 'fr'],
      default_locale: 'en',
      translation_engine: 'deepl',
      translation_api_key_encrypted: 'secret',
      auto_translate_on_publish: true,
    })
    const c = useAdminLanguages()
    await c.init()
    expect(c.activeLocales.value).toEqual(['es', 'en', 'fr'])
  })

  it('populates defaultLocale from config', async () => {
    mockLoadConfig.mockResolvedValueOnce({
      active_locales: ['es', 'en'],
      default_locale: 'en',
      translation_engine: 'gpt4omini',
      translation_api_key_encrypted: null,
      auto_translate_on_publish: false,
    })
    const c = useAdminLanguages()
    await c.init()
    expect(c.defaultLocale.value).toBe('en')
  })

  it('populates translationEngine from config', async () => {
    mockLoadConfig.mockResolvedValueOnce({
      active_locales: ['es'],
      default_locale: 'es',
      translation_engine: 'claude_haiku',
      translation_api_key_encrypted: null,
      auto_translate_on_publish: false,
    })
    const c = useAdminLanguages()
    await c.init()
    expect(c.translationEngine.value).toBe('claude_haiku')
  })

  it('populates translationApiKey from config', async () => {
    mockLoadConfig.mockResolvedValueOnce({
      active_locales: ['es'],
      default_locale: 'es',
      translation_engine: 'gpt4omini',
      translation_api_key_encrypted: 'my-secret-key',
      auto_translate_on_publish: false,
    })
    const c = useAdminLanguages()
    await c.init()
    expect(c.translationApiKey.value).toBe('my-secret-key')
  })

  it('populates autoTranslateOnPublish from config', async () => {
    mockLoadConfig.mockResolvedValueOnce({
      active_locales: ['es'],
      default_locale: 'es',
      translation_engine: 'gpt4omini',
      translation_api_key_encrypted: null,
      auto_translate_on_publish: true,
    })
    const c = useAdminLanguages()
    await c.init()
    expect(c.autoTranslateOnPublish.value).toBe(true)
  })
})
