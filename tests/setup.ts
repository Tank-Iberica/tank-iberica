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

// Mock useSupabaseClient
vi.stubGlobal('useSupabaseClient', () => ({
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
        limit: () => Promise.resolve({ data: [], error: null }),
        order: () => ({
          range: () => Promise.resolve({ data: [], error: null, count: 0 }),
        }),
        in: () => ({
          order: () => ({
            range: () => Promise.resolve({ data: [], error: null, count: 0 }),
          }),
        }),
      }),
      in: () => ({
        eq: () => ({
          order: () => ({
            range: () => Promise.resolve({ data: [], error: null, count: 0 }),
          }),
        }),
      }),
      neq: () => ({
        eq: () => ({
          order: () => ({
            range: () => Promise.resolve({ data: [], error: null, count: 0 }),
          }),
        }),
      }),
      order: () => ({
        range: () => Promise.resolve({ data: [], error: null, count: 0 }),
        limit: () => Promise.resolve({ data: [], error: null }),
      }),
      ilike: () => ({
        order: () => ({
          range: () => Promise.resolve({ data: [], error: null, count: 0 }),
        }),
      }),
      gte: () => ({
        lte: () => ({
          order: () => ({
            range: () => Promise.resolve({ data: [], error: null, count: 0 }),
          }),
        }),
      }),
    }),
    upsert: () => Promise.resolve({ data: null, error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
  }),
}))

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
