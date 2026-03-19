import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock import.meta.client so the composable thinks it's in the browser
vi.stubGlobal('import', { meta: { client: true, server: false } })

// We import via dynamic require after setting up localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

vi.stubGlobal('localStorage', localStorageMock)

// Import AFTER stubs are set up
import { useSavedFilters } from '~/composables/catalog/useSavedFilters'

const STORAGE_KEY = 'tracciona:saved-filters'

describe('useSavedFilters', () => {
  beforeEach(() => {
    localStorageMock.clear()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    // Reset module singleton state between tests
    const { _resetForTesting } = useSavedFilters()
    _resetForTesting()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('savePreset', () => {
    it('saves a preset and persists to localStorage', () => {
      const { savedPresets, savePreset } = useSavedFilters()
      savePreset('Excavadoras León', { brand: 'CAT', price_min: 10000 }, null)

      expect(savedPresets.value).toHaveLength(1)
      expect(savedPresets.value[0].name).toBe('Excavadoras León')
      expect(savedPresets.value[0].filters.brand).toBe('CAT')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('Excavadoras León'),
      )
    })

    it('trims whitespace from name', () => {
      const { savedPresets, savePreset } = useSavedFilters()
      savePreset('  Volvo Madrid  ', {}, null)
      expect(savedPresets.value[0].name).toBe('Volvo Madrid')
    })

    it('ignores empty name', () => {
      const { savedPresets, savePreset } = useSavedFilters()
      savePreset('', { brand: 'MAN' }, null)
      expect(savedPresets.value).toHaveLength(0)
    })

    it('ignores whitespace-only name', () => {
      const { savedPresets, savePreset } = useSavedFilters()
      savePreset('   ', { brand: 'MAN' }, null)
      expect(savedPresets.value).toHaveLength(0)
    })

    it('prepends new presets (newest first)', () => {
      const { savedPresets, savePreset } = useSavedFilters()
      savePreset('Primero', {}, null)
      savePreset('Segundo', {}, null)
      expect(savedPresets.value[0].name).toBe('Segundo')
      expect(savedPresets.value[1].name).toBe('Primero')
    })

    it('replaces existing preset with same name (case-insensitive)', () => {
      const { savedPresets, savePreset } = useSavedFilters()
      savePreset('Excavadoras', { brand: 'CAT' }, null)
      savePreset('EXCAVADORAS', { brand: 'Komatsu' }, null)

      expect(savedPresets.value).toHaveLength(1)
      expect(savedPresets.value[0].filters.brand).toBe('Komatsu')
    })

    it('enforces MAX_PRESETS = 5 limit', () => {
      const { savedPresets, savePreset } = useSavedFilters()
      for (let i = 1; i <= 6; i++) {
        savePreset(`Búsqueda ${i}`, {}, null)
      }
      expect(savedPresets.value).toHaveLength(5)
    })

    it('stores locationLevel', () => {
      const { savedPresets, savePreset } = useSavedFilters()
      savePreset('Nacional', {}, 'nacional')
      expect(savedPresets.value[0].locationLevel).toBe('nacional')
    })

    it('makes a shallow copy of filters (not same reference)', () => {
      const { savedPresets, savePreset } = useSavedFilters()
      const filters = { brand: 'DAF' }
      savePreset('DAF', filters, null)
      // Mutating original should not affect saved preset
      filters.brand = 'Volvo'
      expect(savedPresets.value[0].filters.brand).toBe('DAF')
    })

    it('assigns a string id based on timestamp', () => {
      const { savedPresets, savePreset } = useSavedFilters()
      savePreset('Test', {}, null)
      expect(typeof savedPresets.value[0].id).toBe('string')
      expect(savedPresets.value[0].id).toBeTruthy()
    })
  })

  describe('deletePreset', () => {
    it('removes the preset with matching id', () => {
      const { savedPresets, savePreset, deletePreset } = useSavedFilters()
      savePreset('Primero', {}, null)
      savePreset('Segundo', {}, null)
      // savedPresets: [Segundo (index 0), Primero (index 1)] — newest first
      expect(savedPresets.value).toHaveLength(2)
      const idToDelete = savedPresets.value[1].id // 'Primero' id
      // IDs are unique (counter-based), so only 'Primero' is removed
      deletePreset(idToDelete)

      expect(savedPresets.value).toHaveLength(1)
      expect(savedPresets.value[0].name).toBe('Segundo')
    })

    it('persists deletion to localStorage', () => {
      const { savedPresets, savePreset, deletePreset } = useSavedFilters()
      savePreset('Test', {}, null)
      const id = savedPresets.value[0].id
      localStorageMock.setItem.mockClear()
      deletePreset(id)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, '[]')
    })

    it('does nothing when id does not exist', () => {
      const { savedPresets, savePreset, deletePreset } = useSavedFilters()
      savePreset('Test', {}, null)
      deletePreset('nonexistent-id')
      expect(savedPresets.value).toHaveLength(1)
    })
  })

  describe('clearAllPresets', () => {
    it('removes all presets', () => {
      const { savedPresets, savePreset, clearAllPresets } = useSavedFilters()
      savePreset('A', {}, null)
      savePreset('B', {}, null)
      clearAllPresets()
      expect(savedPresets.value).toHaveLength(0)
    })

    it('persists empty list to localStorage', () => {
      const { savePreset, clearAllPresets } = useSavedFilters()
      savePreset('A', {}, null)
      localStorageMock.setItem.mockClear()
      clearAllPresets()
      expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, '[]')
    })
  })

  describe('hasPresets', () => {
    it('is false when no presets', () => {
      const { hasPresets } = useSavedFilters()
      expect(hasPresets.value).toBe(false)
    })

    it('is true after saving a preset', () => {
      const { hasPresets, savePreset } = useSavedFilters()
      savePreset('Test', {}, null)
      expect(hasPresets.value).toBe(true)
    })

    it('returns false after deleting the last preset', () => {
      const { hasPresets, savePreset, deletePreset, savedPresets } = useSavedFilters()
      savePreset('Solo', {}, null)
      deletePreset(savedPresets.value[0].id)
      expect(hasPresets.value).toBe(false)
    })
  })

  describe('localStorage persistence', () => {
    // Note: hydration from localStorage only runs when import.meta.client is true.
    // In the Vitest env, import.meta.client is false for composables (only plugins get
    // the Vite transform). These tests verify the write path and guard behaviour.

    it('hydrates from localStorage when stored data exists', () => {
      const stored = [{ id: '1', name: 'Stored', filters: {}, locationLevel: null, savedAt: 0 }]
      // Get reset function first (this call triggers hydration with empty store)
      const { _resetForTesting, savedPresets } = useSavedFilters()
      _resetForTesting()
      // Set up mock AFTER reset so the next hydration reads it
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(stored))
      useSavedFilters() // import.meta.client → (true), hydration runs with mock data
      expect(savedPresets.value).toHaveLength(1)
      expect(savedPresets.value[0].name).toBe('Stored')
      expect(localStorageMock.getItem).toHaveBeenCalledWith('tracciona:saved-filters')
    })

    it('writes serialised presets to localStorage on save', () => {
      const { savePreset } = useSavedFilters()
      savePreset('CAT León', { brand: 'CAT', price_min: 5000 }, 'nacional')

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"brand":"CAT"'),
      )
    })

    it('writes empty array to localStorage after clearing all', () => {
      const { savePreset, clearAllPresets } = useSavedFilters()
      savePreset('Test', {}, null)
      localStorageMock.setItem.mockClear()
      clearAllPresets()
      expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, '[]')
    })
  })
})
