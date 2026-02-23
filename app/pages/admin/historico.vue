<script setup lang="ts">
import {
  useAdminHistorico,
  type HistoricoEntry,
  type HistoricoFilters,
  SALE_CATEGORIES,
} from '~/composables/admin/useAdminHistorico'
import { useAdminTypes } from '~/composables/admin/useAdminTypes'
import { useAdminSubcategories } from '~/composables/admin/useAdminSubcategories'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  entries,
  loading,
  saving,
  error,
  total,
  availableYears,
  availableBrands,
  summary,
  fetchEntries,
  restoreVehicle,
  deleteEntry,
} = useAdminHistorico()

const { types, fetchTypes } = useAdminTypes()
const { subcategories, fetchSubcategories } = useAdminSubcategories()

// Filters
const filters = reactive<HistoricoFilters>({
  year: null,
  sale_category: null,
  subcategory_id: null,
  type_id: null,
  brand: null,
  search: '',
})

// Column groups
const showDocs = ref(false)
const showTecnico = ref(false)
const showAlquiler = ref(false)

// Restore modal
const showRestoreModal = ref(false)
const restoreTarget = ref<HistoricoEntry | null>(null)
const restoreConfirm = ref('')
const canRestore = computed(() => restoreConfirm.value.toLowerCase() === 'restaurar')

// Delete modal
const showDeleteModal = ref(false)
const deleteTarget = ref<HistoricoEntry | null>(null)
const deleteConfirm = ref('')
const canDelete = computed(() => deleteConfirm.value.toLowerCase() === 'borrar')

// Detail modal
const showDetailModal = ref(false)
const detailEntry = ref<HistoricoEntry | null>(null)

// Export modal
const showExportModal = ref(false)
const exportFormat = ref<'excel' | 'pdf'>('excel')
const exportDataScope = ref<'all' | 'filtered'>('filtered')

// Sort
const sortCol = ref<'sale_date' | 'sale_price' | 'benefit' | 'brand'>('sale_date')
const sortAsc = ref(false)

// Fullscreen
const isFullscreen = ref(false)
const historicoSection = ref<HTMLElement | null>(null)

// Load data
onMounted(async () => {
  await Promise.all([fetchEntries(filters), fetchSubcategories(), fetchTypes()])
})

// Watch filters
watch(
  filters,
  () => {
    fetchEntries(filters)
  },
  { deep: true },
)

// Sorted entries
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
      case 'benefit':
        cmp = (a.benefit || 0) - (b.benefit || 0)
        break
      case 'brand':
        cmp = (a.brand || '').localeCompare(b.brand || '')
        break
    }
    return sortAsc.value ? cmp : -cmp
  })
  return arr
})

function toggleSort(col: 'sale_date' | 'sale_price' | 'benefit' | 'brand') {
  if (sortCol.value === col) {
    sortAsc.value = !sortAsc.value
  } else {
    sortCol.value = col
    sortAsc.value = false
  }
}

function getSortIcon(col: string): string {
  if (sortCol.value !== col) return '↕'
  return sortAsc.value ? '↑' : '↓'
}

// Fullscreen
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    historicoSection.value?.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}
onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
})
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})

// Modal actions
function openRestoreModal(entry: HistoricoEntry) {
  restoreTarget.value = entry
  restoreConfirm.value = ''
  showRestoreModal.value = true
}

async function handleRestore() {
  if (!restoreTarget.value || !canRestore.value) return
  const success = await restoreVehicle(restoreTarget.value.id)
  if (success) {
    showRestoreModal.value = false
    restoreTarget.value = null
  }
}

function openDeleteModal(entry: HistoricoEntry) {
  deleteTarget.value = entry
  deleteConfirm.value = ''
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!deleteTarget.value || !canDelete.value) return
  const success = await deleteEntry(deleteTarget.value.id)
  if (success) {
    showDeleteModal.value = false
    deleteTarget.value = null
  }
}

function openDetailModal(entry: HistoricoEntry) {
  detailEntry.value = entry
  showDetailModal.value = true
}

// Export functions
function exportHistorico() {
  const dataToExport = exportDataScope.value === 'all' ? entries.value : sortedEntries.value

  if (exportFormat.value === 'excel') {
    exportToExcel(dataToExport)
  } else {
    exportToPDF(dataToExport)
  }
  showExportModal.value = false
}

function exportToExcel(data: HistoricoEntry[]) {
  const headers = [
    'Marca',
    'Modelo',
    'Año',
    'Categoría',
    'Fecha Venta',
    'Precio Venta',
    'Coste Total',
    'Beneficio',
    '%',
  ]
  const rows = data.map((e) => [
    e.brand,
    e.model,
    e.year || '',
    SALE_CATEGORIES[e.sale_category || ''] || e.sale_category || '',
    e.sale_date || '',
    e.sale_price ? `${e.sale_price.toFixed(2)}€` : '',
    e.total_cost ? `${e.total_cost.toFixed(2)}€` : '',
    e.benefit ? `${e.benefit.toFixed(2)}€` : '',
    e.benefit_percent ? `${e.benefit_percent}%` : '',
  ])

  const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
  downloadFile(csv, `historico_${filters.year || 'todos'}.csv`, 'text/csv')
}

function exportToPDF(data: HistoricoEntry[]) {
  let html = `<!DOCTYPE html><html><head><title>Histórico de Ventas - Tracciona</title>
    <style>
      body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 11px; margin: 0; color: #1F2A2A; }
      .header { background: linear-gradient(135deg, #1A3238 0%, #23424A 100%); color: white; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; }
      .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 1px; }
      .header-accent { width: 45px; height: 2px; background: #7FD1C8; margin-top: 6px; }
      .header-info { font-size: 9px; text-align: right; line-height: 1.8; opacity: 0.85; }
      .content { padding: 20px 24px; }
      .subtitle { font-size: 14px; color: #23424A; font-weight: 700; margin: 0 0 4px; }
      .date { font-size: 11px; color: #4A5A5A; margin: 0 0 16px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th { background: #23424A; color: white; padding: 8px 8px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
      td { border-bottom: 1px solid #e5e7eb; padding: 6px 8px; font-size: 10px; }
      tr:nth-child(even) td { background: #f9fafb; }
      .num { text-align: right; }
      .positive { color: #059669; font-weight: 600; }
      .negative { color: #dc2626; font-weight: 600; }
      .summary { margin-top: 20px; padding: 14px; background: #f3f4f6; border-radius: 8px; }
      .summary p { margin: 4px 0; font-size: 12px; }
      .footer { background: #23424A; color: white; text-align: center; padding: 10px; font-size: 9px; margin-top: 24px; }
      @media print { body { margin: 0; } .footer { position: fixed; bottom: 0; left: 0; right: 0; } }
    </style>
  </head><body>
    <div class="header">
      <div><h1>TRACCIONA</h1><div class="header-accent"></div></div>
      <div class="header-info">TRACCIONA.COM<br>info@tracciona.com<br>+34 645 779 594</div>
    </div>
    <div class="content">
    <p class="subtitle">Histórico de Ventas ${filters.year || 'Todos los años'}</p>
    <p class="date">Generado: ${new Date().toLocaleDateString('es-ES')} | Total: ${data.length} ventas</p>
    <table><thead><tr>
      <th>Marca</th><th>Modelo</th><th>Año</th><th>Categoría</th>
      <th>Fecha Venta</th><th>Precio Venta</th><th>Coste</th><th>Beneficio</th><th>%</th>
    </tr></thead><tbody>`

  for (const e of data) {
    const benefitClass = (e.benefit || 0) >= 0 ? 'positive' : 'negative'
    html += `<tr>
      <td>${e.brand}</td>
      <td>${e.model}</td>
      <td>${e.year || ''}</td>
      <td>${SALE_CATEGORIES[e.sale_category || ''] || ''}</td>
      <td>${e.sale_date ? fmtDate(e.sale_date) : ''}</td>
      <td class="num">${e.sale_price ? fmt(e.sale_price) : ''}</td>
      <td class="num">${e.total_cost ? fmt(e.total_cost) : ''}</td>
      <td class="num ${benefitClass}">${e.benefit ? fmt(e.benefit) : ''}</td>
      <td class="num ${benefitClass}">${e.benefit_percent ? `${e.benefit_percent}%` : ''}</td>
    </tr>`
  }

  html += `</tbody></table>
    <div class="summary">
      <p><strong>Total Ingresos:</strong> ${fmt(summary.value.totalIngresos)}</p>
      <p><strong>Total Beneficio:</strong> ${fmt(summary.value.totalBeneficio)}</p>
      <p><strong>Beneficio Medio:</strong> ${summary.value.avgBeneficioPercent}%</p>
    </div>
    </div>
    <div class="footer">TRACCIONA.COM</div>
  </body></html>`

  printHTML(html)
}

function printHTML(html: string) {
  const existingFrame = document.getElementById('print-frame')
  if (existingFrame) existingFrame.remove()

  const iframe = document.createElement('iframe')
  iframe.id = 'print-frame'
  iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:0;height:0;border:none;'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) return

  doc.open()
  doc.write(html)
  doc.close()

  setTimeout(() => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
  }, 100)
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Formatting
function fmt(val: number | null | undefined): string {
  if (val === null || val === undefined) return '—'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(val)
}

function fmtDate(date: string): string {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Clear filters
function clearFilters() {
  filters.year = null
  filters.sale_category = null
  filters.subcategory_id = null
  filters.type_id = null
  filters.brand = null
  filters.search = ''
}

// Category options
const categoryOptions = Object.entries(SALE_CATEGORIES) as [string, string][]
</script>

<template>
  <div ref="historicoSection" class="historico-page" :class="{ fullscreen: isFullscreen }">
    <!-- Header -->
    <header class="page-header">
      <h1>📜 Histórico de Ventas</h1>
      <div class="header-actions">
        <button class="btn btn-icon-only" title="Pantalla completa" @click="toggleFullscreen">
          ⛶
        </button>
        <button class="btn" @click="showExportModal = true">📥 Exportar</button>
      </div>
    </header>

    <!-- Error -->
    <div v-if="error" class="error-msg">{{ error }}</div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card ventas">
        <span class="label">Total Ventas</span>
        <span class="value">{{ summary.totalVentas }}</span>
      </div>
      <div class="summary-card ingresos">
        <span class="label">Total Ingresos</span>
        <span class="value">{{ fmt(summary.totalIngresos) }}</span>
      </div>
      <div
        class="summary-card beneficio"
        :class="summary.totalBeneficio >= 0 ? 'positive' : 'negative'"
      >
        <span class="label">Total Beneficio</span>
        <span class="value">{{ fmt(summary.totalBeneficio) }}</span>
      </div>
      <div class="summary-card percent">
        <span class="label">Beneficio Medio</span>
        <span class="value">{{ summary.avgBeneficioPercent }}%</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-group">
        <select v-model="filters.year">
          <option :value="null">Todos los años</option>
          <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
        </select>

        <select v-model="filters.sale_category">
          <option :value="null">Todas las categorías</option>
          <option v-for="[key, label] in categoryOptions" :key="key" :value="key">
            {{ label }}
          </option>
        </select>

        <select v-model="filters.subcategory_id">
          <option :value="null">Todas las subcat.</option>
          <option v-for="s in subcategories" :key="s.id" :value="s.id">{{ s.name_es }}</option>
        </select>

        <select v-model="filters.type_id">
          <option :value="null">Todos los tipos</option>
          <option v-for="t in types" :key="t.id" :value="t.id">{{ t.name_es }}</option>
        </select>

        <select v-model="filters.brand">
          <option :value="null">Todas las marcas</option>
          <option v-for="b in availableBrands" :key="b" :value="b">{{ b }}</option>
        </select>
      </div>

      <div class="filter-group">
        <input v-model="filters.search" type="text" placeholder="Buscar..." class="search-input" >
        <button class="btn btn-sm" @click="clearFilters">Limpiar</button>
      </div>
    </div>

    <!-- Column Groups Toggle -->
    <div class="column-toggles">
      <label class="toggle-check">
        <input v-model="showDocs" type="checkbox" >
        DOCS
      </label>
      <label class="toggle-check">
        <input v-model="showTecnico" type="checkbox" >
        TÉCNICO
      </label>
      <label class="toggle-check">
        <input v-model="showAlquiler" type="checkbox" >
        ALQUILER
      </label>
      <span class="count">{{ total }} registros</span>
    </div>

    <!-- Table -->
    <div class="table-container">
      <div v-if="loading" class="loading">Cargando...</div>

      <table v-else class="historico-table">
        <thead>
          <tr>
            <th class="sortable" @click="toggleSort('brand')">
              Vehículo {{ getSortIcon('brand') }}
            </th>
            <th>Tipo</th>
            <th class="sortable" @click="toggleSort('sale_date')">
              Fecha {{ getSortIcon('sale_date') }}
            </th>
            <th>Categoría</th>
            <th>Comprador</th>
            <th class="sortable num" @click="toggleSort('sale_price')">
              Precio Venta {{ getSortIcon('sale_price') }}
            </th>
            <th class="num">Coste</th>
            <th class="sortable num" @click="toggleSort('benefit')">
              Beneficio {{ getSortIcon('benefit') }}
            </th>
            <th class="num">%</th>
            <!-- DOCS group -->
            <template v-if="showDocs">
              <th>Docs</th>
            </template>
            <!-- TECNICO group -->
            <template v-if="showTecnico">
              <th>Año</th>
              <th>P.Original</th>
            </template>
            <!-- ALQUILER group -->
            <template v-if="showAlquiler">
              <th>Ing.Alquiler</th>
            </template>
            <th class="actions">Acc.</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="sortedEntries.length === 0">
            <td
              :colspan="9 + (showDocs ? 1 : 0) + (showTecnico ? 2 : 0) + (showAlquiler ? 1 : 0) + 1"
              class="empty"
            >
              No hay registros en el histórico
            </td>
          </tr>
          <tr v-for="e in sortedEntries" :key="e.id">
            <td class="vehiculo">
              <strong>{{ e.brand }}</strong> {{ e.model }}
            </td>
            <td>{{ e.types?.name_es || '—' }}</td>
            <td>{{ e.sale_date ? fmtDate(e.sale_date) : '—' }}</td>
            <td>
              <span class="cat-badge" :class="e.sale_category">
                {{ SALE_CATEGORIES[e.sale_category || ''] || '—' }}
              </span>
            </td>
            <td class="buyer">{{ e.buyer_name || '—' }}</td>
            <td class="num">
              <strong>{{ fmt(e.sale_price) }}</strong>
            </td>
            <td class="num muted">{{ fmt(e.total_cost) }}</td>
            <td class="num" :class="(e.benefit || 0) >= 0 ? 'profit-pos' : 'profit-neg'">
              <strong>{{ fmt(e.benefit) }}</strong>
            </td>
            <td class="num" :class="(e.benefit_percent || 0) >= 0 ? 'profit-pos' : 'profit-neg'">
              {{ e.benefit_percent !== null ? `${e.benefit_percent}%` : '—' }}
            </td>
            <!-- DOCS group -->
            <template v-if="showDocs">
              <td>
                <span v-if="e.vehicle_data" class="doc-badge">📄</span>
                <span v-else>—</span>
              </td>
            </template>
            <!-- TECNICO group -->
            <template v-if="showTecnico">
              <td>{{ e.year || '—' }}</td>
              <td class="num muted">{{ fmt(e.original_price) }}</td>
            </template>
            <!-- ALQUILER group -->
            <template v-if="showAlquiler">
              <td class="num">{{ fmt(e.total_rental_income) }}</td>
            </template>
            <td class="actions">
              <button class="btn-icon" title="Ver detalles" @click="openDetailModal(e)">👁</button>
              <button class="btn-icon restore" title="Restaurar" @click="openRestoreModal(e)">
                🔄
              </button>
              <button class="btn-icon del" title="Eliminar" @click="openDeleteModal(e)">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
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
            <span>📜 {{ detailEntry.brand }} {{ detailEntry.model }} ({{ detailEntry.year }})</span>
            <button @click="showDetailModal = false">×</button>
          </div>
          <div class="modal-body">
            <div class="detail-grid">
              <div class="detail-section">
                <h4>Información de Venta</h4>
                <div class="detail-row">
                  <span class="label">Fecha de venta:</span>
                  <span>{{ detailEntry.sale_date ? fmtDate(detailEntry.sale_date) : '—' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Categoría:</span>
                  <span>{{ SALE_CATEGORIES[detailEntry.sale_category || ''] || '—' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Comprador:</span>
                  <span>{{ detailEntry.buyer_name || '—' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Contacto:</span>
                  <span>{{ detailEntry.buyer_contact || '—' }}</span>
                </div>
              </div>

              <div class="detail-section">
                <h4>Resumen Financiero</h4>
                <div class="detail-row">
                  <span class="label">Precio original:</span>
                  <span>{{ fmt(detailEntry.original_price) }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Precio de venta:</span>
                  <span class="highlight">{{ fmt(detailEntry.sale_price) }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Coste adquisición:</span>
                  <span>{{ fmt(detailEntry.acquisition_cost) }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Total mantenimiento:</span>
                  <span>{{ fmt(detailEntry.total_maintenance) }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Ingresos alquiler:</span>
                  <span class="profit-pos">{{ fmt(detailEntry.total_rental_income) }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Coste total:</span>
                  <span>{{ fmt(detailEntry.total_cost) }}</span>
                </div>
                <div class="detail-row total">
                  <span class="label">Beneficio:</span>
                  <span :class="(detailEntry.benefit || 0) >= 0 ? 'profit-pos' : 'profit-neg'">
                    {{ fmt(detailEntry.benefit) }} ({{ detailEntry.benefit_percent }}%)
                  </span>
                </div>
              </div>
            </div>

            <!-- Maintenance History -->
            <div v-if="detailEntry.maintenance_history?.length" class="detail-section">
              <h4>Historial de Mantenimiento</h4>
              <table class="mini-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Razón</th>
                    <th>Coste</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="m in detailEntry.maintenance_history" :key="m.id">
                    <td>{{ fmtDate(m.date) }}</td>
                    <td>{{ m.reason }}</td>
                    <td>{{ fmt(m.cost) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Rental History -->
            <div v-if="detailEntry.rental_history?.length" class="detail-section">
              <h4>Historial de Alquiler</h4>
              <table class="mini-table">
                <thead>
                  <tr>
                    <th>Desde</th>
                    <th>Hasta</th>
                    <th>Importe</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in detailEntry.rental_history" :key="r.id">
                    <td>{{ fmtDate(r.from_date) }}</td>
                    <td>{{ fmtDate(r.to_date) }}</td>
                    <td>{{ fmt(r.amount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn" @click="showDetailModal = false">Cerrar</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Restore Modal -->
    <Teleport to="body">
      <div v-if="showRestoreModal" class="modal-bg" @click.self="showRestoreModal = false">
        <div class="modal">
          <div class="modal-head">
            <span>🔄 Restaurar vehículo</span>
            <button @click="showRestoreModal = false">×</button>
          </div>
          <div class="modal-body">
            <p>¿Restaurar este vehículo al catálogo activo?</p>
            <p class="restore-info">
              <strong>{{ restoreTarget?.brand }} {{ restoreTarget?.model }}</strong>
              ({{ restoreTarget?.year }})
            </p>
            <p class="warning">
              ⚠️ El vehículo se restaurará como <strong>borrador</strong> y se eliminará la entrada
              del balance asociada.
            </p>
            <div class="field">
              <label>Escribe <strong>Restaurar</strong> para confirmar:</label>
              <input v-model="restoreConfirm" type="text" placeholder="Restaurar" >
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn" @click="showRestoreModal = false">Cancelar</button>
            <button
              class="btn btn-primary"
              :disabled="!canRestore || saving"
              @click="handleRestore"
            >
              🔄 Restaurar
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-bg" @click.self="showDeleteModal = false">
        <div class="modal">
          <div class="modal-head">
            <span>🗑️ Eliminar registro</span>
            <button @click="showDeleteModal = false">×</button>
          </div>
          <div class="modal-body">
            <p>¿Eliminar permanentemente este registro del histórico?</p>
            <p class="delete-info">
              <strong>{{ deleteTarget?.brand }} {{ deleteTarget?.model }}</strong>
              — {{ fmt(deleteTarget?.sale_price) }}
            </p>
            <p class="warning">⚠️ Esta acción no se puede deshacer.</p>
            <div class="field">
              <label>Escribe <strong>Borrar</strong> para confirmar:</label>
              <input v-model="deleteConfirm" type="text" placeholder="Borrar" >
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn" @click="showDeleteModal = false">Cancelar</button>
            <button class="btn btn-danger" :disabled="!canDelete || saving" @click="handleDelete">
              Eliminar
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
            <span>📥 Exportar Histórico</span>
            <button @click="showExportModal = false">×</button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>Formato</label>
              <div class="radio-group">
                <label
                  ><input v-model="exportFormat" type="radio" value="excel" > Excel (CSV)</label
                >
                <label
                  ><input v-model="exportFormat" type="radio" value="pdf" > PDF (Imprimir)</label
                >
              </div>
            </div>

            <div class="field">
              <label>Datos</label>
              <div class="radio-group">
                <label
                  ><input v-model="exportDataScope" type="radio" value="filtered" > Solo
                  filtrados</label
                >
                <label><input v-model="exportDataScope" type="radio" value="all" > Todos</label>
              </div>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn" @click="showExportModal = false">Cancelar</button>
            <button class="btn btn-primary" @click="exportHistorico">Exportar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.historico-page {
  max-width: 1400px;
  margin: 0 auto;
}
.historico-page.fullscreen {
  max-width: none;
  padding: 20px;
  background: #f9fafb;
  min-height: 100vh;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}
.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
}
.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}
.btn-primary {
  background: #23424a;
  color: #fff;
  border: none;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-danger {
  background: #dc2626;
  color: #fff;
  border: none;
}
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-sm {
  padding: 6px 12px;
  font-size: 0.8rem;
}
.btn-icon-only {
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}
.btn-icon {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.9rem;
  border-radius: 4px;
}
.btn-icon:hover {
  background: #f3f4f6;
}
.btn-icon.del:hover {
  background: #fee2e2;
}
.btn-icon.restore:hover {
  background: #dcfce7;
}

/* Error */
.error-msg {
  background: #fef2f2;
  color: #dc2626;
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 16px;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.summary-card {
  padding: 16px 20px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.summary-card .label {
  font-size: 0.8rem;
  font-weight: 500;
  opacity: 0.8;
}
.summary-card .value {
  font-size: 1.5rem;
  font-weight: 700;
}
.summary-card.ventas {
  background: #e0e7ff;
  color: #3730a3;
}
.summary-card.ingresos {
  background: #dbeafe;
  color: #1e40af;
}
.summary-card.beneficio {
  background: #dcfce7;
  color: #166534;
}
.summary-card.beneficio.negative {
  background: #fee2e2;
  color: #991b1b;
}
.summary-card.percent {
  background: #f3e8ff;
  color: #7c3aed;
}

/* Filters */
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 16px;
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
.filters-bar select,
.search-input {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.85rem;
  min-width: 140px;
}
.search-input {
  min-width: 180px;
}

/* Column toggles */
.column-toggles {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 16px;
  font-size: 0.85rem;
}
.toggle-check {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 10px;
  background: #f3f4f6;
  border-radius: 4px;
  font-weight: 500;
}
.toggle-check input {
  margin: 0;
}
.count {
  margin-left: auto;
  color: #6b7280;
}

/* Table */
.table-container {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}
.loading {
  padding: 40px;
  text-align: center;
  color: #6b7280;
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
}
.historico-table th.sortable:hover {
  background: #f3f4f6;
}
.historico-table th.num,
.historico-table td.num {
  text-align: right;
}
.historico-table th.actions {
  text-align: center;
  width: 100px;
}
.historico-table td {
  padding: 10px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}
.historico-table td.empty {
  text-align: center;
  color: #9ca3af;
  padding: 40px;
}
.historico-table td.vehiculo {
  font-weight: 500;
}
.historico-table td.buyer {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.historico-table td.muted {
  color: #9ca3af;
}
.historico-table td.actions {
  text-align: center;
}

/* Category badges */
.cat-badge {
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 500;
}
.cat-badge.venta {
  background: #dbeafe;
  color: #1e40af;
}
.cat-badge.terceros {
  background: #f3e8ff;
  color: #7c3aed;
}
.cat-badge.exportacion {
  background: #fef3c7;
  color: #92400e;
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

/* Doc badge */
.doc-badge {
  font-size: 1rem;
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
  border-radius: 10px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
}
.modal-lg {
  max-width: 700px;
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
}
.modal-head button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #9ca3af;
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
  border-radius: 0 0 10px 10px;
  position: sticky;
  bottom: 0;
}

/* Detail modal */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
.detail-section {
  margin-bottom: 16px;
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
.detail-row .label {
  color: #6b7280;
}
.detail-row.total {
  border-top: 1px solid #e5e7eb;
  margin-top: 8px;
  padding-top: 10px;
  font-weight: 600;
}
.detail-row .highlight {
  font-weight: 700;
  color: #1e40af;
}

/* Mini table */
.mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}
.mini-table th,
.mini-table td {
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  text-align: left;
}
.mini-table th {
  background: #f9fafb;
  font-weight: 600;
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
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  font-size: 0.85rem;
}
.field input:focus {
  outline: none;
  border-color: #23424a;
}

/* Radio groups */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.radio-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: normal;
  color: #374151;
}
.radio-group input {
  margin: 0;
}

/* Info boxes */
.restore-info,
.delete-info {
  padding: 12px;
  background: #f3f4f6;
  border-radius: 6px;
  text-align: center;
  margin-bottom: 12px;
}
.warning {
  padding: 10px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 12px;
}

/* Mobile */
@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .filters-bar {
    flex-direction: column;
  }
  .filter-group {
    width: 100%;
  }
  .filters-bar select,
  .search-input {
    flex: 1;
    min-width: 0;
  }
  .column-toggles {
    flex-wrap: wrap;
  }
  .historico-table {
    font-size: 0.75rem;
  }
  .historico-table th,
  .historico-table td {
    padding: 8px 6px;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
