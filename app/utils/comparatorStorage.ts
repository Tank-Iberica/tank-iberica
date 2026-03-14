/**
 * Vehicle comparator storage helpers.
 * Module-level singleton state + localStorage utilities.
 * Extracted from useVehicleComparator for size reduction (#121).
 */

export const STORAGE_KEY = 'tracciona_comparison'
export const MAX_VEHICLES = 4

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComparisonNote {
  id: string
  vehicle_id: string
  note: string
  rating: number | null
  created_at: string
}

export interface Comparison {
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

// ---------------------------------------------------------------------------
// Singleton reactive state (shared across all composable instances)
// ---------------------------------------------------------------------------

export const comparisons = ref<Comparison[]>([])
export const activeComparison = ref<Comparison | null>(null)
export const notes = ref<Map<string, ComparisonNote>>(new Map())
// Module-level mutable flag — singleton for this module
let loaded = false

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

export function generateId(): string {
  return crypto.randomUUID()
}

export function buildNotesMap(
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

export function findLocalOnlyNotes(
  localNotes: Map<string, ComparisonNote>,
  remoteMap: Map<string, ComparisonNote>,
): ComparisonNote[] {
  const result: ComparisonNote[] = []
  for (const [vehicleId, localNote] of localNotes) {
    if (!remoteMap.has(vehicleId)) result.push(localNote)
  }
  return result
}

export function mergeComparisons(remote: Comparison[], local: Comparison[]): Comparison[] {
  const map = new Map<string, Comparison>()
  for (const c of remote) map.set(c.id, c)
  for (const c of local) {
    if (!map.has(c.id)) map.set(c.id, c)
  }
  return [...map.values()]
}

export function mergeNoteMaps(
  remote: Map<string, ComparisonNote>,
  local: Map<string, ComparisonNote>,
): Map<string, ComparisonNote> {
  const merged = new Map<string, ComparisonNote>(remote)
  for (const [key, value] of local) {
    if (!merged.has(key)) merged.set(key, value)
  }
  return merged
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

export function loadFromStorage(): void {
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

export function saveToStorage(): void {
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

export function clearStorage(): void {
  if (!import.meta.client) return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore
  }
}
