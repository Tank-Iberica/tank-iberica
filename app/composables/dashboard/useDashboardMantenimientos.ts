/**
 * Composable for dealer maintenance records management.
 * Extracts all maintenance CRUD logic from the mantenimientos page.
 * Plan gate: Basico+ (free plan sees upgrade prompt).
 */

// ============ TYPES ============

export interface DealerVehicleOption {
  id: string
  brand: string
  model: string
  year: number | null
}

export interface MaintenanceRecord {
  id: string
  dealer_id: string
  vehicle_id: string
  vehicle_brand: string
  vehicle_model: string
  vehicle_year: number | null
  date: string
  type: 'preventivo' | 'correctivo' | 'itv'
  description: string
  cost: number
  km: number | null
  created_at: string
}

export interface MaintenanceFormData {
  vehicle_id: string
  date: string
  type: 'preventivo' | 'correctivo' | 'itv'
  description: string
  cost: number | null
  km: number | null
}

export type SortColumn = 'date' | 'cost' | 'vehicle' | 'type'

// ============ COMPOSABLE ============

export function useDashboardMantenimientos() {
  const { t, locale } = useI18n()
  const supabase = useSupabaseClient()
  const { userId } = useAuth()
  const { dealerProfile, loadDealer } = useDealerDashboard()
  const { canExport, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

  // ---------- State ----------

  const records = ref<MaintenanceRecord[]>([])
  const vehicleOptions = ref<DealerVehicleOption[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const successMsg = ref<string | null>(null)

  // Filters
  const filterVehicle = ref<string | null>(null)
  const filterType = ref<string | null>(null)

  // Sort
  const sortCol = ref<SortColumn>('date')
  const sortAsc = ref(false)

  // Form
  const showForm = ref(false)
  const editingId = ref<string | null>(null)
  const form = reactive<MaintenanceFormData>({
    vehicle_id: '',
    date: new Date().toISOString().split('T')[0],
    type: 'preventivo',
    description: '',
    cost: null,
    km: null,
  })

  // Delete confirmation
  const showDeleteModal = ref(false)
  const deleteTarget = ref<MaintenanceRecord | null>(null)

  // ---------- Computed ----------

  const filteredRecords = computed(() => {
    let result = records.value

    if (filterVehicle.value) {
      result = result.filter((r) => r.vehicle_id === filterVehicle.value)
    }

    if (filterType.value) {
      result = result.filter((r) => r.type === filterType.value)
    }

    return result
  })

  const sortedRecords = computed(() => {
    const arr = [...filteredRecords.value]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortCol.value) {
        case 'date':
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case 'cost':
          cmp = a.cost - b.cost
          break
        case 'vehicle':
          cmp = `${a.vehicle_brand} ${a.vehicle_model}`.localeCompare(
            `${b.vehicle_brand} ${b.vehicle_model}`,
          )
          break
        case 'type':
          cmp = a.type.localeCompare(b.type)
          break
      }
      return sortAsc.value ? cmp : -cmp
    })
    return arr
  })

  const currentYear = new Date().getFullYear()

  const summaryTotalCostThisYear = computed(() => {
    return records.value
      .filter((r) => new Date(r.date).getFullYear() === currentYear)
      .reduce((sum, r) => sum + r.cost, 0)
  })

  const summaryTotalRecords = computed(() => records.value.length)

  const summaryAvgCost = computed(() => {
    if (records.value.length === 0) return 0
    const total = records.value.reduce((sum, r) => sum + r.cost, 0)
    return Math.round(total / records.value.length)
  })

  const isFormValid = computed(() => {
    return (
      form.vehicle_id !== '' &&
      form.date !== '' &&
      form.description.trim() !== '' &&
      form.cost !== null &&
      form.cost >= 0
    )
  })

  // ---------- Data loading ----------

  async function loadData() {
    loading.value = true
    error.value = null

    try {
      const dealer = dealerProfile.value || (await loadDealer())
      if (!dealer) {
        error.value = t('dashboard.tools.maintenance.errorNoDealer')
        return
      }

      // Load vehicles for select
      const { data: vehiclesData, error: vErr } = await supabase
        .from('vehicles')
        .select('id, brand, model, year')
        .eq('dealer_id', dealer.id)
        .order('brand', { ascending: true })

      if (vErr) throw vErr
      vehicleOptions.value = (vehiclesData || []) as DealerVehicleOption[]

      // Load maintenance records
      const { data: recordsData, error: rErr } = await supabase
        .from('maintenance_records')
        .select('*, vehicles(brand, model, year)')
        .eq('dealer_id', dealer.id)
        .order('date', { ascending: false })

      if (rErr) throw rErr

      records.value = (
        (recordsData || []) as Array<{
          id: string
          dealer_id: string
          vehicle_id: string
          date: string
          type: 'preventivo' | 'correctivo' | 'itv'
          description: string
          cost: number
          km: number | null
          created_at: string
          vehicles: { brand: string; model: string; year: number | null } | null
        }>
      ).map((r) => ({
        id: r.id,
        dealer_id: r.dealer_id,
        vehicle_id: r.vehicle_id,
        vehicle_brand: r.vehicles?.brand || '',
        vehicle_model: r.vehicles?.model || '',
        vehicle_year: r.vehicles?.year ?? null,
        date: r.date,
        type: r.type,
        description: r.description,
        cost: r.cost,
        km: r.km,
        created_at: r.created_at,
      }))
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || t('dashboard.tools.maintenance.errorLoading')
    } finally {
      loading.value = false
    }
  }

  // ---------- CRUD ----------

  function openCreateForm() {
    editingId.value = null
    form.vehicle_id = vehicleOptions.value[0]?.id || ''
    form.date = new Date().toISOString().split('T')[0]
    form.type = 'preventivo'
    form.description = ''
    form.cost = null
    form.km = null
    showForm.value = true
    successMsg.value = null
  }

  function openEditForm(record: MaintenanceRecord) {
    editingId.value = record.id
    form.vehicle_id = record.vehicle_id
    form.date = record.date
    form.type = record.type
    form.description = record.description
    form.cost = record.cost
    form.km = record.km
    showForm.value = true
    successMsg.value = null
  }

  async function handleSave() {
    if (!isFormValid.value) return
    saving.value = true
    error.value = null
    successMsg.value = null

    try {
      const dealer = dealerProfile.value
      if (!dealer) throw new Error('Dealer not found')

      const payload = {
        dealer_id: dealer.id,
        vehicle_id: form.vehicle_id,
        date: form.date,
        type: form.type,
        description: form.description.trim(),
        cost: form.cost,
        km: form.km,
      }

      if (editingId.value) {
        const { error: err } = await supabase
          .from('maintenance_records')
          .update({ ...payload, updated_at: new Date().toISOString() } as never)
          .eq('id', editingId.value)

        if (err) throw err
        successMsg.value = t('dashboard.tools.maintenance.updated')
      } else {
        const { error: err } = await supabase.from('maintenance_records').insert(payload as never)

        if (err) throw err
        successMsg.value = t('dashboard.tools.maintenance.created')
      }

      showForm.value = false
      await loadData()
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || t('dashboard.tools.maintenance.errorSaving')
    } finally {
      saving.value = false
    }
  }

  function confirmDelete(record: MaintenanceRecord) {
    deleteTarget.value = record
    showDeleteModal.value = true
  }

  async function handleDelete() {
    if (!deleteTarget.value) return
    saving.value = true
    error.value = null

    try {
      const { error: err } = await supabase
        .from('maintenance_records')
        .delete()
        .eq('id', deleteTarget.value.id)

      if (err) throw err

      records.value = records.value.filter((r) => r.id !== deleteTarget.value?.id)
      showDeleteModal.value = false
      deleteTarget.value = null
      successMsg.value = t('dashboard.tools.maintenance.deleted')
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || t('dashboard.tools.maintenance.errorDeleting')
    } finally {
      saving.value = false
    }
  }

  // ---------- Sort ----------

  function toggleSort(col: SortColumn) {
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

  // ---------- Export ----------

  function exportCSV() {
    const headers = [
      t('dashboard.tools.maintenance.table.vehicle'),
      t('dashboard.tools.maintenance.table.date'),
      t('dashboard.tools.maintenance.table.type'),
      t('dashboard.tools.maintenance.table.description'),
      t('dashboard.tools.maintenance.table.cost'),
      t('dashboard.tools.maintenance.table.km'),
    ]

    const rows = sortedRecords.value.map((r) => [
      `${r.vehicle_brand} ${r.vehicle_model}`,
      r.date,
      r.type,
      `"${r.description.replace(/"/g, '""')}"`,
      r.cost.toFixed(2),
      r.km ? String(r.km) : '',
    ])

    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mantenimientos_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ---------- Formatting ----------

  function fmt(val: number): string {
    return new Intl.NumberFormat(locale.value === 'en' ? 'en-GB' : 'es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val)
  }

  function fmtDate(date: string): string {
    return new Date(date).toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function fmtKm(km: number | null): string {
    if (!km) return '--'
    return new Intl.NumberFormat(locale.value === 'en' ? 'en-GB' : 'es-ES').format(km) + ' km'
  }

  function getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'preventivo':
        return 'badge-preventivo'
      case 'correctivo':
        return 'badge-correctivo'
      case 'itv':
        return 'badge-itv'
      default:
        return ''
    }
  }

  function clearFilters() {
    filterVehicle.value = null
    filterType.value = null
  }

  // ---------- Form update (for subcomponent emit pattern) ----------

  function updateForm(updated: MaintenanceFormData) {
    form.vehicle_id = updated.vehicle_id
    form.date = updated.date
    form.type = updated.type
    form.description = updated.description
    form.cost = updated.cost
    form.km = updated.km
  }

  // ---------- Return ----------

  return {
    // State
    records,
    vehicleOptions,
    loading,
    saving,
    error,
    successMsg,
    filterVehicle,
    filterType,
    sortCol,
    sortAsc,
    showForm,
    editingId,
    form,
    showDeleteModal,
    deleteTarget,

    // Computed
    filteredRecords,
    sortedRecords,
    summaryTotalCostThisYear,
    summaryTotalRecords,
    summaryAvgCost,
    isFormValid,

    // Functions
    loadData,
    openCreateForm,
    openEditForm,
    handleSave,
    confirmDelete,
    handleDelete,
    toggleSort,
    getSortIcon,
    exportCSV,
    fmt,
    fmtDate,
    fmtKm,
    getTypeBadgeClass,
    clearFilters,
    updateForm,

    // From dependencies (for page use)
    canExport,
    fetchSubscription,
  }
}
