export interface ComparisonVehicle {
  id: string
  slug: string
  brand: string
  model: string
  year: number | null
  price: number | null
  category: string | null
  location: string | null
  main_image_url: string | null
}

export const specKeys = ['year', 'brand', 'model', 'price', 'location', 'category'] as const
export type SpecKey = (typeof specKeys)[number]

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
      .select('id, slug, brand, model, year, price, category, location, main_image_url')
      .in('id', ids)
    if (!error && data) {
      vehicles.value = (data as Array<Record<string, unknown>>).map((row) => ({
        id: row.id as string,
        slug: (row.slug as string) ?? '',
        brand: (row.brand as string) ?? '',
        model: (row.model as string) ?? '',
        year: (row.year as number | null) ?? null,
        price: (row.price as number | null) ?? null,
        category: (row.category as string | null) ?? null,
        location: (row.location as string | null) ?? null,
        main_image_url: (row.main_image_url as string | null) ?? null,
      }))
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
    if (val == null) return '-'
    if (key === 'price') return `${Number(val).toLocaleString()} €`
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

  function printPage(): void {
    window.print()
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
