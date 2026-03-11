export interface ComparisonVehicle {
  id: string
  slug: string
  brand: string
  model: string
  year: number | null
  price: number | null
  km: number | null
  condition: string | null
  category: string | null
  subcategory: string | null
  location: string | null
  is_verified: boolean | null
  main_image_url: string | null
}

export const specKeys = [
  'year',
  'brand',
  'model',
  'price',
  'km',
  'condition',
  'location',
  'category',
  'subcategory',
  'is_verified',
] as const
export type SpecKey = (typeof specKeys)[number]

/** Fields where lower numeric value is "better" (highlight as winner) */
const SPEC_LOWER_IS_BETTER = new Set<string>(['price', 'km'])
/** Fields where higher numeric value is "better" */
const SPEC_HIGHER_IS_BETTER = new Set<string>(['year'])

/**
 * Returns the vehicle IDs that have the "best" value for a given numeric spec.
 * Returns empty set for non-comparable specs (strings, booleans).
 */
export function getBestVehicleIds(
  vehicles: Pick<ComparisonVehicle, 'id'>[],
  values: (number | null)[],
  key: string,
): Set<string> {
  if (!SPEC_LOWER_IS_BETTER.has(key) && !SPEC_HIGHER_IS_BETTER.has(key)) return new Set()
  if (vehicles.length <= 1) return new Set()

  const validPairs = vehicles
    .map((v, i) => ({ id: v.id, val: values[i] }))
    .filter((p): p is { id: string; val: number } => p.val !== null && p.val > 0)

  if (validPairs.length === 0) return new Set()

  const bestVal = SPEC_LOWER_IS_BETTER.has(key)
    ? Math.min(...validPairs.map((p) => p.val))
    : Math.max(...validPairs.map((p) => p.val))

  return new Set(validPairs.filter((p) => p.val === bestVal).map((p) => p.id))
}

function printPage(): void {
  globalThis.print()
}

export function usePerfilComparador() {
  const supabase = useSupabaseClient()
  const {
    comparisons,
    activeComparison,
    notes,
    removeFromComparison,
    createComparison,
    deleteComparison,
    addNote,
    updateNote,
    fetchComparisons,
  } = useVehicleComparator()

  const vehicles = ref<ComparisonVehicle[]>([])
  const loading = ref(true)
  const draftNotes = ref<Record<string, string>>({})
  const draftRatings = ref<Record<string, number>>({})
  const newCompName = ref('')
  const showNewForm = ref(false)

  async function loadVehicles(): Promise<void> {
    const ids = activeComparison.value?.vehicle_ids ?? []
    if (ids.length === 0) {
      vehicles.value = []
      loading.value = false
      return
    }
    loading.value = true
    const { data, error } = await supabase
      .from('vehicles')
      .select(
        'id, slug, brand, model, year, price, km, condition, category, location, is_verified, main_image_url, subcategories(name)',
      )
      .in('id', ids)
    if (!error && data) {
      vehicles.value = (data as unknown as Array<Record<string, unknown>>).map((row) => {
        const subRaw = row.subcategories as { name?: Record<string, string> } | null
        const subName = subRaw?.name
        const subcategoryLabel = subName
          ? (subName['es'] ?? subName['en'] ?? null)
          : null
        return {
          id: row.id as string,
          slug: (row.slug as string) ?? '',
          brand: (row.brand as string) ?? '',
          model: (row.model as string) ?? '',
          year: (row.year as number | null) ?? null,
          price: (row.price as number | null) ?? null,
          km: (row.km as number | null) ?? null,
          condition: (row.condition as string | null) ?? null,
          category: (row.category as string | null) ?? null,
          subcategory: subcategoryLabel,
          location: (row.location as string | null) ?? null,
          is_verified: (row.is_verified as boolean | null) ?? null,
          main_image_url: (row.main_image_url as string | null) ?? null,
        }
      })
    }
    for (const v of vehicles.value) {
      const n = notes.value.get(v.id)
      draftNotes.value[v.id] = n?.note ?? ''
      draftRatings.value[v.id] = n?.rating ?? 0
    }
    loading.value = false
  }

  function getSpec(vehicle: ComparisonVehicle, key: string): string {
    const val = vehicle[key as keyof ComparisonVehicle]
    if (val == null || val === '') return '-'
    if (key === 'price') return `${Number(val).toLocaleString()} €`
    if (key === 'km') return `${Number(val).toLocaleString()} km`
    if (key === 'is_verified') return val ? '✓' : '✗'
    return String(val)
  }

  function updateDraftNote(vehicleId: string, value: string): void {
    draftNotes.value[vehicleId] = value
  }

  function saveNote(vehicleId: string): void {
    const note = draftNotes.value[vehicleId] ?? ''
    const rating = draftRatings.value[vehicleId] ?? 0
    if (notes.value.get(vehicleId)) updateNote(vehicleId, note, rating)
    else addNote(vehicleId, note, rating)
  }

  function setRating(vehicleId: string, star: number): void {
    draftRatings.value[vehicleId] = star
    saveNote(vehicleId)
  }

  function handleRemove(vehicleId: string): void {
    removeFromComparison(vehicleId)
    vehicles.value = vehicles.value.filter((v) => v.id !== vehicleId)
  }

  function updateNewCompName(value: string): void {
    newCompName.value = value
  }

  function toggleNewForm(): void {
    showNewForm.value = !showNewForm.value
  }

  function handleCreate(): void {
    const name = newCompName.value.trim()
    if (!name) return
    createComparison(name)
    newCompName.value = ''
    showNewForm.value = false
  }

  function handleDelete(id: string): void {
    deleteComparison(id)
    vehicles.value = []
    nextTick(() => loadVehicles())
  }

  function selectComparison(id: string): void {
    const comp = comparisons.value.find((c) => c.id === id)
    if (comp) {
      activeComparison.value = comp
      loadVehicles()
    }
  }

  watch(activeComparison, () => {
    loadVehicles()
  })

  async function init(): Promise<void> {
    await fetchComparisons()
    loadVehicles()
  }

  return {
    vehicles,
    loading,
    draftNotes,
    draftRatings,
    newCompName,
    showNewForm,
    specKeys,
    comparisons,
    activeComparison,
    getSpec,
    setRating,
    saveNote,
    handleRemove,
    handleCreate,
    handleDelete,
    selectComparison,
    printPage,
    updateDraftNote,
    updateNewCompName,
    toggleNewForm,
    init,
  }
}
