<script setup lang="ts">
/**
 * Maintenance Records Tool
 * CRUD for maintenance_records table scoped to dealer.
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

interface MaintenanceRecord {
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

interface MaintenanceFormData {
  vehicle_id: string
  date: string
  type: 'preventivo' | 'correctivo' | 'itv'
  description: string
  cost: number | null
  km: number | null
}

type SortColumn = 'date' | 'cost' | 'vehicle' | 'type'

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

// ---------- Lifecycle ----------

onMounted(async () => {
  await Promise.all([loadData(), fetchSubscription()])
})
</script>

<template>
  <div class="maintenance-page">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h1>{{ t('dashboard.tools.maintenance.title') }}</h1>
        <p class="subtitle">{{ t('dashboard.tools.maintenance.subtitle') }}</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="exportCSV">
          {{ t('dashboard.tools.maintenance.exportCSV') }}
        </button>
        <button class="btn-primary" @click="openCreateForm">
          + {{ t('dashboard.tools.maintenance.addRecord') }}
        </button>
      </div>
    </header>

    <!-- Plan gate -->
    <div v-if="!canExport" class="plan-gate">
      <div class="gate-icon">&#128274;</div>
      <h2>{{ t('dashboard.tools.maintenance.planRequired') }}</h2>
      <p>{{ t('dashboard.tools.maintenance.planRequiredDesc') }}</p>
      <NuxtLink to="/dashboard/suscripcion" class="btn-primary">
        {{ t('dashboard.tools.maintenance.upgradePlan') }}
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Success -->
      <div v-if="successMsg" class="alert-success">{{ successMsg }}</div>

      <!-- Error -->
      <div v-if="error" class="alert-error">{{ error }}</div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card cost-year">
          <span class="card-label">{{
            t('dashboard.tools.maintenance.summary.costThisYear')
          }}</span>
          <span class="card-value">{{ fmt(summaryTotalCostThisYear) }}</span>
        </div>
        <div class="summary-card total-records">
          <span class="card-label">{{
            t('dashboard.tools.maintenance.summary.totalRecords')
          }}</span>
          <span class="card-value">{{ summaryTotalRecords }}</span>
        </div>
        <div class="summary-card avg-cost">
          <span class="card-label">{{ t('dashboard.tools.maintenance.summary.avgCost') }}</span>
          <span class="card-value">{{ fmt(summaryAvgCost) }}</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="filter-group">
          <select v-model="filterVehicle" class="filter-select">
            <option :value="null">
              {{ t('dashboard.tools.maintenance.filters.allVehicles') }}
            </option>
            <option v-for="v in vehicleOptions" :key="v.id" :value="v.id">
              {{ v.brand }} {{ v.model }} {{ v.year ? `(${v.year})` : '' }}
            </option>
          </select>

          <select v-model="filterType" class="filter-select">
            <option :value="null">{{ t('dashboard.tools.maintenance.filters.allTypes') }}</option>
            <option value="preventivo">
              {{ t('dashboard.tools.maintenance.types.preventivo') }}
            </option>
            <option value="correctivo">
              {{ t('dashboard.tools.maintenance.types.correctivo') }}
            </option>
            <option value="itv">{{ t('dashboard.tools.maintenance.types.itv') }}</option>
          </select>

          <button class="btn-sm" @click="clearFilters">
            {{ t('dashboard.tools.maintenance.filters.clear') }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner" />
        <span>{{ t('common.loading') }}...</span>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <table v-if="sortedRecords.length > 0" class="data-table">
          <thead>
            <tr>
              <th class="sortable" @click="toggleSort('vehicle')">
                {{ t('dashboard.tools.maintenance.table.vehicle') }}{{ getSortIcon('vehicle') }}
              </th>
              <th class="sortable" @click="toggleSort('date')">
                {{ t('dashboard.tools.maintenance.table.date') }}{{ getSortIcon('date') }}
              </th>
              <th class="sortable" @click="toggleSort('type')">
                {{ t('dashboard.tools.maintenance.table.type') }}{{ getSortIcon('type') }}
              </th>
              <th>{{ t('dashboard.tools.maintenance.table.description') }}</th>
              <th class="sortable num" @click="toggleSort('cost')">
                {{ t('dashboard.tools.maintenance.table.cost') }}{{ getSortIcon('cost') }}
              </th>
              <th class="num">{{ t('dashboard.tools.maintenance.table.km') }}</th>
              <th class="actions-col">{{ t('dashboard.tools.maintenance.table.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in sortedRecords" :key="r.id">
              <td class="vehicle-cell">
                <strong>{{ r.vehicle_brand }}</strong> {{ r.vehicle_model }}
                <span v-if="r.vehicle_year" class="year-tag">({{ r.vehicle_year }})</span>
              </td>
              <td>{{ fmtDate(r.date) }}</td>
              <td>
                <span class="type-badge" :class="getTypeBadgeClass(r.type)">
                  {{ t(`dashboard.tools.maintenance.types.${r.type}`) }}
                </span>
              </td>
              <td class="desc-cell">{{ r.description }}</td>
              <td class="num">
                <strong>{{ fmt(r.cost) }}</strong>
              </td>
              <td class="num">{{ fmtKm(r.km) }}</td>
              <td class="actions-cell">
                <button
                  class="btn-icon"
                  :title="t('dashboard.tools.maintenance.edit')"
                  @click="openEditForm(r)"
                >
                  &#9998;
                </button>
                <button
                  class="btn-icon delete"
                  :title="t('dashboard.tools.maintenance.delete')"
                  @click="confirmDelete(r)"
                >
                  &#128465;
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else class="empty-state">
          <p>{{ t('dashboard.tools.maintenance.empty') }}</p>
          <button class="btn-primary" @click="openCreateForm">
            + {{ t('dashboard.tools.maintenance.addFirst') }}
          </button>
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
                    ? t('dashboard.tools.maintenance.editTitle')
                    : t('dashboard.tools.maintenance.createTitle')
                }}
              </span>
              <button @click="showForm = false">&times;</button>
            </div>
            <div class="modal-body">
              <!-- Vehicle -->
              <div class="field">
                <label>{{ t('dashboard.tools.maintenance.form.vehicle') }} *</label>
                <select v-model="form.vehicle_id" class="field-input">
                  <option value="" disabled>
                    {{ t('dashboard.tools.maintenance.form.selectVehicle') }}
                  </option>
                  <option v-for="v in vehicleOptions" :key="v.id" :value="v.id">
                    {{ v.brand }} {{ v.model }} {{ v.year ? `(${v.year})` : '' }}
                  </option>
                </select>
              </div>

              <!-- Date -->
              <div class="field">
                <label>{{ t('dashboard.tools.maintenance.form.date') }} *</label>
                <input v-model="form.date" type="date" class="field-input" >
              </div>

              <!-- Type -->
              <div class="field">
                <label>{{ t('dashboard.tools.maintenance.form.type') }} *</label>
                <div class="radio-group">
                  <label class="radio-label">
                    <input v-model="form.type" type="radio" value="preventivo" >
                    {{ t('dashboard.tools.maintenance.types.preventivo') }}
                  </label>
                  <label class="radio-label">
                    <input v-model="form.type" type="radio" value="correctivo" >
                    {{ t('dashboard.tools.maintenance.types.correctivo') }}
                  </label>
                  <label class="radio-label">
                    <input v-model="form.type" type="radio" value="itv" >
                    {{ t('dashboard.tools.maintenance.types.itv') }}
                  </label>
                </div>
              </div>

              <!-- Description -->
              <div class="field">
                <label>{{ t('dashboard.tools.maintenance.form.description') }} *</label>
                <textarea
                  v-model="form.description"
                  rows="3"
                  class="field-input"
                  :placeholder="t('dashboard.tools.maintenance.form.descriptionPlaceholder')"
                />
              </div>

              <!-- Cost -->
              <div class="field-row">
                <div class="field">
                  <label>{{ t('dashboard.tools.maintenance.form.cost') }} *</label>
                  <input
                    v-model.number="form.cost"
                    type="number"
                    min="0"
                    step="0.01"
                    class="field-input"
                    placeholder="0.00"
                  >
                </div>

                <!-- Km -->
                <div class="field">
                  <label>{{ t('dashboard.tools.maintenance.form.km') }}</label>
                  <input
                    v-model.number="form.km"
                    type="number"
                    min="0"
                    class="field-input"
                    placeholder="0"
                  >
                </div>
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn" @click="showForm = false">
                {{ t('dashboard.tools.maintenance.form.cancel') }}
              </button>
              <button
                class="btn btn-primary"
                :disabled="!isFormValid || saving"
                @click="handleSave"
              >
                <span v-if="saving" class="spinner-sm" />
                {{
                  editingId
                    ? t('dashboard.tools.maintenance.form.update')
                    : t('dashboard.tools.maintenance.form.save')
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
              <span>{{ t('dashboard.tools.maintenance.deleteTitle') }}</span>
              <button @click="showDeleteModal = false">&times;</button>
            </div>
            <div class="modal-body">
              <p>{{ t('dashboard.tools.maintenance.deleteConfirm') }}</p>
              <div v-if="deleteTarget" class="delete-info">
                <strong>{{ deleteTarget.vehicle_brand }} {{ deleteTarget.vehicle_model }}</strong>
                &mdash; {{ fmtDate(deleteTarget.date) }} &mdash; {{ fmt(deleteTarget.cost) }}
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn" @click="showDeleteModal = false">
                {{ t('dashboard.tools.maintenance.form.cancel') }}
              </button>
              <button class="btn btn-danger" :disabled="saving" @click="handleDelete">
                {{ t('dashboard.tools.maintenance.confirmDelete') }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </template>
  </div>
</template>

<style scoped>
.maintenance-page {
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
}

.btn-danger:hover {
  background: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  min-height: 44px;
  padding: 8px 12px;
  font-size: 0.8rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
}

.btn-sm:hover {
  background: #f8fafc;
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

.summary-card.cost-year {
  background: #fee2e2;
  color: #991b1b;
}

.summary-card.total-records {
  background: #dbeafe;
  color: #1e40af;
}

.summary-card.avg-cost {
  background: #f3e8ff;
  color: #7c3aed;
}

/* Filters */
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.filter-select {
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.85rem;
  min-width: 140px;
  background: #fff;
  flex: 1;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
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

.data-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.data-table th.sortable:hover {
  background: #f3f4f6;
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

.year-tag {
  color: #9ca3af;
  font-size: 0.8rem;
}

.desc-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions-cell {
  text-align: center;
  white-space: nowrap;
}

/* Type badges */
.type-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-preventivo {
  background: #dbeafe;
  color: #1e40af;
}

.badge-correctivo {
  background: #fee2e2;
  color: #991b1b;
}

.badge-itv {
  background: #dcfce7;
  color: #166534;
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
  max-width: 520px;
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
@media (min-width: 768px) {
  .maintenance-page {
    padding: 24px;
    gap: 20px;
  }

  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .filter-group {
    width: auto;
  }

  .filter-select {
    flex: initial;
    min-width: 180px;
  }
}

@media (max-width: 767px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }

  .data-table {
    font-size: 0.75rem;
  }

  .data-table th,
  .data-table td {
    padding: 8px 6px;
  }

  .desc-cell {
    max-width: 120px;
  }
}
</style>
