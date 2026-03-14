/**
 * Client-side favorites with Supabase sync for authenticated users.
 * Anonymous users fall back to localStorage only.
 * State is lazily initialized on first call to avoid import side effects.
 */
import { ref, readonly } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'

const STORAGE_KEY = 'userFavorites'

// Lazy-initialized singleton state
let _favoriteIds: Ref<Set<string>> | null = null
let _favoritesOnly: Ref<boolean> | null = null
let _loaded = false
let _synced: Ref<boolean> | null = null

function getFavoriteIds(): Ref<Set<string>> {
  _favoriteIds ??= ref<Set<string>>(new Set())
  return _favoriteIds
}
function getFavoritesOnly(): Ref<boolean> {
  _favoritesOnly ??= ref(false)
  return _favoritesOnly
}
function getSynced(): Ref<boolean> {
  _synced ??= ref(false)
  return _synced
}

function loadFromStorage(favoriteIds: Ref<Set<string>>) {
  if (_loaded) return
  _loaded = true
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

function saveToStorage(favoriteIds: Ref<Set<string>>) {
  if (import.meta.client) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...favoriteIds.value]))
    } catch {
      // localStorage may be full or unavailable in private mode
    }
  }
}

export function useFavorites() {
  const favoriteIds = getFavoriteIds()
  const favoritesOnly = getFavoritesOnly()
  const synced = getSynced()

  loadFromStorage(favoriteIds)

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

  /**
   * Toggle a vehicle as favorite/unfavorite.
   * Optimistic: updates UI immediately, reverts on Supabase error.
   */
  function toggle(vehicleId: string) {
    const wasAdded = !favoriteIds.value.has(vehicleId)
    const next = new Set(favoriteIds.value)
    if (wasAdded) {
      next.add(vehicleId)
    } else {
      next.delete(vehicleId)
    }
    favoriteIds.value = next
    saveToStorage(favoriteIds)

    // Sync with Supabase for authenticated users — revert on error
    if (user.value) {
      const promise = wasAdded
        ? supabase.from('favorites').insert({ user_id: user.value.id, vehicle_id: vehicleId })
        : supabase
            .from('favorites')
            .delete()
            .eq('user_id', user.value.id)
            .eq('vehicle_id', vehicleId)

      promise.then(({ error: err }) => {
        if (err) {
          // Revert optimistic update
          const reverted = new Set(favoriteIds.value)
          if (wasAdded) {
            reverted.delete(vehicleId)
          } else {
            reverted.add(vehicleId)
          }
          favoriteIds.value = reverted
          saveToStorage(favoriteIds)
        }
      })
    }
  }

  /** Returns true if the given vehicle is in the favorites list. */
  function isFavorite(vehicleId: string): boolean {
    return favoriteIds.value.has(vehicleId)
  }

  /** Toggle the "show favorites only" filter in the catalog. */
  function toggleFilter() {
    favoritesOnly.value = !favoritesOnly.value
  }

  /** Returns the total number of favorited vehicles. */
  function count(): number {
    return favoriteIds.value.size
  }

  /**
   * Set a price alert threshold for a favorited vehicle.
   * Only meaningful for authenticated users. No-op for anonymous.
   * @param vehicleId - vehicle to set alert for
   * @param threshold - alert when price drops to this value or below (same unit as vehicles.price). Pass null to clear.
   */
  async function setThreshold(vehicleId: string, threshold: number | null): Promise<void> {
    if (!user.value) return
    await supabase
      .from('favorites')
      .update({ price_threshold: threshold })
      .eq('user_id', user.value.id)
      .eq('vehicle_id', vehicleId)
  }

  return {
    favoriteIds: readonly(favoriteIds),
    favoritesOnly,
    toggle,
    isFavorite,
    toggleFilter,
    count,
    setThreshold,
  }
}
