/**
 * Client-side favorites with Supabase sync for authenticated users.
 * Anonymous users fall back to localStorage only.
 */
import { ref, readonly } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

const STORAGE_KEY = 'userFavorites'

const favoriteIds = ref<Set<string>>(new Set())
const favoritesOnly = ref(false)
let loaded = false
const synced = ref(false)

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
    } catch {
      // ignore malformed data
    }
  }
}

function saveToStorage() {
  if (import.meta.client) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...favoriteIds.value]))
    } catch {
      // localStorage may be full or unavailable in private mode
    }
  }
}

export function useFavorites() {
  loadFromStorage()

  const user = useSupabaseUser()
  const supabase = useSupabaseClient()

  async function syncWithSupabase() {
    if (synced.value || !user.value) return

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('vehicle_id')
        .eq('user_id', user.value.id)

      if (error) return

      const supabaseIds = new Set<string>(
        (data ?? []).map((row: { vehicle_id: string }) => row.vehicle_id),
      )

      // Collect localStorage-only favorites to migrate
      const localOnlyIds: string[] = []
      for (const id of favoriteIds.value) {
        if (!supabaseIds.has(id)) {
          localOnlyIds.push(id)
        }
      }

      // Merge: union of Supabase + localStorage
      const merged = new Set<string>(supabaseIds)
      for (const id of favoriteIds.value) {
        merged.add(id)
      }

      // Insert localStorage-only favorites into Supabase (fire-and-forget)
      if (localOnlyIds.length > 0) {
        supabase
          .from('favorites')
          .insert(
            localOnlyIds.map((vehicleId) => ({
              user_id: user.value!.id,
              vehicle_id: vehicleId,
            })),
          )
          .then(() => {
            // Clear localStorage after successful migration
            if (import.meta.client) {
              try {
                localStorage.removeItem(STORAGE_KEY)
              } catch {
                // ignore — localStorage may be unavailable
              }
            }
          })
      } else if (import.meta.client) {
        // No local-only favorites to migrate, clear localStorage duplicates
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          // ignore — localStorage may be unavailable
        }
      }

      favoriteIds.value = merged
      synced.value = true
    } catch {
      // Sync failed silently — localStorage remains as fallback
    }
  }

  // Fire-and-forget Supabase sync
  syncWithSupabase()

  function toggle(vehicleId: string) {
    const next = new Set(favoriteIds.value)
    if (next.has(vehicleId)) {
      next.delete(vehicleId)
    } else {
      next.add(vehicleId)
    }
    favoriteIds.value = next
    saveToStorage()

    // Sync with Supabase for authenticated users (fire-and-forget)
    if (user.value) {
      if (favoriteIds.value.has(vehicleId)) {
        // Was just added
        supabase.from('favorites').insert({ user_id: user.value.id, vehicle_id: vehicleId })
      } else {
        // Was just removed
        supabase.from('favorites').delete().eq('user_id', user.value.id).eq('vehicle_id', vehicleId)
      }
    }
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
