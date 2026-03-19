// Vitest setup file — mock Nuxt auto-imports and browser APIs
import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Minimal translation map for common keys used in component tests
const translations: Record<string, string> = {
  'common.save': 'Guardar',
  'common.saving': 'Guardando...',
  'common.cancel': 'Cancelar',
  'common.delete': 'Eliminar',
  'common.deleting': 'Eliminando...',
  'common.create': 'Crear',
  'common.close': 'Cerrar',
  'common.back': 'Volver',
  'common.loading': 'Cargando',
  'common.edit': 'Editar',
  'common.exportCsv': 'Exportar CSV',
  'common.noResults': 'Sin resultados',
  'common.print': 'Imprimir',
  'common.continue': 'Continuar',
  'common.loadingItems': 'Cargando...',
}

// Global Vue Test Utils config — makes $t and auto-imports available in all component templates
config.global.mocks = {
  $t: (key: string) => translations[key] ?? key,
  useSiteUrl: () => 'https://tracciona.com',
  useSiteName: () => 'Tracciona',
}

// Mock useState (Nuxt)
const stateStore = new Map<string, { value: unknown }>()
vi.stubGlobal('useState', (key: string, init?: () => unknown) => {
  if (!stateStore.has(key)) {
    stateStore.set(key, { value: init ? init() : null })
  }
  return stateStore.get(key)!
})

// Mock useSupabaseClient with full chainable query builder
vi.stubGlobal('useSupabaseClient', () => {
  // Create a chainable query builder mock that supports all methods
  const createChainableMock = (): Record<string, unknown> => {
    const chain: Record<string, unknown> = {}
    const methods = ['eq', 'or', 'in', 'order', 'gte', 'lte', 'ilike', 'select']

    methods.forEach((method) => {
      chain[method] = (..._args: unknown[]) => createChainableMock()
    })

    // Terminal methods that return promises
    chain.range = () => Promise.resolve({ data: [], error: null, count: 0 })
    chain.single = () => Promise.resolve({ data: null, error: null })
    chain.limit = () => Promise.resolve({ data: [], error: null })

    return chain
  }

  return {
    from: () => ({
      select: () => createChainableMock(),
      upsert: () => Promise.resolve({ data: null, error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  }
})

// Mock useSupabaseUser
vi.stubGlobal('useSupabaseUser', () => ({
  value: { id: 'test-user-id', email: 'test@test.com' },
}))

// Mock useI18n
vi.stubGlobal('useI18n', () => ({
  locale: { value: 'es' },
  t: (key: string) => key,
}))

// Mock useVerticalConfig
vi.stubGlobal('useVerticalConfig', () => ({
  config: { value: { name: { es: 'Tracciona', en: 'Tracciona' } } },
}))

// Mock useNuxtApp
vi.stubGlobal('useNuxtApp', () => ({
  $i18n: { locale: { value: 'es' } },
}))

// Mock useRuntimeConfig
vi.stubGlobal('useRuntimeConfig', () => ({
  public: {
    vertical: 'tracciona',
    supabaseUrl: 'https://test.supabase.co',
    supabaseKey: 'test-key',
    turnstileSiteKey: '',
  },
}))

// Mock import.meta.client
vi.stubGlobal('import', { meta: { client: true, server: false } })

// Mock computed/ref/reactive for composables that import them
vi.stubGlobal('computed', (fn: () => unknown) => ({ value: fn() }))
vi.stubGlobal('readonly', (obj: unknown) => obj)
vi.stubGlobal('reactive', <T extends object>(obj: T): T => obj)
vi.stubGlobal('ref', (val: unknown) => ({ value: val }))
vi.stubGlobal('unref', (val: unknown) =>
  val && typeof val === 'object' && 'value' in val ? (val as { value: unknown }).value : val,
)
vi.stubGlobal('toValue', (val: unknown) =>
  typeof val === 'function'
    ? (val as () => unknown)()
    : val && typeof val === 'object' && 'value' in val
      ? (val as { value: unknown }).value
      : val,
)
vi.stubGlobal('watch', () => {})
vi.stubGlobal('watchEffect', () => {})
vi.stubGlobal('onMounted', () => {})
vi.stubGlobal('onUnmounted', () => {})
vi.stubGlobal('nextTick', () => Promise.resolve())
vi.stubGlobal('navigateTo', () => {})
vi.stubGlobal('useRoute', () => ({ params: {}, query: {} }))
vi.stubGlobal('$fetch', () => Promise.resolve(null))
vi.stubGlobal('getVerticalSlug', () => 'tracciona')
vi.stubGlobal('useRouter', () => ({ push: () => {} }))
vi.stubGlobal('definePageMeta', () => {})

// Mock useSiteUrl / useSiteName / getSiteUrl / getSiteName / getSiteEmail (Nuxt auto-imports)
vi.stubGlobal('useSiteUrl', () => 'https://tracciona.com')
vi.stubGlobal('useSiteName', () => 'Tracciona')
vi.stubGlobal('getSiteUrl', () => 'https://tracciona.com')
vi.stubGlobal('getSiteName', () => 'Tracciona')
vi.stubGlobal('getSiteEmail', () => 'hola@tracciona.com')

// Mock useSubscriptionPlan (Nuxt auto-import)
vi.stubGlobal('useSubscriptionPlan', () => ({
  currentPlan: { value: 'free' },
  isFounder: { value: false },
  limits: { value: {} },
  canExport: { value: true },
  canUseWidget: { value: true },
  fetchSubscription: vi.fn().mockResolvedValue(undefined),
}))

// Mock localizedField
vi.stubGlobal('localizedField', (field: Record<string, string> | null, locale: string) => {
  if (!field) return ''
  return field[locale] || field['es'] || ''
})

// Mock useLocalePath
vi.stubGlobal('useLocalePath', () => (path: string) => path)

// Reset state between tests
beforeEach(() => {
  stateStore.clear()
})
