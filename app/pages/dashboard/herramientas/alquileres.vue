<script setup lang="ts">
/**
 * Rental Records Tool
 * CRUD for rental_records table scoped to dealer.
 * Plan: Basico+
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t, locale } = useI18n()
const supabase = useSupabaseClient()
const { userId } = useAuth()
const { dealerProfile, loadDealer } = useDealerDashboard()
const { canExport, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

// ---------- Types ----------

interface DealerVehicleOption {
  id: string
  brand: string
  model: string
  year: number | null
}

type RentalStatus = 'active' | 'finished' | 'overdue'

interface RentalRecord {
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

interface RentalFormData {
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
const _finishedRentals = computed(() => records.value.filter((r) => r.status === 'finished'))
const _overdueRentals = computed(() => records.value.filter((r) => r.status === 'overdue'))

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

// ---------- Lifecycle ----------

onMounted(async () => {
  await Promise.all([loadData(), fetchSubscription()])
})
</script>

<template>
  <div class="rentals-page">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h1>{{ t('dashboard.tools.rentals.title') }}</h1>
        <p class="subtitle">{{ t('dashboard.tools.rentals.subtitle') }}</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="exportCSV">
          {{ t('dashboard.tools.rentals.exportCSV') }}
        </button>
        <button class="btn-primary" @click="openCreateForm">
          + {{ t('dashboard.tools.rentals.addRental') }}
        </button>
      </div>
    </header>

    <!-- Plan gate -->
    <div v-if="!canExport" class="plan-gate">
      <div class="gate-icon">&#128274;</div>
      <h2>{{ t('dashboard.tools.rentals.planRequired') }}</h2>
      <p>{{ t('dashboard.tools.rentals.planRequiredDesc') }}</p>
      <NuxtLink to="/dashboard/suscripcion" class="btn-primary">
        {{ t('dashboard.tools.rentals.upgradePlan') }}
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Success -->
      <div v-if="successMsg" class="alert-success">{{ successMsg }}</div>

      <!-- Error -->
      <div v-if="error" class="alert-error">{{ error }}</div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card active-rentals">
          <span class="card-label">{{ t('dashboard.tools.rentals.summary.activeRentals') }}</span>
          <span class="card-value">{{ totalActiveRentals }}</span>
        </div>
        <div class="summary-card monthly-income">
          <span class="card-label">{{ t('dashboard.tools.rentals.summary.monthlyIncome') }}</span>
          <span class="card-value">{{ fmt(totalMonthlyIncome) }}</span>
        </div>
        <div class="summary-card available-soon">
          <span class="card-label">{{ t('dashboard.tools.rentals.summary.availableSoon') }}</span>
          <span class="card-value">{{ vehiclesAvailableSoon }}</span>
        </div>
      </div>

      <!-- Ending Soon Alerts -->
      <div v-if="endingSoonRentals.length > 0" class="ending-soon-alert">
        <strong>{{ t('dashboard.tools.rentals.endingSoonTitle') }}</strong>
        <div v-for="r in endingSoonRentals" :key="r.id" class="ending-soon-item">
          <span>{{ r.vehicle_brand }} {{ r.vehicle_model }} &mdash; {{ r.client_name }}</span>
          <span class="days-remaining">
            {{ daysUntilEnd(r) }} {{ t('dashboard.tools.rentals.daysLeft') }}
          </span>
        </div>
      </div>

      <!-- View toggle -->
      <div class="view-toggle">
        <button
          class="toggle-btn"
          :class="{ active: viewMode === 'cards' }"
          @click="viewMode = 'cards'"
        >
          {{ t('dashboard.tools.rentals.viewCards') }}
        </button>
        <button
          class="toggle-btn"
          :class="{ active: viewMode === 'table' }"
          @click="viewMode = 'table'"
        >
          {{ t('dashboard.tools.rentals.viewTable') }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner" />
        <span>{{ t('common.loading') }}...</span>
      </div>

      <!-- Card View -->
      <div v-else-if="viewMode === 'cards'">
        <div v-if="sortedRecords.length === 0" class="empty-state">
          <p>{{ t('dashboard.tools.rentals.empty') }}</p>
          <button class="btn-primary" @click="openCreateForm">
            + {{ t('dashboard.tools.rentals.addFirst') }}
          </button>
        </div>

        <div v-else class="rental-cards-grid">
          <div
            v-for="r in sortedRecords"
            :key="r.id"
            class="rental-card"
            :class="{ 'ending-soon': isEndingSoon(r), [getStatusClass(r.status)]: true }"
          >
            <!-- Status badge -->
            <div class="card-top">
              <span class="status-badge" :class="getStatusClass(r.status)">
                {{ t(`dashboard.tools.rentals.statuses.${r.status}`) }}
              </span>
              <div class="card-actions">
                <button
                  class="btn-icon"
                  :title="t('dashboard.tools.rentals.edit')"
                  @click="openEditForm(r)"
                >
                  &#9998;
                </button>
                <button
                  class="btn-icon delete"
                  :title="t('dashboard.tools.rentals.delete')"
                  @click="confirmDelete(r)"
                >
                  &#128465;
                </button>
              </div>
            </div>

            <!-- Vehicle info -->
            <div class="card-vehicle">
              <strong>{{ r.vehicle_brand }} {{ r.vehicle_model }}</strong>
              <span v-if="r.vehicle_year" class="year-tag">({{ r.vehicle_year }})</span>
            </div>

            <!-- Client -->
            <div class="card-client">
              <span class="client-name">{{ r.client_name }}</span>
              <span v-if="r.client_contact" class="client-contact">{{ r.client_contact }}</span>
            </div>

            <!-- Details grid -->
            <div class="card-details">
              <div class="detail">
                <span class="detail-label">{{
                  t('dashboard.tools.rentals.table.monthlyRent')
                }}</span>
                <span class="detail-value rent"
                  >{{ fmt(r.monthly_rent) }}/{{ t('dashboard.tools.rentals.month') }}</span
                >
              </div>
              <div class="detail">
                <span class="detail-label">{{ t('dashboard.tools.rentals.table.deposit') }}</span>
                <span class="detail-value">{{ r.deposit ? fmt(r.deposit) : '--' }}</span>
              </div>
              <div class="detail">
                <span class="detail-label">{{ t('dashboard.tools.rentals.table.startDate') }}</span>
                <span class="detail-value">{{ fmtDate(r.start_date) }}</span>
              </div>
              <div class="detail">
                <span class="detail-label">{{ t('dashboard.tools.rentals.table.endDate') }}</span>
                <span class="detail-value" :class="{ 'ending-text': isEndingSoon(r) }">
                  {{ fmtDate(r.end_date) }}
                  <span v-if="isEndingSoon(r)" class="ending-badge"> {{ daysUntilEnd(r) }}d </span>
                </span>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="r.notes" class="card-notes">
              {{ r.notes }}
            </div>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div v-else-if="viewMode === 'table'" class="table-container">
        <table v-if="sortedRecords.length > 0" class="data-table">
          <thead>
            <tr>
              <th>{{ t('dashboard.tools.rentals.table.vehicle') }}</th>
              <th>{{ t('dashboard.tools.rentals.table.client') }}</th>
              <th>{{ t('dashboard.tools.rentals.table.startDate') }}</th>
              <th>{{ t('dashboard.tools.rentals.table.endDate') }}</th>
              <th class="num">{{ t('dashboard.tools.rentals.table.monthlyRent') }}</th>
              <th>{{ t('dashboard.tools.rentals.table.status') }}</th>
              <th class="actions-col">{{ t('dashboard.tools.rentals.table.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in sortedRecords" :key="r.id">
              <td class="vehicle-cell">
                <strong>{{ r.vehicle_brand }}</strong> {{ r.vehicle_model }}
              </td>
              <td>{{ r.client_name }}</td>
              <td>{{ fmtDate(r.start_date) }}</td>
              <td :class="{ 'ending-text': isEndingSoon(r) }">
                {{ fmtDate(r.end_date) }}
                <span v-if="isEndingSoon(r)" class="ending-badge">{{ daysUntilEnd(r) }}d</span>
              </td>
              <td class="num">
                <strong>{{ fmt(r.monthly_rent) }}</strong>
              </td>
              <td>
                <span class="status-badge" :class="getStatusClass(r.status)">
                  {{ t(`dashboard.tools.rentals.statuses.${r.status}`) }}
                </span>
              </td>
              <td class="actions-cell">
                <button class="btn-icon" @click="openEditForm(r)">&#9998;</button>
                <button class="btn-icon delete" @click="confirmDelete(r)">&#128465;</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else class="empty-state">
          <p>{{ t('dashboard.tools.rentals.empty') }}</p>
        </div>
      </div>

      <!-- Create/Edit Form Modal -->
      <Teleport to="body">
        <div v-if="showForm" class="modal-bg" @click.self="showForm = false">
          <div class="modal">
            <div class="modal-head">
              <span>
                {{
                  editingId
                    ? t('dashboard.tools.rentals.editTitle')
                    : t('dashboard.tools.rentals.createTitle')
                }}
              </span>
              <button @click="showForm = false">&times;</button>
            </div>
            <div class="modal-body">
              <!-- Vehicle -->
              <div class="field">
                <label>{{ t('dashboard.tools.rentals.form.vehicle') }} *</label>
                <select v-model="form.vehicle_id" class="field-input">
                  <option value="" disabled>
                    {{ t('dashboard.tools.rentals.form.selectVehicle') }}
                  </option>
                  <option v-for="v in vehicleOptions" :key="v.id" :value="v.id">
                    {{ v.brand }} {{ v.model }} {{ v.year ? `(${v.year})` : '' }}
                  </option>
                </select>
              </div>

              <!-- Client name & contact -->
              <div class="field-row">
                <div class="field">
                  <label>{{ t('dashboard.tools.rentals.form.clientName') }} *</label>
                  <input
                    v-model="form.client_name"
                    type="text"
                    class="field-input"
                    :placeholder="t('dashboard.tools.rentals.form.clientNamePlaceholder')"
                  >
                </div>
                <div class="field">
                  <label>{{ t('dashboard.tools.rentals.form.clientContact') }}</label>
                  <input
                    v-model="form.client_contact"
                    type="text"
                    class="field-input"
                    :placeholder="t('dashboard.tools.rentals.form.clientContactPlaceholder')"
                  >
                </div>
              </div>

              <!-- Dates -->
              <div class="field-row">
                <div class="field">
                  <label>{{ t('dashboard.tools.rentals.form.startDate') }} *</label>
                  <input v-model="form.start_date" type="date" class="field-input" >
                </div>
                <div class="field">
                  <label>{{ t('dashboard.tools.rentals.form.endDate') }}</label>
                  <input v-model="form.end_date" type="date" class="field-input" >
                </div>
              </div>

              <!-- Money -->
              <div class="field-row">
                <div class="field">
                  <label>{{ t('dashboard.tools.rentals.form.monthlyRent') }} *</label>
                  <input
                    v-model.number="form.monthly_rent"
                    type="number"
                    min="0"
                    step="0.01"
                    class="field-input"
                    placeholder="0.00"
                  >
                </div>
                <div class="field">
                  <label>{{ t('dashboard.tools.rentals.form.deposit') }}</label>
                  <input
                    v-model.number="form.deposit"
                    type="number"
                    min="0"
                    step="0.01"
                    class="field-input"
                    placeholder="0.00"
                  >
                </div>
              </div>

              <!-- Status -->
              <div class="field">
                <label>{{ t('dashboard.tools.rentals.form.status') }} *</label>
                <div class="radio-group">
                  <label class="radio-label">
                    <input v-model="form.status" type="radio" value="active" >
                    {{ t('dashboard.tools.rentals.statuses.active') }}
                  </label>
                  <label class="radio-label">
                    <input v-model="form.status" type="radio" value="finished" >
                    {{ t('dashboard.tools.rentals.statuses.finished') }}
                  </label>
                  <label class="radio-label">
                    <input v-model="form.status" type="radio" value="overdue" >
                    {{ t('dashboard.tools.rentals.statuses.overdue') }}
                  </label>
                </div>
              </div>

              <!-- Notes -->
              <div class="field">
                <label>{{ t('dashboard.tools.rentals.form.notes') }}</label>
                <textarea
                  v-model="form.notes"
                  rows="3"
                  class="field-input"
                  :placeholder="t('dashboard.tools.rentals.form.notesPlaceholder')"
                />
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn" @click="showForm = false">
                {{ t('dashboard.tools.rentals.form.cancel') }}
              </button>
              <button
                class="btn btn-primary"
                :disabled="!isFormValid || saving"
                @click="handleSave"
              >
                <span v-if="saving" class="spinner-sm" />
                {{
                  editingId
                    ? t('dashboard.tools.rentals.form.update')
                    : t('dashboard.tools.rentals.form.save')
                }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Delete Confirmation Modal -->
      <Teleport to="body">
        <div v-if="showDeleteModal" class="modal-bg" @click.self="showDeleteModal = false">
          <div class="modal">
            <div class="modal-head">
              <span>{{ t('dashboard.tools.rentals.deleteTitle') }}</span>
              <button @click="showDeleteModal = false">&times;</button>
            </div>
            <div class="modal-body">
              <p>{{ t('dashboard.tools.rentals.deleteConfirm') }}</p>
              <div v-if="deleteTarget" class="delete-info">
                <strong>{{ deleteTarget.vehicle_brand }} {{ deleteTarget.vehicle_model }}</strong>
                &mdash; {{ deleteTarget.client_name }}
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn" @click="showDeleteModal = false">
                {{ t('dashboard.tools.rentals.form.cancel') }}
              </button>
              <button class="btn btn-danger" :disabled="saving" @click="handleDelete">
                {{ t('dashboard.tools.rentals.confirmDelete') }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </template>
  </div>
</template>

<style scoped>
.rentals-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Plan gate */
.plan-gate {
  text-align: center;
  padding: 48px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.gate-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.plan-gate h2 {
  margin: 0 0 8px;
  font-size: 1.2rem;
  color: #1e293b;
}

.plan-gate p {
  margin: 0 0 20px;
  color: #64748b;
  font-size: 0.9rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
}

.btn:hover {
  background: #f8fafc;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
  gap: 6px;
}

.btn-primary:hover {
  background: #1a3238;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 16px;
  background: white;
  color: var(--color-primary, #23424a);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #f8fafc;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  font-weight: 600;
  min-height: 44px;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-danger:hover {
  background: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: #f3f4f6;
}

.btn-icon.delete:hover {
  background: #fee2e2;
}

/* Alerts */
.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.9rem;
}

.alert-success {
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #16a34a;
  font-size: 0.9rem;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.summary-card {
  padding: 16px 20px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-card .card-label {
  font-size: 0.8rem;
  font-weight: 500;
  opacity: 0.8;
}

.summary-card .card-value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
}

.summary-card.active-rentals {
  background: #dcfce7;
  color: #166534;
}

.summary-card.monthly-income {
  background: #dbeafe;
  color: #1e40af;
}

.summary-card.available-soon {
  background: #fef3c7;
  color: #92400e;
}

/* Ending soon alerts */
.ending-soon-alert {
  padding: 16px;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 12px;
}

.ending-soon-alert strong {
  display: block;
  margin-bottom: 8px;
  color: #92400e;
  font-size: 0.9rem;
}

.ending-soon-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 0.85rem;
  color: #78350f;
}

.days-remaining {
  font-weight: 700;
  color: #dc2626;
}

/* View toggle */
.view-toggle {
  display: flex;
  gap: 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  align-self: flex-start;
}

.toggle-btn {
  min-height: 44px;
  padding: 10px 20px;
  border: none;
  background: white;
  font-size: 0.85rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.toggle-btn + .toggle-btn {
  border-left: 1px solid #e5e7eb;
}

.toggle-btn.active {
  background: var(--color-primary, #23424a);
  color: white;
}

/* Loading */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #64748b;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Rental Cards Grid */
.rental-cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.rental-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rental-card.status-active {
  border-left-color: #22c55e;
}

.rental-card.status-finished {
  border-left-color: #94a3b8;
}

.rental-card.status-overdue {
  border-left-color: #ef4444;
}

.rental-card.ending-soon {
  background: #fffbeb;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-actions {
  display: flex;
  gap: 0;
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.status-active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.status-finished {
  background: #f1f5f9;
  color: #64748b;
}

.status-badge.status-overdue {
  background: #fee2e2;
  color: #991b1b;
}

.card-vehicle {
  font-size: 1rem;
}

.year-tag {
  color: #9ca3af;
  font-size: 0.85rem;
  font-weight: 400;
}

.card-client {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.client-name {
  font-size: 0.9rem;
  color: #374151;
}

.client-contact {
  font-size: 0.8rem;
  color: #9ca3af;
}

.card-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 4px;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
}

.detail-value {
  font-size: 0.85rem;
  color: #374151;
}

.detail-value.rent {
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.ending-text {
  color: #dc2626;
}

.ending-badge {
  display: inline-block;
  padding: 1px 6px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 700;
  margin-left: 4px;
}

.card-notes {
  font-size: 0.8rem;
  color: #6b7280;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 6px;
  font-style: italic;
}

/* Table */
.table-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.data-table th {
  text-align: left;
  padding: 12px 10px;
  background: #f9fafb;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.data-table th.num,
.data-table td.num {
  text-align: right;
}

.data-table th.actions-col {
  text-align: center;
  width: 100px;
}

.data-table td {
  padding: 10px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.vehicle-cell {
  white-space: nowrap;
}

.actions-cell {
  text-align: center;
  white-space: nowrap;
}

/* Empty state */
.empty-state {
  padding: 48px 20px;
  text-align: center;
  color: #64748b;
  font-size: 0.95rem;
}

.empty-state p {
  margin: 0 0 16px;
}

/* Modal */
.modal-bg {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 560px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  position: sticky;
  top: 0;
  background: #fff;
  border-radius: 12px 12px 0 0;
}

.modal-head button {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: #9ca3af;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.modal-head button:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 16px;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 12px 12px;
  position: sticky;
  bottom: 0;
}

/* Form fields */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
}

.field-input {
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
}

.field-input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
}

textarea.field-input {
  resize: vertical;
  min-height: 80px;
}

.field-row {
  display: flex;
  gap: 12px;
}

.field-row .field {
  flex: 1;
}

.radio-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #374151;
  min-height: 44px;
}

.radio-label input {
  margin: 0;
  accent-color: var(--color-primary, #23424a);
}

/* Delete modal */
.delete-info {
  padding: 12px;
  background: #f3f4f6;
  border-radius: 6px;
  text-align: center;
  margin-top: 12px;
  font-size: 0.9rem;
}

/* Responsive */
@media (min-width: 480px) {
  .rental-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .rentals-page {
    padding: 24px;
    gap: 20px;
  }

  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

@media (min-width: 1024px) {
  .rental-cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 767px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }

  .field-row {
    flex-direction: column;
    gap: 0;
  }

  .data-table {
    font-size: 0.75rem;
  }

  .data-table th,
  .data-table td {
    padding: 8px 6px;
  }
}
</style>
