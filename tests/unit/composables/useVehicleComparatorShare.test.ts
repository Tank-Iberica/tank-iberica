import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'

// Mock Nuxt auto-imports
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('readonly', (r: any) => r)
vi.stubGlobal('watch', vi.fn())
vi.stubGlobal('onMounted', vi.fn())

vi.stubGlobal(
  'useSupabaseClient',
  vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  })),
)

vi.stubGlobal(
  'useSupabaseUser',
  vi.fn(() => ref(null)),
)
vi.stubGlobal(
  'useI18n',
  vi.fn(() => ({ t: (k: string) => k, locale: { value: 'es' } })),
)
vi.stubGlobal(
  'useRuntimeConfig',
  vi.fn(() => ({ public: { vertical: 'tracciona' } })),
)
vi.stubGlobal(
  'useState',
  vi.fn((_k: string, init?: () => unknown) => ref(init ? init() : null)),
)
vi.stubGlobal(
  'useRoute',
  vi.fn(() => ({ params: {}, query: {} })),
)
vi.stubGlobal(
  'useRouter',
  vi.fn(() => ({ push: vi.fn() })),
)

// Mock window.location for getShareUrl
vi.stubGlobal('window', {
  location: { origin: 'https://tracciona.com' },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})

// Mock localStorage
vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
})

// Mock crypto for generateId
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
})

import { useVehicleComparator } from '../../../app/composables/useVehicleComparator'

describe('Vehicle comparison share link (N47)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getShareUrl', () => {
    it('returns base path when no active comparison', () => {
      const { getShareUrl } = useVehicleComparator()
      expect(getShareUrl()).toContain('/perfil/comparador')
    })

    it('returns base path when no vehicle IDs', () => {
      const { getShareUrl } = useVehicleComparator()
      const url = getShareUrl()
      expect(url).toBe('/perfil/comparador')
    })

    it('generates URL with vehicle ids', () => {
      const { createComparison, addToComparison, getShareUrl } = useVehicleComparator()
      createComparison('Test')
      addToComparison('550e8400-e29b-41d4-a716-446655440001')
      addToComparison('660e8400-e29b-41d4-a716-446655440002')

      const url = getShareUrl()
      expect(url).toContain('/perfil/comparador?ids=')
      expect(url).toContain('550e8400-e29b-41d4-a716-446655440001')
      expect(url).toContain('660e8400-e29b-41d4-a716-446655440002')
    })

    it('joins IDs with commas', () => {
      const { createComparison, addToComparison, getShareUrl } = useVehicleComparator()
      createComparison('Test')
      addToComparison('aaaa0000-0000-0000-0000-000000000001')
      addToComparison('bbbb0000-0000-0000-0000-000000000002')

      const url = getShareUrl()
      expect(url).toContain(
        'aaaa0000-0000-0000-0000-000000000001,bbbb0000-0000-0000-0000-000000000002',
      )
    })
  })

  describe('loadFromShareUrl', () => {
    it('parses single ID', () => {
      const { loadFromShareUrl } = useVehicleComparator()
      const ids = loadFromShareUrl('550e8400-e29b-41d4-a716-446655440000')
      expect(ids).toEqual(['550e8400-e29b-41d4-a716-446655440000'])
    })

    it('parses multiple comma-separated IDs', () => {
      const { loadFromShareUrl } = useVehicleComparator()
      const ids = loadFromShareUrl(
        '550e8400-e29b-41d4-a716-446655440000,660e8400-e29b-41d4-a716-446655440001',
      )
      expect(ids).toHaveLength(2)
    })

    it('validates UUIDs — rejects invalid', () => {
      const { loadFromShareUrl } = useVehicleComparator()
      const ids = loadFromShareUrl('550e8400-e29b-41d4-a716-446655440000,INVALID,hello')
      expect(ids).toHaveLength(1)
      expect(ids[0]).toBe('550e8400-e29b-41d4-a716-446655440000')
    })

    it('accepts uppercase UUIDs', () => {
      const { loadFromShareUrl } = useVehicleComparator()
      const ids = loadFromShareUrl('550E8400-E29B-41D4-A716-446655440000')
      expect(ids).toHaveLength(1)
    })

    it('limits to MAX_VEHICLES (4)', () => {
      const { loadFromShareUrl } = useVehicleComparator()
      const manyIds = Array(10)
        .fill(null)
        .map((_, i) => `550e8400-e29b-41d4-a716-44665544000${i}`)
        .join(',')
      const ids = loadFromShareUrl(manyIds)
      expect(ids.length).toBeLessThanOrEqual(4)
    })

    it('trims whitespace from IDs', () => {
      const { loadFromShareUrl } = useVehicleComparator()
      const ids = loadFromShareUrl('  550e8400-e29b-41d4-a716-446655440000  ')
      expect(ids).toEqual(['550e8400-e29b-41d4-a716-446655440000'])
    })

    it('handles empty string', () => {
      const { loadFromShareUrl } = useVehicleComparator()
      const ids = loadFromShareUrl('')
      expect(ids).toEqual([])
    })

    it('rejects SQL injection attempts', () => {
      const { loadFromShareUrl } = useVehicleComparator()
      const ids = loadFromShareUrl("'; DROP TABLE vehicles; --")
      expect(ids).toEqual([])
    })
  })
})
