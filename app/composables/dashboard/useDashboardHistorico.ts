/**
 * Composable: useDashboardHistorico
 * Extracted from pages/dashboard/historico.vue
 * Manages dealer sales history state, filters, sorting, modals, restore, and export.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SoldVehicle {
  id: string
  brand: string
  model: string
  year: number | null
  price: number | null
  sale_price: number | null
  sale_date: string | null
  acquisition_cost: number | null
  total_maintenance: number | null
  total_rental_income: number | null
  buyer_name: string | null
  buyer_contact: string | null
  status: string
}

export interface DealerHistoricoFilters {
  year: number | null
  brand: string | null
  search: string
}

export interface DealerHistoricoSummary {
  totalSales: number
  totalRevenue: number
  totalProfit: number
  avgMarginPercent: number
}

export type HistoricoSortCol = 'sale_date' | 'sale_price' | 'profit' | 'brand'

// ---------------------------------------------------------------------------
// Pure utility functions (exported standalone for subcomponent imports)
// ---------------------------------------------------------------------------

export function getProfit(entry: SoldVehicle): number {
  const salePrice = entry.sale_price || 0
  const acquisitionCost = entry.acquisition_cost || 0
  const maintenance = entry.total_maintenance || 0
  const rentalIncome = entry.total_rental_income || 0
  return salePrice - acquisitionCost - maintenance + rentalIncome
}

export function getMarginPercent(entry: SoldVehicle): number {
  const salePrice = entry.sale_price || 0
  if (salePrice === 0) return 0
  return Math.round((getProfit(entry) / salePrice) * 100)
}

export function getTotalCost(entry: SoldVehicle): number {
  return (
    (entry.acquisition_cost || 0) +
    (entry.total_maintenance || 0) -
    (entry.total_rental_income || 0)
  )
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useDashboardHistorico() {
  const { t, locale } = useI18n()
  const supabase = useSupabaseClient()
  const { dealerProfile, loadDealer } = useDealerDashboard()

  // ---- Core data state ----
  const entries = ref<SoldVehicle[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const availableYears = ref<number[]>([])
  const availableBrands = ref<string[]>([])

  const filters = reactive<DealerHistoricoFilters>({
    year: null,
    brand: null,
    search: '',
  })

  // ---- Sort ----
  const sortCol = ref<HistoricoSortCol>('sale_date')
  const sortAsc = ref(false)

  // ---- Modals ----
  const showDetailModal = ref(false)
  const detailEntry = ref<SoldVehicle | null>(null)

  const showRestoreModal = ref(false)
  const restoreTarget = ref<SoldVehicle | null>(null)
  const restoreConfirm = ref('')

  const showExportModal = ref(false)
  const exportDataScope = ref<'all' | 'filtered'>('filtered')

  // ---- Computed ----

  const canRestore = computed(() => {
    const target = restoreConfirm.value.toLowerCase()
    const esWord = 'restaurar'
    const enWord = 'restore'
    return target === esWord || target === enWord
  })

  const summary = computed<DealerHistoricoSummary>(() => {
    let totalSales = 0
    let totalRevenue = 0
    let totalProfit = 0
    let totalMargin = 0
    let countWithMargin = 0

    for (const entry of entries.value) {
      totalSales++
      totalRevenue += entry.sale_price || 0
      const profit = getProfit(entry)
      totalProfit += profit
      const margin = getMarginPercent(entry)
      if (entry.sale_price) {
        totalMargin += margin
        countWithMargin++
      }
    }

    return {
      totalSales,
      totalRevenue,
      totalProfit,
      avgMarginPercent: countWithMargin > 0 ? Math.round(totalMargin / countWithMargin) : 0,
    }
  })

  const sortedEntries = computed(() => {
    const arr = [...entries.value]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortCol.value) {
        case 'sale_date':
          cmp = new Date(a.sale_date || 0).getTime() - new Date(b.sale_date || 0).getTime()
          break
        case 'sale_price':
          cmp = (a.sale_price || 0) - (b.sale_price || 0)
          break
        case 'profit':
          cmp = getProfit(a) - getProfit(b)
          break
        case 'brand':
          cmp = (a.brand || '').localeCompare(b.brand || '')
          break
      }
      return sortAsc.value ? cmp : -cmp
    })
    return arr
  })

  // ---- Data fetching ----

  async function fetchEntries(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const dealer = dealerProfile.value || (await loadDealer())
      if (!dealer) {
        error.value = t('dashboard.historico.error')
        return
      }

      let query = supabase
        .from('vehicles')
        .select(
          'id, brand, model, year, price, sale_price, sale_date, acquisition_cost, total_maintenance, total_rental_income, buyer_name, buyer_contact, status',
        )
        .eq('dealer_id', dealer.id)
        .eq('status', 'sold')
        .order('sale_date', { ascending: false })

      if (filters.year) {
        const startDate = `${filters.year}-01-01`
        const endDate = `${filters.year}-12-31`
        query = query.gte('sale_date', startDate).lte('sale_date', endDate)
      }

      if (filters.brand) {
        query = query.ilike('brand', `%${filters.brand}%`)
      }

      if (filters.search) {
        query = query.or(
          `brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%,buyer_name.ilike.%${filters.search}%`,
        )
      }

      const { data, error: err } = await query

      if (err) throw err

      entries.value = (data as unknown as SoldVehicle[]) || []

      // Extract filter data
      await fetchFiltersData(dealer.id)
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || t('dashboard.historico.error')
      entries.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchFiltersData(dealerId: string): Promise<void> {
    try {
      const { data } = await supabase
        .from('vehicles')
        .select('sale_date, brand')
        .eq('dealer_id', dealerId)
        .eq('status', 'sold')

      if (data) {
        const years = new Set<number>()
        const brands = new Set<string>()

        for (const row of data as unknown as Array<{
          sale_date: string | null
          brand: string | null
        }>) {
          if (row.sale_date) {
            years.add(new Date(row.sale_date).getFullYear())
          }
          if (row.brand) {
            brands.add(row.brand)
          }
        }

        availableYears.value = Array.from(years).sort((a, b) => b - a)
        availableBrands.value = Array.from(brands).sort()

        const currentYear = new Date().getFullYear()
        if (!availableYears.value.includes(currentYear)) {
          availableYears.value.unshift(currentYear)
        }
      }
    } catch {
      availableYears.value = [new Date().getFullYear()]
      availableBrands.value = []
    }
  }

  // ---- Restore ----

  async function handleRestore(): Promise<void> {
    if (!restoreTarget.value || !canRestore.value) return
    saving.value = true
    error.value = null

    try {
      const { error: err } = await supabase
        .from('vehicles')
        .update({
          status: 'draft',
          sale_price: null,
          sale_date: null,
          buyer_name: null,
          buyer_contact: null,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', restoreTarget.value.id)

      if (err) throw err

      entries.value = entries.value.filter((e) => e.id !== restoreTarget.value?.id)
      showRestoreModal.value = false
      restoreTarget.value = null
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || 'Error restoring vehicle'
    } finally {
      saving.value = false
    }
  }

  // ---- Export ----

  function exportCSV(): void {
    const dataToExport = exportDataScope.value === 'all' ? entries.value : sortedEntries.value
    const headers = [
      t('dashboard.historico.table.vehicle'),
      t('dashboard.historico.table.year'),
      t('dashboard.historico.table.saleDate'),
      t('dashboard.historico.table.salePrice'),
      t('dashboard.historico.table.cost'),
      t('dashboard.historico.table.profit'),
      t('dashboard.historico.table.margin'),
    ]
    const rows = dataToExport.map((e) => [
      `${e.brand} ${e.model}`,
      e.year || '',
      e.sale_date || '',
      e.sale_price ? e.sale_price.toFixed(2) : '',
      getTotalCost(e).toFixed(2),
      getProfit(e).toFixed(2),
      `${getMarginPercent(e)}%`,
    ])

    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historico_${filters.year || 'all'}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showExportModal.value = false
  }

  // ---- Modal helpers ----

  function openDetailModal(entry: SoldVehicle): void {
    detailEntry.value = entry
    showDetailModal.value = true
  }

  function closeDetailModal(): void {
    showDetailModal.value = false
  }

  function openRestoreModal(entry: SoldVehicle): void {
    restoreTarget.value = entry
    restoreConfirm.value = ''
    showRestoreModal.value = true
  }

  function closeRestoreModal(): void {
    showRestoreModal.value = false
  }

  function closeExportModal(): void {
    showExportModal.value = false
  }

  function openExportModal(): void {
    showExportModal.value = true
  }

  // ---- Sort helpers ----

  function toggleSort(col: HistoricoSortCol): void {
    if (sortCol.value === col) {
      sortAsc.value = !sortAsc.value
    } else {
      sortCol.value = col
      sortAsc.value = false
    }
  }

  function getSortIcon(col: string): string {
    if (sortCol.value !== col) return ''
    return sortAsc.value ? ' \u2191' : ' \u2193'
  }

  // ---- Formatting ----

  function fmt(val: number | null | undefined): string {
    if (val === null || val === undefined) return '--'
    return new Intl.NumberFormat(locale.value === 'en' ? 'en-GB' : 'es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val)
  }

  function fmtDate(date: string | null): string {
    if (!date) return '--'
    return new Date(date).toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // ---- Filter helpers ----

  function clearFilters(): void {
    filters.year = null
    filters.brand = null
    filters.search = ''
  }

  function setFilterYear(val: number | null): void {
    filters.year = val
  }

  function setFilterBrand(val: string | null): void {
    filters.brand = val
  }

  function setFilterSearch(val: string): void {
    filters.search = val
  }

  function setRestoreConfirm(val: string): void {
    restoreConfirm.value = val
  }

  function setExportDataScope(val: 'all' | 'filtered'): void {
    exportDataScope.value = val
  }

  // ---- Init (called from onMounted in page) ----

  async function init(): Promise<void> {
    await fetchEntries()
  }

  return {
    // Data
    entries: readonly(entries),
    loading: readonly(loading),
    saving: readonly(saving),
    error,
    availableYears: readonly(availableYears),
    availableBrands: readonly(availableBrands),
    filters,

    // Sort
    sortCol: readonly(sortCol),
    sortAsc: readonly(sortAsc),

    // Modals
    showDetailModal: readonly(showDetailModal),
    detailEntry: readonly(detailEntry),
    showRestoreModal: readonly(showRestoreModal),
    restoreTarget: readonly(restoreTarget),
    restoreConfirm: readonly(restoreConfirm),
    showExportModal: readonly(showExportModal),
    exportDataScope: readonly(exportDataScope),

    // Computed
    canRestore,
    summary,
    sortedEntries,

    // Functions
    fetchEntries,
    handleRestore,
    exportCSV,
    openDetailModal,
    closeDetailModal,
    openRestoreModal,
    closeRestoreModal,
    openExportModal,
    closeExportModal,
    toggleSort,
    getSortIcon,
    fmt,
    fmtDate,
    clearFilters,
    setFilterYear,
    setFilterBrand,
    setFilterSearch,
    setRestoreConfirm,
    setExportDataScope,

    // Init
    init,
  }
}
