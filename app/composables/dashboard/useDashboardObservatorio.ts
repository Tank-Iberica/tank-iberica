/**
 * Composable: useDashboardObservatorio
 * Extracted from pages/dashboard/observatorio.vue
 * Manages competition observatory state, CRUD, filters, modals, and platform config.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CompetitorStatus = 'watching' | 'sold' | 'expired'

export interface Platform {
  id: string
  name: string
  slug: string
  is_default: boolean
}

export interface DealerPlatform {
  id: string
  dealer_id: string
  platform_id: string
  custom_name: string | null
}

export interface CompetitorVehicle {
  id: string
  dealer_id: string
  platform_id: string | null
  url: string | null
  brand: string
  model: string
  year: number | null
  price: number | null
  location: string | null
  notes: string | null
  status: CompetitorStatus
  created_at: string | null
  updated_at: string | null
}

export interface CompetitorVehicleForm {
  platform_id: string
  url: string
  brand: string
  model: string
  year: string
  price: string
  location: string
  notes: string
  status: CompetitorStatus
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPTY_FORM: CompetitorVehicleForm = {
  platform_id: '',
  url: '',
  brand: '',
  model: '',
  year: '',
  price: '',
  location: '',
  notes: '',
  status: 'watching',
}

export const STATUS_OPTIONS: CompetitorStatus[] = ['watching', 'sold', 'expired']

const PLATFORM_COLORS = [
  '#23424A',
  '#2563eb',
  '#7c3aed',
  '#059669',
  '#d97706',
  '#dc2626',
  '#6366f1',
  '#0891b2',
]

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useDashboardObservatorio() {
  const supabase = useSupabaseClient()
  const { userId } = useAuth()
  const { dealerProfile, loadDealer } = useDealerDashboard()
  const { currentPlan, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

  // ---- Plan gate ----
  const isPremium = computed(() => {
    return currentPlan.value === 'premium' || currentPlan.value === 'founding'
  })

  // ---- Core data state ----
  const entries = ref<CompetitorVehicle[]>([])
  const platforms = ref<Platform[]>([])
  const dealerPlatforms = ref<DealerPlatform[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const dealerId = computed(() => dealerProfile.value?.id ?? null)

  // ---- Fetch functions ----

  async function fetchEntries(): Promise<void> {
    if (!dealerId.value) return
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('competitor_vehicles')
        .select('*')
        .eq('dealer_id', dealerId.value)
        .order('created_at', { ascending: false })

      if (err) throw err
      entries.value = (data ?? []) as never as CompetitorVehicle[]
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading entries'
    } finally {
      loading.value = false
    }
  }

  async function fetchPlatforms(): Promise<void> {
    try {
      const { data, error: err } = await supabase
        .from('platforms')
        .select('*')
        .order('name', { ascending: true })

      if (err) throw err
      platforms.value = (data ?? []) as never as Platform[]
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading platforms'
    }
  }

  async function fetchDealerPlatforms(): Promise<void> {
    if (!dealerId.value) return
    try {
      const { data, error: err } = await supabase
        .from('dealer_platforms')
        .select('*')
        .eq('dealer_id', dealerId.value)

      if (err) throw err
      dealerPlatforms.value = (data ?? []) as never as DealerPlatform[]
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading dealer platforms'
    }
  }

  async function createEntry(form: CompetitorVehicleForm): Promise<boolean> {
    if (!dealerId.value) return false
    error.value = null
    try {
      const { error: err } = await supabase.from('competitor_vehicles').insert({
        dealer_id: dealerId.value,
        platform_id: form.platform_id || null,
        url: form.url || null,
        brand: form.brand,
        model: form.model,
        year: form.year ? Number(form.year) : null,
        price: form.price ? Number(form.price) : null,
        location: form.location || null,
        notes: form.notes || null,
        status: form.status,
      } as never)

      if (err) throw err
      await fetchEntries()
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error creating entry'
      return false
    }
  }

  async function updateEntry(id: string, form: CompetitorVehicleForm): Promise<boolean> {
    error.value = null
    try {
      const { error: err } = await supabase
        .from('competitor_vehicles')
        .update({
          platform_id: form.platform_id || null,
          url: form.url || null,
          brand: form.brand,
          model: form.model,
          year: form.year ? Number(form.year) : null,
          price: form.price ? Number(form.price) : null,
          location: form.location || null,
          notes: form.notes || null,
          status: form.status,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)

      if (err) throw err
      await fetchEntries()
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error updating entry'
      return false
    }
  }

  async function deleteEntry(id: string): Promise<boolean> {
    error.value = null
    try {
      const { error: err } = await supabase.from('competitor_vehicles').delete().eq('id', id)

      if (err) throw err
      entries.value = entries.value.filter((e) => e.id !== id)
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error deleting entry'
      return false
    }
  }

  async function addPlatform(platformId: string): Promise<void> {
    if (!dealerId.value) return
    error.value = null
    try {
      const { error: err } = await supabase.from('dealer_platforms').insert({
        dealer_id: dealerId.value,
        platform_id: platformId,
      } as never)

      if (err) throw err
      await fetchDealerPlatforms()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error adding platform'
    }
  }

  async function removePlatform(platformId: string): Promise<void> {
    if (!dealerId.value) return
    error.value = null
    try {
      const { error: err } = await supabase
        .from('dealer_platforms')
        .delete()
        .eq('dealer_id', dealerId.value)
        .eq('platform_id', platformId)

      if (err) throw err
      dealerPlatforms.value = dealerPlatforms.value.filter((dp) => dp.platform_id !== platformId)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error removing platform'
    }
  }

  async function loadAll(): Promise<void> {
    loading.value = true
    await Promise.all([fetchEntries(), fetchPlatforms(), fetchDealerPlatforms()])
    loading.value = false
  }

  // ---- Filters ----

  const filterPlatform = ref('')
  const filterStatus = ref<CompetitorStatus | ''>('')
  const searchQuery = ref('')

  const platformMap = computed(() => {
    const map = new Map<string, string>()
    for (const p of platforms.value) {
      map.set(p.id, p.name)
    }
    return map
  })

  const activePlatformIds = computed(() => {
    return new Set(dealerPlatforms.value.map((dp) => dp.platform_id))
  })

  const selectablePlatforms = computed(() => {
    return platforms.value.filter((p) => activePlatformIds.value.has(p.id))
  })

  const filteredEntries = computed(() => {
    let result = [...entries.value]

    if (filterPlatform.value) {
      result = result.filter((e) => e.platform_id === filterPlatform.value)
    }

    if (filterStatus.value) {
      result = result.filter((e) => e.status === filterStatus.value)
    }

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      result = result.filter(
        (e) =>
          e.brand.toLowerCase().includes(q) ||
          e.model.toLowerCase().includes(q) ||
          (e.location && e.location.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q)),
      )
    }

    return result
  })

  // ---- Helpers ----

  function getPlatformColor(platformId: string | null): string {
    if (!platformId) return '#94a3b8'
    const idx = platforms.value.findIndex((p) => p.id === platformId)
    return PLATFORM_COLORS[idx % PLATFORM_COLORS.length] || '#94a3b8'
  }

  function getStatusClass(status: CompetitorStatus): string {
    switch (status) {
      case 'watching':
        return 'status-watching'
      case 'sold':
        return 'status-sold'
      case 'expired':
        return 'status-expired'
      default:
        return ''
    }
  }

  // ---- Entry modal state & logic ----

  const showEntryModal = ref(false)
  const editingEntry = ref<CompetitorVehicle | null>(null)
  const savingEntry = ref(false)
  const entryForm = ref<CompetitorVehicleForm>({ ...EMPTY_FORM })

  function openAddEntry(): void {
    editingEntry.value = null
    entryForm.value = { ...EMPTY_FORM }
    showEntryModal.value = true
  }

  function openEditEntry(entry: CompetitorVehicle): void {
    editingEntry.value = entry
    entryForm.value = {
      platform_id: entry.platform_id || '',
      url: entry.url || '',
      brand: entry.brand,
      model: entry.model,
      year: entry.year ? String(entry.year) : '',
      price: entry.price ? String(entry.price) : '',
      location: entry.location || '',
      notes: entry.notes || '',
      status: entry.status,
    }
    showEntryModal.value = true
  }

  function closeEntryModal(): void {
    showEntryModal.value = false
    editingEntry.value = null
    entryForm.value = { ...EMPTY_FORM }
  }

  async function saveEntry(): Promise<void> {
    if (!entryForm.value.brand.trim() || !entryForm.value.model.trim()) return
    savingEntry.value = true

    let success: boolean
    if (editingEntry.value) {
      success = await updateEntry(editingEntry.value.id, entryForm.value)
    } else {
      success = await createEntry(entryForm.value)
    }

    savingEntry.value = false
    if (success) {
      closeEntryModal()
    }
  }

  // ---- Delete confirmation ----

  const confirmDeleteId = ref<string | null>(null)

  async function handleDelete(id: string): Promise<void> {
    if (confirmDeleteId.value === id) {
      await deleteEntry(id)
      confirmDeleteId.value = null
    } else {
      confirmDeleteId.value = id
      setTimeout(() => {
        confirmDeleteId.value = null
      }, 3000)
    }
  }

  // ---- Platform settings modal ----

  const showPlatformModal = ref(false)

  function openPlatformSettings(): void {
    showPlatformModal.value = true
  }

  function closePlatformSettings(): void {
    showPlatformModal.value = false
  }

  async function togglePlatform(platformId: string): Promise<void> {
    if (activePlatformIds.value.has(platformId)) {
      await removePlatform(platformId)
    } else {
      await addPlatform(platformId)
    }
  }

  // ---- Init (called from onMounted in page) ----

  async function init(): Promise<void> {
    const dealer = dealerProfile.value || (await loadDealer())
    if (!dealer) return
    await fetchSubscription()
    if (isPremium.value) {
      await loadAll()
    }
  }

  return {
    // Plan
    isPremium,
    currentPlan,

    // Data (readonly where appropriate)
    entries: readonly(entries),
    platforms: readonly(platforms),
    dealerPlatforms: readonly(dealerPlatforms),
    loading: readonly(loading),
    error,

    // Filters
    filterPlatform,
    filterStatus,
    searchQuery,
    filteredEntries,
    selectablePlatforms,
    platformMap,
    activePlatformIds,

    // Helpers
    getPlatformColor,
    getStatusClass,

    // Entry modal
    showEntryModal,
    editingEntry: readonly(editingEntry),
    savingEntry: readonly(savingEntry),
    entryForm,
    openAddEntry,
    openEditEntry,
    closeEntryModal,
    saveEntry,

    // Delete
    confirmDeleteId,
    handleDelete,

    // Platform modal
    showPlatformModal,
    openPlatformSettings,
    closePlatformSettings,
    togglePlatform,

    // Init
    init,
  }
}
