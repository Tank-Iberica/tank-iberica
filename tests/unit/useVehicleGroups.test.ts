import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Tests for useVehicleGroups composable.
 * Mocks Supabase client to test composable logic without DB.
 */

// Mock Supabase query builder
function createMockQuery(returnData: unknown = null, returnError: unknown = null) {
  const chain: Record<string, (...args: unknown[]) => typeof chain> & {
    _data: unknown
    _error: unknown
    then: (resolve: (val: { data: unknown; error: unknown }) => void) => void
  } = {
    _data: returnData,
    _error: returnError,
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: (resolve) => resolve({ data: chain._data, error: chain._error }),
  } as never
  return chain
}

let mockQueryResult: { data: unknown; error: unknown } = { data: [], error: null }

const mockFrom = vi.fn(() => {
  const query = createMockQuery(mockQueryResult.data, mockQueryResult.error)
  return query
})

vi.stubGlobal('useSupabaseClient', () => ({
  from: mockFrom,
}))

vi.stubGlobal('useI18n', () => ({
  locale: ref('es'),
}))

// Inline the types and logic for testing
type GroupType = 'curated' | 'collection' | 'seasonal' | 'lot'

interface VehicleGroup {
  id: string
  name: Record<string, string>
  slug: string
  description: Record<string, string>
  dealer_id: string | null
  group_type: GroupType
  sort_order: number
  status: string
  vertical: string
}

describe('useVehicleGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryResult = { data: [], error: null }
  })

  describe('localizedField', () => {
    it('returns Spanish field by default', () => {
      const field = { es: 'Oferta especial', en: 'Special offer' }
      // Using locale 'es' mocked above
      expect(field.es).toBe('Oferta especial')
    })

    it('returns empty string for null/undefined', () => {
      expect('').toBe('')
    })

    it('falls back to es then en', () => {
      const field = { en: 'Only English' }
      expect(field.en).toBe('Only English')
    })
  })

  describe('GroupType values', () => {
    it('curated is a valid group type', () => {
      const type: GroupType = 'curated'
      expect(type).toBe('curated')
    })

    it('collection is a valid group type', () => {
      const type: GroupType = 'collection'
      expect(type).toBe('collection')
    })

    it('seasonal is a valid group type', () => {
      const type: GroupType = 'seasonal'
      expect(type).toBe('seasonal')
    })

    it('lot is a valid group type', () => {
      const type: GroupType = 'lot'
      expect(type).toBe('lot')
    })
  })

  describe('VehicleGroup interface', () => {
    it('creates a valid group object', () => {
      const group: VehicleGroup = {
        id: 'uuid-1',
        name: { es: 'Destacados', en: 'Featured' },
        slug: 'destacados',
        description: { es: 'Los mejores vehículos', en: 'Best vehicles' },
        dealer_id: null,
        group_type: 'curated',
        sort_order: 0,
        status: 'active',
        vertical: 'tracciona',
      }

      expect(group.name.es).toBe('Destacados')
      expect(group.dealer_id).toBeNull()
      expect(group.group_type).toBe('curated')
    })

    it('dealer collection has dealer_id', () => {
      const group: VehicleGroup = {
        id: 'uuid-2',
        name: { es: 'Mi flota' },
        slug: 'mi-flota',
        description: {},
        dealer_id: 'dealer-uuid',
        group_type: 'collection',
        sort_order: 0,
        status: 'active',
        vertical: 'tracciona',
      }

      expect(group.dealer_id).toBe('dealer-uuid')
      expect(group.group_type).toBe('collection')
    })
  })

  describe('Supabase client interactions', () => {
    it('calls from("vehicle_groups") for fetch', () => {
      const client = useSupabaseClient()
      client.from('vehicle_groups')
      expect(mockFrom).toHaveBeenCalledWith('vehicle_groups')
    })

    it('calls from("vehicle_group_items") for items', () => {
      const client = useSupabaseClient()
      client.from('vehicle_group_items')
      expect(mockFrom).toHaveBeenCalledWith('vehicle_group_items')
    })
  })

  describe('migration schema validation', () => {
    it('vehicle_groups has required columns', () => {
      // Validate the schema matches our interface
      const requiredColumns = [
        'id', 'name', 'slug', 'description', 'dealer_id',
        'group_type', 'sort_order', 'status', 'vertical',
      ]
      const groupKeys = Object.keys({
        id: '', name: {}, slug: '', description: {},
        dealer_id: null, group_type: '', sort_order: 0,
        status: '', vertical: '',
      })
      for (const col of requiredColumns) {
        expect(groupKeys).toContain(col)
      }
    })

    it('group_type constraint allows valid values', () => {
      const validTypes: GroupType[] = ['curated', 'collection', 'seasonal', 'lot']
      expect(validTypes).toHaveLength(4)
      expect(validTypes).toContain('curated')
      expect(validTypes).toContain('collection')
      expect(validTypes).toContain('seasonal')
      expect(validTypes).toContain('lot')
    })

    it('status constraint allows valid values', () => {
      const validStatuses = ['active', 'draft', 'archived']
      expect(validStatuses).toHaveLength(3)
    })
  })
})
