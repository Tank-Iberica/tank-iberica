import { describe, it, expect, vi, beforeEach } from 'vitest'

// Stub Nuxt auto-imports before importing the module
const mockSupabaseClient = { from: vi.fn() }
const mockRoute = { path: '/test', params: {}, query: {} }
const mockRouter = { push: vi.fn(), replace: vi.fn() }
const mockUser = { value: { id: 'user-123', email: 'test@x.com' } }
const mockConfig = { public: { siteUrl: 'https://tracciona.com' } }

vi.stubGlobal(
  'useSupabaseClient',
  vi.fn(() => mockSupabaseClient),
)
vi.stubGlobal(
  'useRoute',
  vi.fn(() => mockRoute),
)
vi.stubGlobal(
  'useRouter',
  vi.fn(() => mockRouter),
)
vi.stubGlobal(
  'useSupabaseUser',
  vi.fn(() => mockUser),
)
vi.stubGlobal(
  'useRuntimeConfig',
  vi.fn(() => mockConfig),
)

import {
  useInjectSupabase,
  useInjectRoute,
  useInjectRouter,
  useInjectUser,
  useInjectConfig,
  useInjectOrDefault,
} from '../../../app/composables/useInject'

describe('useInject — DI utility (F56) — Behavioral', () => {
  describe('useInjectOrDefault (generic)', () => {
    it('returns override when provided', () => {
      const override = { custom: true }
      const factory = vi.fn(() => ({ custom: false }))
      expect(useInjectOrDefault(override, factory)).toBe(override)
      expect(factory).not.toHaveBeenCalled()
    })

    it('calls factory when override is undefined', () => {
      const defaultVal = { custom: false }
      const factory = vi.fn(() => defaultVal)
      expect(useInjectOrDefault(undefined, factory)).toBe(defaultVal)
      expect(factory).toHaveBeenCalledOnce()
    })

    it('calls factory when override is null (null is not undefined)', () => {
      const factory = vi.fn(() => 'default')
      // null ?? factory() → factory is called because null is nullish
      expect(useInjectOrDefault(null as unknown as undefined, factory)).toBe('default')
    })
  })

  describe('useInjectSupabase', () => {
    it('returns override when provided', () => {
      const custom = { from: vi.fn() } as any
      expect(useInjectSupabase(custom)).toBe(custom)
    })

    it('falls back to useSupabaseClient() when no override', () => {
      const result = useInjectSupabase()
      expect(result).toBe(mockSupabaseClient)
    })
  })

  describe('useInjectRoute', () => {
    it('returns override when provided', () => {
      const custom = { path: '/custom' } as any
      expect(useInjectRoute(custom)).toBe(custom)
    })

    it('falls back to useRoute() when no override', () => {
      expect(useInjectRoute()).toBe(mockRoute)
    })
  })

  describe('useInjectRouter', () => {
    it('returns override when provided', () => {
      const custom = { push: vi.fn() } as any
      expect(useInjectRouter(custom)).toBe(custom)
    })

    it('falls back to useRouter() when no override', () => {
      expect(useInjectRouter()).toBe(mockRouter)
    })
  })

  describe('useInjectUser', () => {
    it('returns override when provided', () => {
      const custom = { value: { id: 'other' } } as any
      expect(useInjectUser(custom)).toBe(custom)
    })

    it('falls back to useSupabaseUser() when no override', () => {
      expect(useInjectUser()).toBe(mockUser)
    })
  })

  describe('useInjectConfig', () => {
    it('returns override when provided', () => {
      const custom = { public: { siteUrl: 'https://custom.com' } } as any
      expect(useInjectConfig(custom)).toBe(custom)
    })

    it('falls back to useRuntimeConfig() when no override', () => {
      expect(useInjectConfig()).toBe(mockConfig)
    })
  })
})
