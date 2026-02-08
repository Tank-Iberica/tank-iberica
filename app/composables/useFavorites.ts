/**
 * Client-side favorites using localStorage.
 * Will be migrated to Supabase `favorites` table in Step 3.
 */
import { ref, readonly } from 'vue'

const STORAGE_KEY = 'userFavorites'

const favoriteIds = ref<Set<string>>(new Set())
const favoritesOnly = ref(false)
let loaded = false

function loadFromStorage() {
  if (loaded) return
  loaded = true
  if (import.meta.client) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const ids: string[] = JSON.parse(raw)
        favoriteIds.value = new Set(ids)
      }
    }
    catch {
      // ignore malformed data
    }
  }
}

function saveToStorage() {
  if (import.meta.client) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favoriteIds.value]))
  }
}

export function useFavorites() {
  loadFromStorage()

  function toggle(vehicleId: string) {
    const next = new Set(favoriteIds.value)
    if (next.has(vehicleId)) {
      next.delete(vehicleId)
    }
    else {
      next.add(vehicleId)
    }
    favoriteIds.value = next
    saveToStorage()
  }

  function isFavorite(vehicleId: string): boolean {
    return favoriteIds.value.has(vehicleId)
  }

  function toggleFilter() {
    favoritesOnly.value = !favoritesOnly.value
  }

  function count(): number {
    return favoriteIds.value.size
  }

  return {
    favoriteIds: readonly(favoriteIds),
    favoritesOnly,
    toggle,
    isFavorite,
    toggleFilter,
    count,
  }
}
