/**
 * Vehicle comparison shortlists with private notes.
 * Hybrid localStorage + Supabase sync (fire-and-forget), same pattern as useFavorites.
 * Anonymous users fall back to localStorage only.
 */

const STORAGE_KEY = 'tracciona_comparison'
const MAX_VEHICLES = 4

interface ComparisonNote {
  id: string
  vehicle_id: string
  note: string
  rating: number | null
  created_at: string
}

interface Comparison {
  id: string
  name: string
  vehicle_ids: string[]
  created_at: string
}

interface LocalStorageData {
  comparisons: Comparison[]
  activeComparisonId: string | null
  notes: Record<string, ComparisonNote>
}

const comparisons = ref<Comparison[]>([])
const activeComparison = ref<Comparison | null>(null)
const notes = ref<Map<string, ComparisonNote>>(new Map())
let loaded = false
let synced = false

function generateId(): string {
  return crypto.randomUUID()
}

function buildNotesMap(
  rows: Array<{
    id: string
    vehicle_id: string
    note: string
    rating: number | null
    created_at: string
  }>,
): Map<string, ComparisonNote> {
  const map = new Map<string, ComparisonNote>()
  for (const row of rows) {
    map.set(row.vehicle_id, {
      id: row.id,
      vehicle_id: row.vehicle_id,
      note: row.note,
      rating: row.rating,
      created_at: row.created_at,
    })
  }
  return map
}

function findLocalOnlyNotes(
  localNotes: Map<string, ComparisonNote>,
  remoteMap: Map<string, ComparisonNote>,
): ComparisonNote[] {
  const result: ComparisonNote[] = []
  for (const [vehicleId, localNote] of localNotes) {
    if (!remoteMap.has(vehicleId)) result.push(localNote)
  }
  return result
}

function mergeComparisons(remote: Comparison[], local: Comparison[]): Comparison[] {
  const map = new Map<string, Comparison>()
  for (const c of remote) map.set(c.id, c)
  for (const c of local) {
    if (!map.has(c.id)) map.set(c.id, c)
  }
  return [...map.values()]
}

function mergeNoteMaps(
  remote: Map<string, ComparisonNote>,
  local: Map<string, ComparisonNote>,
): Map<string, ComparisonNote> {
  const merged = new Map<string, ComparisonNote>(remote)
  for (const [key, value] of local) {
    if (!merged.has(key)) merged.set(key, value)
  }
  return merged
}

function loadFromStorage(): void {
  if (loaded) return
  loaded = true
  if (!import.meta.client) return

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return

    const data: LocalStorageData = JSON.parse(raw)
    comparisons.value = data.comparisons ?? []
    const notesMap = new Map<string, ComparisonNote>()
    if (data.notes) {
      for (const [key, value] of Object.entries(data.notes)) {
        notesMap.set(key, value)
      }
    }
    notes.value = notesMap

    if (data.activeComparisonId) {
      activeComparison.value =
        comparisons.value.find((c) => c.id === data.activeComparisonId) ?? null
    }
  } catch {
    // Ignore malformed data
  }
}

function saveToStorage(): void {
  if (!import.meta.client) return

  try {
    const data: LocalStorageData = {
      comparisons: comparisons.value,
      activeComparisonId: activeComparison.value?.id ?? null,
      notes: Object.fromEntries(notes.value),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage may be full or unavailable in private mode
  }
}

function clearStorage(): void {
  if (!import.meta.client) return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore
  }
}

// -- Advanced comparison unlock state (credit-gated) -------------------------

const ADVANCED_UNLOCK_KEY = 'tracciona_comparison_advanced'

function loadUnlockedComparisons(): Set<string> {
  if (!import.meta.client) return new Set()
  try {
    const raw = localStorage.getItem(ADVANCED_UNLOCK_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveUnlockedComparisons(ids: Set<string>): void {
  if (!import.meta.client) return
  try {
    localStorage.setItem(ADVANCED_UNLOCK_KEY, JSON.stringify([...ids]))
  } catch {
    // Ignore
  }
}

const unlockedAdvancedIds = ref<Set<string>>(loadUnlockedComparisons())

// -- Public composable -------------------------------------------------------

export function useVehicleComparator() {
  loadFromStorage()

  const user = useSupabaseUser()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabaseClient() as any

  const comparisonCount = computed<number>(() => activeComparison.value?.vehicle_ids.length ?? 0)

  // --- Supabase sync (fire-and-forget, mirrors useFavorites pattern) ---

  async function syncWithSupabase(): Promise<void> {
    if (synced || !user.value) return

    try {
      // Fetch remote comparisons
      const { data: remoteComparisons, error: compError } = await supabase
        .from('vehicle_comparisons')
        .select('id, name, vehicle_ids, created_at')
        .eq('user_id', user.value.id)
        .order('created_at', { ascending: false })

      if (compError) return

      const typedRemote: Comparison[] = (remoteComparisons ?? []).map(
        (row: {
          id: string
          name: string | null
          vehicle_ids: string[] | null
          created_at: string | null
        }) => ({
          id: row.id,
          name: row.name ?? '',
          vehicle_ids: row.vehicle_ids ?? [],
          created_at: row.created_at ?? '',
        }),
      )

      // Fetch remote notes
      const { data: remoteNotes, error: notesError } = await supabase
        .from('comparison_notes')
        .select('id, vehicle_id, note, rating, created_at')
        .eq('user_id', user.value.id)

      if (notesError) return

      const remoteNotesMap = buildNotesMap(
        (remoteNotes ?? []) as Parameters<typeof buildNotesMap>[0],
      )
      // Migrate local-only comparisons to Supabase
      const remoteIds = new Set(typedRemote.map((c) => c.id))
      const localOnly = comparisons.value.filter((c) => !remoteIds.has(c.id))

      if (localOnly.length) {
        const userId = user.value.id
        supabase
          .from('vehicle_comparisons')
          .insert(
            localOnly.map((c) => ({
              id: c.id,
              user_id: userId,
              name: c.name,
              vehicle_ids: c.vehicle_ids,
            })),
          )
          .then(() => {
            // Migration done
          })
      }

      // Migrate local-only notes to Supabase
      const localOnlyNotes = findLocalOnlyNotes(notes.value, remoteNotesMap)

      if (localOnlyNotes.length) {
        const userId = user.value.id
        const compId = activeComparison.value?.id ?? null
        supabase
          .from('comparison_notes')
          .insert(
            localOnlyNotes.map((n) => ({
              id: n.id,
              user_id: userId,
              vehicle_id: n.vehicle_id,
              comparison_id: compId,
              note: n.note,
              rating: n.rating,
            })),
          )
          .then(() => {
            // Migration done
          })
      }

      // Merge: union of remote + local
      comparisons.value = mergeComparisons(typedRemote, comparisons.value)
      notes.value = mergeNoteMaps(remoteNotesMap, notes.value)

      // Re-resolve active comparison
      if (activeComparison.value) {
        activeComparison.value =
          comparisons.value.find((c) => c.id === activeComparison.value!.id) ?? null
      }

      clearStorage()
      synced = true
    } catch {
      // Sync failed silently -- localStorage remains as fallback
    }
  }

  // Fire-and-forget sync on composable init
  syncWithSupabase()

  // --- Public API ---

  function isInComparison(vehicleId: string): boolean {
    if (!activeComparison.value) return false
    return activeComparison.value.vehicle_ids.includes(vehicleId)
  }

  function addToComparison(vehicleId: string): void {
    if (!activeComparison.value) return
    if (activeComparison.value.vehicle_ids.length >= MAX_VEHICLES) return
    if (isInComparison(vehicleId)) return

    const updated: Comparison = {
      ...activeComparison.value,
      vehicle_ids: [...activeComparison.value.vehicle_ids, vehicleId],
    }
    activeComparison.value = updated
    comparisons.value = comparisons.value.map((c) => (c.id === updated.id ? updated : c))
    saveToStorage()

    if (user.value) {
      supabase
        .from('vehicle_comparisons')
        .update({ vehicle_ids: updated.vehicle_ids, updated_at: new Date().toISOString() })
        .eq('id', updated.id)
        .eq('user_id', user.value.id)
    }
  }

  function removeFromComparison(vehicleId: string): void {
    if (!activeComparison.value) return
    if (!isInComparison(vehicleId)) return

    const updated: Comparison = {
      ...activeComparison.value,
      vehicle_ids: activeComparison.value.vehicle_ids.filter((id) => id !== vehicleId),
    }
    activeComparison.value = updated
    comparisons.value = comparisons.value.map((c) => (c.id === updated.id ? updated : c))
    saveToStorage()

    if (user.value) {
      supabase
        .from('vehicle_comparisons')
        .update({ vehicle_ids: updated.vehicle_ids, updated_at: new Date().toISOString() })
        .eq('id', updated.id)
        .eq('user_id', user.value.id)
    }
  }

  function createComparison(name: string): void {
    const now = new Date().toISOString()
    const newComparison: Comparison = {
      id: generateId(),
      name,
      vehicle_ids: [],
      created_at: now,
    }

    comparisons.value = [newComparison, ...comparisons.value]
    activeComparison.value = newComparison
    saveToStorage()

    if (user.value) {
      supabase.from('vehicle_comparisons').insert({
        id: newComparison.id,
        user_id: user.value.id,
        name: newComparison.name,
        vehicle_ids: newComparison.vehicle_ids,
      })
    }
  }

  function deleteComparison(id: string): void {
    const target = comparisons.value.find((c) => c.id === id)

    comparisons.value = comparisons.value.filter((c) => c.id !== id)
    if (activeComparison.value?.id === id) {
      activeComparison.value = comparisons.value[0] ?? null
    }

    // Remove associated notes from local state
    if (target) {
      for (const vehicleId of target.vehicle_ids) {
        notes.value.delete(vehicleId)
      }
      // Trigger reactivity
      notes.value = new Map(notes.value)
    }

    saveToStorage()

    if (user.value) {
      supabase
        .from('comparison_notes')
        .delete()
        .eq('comparison_id', id)
        .eq('user_id', user.value.id)

      supabase.from('vehicle_comparisons').delete().eq('id', id).eq('user_id', user.value.id)
    }
  }

  function addNote(vehicleId: string, note: string, rating?: number): void {
    const now = new Date().toISOString()
    const noteId = generateId()
    const compNote: ComparisonNote = {
      id: noteId,
      vehicle_id: vehicleId,
      note,
      rating: rating ?? null,
      created_at: now,
    }

    const updated = new Map(notes.value)
    updated.set(vehicleId, compNote)
    notes.value = updated
    saveToStorage()

    if (user.value) {
      supabase.from('comparison_notes').upsert(
        {
          id: noteId,
          user_id: user.value.id,
          vehicle_id: vehicleId,
          comparison_id: activeComparison.value?.id ?? null,
          note,
          rating: rating ?? null,
        },
        { onConflict: 'user_id,vehicle_id' },
      )
    }
  }

  function updateNote(vehicleId: string, note: string, rating?: number): void {
    const existing = notes.value.get(vehicleId)
    if (!existing) return

    const updated: ComparisonNote = {
      ...existing,
      note,
      rating: rating ?? existing.rating,
    }

    const updatedMap = new Map(notes.value)
    updatedMap.set(vehicleId, updated)
    notes.value = updatedMap
    saveToStorage()

    if (user.value) {
      supabase
        .from('comparison_notes')
        .update({
          note,
          rating: rating ?? existing.rating,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.value.id)
        .eq('vehicle_id', vehicleId)
    }
  }

  function deleteNote(vehicleId: string): void {
    if (!notes.value.has(vehicleId)) return

    const updatedMap = new Map(notes.value)
    updatedMap.delete(vehicleId)
    notes.value = updatedMap
    saveToStorage()

    if (user.value) {
      supabase
        .from('comparison_notes')
        .delete()
        .eq('user_id', user.value.id)
        .eq('vehicle_id', vehicleId)
    }
  }

  async function fetchComparisons(): Promise<void> {
    if (user.value) {
      // Authenticated: load from Supabase
      const { data, error } = await supabase
        .from('vehicle_comparisons')
        .select('id, name, vehicle_ids, created_at')
        .eq('user_id', user.value.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        comparisons.value = (
          data as Array<{
            id: string
            name: string
            vehicle_ids: string[]
            created_at: string
          }>
        ).map((row) => ({
          id: row.id,
          name: row.name,
          vehicle_ids: row.vehicle_ids ?? [],
          created_at: row.created_at,
        }))
      }

      const { data: notesData, error: notesErr } = await supabase
        .from('comparison_notes')
        .select('id, vehicle_id, note, rating, created_at')
        .eq('user_id', user.value.id)

      if (!notesErr && notesData) {
        notes.value = buildNotesMap(notesData as Parameters<typeof buildNotesMap>[0])
      }

      // Set active comparison to first if none selected
      if (!activeComparison.value && comparisons.value.length) {
        activeComparison.value = comparisons.value[0] ?? null
      }
    } else {
      // Anonymous: already loaded from localStorage via loadFromStorage()
      loadFromStorage()
    }
  }

  // Auto-fetch on mount (client-side only)
  if (import.meta.client) {
    onMounted(() => {
      fetchComparisons()
    })
  }

  // -- Advanced comparison (credit-gated) -----------------------------------

  const { currentPlan } = useSubscriptionPlan(user.value?.id)

  /** True if the user's plan includes advanced comparison at no extra cost */
  const isPremiumPlan = computed<boolean>(() => {
    return currentPlan.value === 'premium' || (currentPlan.value as string) === 'full'
  })

  /** True if advanced metrics are accessible for the active comparison */
  const canUseAdvanced = computed<boolean>(() => {
    if (isPremiumPlan.value) return true
    const id = activeComparison.value?.id
    return id ? unlockedAdvancedIds.value.has(id) : false
  })

  const unlockingAdvanced = ref(false)
  const unlockAdvancedError = ref<string | null>(null)

  /**
   * Unlocks advanced comparison metrics for the active comparison by spending 1 credit.
   * No-op if already unlocked or user is on premium plan.
   */
  async function unlockAdvancedComparison(): Promise<boolean> {
    if (canUseAdvanced.value) return true
    if (!user.value) return false
    if (!activeComparison.value) return false

    unlockingAdvanced.value = true
    unlockAdvancedError.value = null

    try {
      // Reuse CSRF + credit endpoint pattern
      await $fetch('/api/credits/unlock-advanced-comparison', {
        method: 'POST',
        body: { comparisonId: activeComparison.value.id },
      })

      const updated = new Set(unlockedAdvancedIds.value)
      updated.add(activeComparison.value.id)
      unlockedAdvancedIds.value = updated
      saveUnlockedComparisons(updated)
      return true
    } catch (err: unknown) {
      unlockAdvancedError.value =
        err instanceof Error ? err.message : 'Error al desbloquear comparación avanzada'
      return false
    } finally {
      unlockingAdvanced.value = false
    }
  }

  return {
    comparisons,
    activeComparison,
    notes,
    isInComparison,
    addToComparison,
    removeFromComparison,
    createComparison,
    deleteComparison,
    addNote,
    updateNote,
    deleteNote,
    fetchComparisons,
    comparisonCount,
    // Advanced (credit-gated)
    isPremiumPlan,
    canUseAdvanced,
    unlockingAdvanced,
    unlockAdvancedError,
    unlockAdvancedComparison,
  }
}
