/**
 * Composable for dealer rental records management.
 * Extracts all rental CRUD logic from the alquileres page.
 * Plan gate: Basico+ (free plan sees upgrade prompt).
 */

// ============ TYPES ============

export interface DealerVehicleOption {
  id: string
  brand: string
  model: string
  year: number | null
}

export type RentalStatus = 'active' | 'finished' | 'overdue'

export interface RentalRecord {
  id: string
  dealer_id: string
  vehicle_id: string
  vehicle_brand: string
  vehicle_model: string
  vehicle_year: number | null
  client_name: string
  client_contact: string | null
  start_date: string
  end_date: string | null
  monthly_rent: number
  deposit: number | null
  status: RentalStatus
  notes: string | null
  created_at: string
}

export interface RentalFormData {
  vehicle_id: string
  client_name: string
  client_contact: string
  start_date: string
  end_date: string
  monthly_rent: number | null
  deposit: number | null
  status: RentalStatus
  notes: string
}

// ============ COMPOSABLE ============

export function useDashboardAlquileres() {
  const { t, locale } = useI18n()
  const supabase = useSupabaseClient()
  const { userId } = useAuth()
  const { dealerProfile, loadDealer } = useDealerDashboard()
  const { canExport, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

  // ---------- State ----------

  const records = ref<RentalRecord[]>([])
  const vehicleOptions = ref<DealerVehicleOption[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const successMsg = ref<string | null>(null)

  // View
  const viewMode = ref<'cards' | 'table'>('cards')

  // Form
  const showForm = ref(false)
  const editingId = ref<string | null>(null)
  const form = reactive<RentalFormData>({
    vehicle_id: '',
    client_name: '',
    client_contact: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    monthly_rent: null,
    deposit: null,
    status: 'active',
    notes: '',
  })

  // Delete modal
  const showDeleteModal = ref(false)
  const deleteTarget = ref<RentalRecord | null>(null)

  // ---------- Computed ----------

  const activeRentals = computed(() => records.value.filter((r) => r.status === 'active'))

  const totalActiveRentals = computed(() => activeRentals.value.length)

  const totalMonthlyIncome = computed(() =>
    activeRentals.value.reduce((sum, r) => sum + r.monthly_rent, 0),
  )

  const endingSoonRentals = computed(() => {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    const now = new Date()

    return activeRentals.value.filter((r) => {
      if (!r.end_date) return false
      const endDate = new Date(r.end_date)
      return endDate >= now && endDate <= thirtyDaysFromNow
    })
  })

  const vehiclesAvailableSoon = computed(() => endingSoonRentals.value.length)

  const isFormValid = computed(() => {
    return (
      form.vehicle_id !== '' &&
      form.client_name.trim() !== '' &&
      form.start_date !== '' &&
      form.monthly_rent !== null &&
      form.monthly_rent > 0
    )
  })

  const sortedRecords = computed(() => {
    const statusOrder: Record<RentalStatus, number> = { active: 0, overdue: 1, finished: 2 }
    return [...records.value].sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status]
      if (statusDiff !== 0) return statusDiff
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    })
  })

  // ---------- Data loading ----------

  async function loadData() {
    loading.value = true
    error.value = null

    try {
      const dealer = dealerProfile.value || (await loadDealer())
      if (!dealer) {
        error.value = t('dashboard.tools.rentals.errorNoDealer')
        return
      }

      // Load vehicles
      const { data: vehiclesData, error: vErr } = await supabase
        .from('vehicles')
        .select('id, brand, model, year')
        .eq('dealer_id', dealer.id)
        .order('brand', { ascending: true })

      if (vErr) throw vErr
      vehicleOptions.value = (vehiclesData || []) as DealerVehicleOption[]

      // Load rental records
      const { data: rentalsData, error: rErr } = await supabase
        .from('rental_records')
        .select('*, vehicles(brand, model, year)')
        .eq('dealer_id', dealer.id)
        .order('start_date', { ascending: false })

      if (rErr) throw rErr

      records.value = (
        (rentalsData || []) as Array<{
          id: string
          dealer_id: string
          vehicle_id: string
          client_name: string
          client_contact: string | null
          start_date: string
          end_date: string | null
          monthly_rent: number
          deposit: number | null
          status: RentalStatus
          notes: string | null
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
        client_name: r.client_name,
        client_contact: r.client_contact,
        start_date: r.start_date,
        end_date: r.end_date,
        monthly_rent: r.monthly_rent,
        deposit: r.deposit,
        status: r.status,
        notes: r.notes,
        created_at: r.created_at,
      }))

      // Auto-detect overdue
      checkOverdue()
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || t('dashboard.tools.rentals.errorLoading')
    } finally {
      loading.value = false
    }
  }

  function checkOverdue() {
    const now = new Date()
    for (const record of records.value) {
      if (record.status === 'active' && record.end_date) {
        const endDate = new Date(record.end_date)
        if (endDate < now) {
          record.status = 'overdue'
        }
      }
    }
  }

  // ---------- CRUD ----------

  function openCreateForm() {
    editingId.value = null
    form.vehicle_id = vehicleOptions.value[0]?.id || ''
    form.client_name = ''
    form.client_contact = ''
    form.start_date = new Date().toISOString().split('T')[0]
    form.end_date = ''
    form.monthly_rent = null
    form.deposit = null
    form.status = 'active'
    form.notes = ''
    showForm.value = true
    successMsg.value = null
  }

  function openEditForm(record: RentalRecord) {
    editingId.value = record.id
    form.vehicle_id = record.vehicle_id
    form.client_name = record.client_name
    form.client_contact = record.client_contact || ''
    form.start_date = record.start_date
    form.end_date = record.end_date || ''
    form.monthly_rent = record.monthly_rent
    form.deposit = record.deposit
    form.status = record.status
    form.notes = record.notes || ''
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
        client_name: form.client_name.trim(),
        client_contact: form.client_contact.trim() || null,
        start_date: form.start_date,
        end_date: form.end_date || null,
        monthly_rent: form.monthly_rent,
        deposit: form.deposit,
        status: form.status,
        notes: form.notes.trim() || null,
      }

      if (editingId.value) {
        const { error: err } = await supabase
          .from('rental_records')
          .update({ ...payload, updated_at: new Date().toISOString() } as never)
          .eq('id', editingId.value)

        if (err) throw err
        successMsg.value = t('dashboard.tools.rentals.updated')
      } else {
        const { error: err } = await supabase.from('rental_records').insert(payload as never)

        if (err) throw err
        successMsg.value = t('dashboard.tools.rentals.created')
      }

      showForm.value = false
      await loadData()
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || t('dashboard.tools.rentals.errorSaving')
    } finally {
      saving.value = false
    }
  }

  function confirmDelete(record: RentalRecord) {
    deleteTarget.value = record
    showDeleteModal.value = true
  }

  async function handleDelete() {
    if (!deleteTarget.value) return
    saving.value = true
    error.value = null

    try {
      const { error: err } = await supabase
        .from('rental_records')
        .delete()
        .eq('id', deleteTarget.value.id)

      if (err) throw err

      records.value = records.value.filter((r) => r.id !== deleteTarget.value?.id)
      showDeleteModal.value = false
      deleteTarget.value = null
      successMsg.value = t('dashboard.tools.rentals.deleted')
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || t('dashboard.tools.rentals.errorDeleting')
    } finally {
      saving.value = false
    }
  }

  // ---------- Export ----------

  function exportCSV() {
    const headers = [
      t('dashboard.tools.rentals.table.vehicle'),
      t('dashboard.tools.rentals.table.client'),
      t('dashboard.tools.rentals.table.contact'),
      t('dashboard.tools.rentals.table.startDate'),
      t('dashboard.tools.rentals.table.endDate'),
      t('dashboard.tools.rentals.table.monthlyRent'),
      t('dashboard.tools.rentals.table.deposit'),
      t('dashboard.tools.rentals.table.status'),
      t('dashboard.tools.rentals.table.notes'),
    ]

    const rows = sortedRecords.value.map((r) => [
      `${r.vehicle_brand} ${r.vehicle_model}`,
      r.client_name,
      r.client_contact || '',
      r.start_date,
      r.end_date || '',
      r.monthly_rent.toFixed(2),
      r.deposit ? r.deposit.toFixed(2) : '',
      r.status,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ])

    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `alquileres_${new Date().toISOString().split('T')[0]}.csv`
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

  function fmtDate(date: string | null): string {
    if (!date) return '--'
    return new Date(date).toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function getStatusClass(status: RentalStatus): string {
    switch (status) {
      case 'active':
        return 'status-active'
      case 'finished':
        return 'status-finished'
      case 'overdue':
        return 'status-overdue'
      default:
        return ''
    }
  }

  function isEndingSoon(record: RentalRecord): boolean {
    if (record.status !== 'active' || !record.end_date) return false
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    const endDate = new Date(record.end_date)
    return endDate >= new Date() && endDate <= thirtyDaysFromNow
  }

  function daysUntilEnd(record: RentalRecord): number {
    if (!record.end_date) return -1
    const endDate = new Date(record.end_date)
    const now = new Date()
    return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
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
    viewMode,
    showForm,
    editingId,
    form,
    showDeleteModal,
    deleteTarget,

    // Computed
    activeRentals,
    totalActiveRentals,
    totalMonthlyIncome,
    endingSoonRentals,
    vehiclesAvailableSoon,
    isFormValid,
    sortedRecords,

    // Functions
    loadData,
    checkOverdue,
    openCreateForm,
    openEditForm,
    handleSave,
    confirmDelete,
    handleDelete,
    exportCSV,
    fmt,
    fmtDate,
    getStatusClass,
    isEndingSoon,
    daysUntilEnd,

    // From dependencies (for page use)
    canExport,
    fetchSubscription,
  }
}
