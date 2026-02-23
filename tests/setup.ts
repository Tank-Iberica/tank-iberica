// Vitest setup file — mock Nuxt auto-imports and browser APIs
import { vi } from 'vitest'

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
vi.stubGlobal('ref', (val: unknown) => ({ value: val }))
vi.stubGlobal('watch', () => {})
vi.stubGlobal('watchEffect', () => {})
vi.stubGlobal('onMounted', () => {})
vi.stubGlobal('onUnmounted', () => {})
vi.stubGlobal('nextTick', () => Promise.resolve())
vi.stubGlobal('navigateTo', () => {})
vi.stubGlobal('useRoute', () => ({ params: {}, query: {} }))
vi.stubGlobal('useRouter', () => ({ push: () => {} }))
vi.stubGlobal('definePageMeta', () => {})

// Reset state between tests
beforeEach(() => {
  stateStore.clear()
})
