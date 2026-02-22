<script setup lang="ts">
/**
 * Dealer Sales History Page
 * Shows sold vehicles for the current dealer with filters, summary, and export.
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t, locale } = useI18n()
const supabase = useSupabaseClient()
const { dealerProfile, loadDealer } = useDealerDashboard()

// ---------- Types ----------
interface SoldVehicle {
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

interface DealerHistoricoFilters {
  year: number | null
  brand: string | null
  search: string
}

interface DealerHistoricoSummary {
  totalSales: number
  totalRevenue: number
  totalProfit: number
  avgMarginPercent: number
}

// ---------- State ----------
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

// Sort
const sortCol = ref<'sale_date' | 'sale_price' | 'profit' | 'brand'>('sale_date')
const sortAsc = ref(false)

// Modals
const showDetailModal = ref(false)
const detailEntry = ref<SoldVehicle | null>(null)

const showRestoreModal = ref(false)
const restoreTarget = ref<SoldVehicle | null>(null)
const restoreConfirm = ref('')

const showExportModal = ref(false)
const exportDataScope = ref<'all' | 'filtered'>('filtered')

// ---------- Computed ----------

function getProfit(entry: SoldVehicle): number {
  const salePrice = entry.sale_price || 0
  const acquisitionCost = entry.acquisition_cost || 0
  const maintenance = entry.total_maintenance || 0
  const rentalIncome = entry.total_rental_income || 0
  return salePrice - acquisitionCost - maintenance + rentalIncome
}

function getMarginPercent(entry: SoldVehicle): number {
  const salePrice = entry.sale_price || 0
  if (salePrice === 0) return 0
  return Math.round((getProfit(entry) / salePrice) * 100)
}

function getTotalCost(entry: SoldVehicle): number {
  return (
    (entry.acquisition_cost || 0) +
    (entry.total_maintenance || 0) -
    (entry.total_rental_income || 0)
  )
}

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

// ---------- Data fetching ----------

async function fetchEntries() {
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

async function fetchFiltersData(dealerId: string) {
  try {
    const { data } = await supabase
      .from('vehicles')
      .select('sale_date, brand')
      .eq('dealer_id', dealerId)
      .eq('status', 'sold')

    if (data) {
      const years = new Set<number>()
      const brands = new Set<string>()

      for (const row of data as Array<{ sale_date: string | null; brand: string | null }>) {
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

// ---------- Restore ----------

async function handleRestore() {
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

// ---------- Export ----------

function exportCSV() {
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

// ---------- Modal helpers ----------

function openDetailModal(entry: SoldVehicle) {
  detailEntry.value = entry
  showDetailModal.value = true
}

function openRestoreModal(entry: SoldVehicle) {
  restoreTarget.value = entry
  restoreConfirm.value = ''
  showRestoreModal.value = true
}

// ---------- Sort helpers ----------

function toggleSort(col: 'sale_date' | 'sale_price' | 'profit' | 'brand') {
  if (sortCol.value === col) {
    sortAsc.value = !sortAsc.value
  } else {
    sortCol.value = col
    sortAsc.value = false
  }
}

function getSortIcon(col: string): string {
  if (sortCol.value !== col) return ''
  return sortAsc.value ? ' ↑' : ' ↓'
}

// ---------- Formatting ----------

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

function clearFilters() {
  filters.year = null
  filters.brand = null
  filters.search = ''
}

// ---------- Lifecycle ----------

onMounted(() => {
  fetchEntries()
})

watch(
  filters,
  () => {
    fetchEntries()
  },
  { deep: true },
)
</script>

<template>
  <div class="historico-page">
    <!-- Header -->
    <header class="page-header">
      <h1>{{ t('dashboard.historico.title') }}</h1>
      <button class="btn btn-export" @click="showExportModal = true">
        {{ t('dashboard.historico.export') }}
      </button>
    </header>

    <!-- Error -->
    <div v-if="error" class="alert-error">
      {{ error }}
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card sales">
        <span class="card-label">{{ t('dashboard.historico.summary.totalSales') }}</span>
        <span class="card-value">{{ summary.totalSales }}</span>
      </div>
      <div class="summary-card revenue">
        <span class="card-label">{{ t('dashboard.historico.summary.totalRevenue') }}</span>
        <span class="card-value">{{ fmt(summary.totalRevenue) }}</span>
      </div>
      <div class="summary-card profit" :class="{ negative: summary.totalProfit < 0 }">
        <span class="card-label">{{ t('dashboard.historico.summary.totalProfit') }}</span>
        <span class="card-value">{{ fmt(summary.totalProfit) }}</span>
      </div>
      <div class="summary-card margin">
        <span class="card-label">{{ t('dashboard.historico.summary.avgMargin') }}</span>
        <span class="card-value">{{ summary.avgMarginPercent }}%</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-group">
        <select v-model="filters.year" class="filter-select">
          <option :value="null">{{ t('dashboard.historico.filters.allYears') }}</option>
          <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
        </select>

        <select v-model="filters.brand" class="filter-select">
          <option :value="null">{{ t('dashboard.historico.filters.allBrands') }}</option>
          <option v-for="b in availableBrands" :key="b" :value="b">{{ b }}</option>
        </select>
      </div>

      <div class="filter-group">
        <input
          v-model="filters.search"
          type="text"
          :placeholder="t('dashboard.historico.filters.searchPlaceholder')"
          class="search-input"
        >
        <button class="btn btn-sm" @click="clearFilters">
          {{ t('dashboard.historico.filters.clear') }}
        </button>
      </div>
    </div>

    <!-- Record count -->
    <div class="record-count">
      {{ sortedEntries.length }} {{ t('dashboard.historico.records') }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>{{ t('dashboard.historico.loading') }}</span>
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <table v-if="sortedEntries.length > 0" class="historico-table">
        <thead>
          <tr>
            <th class="sortable" @click="toggleSort('brand')">
              {{ t('dashboard.historico.table.vehicle') }}{{ getSortIcon('brand') }}
            </th>
            <th>{{ t('dashboard.historico.table.year') }}</th>
            <th class="sortable" @click="toggleSort('sale_date')">
              {{ t('dashboard.historico.table.saleDate') }}{{ getSortIcon('sale_date') }}
            </th>
            <th class="sortable num" @click="toggleSort('sale_price')">
              {{ t('dashboard.historico.table.salePrice') }}{{ getSortIcon('sale_price') }}
            </th>
            <th class="num">{{ t('dashboard.historico.table.cost') }}</th>
            <th class="sortable num" @click="toggleSort('profit')">
              {{ t('dashboard.historico.table.profit') }}{{ getSortIcon('profit') }}
            </th>
            <th class="num">{{ t('dashboard.historico.table.margin') }}</th>
            <th class="actions-col">{{ t('dashboard.historico.table.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in sortedEntries" :key="e.id">
            <td class="vehiculo-cell">
              <strong>{{ e.brand }}</strong> {{ e.model }}
            </td>
            <td>{{ e.year || '--' }}</td>
            <td>{{ fmtDate(e.sale_date) }}</td>
            <td class="num">
              <strong>{{ fmt(e.sale_price) }}</strong>
            </td>
            <td class="num muted">{{ fmt(getTotalCost(e)) }}</td>
            <td class="num" :class="getProfit(e) >= 0 ? 'profit-pos' : 'profit-neg'">
              <strong>{{ fmt(getProfit(e)) }}</strong>
            </td>
            <td class="num" :class="getMarginPercent(e) >= 0 ? 'profit-pos' : 'profit-neg'">
              {{ getMarginPercent(e) }}%
            </td>
            <td class="actions-cell">
              <button
                class="btn-icon"
                :title="t('dashboard.historico.detail.title')"
                @click="openDetailModal(e)"
              >
                &#128065;
              </button>
              <button
                class="btn-icon restore"
                :title="t('dashboard.historico.restore.title')"
                @click="openRestoreModal(e)"
              >
                &#8634;
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <p>{{ t('dashboard.historico.empty') }}</p>
      </div>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <div
        v-if="showDetailModal && detailEntry"
        class="modal-bg"
        @click.self="showDetailModal = false"
      >
        <div class="modal modal-lg">
          <div class="modal-head">
            <span
              >{{ detailEntry.brand }} {{ detailEntry.model }} ({{
                detailEntry.year || '--'
              }})</span
            >
            <button @click="showDetailModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="detail-grid">
              <!-- Sale info -->
              <div class="detail-section">
                <h4>{{ t('dashboard.historico.detail.saleInfo') }}</h4>
                <div class="detail-row">
                  <span class="dlabel">{{ t('dashboard.historico.detail.saleDate') }}:</span>
                  <span>{{ fmtDate(detailEntry.sale_date) }}</span>
                </div>
                <div class="detail-row">
                  <span class="dlabel">{{ t('dashboard.historico.detail.buyer') }}:</span>
                  <span>{{ detailEntry.buyer_name || '--' }}</span>
                </div>
                <div class="detail-row">
                  <span class="dlabel">{{ t('dashboard.historico.detail.buyerContact') }}:</span>
                  <span>{{ detailEntry.buyer_contact || '--' }}</span>
                </div>
              </div>

              <!-- Financial -->
              <div class="detail-section">
                <h4>{{ t('dashboard.historico.detail.financial') }}</h4>
                <div class="detail-row">
                  <span class="dlabel">{{ t('dashboard.historico.detail.originalPrice') }}:</span>
                  <span>{{ fmt(detailEntry.price) }}</span>
                </div>
                <div class="detail-row">
                  <span class="dlabel">{{ t('dashboard.historico.detail.salePrice') }}:</span>
                  <span class="highlight">{{ fmt(detailEntry.sale_price) }}</span>
                </div>
                <div class="detail-row">
                  <span class="dlabel">{{ t('dashboard.historico.detail.acquisitionCost') }}:</span>
                  <span>{{ fmt(detailEntry.acquisition_cost) }}</span>
                </div>
                <div class="detail-row">
                  <span class="dlabel"
                    >{{ t('dashboard.historico.detail.totalMaintenance') }}:</span
                  >
                  <span>{{ fmt(detailEntry.total_maintenance) }}</span>
                </div>
                <div class="detail-row">
                  <span class="dlabel">{{ t('dashboard.historico.detail.rentalIncome') }}:</span>
                  <span class="profit-pos">{{ fmt(detailEntry.total_rental_income) }}</span>
                </div>
                <div class="detail-row">
                  <span class="dlabel">{{ t('dashboard.historico.detail.totalCost') }}:</span>
                  <span>{{ fmt(getTotalCost(detailEntry)) }}</span>
                </div>
                <div class="detail-row total-row">
                  <span class="dlabel">{{ t('dashboard.historico.detail.profit') }}:</span>
                  <span :class="getProfit(detailEntry) >= 0 ? 'profit-pos' : 'profit-neg'">
                    {{ fmt(getProfit(detailEntry)) }} ({{ getMarginPercent(detailEntry) }}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn" @click="showDetailModal = false">
              {{ t('dashboard.historico.detail.close') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Restore Modal -->
    <Teleport to="body">
      <div v-if="showRestoreModal" class="modal-bg" @click.self="showRestoreModal = false">
        <div class="modal">
          <div class="modal-head">
            <span>{{ t('dashboard.historico.restore.title') }}</span>
            <button @click="showRestoreModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <p>{{ t('dashboard.historico.restore.message') }}</p>
            <div class="restore-info">
              <strong>{{ restoreTarget?.brand }} {{ restoreTarget?.model }}</strong>
              ({{ restoreTarget?.year || '--' }})
            </div>
            <div class="warning-box">
              {{ t('dashboard.historico.restore.warning') }}
            </div>
            <div class="field">
              <label>{{ t('dashboard.historico.restore.confirmLabel') }}</label>
              <input
                v-model="restoreConfirm"
                type="text"
                :placeholder="t('dashboard.historico.restore.confirmPlaceholder')"
              >
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn" @click="showRestoreModal = false">
              {{ t('dashboard.historico.restore.cancel') }}
            </button>
            <button
              class="btn btn-primary"
              :disabled="!canRestore || saving"
              @click="handleRestore"
            >
              {{ t('dashboard.historico.restore.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Export Modal -->
    <Teleport to="body">
      <div v-if="showExportModal" class="modal-bg" @click.self="showExportModal = false">
        <div class="modal">
          <div class="modal-head">
            <span>{{ t('dashboard.historico.exportModal.title') }}</span>
            <button @click="showExportModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>{{ t('dashboard.historico.exportModal.scope') }}</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input v-model="exportDataScope" type="radio" value="filtered" >
                  {{ t('dashboard.historico.exportModal.filtered') }}
                </label>
                <label class="radio-label">
                  <input v-model="exportDataScope" type="radio" value="all" >
                  {{ t('dashboard.historico.exportModal.all') }}
                </label>
              </div>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn" @click="showExportModal = false">
              {{ t('dashboard.historico.exportModal.cancel') }}
            </button>
            <button class="btn btn-primary" @click="exportCSV">
              {{ t('dashboard.historico.exportModal.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* Page layout */
.historico-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
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

.btn-export {
  background: var(--color-primary, #23424a);
  color: #fff;
  border: none;
  font-weight: 600;
}

.btn-export:hover {
  background: #1a3238;
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: #fff;
  border: none;
  font-weight: 600;
}

.btn-primary:hover {
  background: #1a3238;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  min-height: 36px;
  padding: 6px 12px;
  font-size: 0.8rem;
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

.btn-icon.restore:hover {
  background: #dcfce7;
}

/* Error */
.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.9rem;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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

.summary-card.sales {
  background: #e0e7ff;
  color: #3730a3;
}

.summary-card.revenue {
  background: #dbeafe;
  color: #1e40af;
}

.summary-card.profit {
  background: #dcfce7;
  color: #166534;
}

.summary-card.profit.negative {
  background: #fee2e2;
  color: #991b1b;
}

.summary-card.margin {
  background: #f3e8ff;
  color: #7c3aed;
}

/* Filters */
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
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
}

.filter-select,
.search-input {
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.85rem;
  min-width: 140px;
  background: #fff;
}

.search-input {
  min-width: 180px;
}

.filter-select:focus,
.search-input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
}

/* Record count */
.record-count {
  font-size: 0.85rem;
  color: #6b7280;
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

.historico-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.historico-table th {
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

.historico-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.historico-table th.sortable:hover {
  background: #f3f4f6;
}

.historico-table th.num,
.historico-table td.num {
  text-align: right;
}

.historico-table th.actions-col {
  text-align: center;
  width: 100px;
}

.historico-table td {
  padding: 10px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.historico-table td.vehiculo-cell {
  font-weight: 500;
  white-space: nowrap;
}

.historico-table td.muted {
  color: #9ca3af;
}

.historico-table td.actions-cell {
  text-align: center;
  white-space: nowrap;
}

/* Profit colors */
.profit-pos {
  color: #16a34a;
  font-weight: 600;
}

.profit-neg {
  color: #dc2626;
  font-weight: 600;
}

/* Empty state */
.empty-state {
  padding: 48px 20px;
  text-align: center;
  color: #64748b;
  font-size: 0.95rem;
}

.empty-state p {
  margin: 0;
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
  max-width: 420px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-lg {
  max-width: 640px;
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

/* Detail modal */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.detail-section {
  margin-bottom: 8px;
}

.detail-section h4 {
  margin: 0 0 12px;
  font-size: 0.9rem;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 0.85rem;
}

.detail-row .dlabel {
  color: #6b7280;
}

.detail-row .highlight {
  font-weight: 700;
  color: #1e40af;
}

.total-row {
  border-top: 1px solid #e5e7eb;
  margin-top: 8px;
  padding-top: 10px;
  font-weight: 600;
}

/* Restore modal */
.restore-info {
  padding: 12px;
  background: #f3f4f6;
  border-radius: 6px;
  text-align: center;
  margin-bottom: 12px;
}

.warning-box {
  padding: 10px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 12px;
}

/* Form fields */
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
}

.field input {
  min-height: 44px;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.85rem;
}

.field input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
}

/* Radio groups */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: normal;
  color: #374151;
  min-height: 44px;
}

.radio-label input {
  margin: 0;
}

/* Responsive — mobile-first, scale up */
@media (min-width: 480px) {
  .summary-cards {
    gap: 16px;
  }

  .summary-card .card-value {
    font-size: 1.75rem;
  }
}

@media (min-width: 768px) {
  .historico-page {
    padding: 24px;
    gap: 20px;
  }

  .summary-cards {
    grid-template-columns: repeat(4, 1fr);
  }

  .filters-bar {
    flex-direction: row;
  }

  .filter-group {
    width: auto;
  }

  .detail-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 767px) {
  .filters-bar {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }

  .filter-select,
  .search-input {
    flex: 1;
    min-width: 0;
  }

  .historico-table {
    font-size: 0.75rem;
  }

  .historico-table th,
  .historico-table td {
    padding: 8px 6px;
  }
}
</style>
