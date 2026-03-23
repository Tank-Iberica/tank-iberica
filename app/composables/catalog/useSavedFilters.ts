import { ref, computed } from 'vue'
import type { VehicleFilters } from '~/composables/useVehicles'
import type { LocationLevel } from '~/utils/geoData'

const STORAGE_KEY = 'tracciona:saved-filters'
const MAX_PRESETS = 5

export interface SavedFilterPreset {
  id: string
  name: string
  filters: VehicleFilters
  locationLevel: LocationLevel | null
  searchQuery?: string
  savedAt: number
}

function loadFromStorage(): SavedFilterPreset[] {
  if (globalThis.window === undefined) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedFilterPreset[]) : []
  } catch {
    return []
  }
}

function saveToStorage(presets: SavedFilterPreset[]): void {
  if (globalThis.window === undefined) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  } catch {
    // localStorage may be full or unavailable — silently ignore
  }
}

// Module-level ref: singleton so all callers share the same list
const savedPresets = ref<SavedFilterPreset[]>([])
let hydrated = false
let idCounter = 0

/** Composable for saved filters. */
export function useSavedFilters() {
  // Hydrate from localStorage once per page load (client-side only)
  if (import.meta.client && !hydrated) {
    savedPresets.value = loadFromStorage()
    hydrated = true
  }

  const hasPresets = computed(() => !!savedPresets.value.length)

  function savePreset(
    name: string,
    filters: VehicleFilters,
    locationLevel: LocationLevel | null,
    searchQuery?: string,
  ): void {
    const trimmedName = name.trim()
    if (!trimmedName) return

    const newPreset: SavedFilterPreset = {
      id: `${Date.now()}-${++idCounter}`,
      name: trimmedName,
      filters: { ...filters },
      locationLevel,
      searchQuery: searchQuery || undefined,
      savedAt: Date.now(),
    }

    // Replace existing preset with same name (case-insensitive) to avoid duplicates
    const existingIdx = savedPresets.value.findIndex(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase(),
    )

    if (existingIdx >= 0) {
      const updated = [...savedPresets.value]
      updated[existingIdx] = newPreset
      savedPresets.value = updated
    } else {
      // Prepend new preset; trim list to MAX_PRESETS
      savedPresets.value = [newPreset, ...savedPresets.value].slice(0, MAX_PRESETS)
    }

    saveToStorage(savedPresets.value)
  }

  function deletePreset(id: string): void {
    savedPresets.value = savedPresets.value.filter((p) => p.id !== id)
    saveToStorage(savedPresets.value)
  }

  function clearAllPresets(): void {
    savedPresets.value = []
    saveToStorage(savedPresets.value)
  }

  /** Exposed only for test resets — do not call in production code */
  function _resetForTesting(): void {
    savedPresets.value = []
    hydrated = false
    idCounter = 0
  }

  return {
    savedPresets,
    hasPresets,
    savePreset,
    deletePreset,
    clearAllPresets,
    _resetForTesting,
  }
}
