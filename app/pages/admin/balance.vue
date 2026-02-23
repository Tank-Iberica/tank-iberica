<script setup lang="ts">
import {
  useAdminBalance,
  type BalanceEntry,
  type BalanceFormData,
  type BalanceFilters,
  type BalanceReason,
  type BalanceStatus,
  BALANCE_REASONS,
  BALANCE_STATUS_LABELS,
} from '~/composables/admin/useAdminBalance'
import { useAdminTypes } from '~/composables/admin/useAdminTypes'
import { useAdminSubcategories } from '~/composables/admin/useAdminSubcategories'
import { useAdminVehicles } from '~/composables/admin/useAdminVehicles'

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
  summary,
  fetchEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  calculateProfit,
} = useAdminBalance()

const { types, fetchTypes } = useAdminTypes()
const { subcategories, fetchSubcategories } = useAdminSubcategories()
const { vehicles, fetchVehicles } = useAdminVehicles()

// Filters
const filters = reactive<BalanceFilters>({
  year: new Date().getFullYear(),
  tipo: null,
  razon: null,
  estado: null,
  subcategory_id: null,
  type_id: null,
  search: '',
})

// Modal state
const showModal = ref(false)
const editingId = ref<string | null>(null)
const formData = ref<BalanceFormData>(getEmptyForm())

// Delete modal
const showDeleteModal = ref(false)
const deleteTarget = ref<BalanceEntry | null>(null)
const deleteConfirm = ref('')
const canDelete = computed(() => deleteConfirm.value.toLowerCase() === 'borrar')

// Export modals
const showExportModal = ref(false)
const showExportResumenModal = ref(false)
const exportFormat = ref<'excel' | 'pdf'>('excel')
const exportDataScope = ref<'all' | 'filtered'>('filtered')
const exportColumns = reactive({
  tipo: true,
  fecha: true,
  razon: true,
  detalle: true,
  importe: true,
  estado: true,
  notas: false,
})
const resumenOptions = reactive({
  totales: true,
  desglose: true,
  mensual: true,
})

// View toggles
const showDesglose = ref(false)
const showCharts = ref(false)
const chartType = ref<'bar' | 'pie'>('bar')
const isFullscreen = ref(false)
const balanceSection = ref<HTMLElement | null>(null)

// Sort
const sortCol = ref<'fecha' | 'importe' | 'tipo' | 'razon'>('fecha')
const sortAsc = ref(false)

// Load data
onMounted(async () => {
  await Promise.all([fetchEntries(filters), fetchSubcategories(), fetchTypes(), fetchVehicles()])
})

// Watch filters
watch(
  filters,
  () => {
    fetchEntries(filters)
  },
  { deep: true },
)

function getEmptyForm(): BalanceFormData {
  return {
    tipo: 'gasto',
    fecha: new Date().toISOString().split('T')[0],
    razon: 'otros',
    detalle: null,
    importe: 0,
    estado: 'pendiente',
    notas: null,
    factura_url: null,
    coste_asociado: null,
    vehicle_id: null,
    type_id: null,
  }
}

// Sorted entries
const sortedEntries = computed(() => {
  const arr = [...entries.value]
  arr.sort((a, b) => {
    let cmp = 0
    switch (sortCol.value) {
      case 'fecha':
        cmp = new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
        break
      case 'importe':
        cmp = a.importe - b.importe
        break
      case 'tipo':
        cmp = a.tipo.localeCompare(b.tipo)
        break
      case 'razon':
        cmp = a.razon.localeCompare(b.razon)
        break
    }
    return sortAsc.value ? cmp : -cmp
  })
  return arr
})

// Monthly breakdown for export
const monthlyBreakdown = computed(() => {
  const months: Record<string, { ingresos: number; gastos: number }> = {}
  for (const e of entries.value) {
    const month = e.fecha.substring(0, 7) // YYYY-MM
    if (!months[month]) {
      months[month] = { ingresos: 0, gastos: 0 }
    }
    if (e.tipo === 'ingreso') {
      months[month].ingresos += e.importe
    } else {
      months[month].gastos += e.importe
    }
  }
  return Object.entries(months).sort((a, b) => b[0].localeCompare(a[0]))
})

function toggleSort(col: 'fecha' | 'importe' | 'tipo' | 'razon') {
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
    balanceSection.value?.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

// Listen for fullscreen change
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
function openNewModal() {
  editingId.value = null
  formData.value = getEmptyForm()
  showModal.value = true
}

function openEditModal(entry: BalanceEntry) {
  editingId.value = entry.id
  formData.value = {
    tipo: entry.tipo,
    fecha: entry.fecha,
    razon: entry.razon,
    detalle: entry.detalle,
    importe: entry.importe,
    estado: entry.estado,
    notas: entry.notas,
    factura_url: entry.factura_url,
    coste_asociado: entry.coste_asociado,
    vehicle_id: entry.vehicle_id,
    type_id: entry.type_id,
  }
  showModal.value = true
}

async function handleSave() {
  if (!formData.value.importe || formData.value.importe <= 0) {
    alert('El importe debe ser mayor que 0')
    return
  }

  let success = false
  if (editingId.value) {
    success = await updateEntry(editingId.value, formData.value)
  } else {
    const id = await createEntry(formData.value)
    success = !!id
  }

  if (success) {
    showModal.value = false
    await fetchEntries(filters)
  }
}

function openDeleteModal(entry: BalanceEntry) {
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

// Export functions
function exportBalance() {
  const dataToExport = exportDataScope.value === 'all' ? entries.value : sortedEntries.value

  if (exportFormat.value === 'excel') {
    exportToExcel(dataToExport)
  } else {
    exportToPDF(dataToExport)
  }
  showExportModal.value = false
}

function exportToExcel(data: BalanceEntry[]) {
  // Build CSV (simplified Excel export)
  const headers: string[] = []
  if (exportColumns.tipo) headers.push('Tipo')
  if (exportColumns.fecha) headers.push('Fecha')
  if (exportColumns.razon) headers.push('Razón')
  if (exportColumns.detalle) headers.push('Detalle')
  if (exportColumns.importe) headers.push('Importe')
  if (exportColumns.estado) headers.push('Estado')
  if (exportColumns.notas) headers.push('Notas')

  const rows = data.map((e) => {
    const row: string[] = []
    if (exportColumns.tipo) row.push(e.tipo === 'ingreso' ? 'Ingreso' : 'Gasto')
    if (exportColumns.fecha) row.push(e.fecha)
    if (exportColumns.razon) row.push(BALANCE_REASONS[e.razon])
    if (exportColumns.detalle) row.push(e.detalle || '')
    if (exportColumns.importe)
      row.push(`${e.tipo === 'ingreso' ? '+' : '-'}${e.importe.toFixed(2)}€`)
    if (exportColumns.estado) row.push(BALANCE_STATUS_LABELS[e.estado])
    if (exportColumns.notas) row.push(e.notas || '')
    return row
  })

  const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
  downloadFile(csv, `balance_${filters.year || 'todos'}.csv`, 'text/csv')
}

function exportToPDF(data: BalanceEntry[]) {
  // Generate corporate-styled HTML table for printing
  let html = `<!DOCTYPE html><html><head><title>Balance ${filters.year || 'Todos'} - Tracciona</title>
    <style>
      body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 12px; margin: 0; color: #1F2A2A; }
      .header { background: linear-gradient(135deg, #1A3238 0%, #23424A 100%); color: white; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; }
      .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 1px; }
      .header-accent { width: 45px; height: 2px; background: #7FD1C8; margin-top: 6px; }
      .header-info { font-size: 9px; text-align: right; line-height: 1.8; opacity: 0.85; }
      .content { padding: 20px 24px; }
      .subtitle { font-size: 14px; color: #23424A; font-weight: 700; margin: 0 0 4px; }
      .date { font-size: 11px; color: #4A5A5A; margin: 0 0 16px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th { background: #23424A; color: white; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
      td { border-bottom: 1px solid #e5e7eb; padding: 7px 10px; text-align: left; font-size: 11px; }
      tr:nth-child(even) td { background: #f9fafb; }
      .ingreso { color: #059669; font-weight: 600; }
      .gasto { color: #dc2626; font-weight: 600; }
      .totals { margin-top: 20px; padding: 16px; background: #f3f4f6; border-radius: 8px; }
      .totals p { margin: 4px 0; font-size: 12px; }
      .footer { background: #23424A; color: white; text-align: center; padding: 10px; font-size: 9px; margin-top: 24px; }
      @media print { body { margin: 0; } .footer { position: fixed; bottom: 0; left: 0; right: 0; } }
    </style>
  </head><body>
    <div class="header">
      <div><h1>TRACCIONA</h1><div class="header-accent"></div></div>
      <div class="header-info">TRACCIONA.COM<br>info@tracciona.com<br>+34 645 779 594</div>
    </div>
    <div class="content">
    <p class="subtitle">Balance ${filters.year || 'Todos los años'}</p>
    <p class="date">Generado: ${new Date().toLocaleDateString('es-ES')}</p>
    <table><thead><tr>`

  if (exportColumns.tipo) html += '<th>Tipo</th>'
  if (exportColumns.fecha) html += '<th>Fecha</th>'
  if (exportColumns.razon) html += '<th>Razón</th>'
  if (exportColumns.detalle) html += '<th>Detalle</th>'
  if (exportColumns.importe) html += '<th>Importe</th>'
  if (exportColumns.estado) html += '<th>Estado</th>'
  if (exportColumns.notas) html += '<th>Notas</th>'

  html += '</tr></thead><tbody>'

  for (const e of data) {
    html += '<tr>'
    if (exportColumns.tipo) html += `<td class="${e.tipo}">${e.tipo === 'ingreso' ? '↑' : '↓'}</td>`
    if (exportColumns.fecha) html += `<td>${e.fecha}</td>`
    if (exportColumns.razon) html += `<td>${BALANCE_REASONS[e.razon]}</td>`
    if (exportColumns.detalle) html += `<td>${e.detalle || ''}</td>`
    if (exportColumns.importe)
      html += `<td class="${e.tipo}">${e.tipo === 'ingreso' ? '+' : '-'}${e.importe.toFixed(2)}€</td>`
    if (exportColumns.estado) html += `<td>${BALANCE_STATUS_LABELS[e.estado]}</td>`
    if (exportColumns.notas) html += `<td>${e.notas || ''}</td>`
    html += '</tr>'
  }

  html += `</tbody></table>
    <div class="totals">
      <p><strong>Total Ingresos:</strong> <span class="ingreso">+${summary.value.totalIngresos.toFixed(2)}€</span></p>
      <p><strong>Total Gastos:</strong> <span class="gasto">-${summary.value.totalGastos.toFixed(2)}€</span></p>
      <p><strong>Balance Neto:</strong> <strong>${summary.value.balanceNeto.toFixed(2)}€</strong></p>
    </div>
    </div>
    <div class="footer">TRACCIONA.COM</div>
  </body></html>`

  printHTML(html)
}

function exportResumen() {
  if (exportFormat.value === 'excel') {
    exportResumenExcel()
  } else {
    exportResumenPDF()
  }
  showExportResumenModal.value = false
}

function exportResumenExcel() {
  const lines: string[] = ['Concepto;Ingresos;Gastos;Neto']

  if (resumenOptions.totales) {
    lines.push(`TOTAL INGRESOS;+${summary.value.totalIngresos.toFixed(2)}€;;`)
    lines.push(`TOTAL GASTOS;;-${summary.value.totalGastos.toFixed(2)}€;`)
    lines.push(`BALANCE NETO;;;${summary.value.balanceNeto.toFixed(2)}€`)
    lines.push('')
  }

  if (resumenOptions.desglose) {
    lines.push('DESGLOSE POR RAZÓN;;;')
    for (const [key, label] of Object.entries(BALANCE_REASONS)) {
      const data = summary.value.byReason[key]
      if (data) {
        const neto = (data.ingresos || 0) - (data.gastos || 0)
        lines.push(
          `${label};+${(data.ingresos || 0).toFixed(2)}€;-${(data.gastos || 0).toFixed(2)}€;${neto.toFixed(2)}€`,
        )
      }
    }
    lines.push('')
  }

  if (resumenOptions.mensual) {
    lines.push('DESGLOSE MENSUAL;;;')
    for (const [month, data] of monthlyBreakdown.value) {
      const neto = data.ingresos - data.gastos
      lines.push(
        `${month};+${data.ingresos.toFixed(2)}€;-${data.gastos.toFixed(2)}€;${neto.toFixed(2)}€`,
      )
    }
  }

  downloadFile(lines.join('\n'), `resumen_balance_${filters.year || 'todos'}.csv`, 'text/csv')
}

function exportResumenPDF() {
  let html = `<!DOCTYPE html><html><head><title>Resumen Balance - Tracciona</title>
    <style>
      body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 12px; margin: 0; color: #1F2A2A; }
      .header { background: linear-gradient(135deg, #1A3238 0%, #23424A 100%); color: white; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; }
      .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 1px; }
      .header-accent { width: 45px; height: 2px; background: #7FD1C8; margin-top: 6px; }
      .header-info { font-size: 9px; text-align: right; line-height: 1.8; opacity: 0.85; }
      .content { padding: 20px 24px; }
      .subtitle { font-size: 14px; color: #23424A; font-weight: 700; margin: 0 0 4px; }
      .date { font-size: 11px; color: #4A5A5A; margin: 0 0 16px; }
      h2 { font-size: 13px; color: #23424A; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th { background: #23424A; color: white; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
      td { border-bottom: 1px solid #e5e7eb; padding: 7px 10px; text-align: right; font-size: 11px; }
      td:first-child { text-align: left; }
      tr:nth-child(even) td { background: #f9fafb; }
      .positive { color: #059669; font-weight: 600; }
      .negative { color: #dc2626; font-weight: 600; }
      .footer { background: #23424A; color: white; text-align: center; padding: 10px; font-size: 9px; margin-top: 24px; }
      @media print { body { margin: 0; } .footer { position: fixed; bottom: 0; left: 0; right: 0; } }
    </style>
  </head><body>
    <div class="header">
      <div><h1>TRACCIONA</h1><div class="header-accent"></div></div>
      <div class="header-info">TRACCIONA.COM<br>info@tracciona.com<br>+34 645 779 594</div>
    </div>
    <div class="content">
    <p class="subtitle">Resumen Balance ${filters.year || 'Todos los años'}</p>
    <p class="date">Generado: ${new Date().toLocaleDateString('es-ES')}</p>`

  if (resumenOptions.totales) {
    html += `<h2>Totales</h2>
      <table>
        <tr><td>Total Ingresos</td><td class="positive">+${summary.value.totalIngresos.toFixed(2)}€</td></tr>
        <tr><td>Total Gastos</td><td class="negative">-${summary.value.totalGastos.toFixed(2)}€</td></tr>
        <tr><td><strong>Balance Neto</strong></td><td class="${summary.value.balanceNeto >= 0 ? 'positive' : 'negative'}"><strong>${summary.value.balanceNeto.toFixed(2)}€</strong></td></tr>
      </table>`
  }

  if (resumenOptions.desglose) {
    html += `<h2>Desglose por Razón</h2>
      <table><thead><tr><th>Razón</th><th>Ingresos</th><th>Gastos</th><th>Neto</th></tr></thead><tbody>`
    for (const [key, label] of Object.entries(BALANCE_REASONS)) {
      const data = summary.value.byReason[key]
      if (data && (data.ingresos > 0 || data.gastos > 0)) {
        const neto = (data.ingresos || 0) - (data.gastos || 0)
        html += `<tr><td>${label}</td><td class="positive">+${(data.ingresos || 0).toFixed(2)}€</td><td class="negative">-${(data.gastos || 0).toFixed(2)}€</td><td class="${neto >= 0 ? 'positive' : 'negative'}">${neto.toFixed(2)}€</td></tr>`
      }
    }
    html += '</tbody></table>'
  }

  if (resumenOptions.mensual) {
    html += `<h2>Desglose Mensual</h2>
      <table><thead><tr><th>Mes</th><th>Ingresos</th><th>Gastos</th><th>Neto</th></tr></thead><tbody>`
    for (const [month, data] of monthlyBreakdown.value) {
      const neto = data.ingresos - data.gastos
      html += `<tr><td>${month}</td><td class="positive">+${data.ingresos.toFixed(2)}€</td><td class="negative">-${data.gastos.toFixed(2)}€</td><td class="${neto >= 0 ? 'positive' : 'negative'}">${neto.toFixed(2)}€</td></tr>`
    }
    html += '</tbody></table>'
  }

  html += `</div>
    <div class="footer">TRACCIONA.COM</div>
  </body></html>`

  printHTML(html)
}

/**
 * Print HTML content using a hidden iframe (avoids popup blocker issues)
 */
function printHTML(html: string) {
  // Remove any existing print iframe
  const existingFrame = document.getElementById('print-frame')
  if (existingFrame) {
    existingFrame.remove()
  }

  // Create hidden iframe
  const iframe = document.createElement('iframe')
  iframe.id = 'print-frame'
  iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:0;height:0;border:none;'
  document.body.appendChild(iframe)

  // Write content to iframe
  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
    alert('No se pudo abrir la ventana de impresión. Por favor, desactiva el bloqueador de popups.')
    return
  }

  doc.open()
  doc.write(html)
  doc.close()

  // Wait for content to load then print
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch {
      // Fallback: try window.open
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
        win.focus()
        win.print()
      } else {
        alert(
          'No se pudo abrir la ventana de impresión. Por favor, desactiva el bloqueador de popups.',
        )
      }
    }
  }

  // Trigger load manually for synchronous content
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch {
      // Silent fail - onload will handle it
    }
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

function fmtPercent(val: number | null): string {
  if (val === null) return '—'
  return `${val > 0 ? '+' : ''}${val}%`
}

// Clear filters
function clearFilters() {
  filters.year = null
  filters.tipo = null
  filters.razon = null
  filters.estado = null
  filters.subcategory_id = null
  filters.type_id = null
  filters.search = ''
}

// Chart data
const chartRazonData = computed(() => {
  const labels: string[] = []
  const ingresos: number[] = []
  const gastos: number[] = []

  for (const [key, label] of Object.entries(BALANCE_REASONS)) {
    const data = summary.value.byReason[key]
    if (data && (data.ingresos > 0 || data.gastos > 0)) {
      labels.push(label)
      ingresos.push(data.ingresos || 0)
      gastos.push(data.gastos || 0)
    }
  }
  return { labels, ingresos, gastos }
})

const chartSubcatData = computed(() => {
  const labels: string[] = []
  const beneficios: number[] = []

  for (const [name, data] of Object.entries(summary.value.bySubcategory)) {
    if (data.beneficio !== 0) {
      labels.push(name)
      beneficios.push(data.beneficio)
    }
  }
  return { labels, beneficios }
})

// Reason options for select
const reasonOptions = Object.entries(BALANCE_REASONS) as [BalanceReason, string][]
const statusOptions = Object.entries(BALANCE_STATUS_LABELS) as [BalanceStatus, string][]
</script>

<template>
  <div ref="balanceSection" class="balance-page" :class="{ fullscreen: isFullscreen }">
    <!-- Header -->
    <header class="page-header">
      <h1>💰 Balance</h1>
      <div class="header-actions">
        <button class="btn btn-icon-only" title="Pantalla completa" @click="toggleFullscreen">
          {{ isFullscreen ? '⛶' : '⛶' }}
        </button>
        <button class="btn" @click="showExportResumenModal = true">📊 Exportar Resumen</button>
        <button class="btn" @click="showExportModal = true">📥 Exportar</button>
        <button class="btn btn-primary" @click="openNewModal">+ Nueva Transacción</button>
      </div>
    </header>

    <!-- Error -->
    <div v-if="error" class="error-msg">{{ error }}</div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card ingresos">
        <span class="label">Total Ingresos</span>
        <span class="value">{{ fmt(summary.totalIngresos) }}</span>
      </div>
      <div class="summary-card gastos">
        <span class="label">Total Gastos</span>
        <span class="value">{{ fmt(summary.totalGastos) }}</span>
      </div>
      <div class="summary-card neto" :class="summary.balanceNeto >= 0 ? 'positive' : 'negative'">
        <span class="label">Balance Neto</span>
        <span class="value">{{ fmt(summary.balanceNeto) }}</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-group">
        <select v-model="filters.year">
          <option :value="null">Todos los años</option>
          <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
        </select>

        <select v-model="filters.tipo">
          <option :value="null">Todos los tipos</option>
          <option value="ingreso">↑ Ingresos</option>
          <option value="gasto">↓ Gastos</option>
        </select>

        <select v-model="filters.razon">
          <option :value="null">Todas las razones</option>
          <option v-for="[key, label] in reasonOptions" :key="key" :value="key">{{ label }}</option>
        </select>

        <select v-model="filters.estado">
          <option :value="null">Todos los estados</option>
          <option v-for="[key, label] in statusOptions" :key="key" :value="key">{{ label }}</option>
        </select>

        <select v-model="filters.subcategory_id">
          <option :value="null">Todas las subcat.</option>
          <option v-for="s in subcategories" :key="s.id" :value="s.id">{{ s.name_es }}</option>
        </select>

        <select v-model="filters.type_id">
          <option :value="null">Todos los tipos</option>
          <option v-for="t in types" :key="t.id" :value="t.id">{{ t.name_es }}</option>
        </select>
      </div>

      <div class="filter-group">
        <input
          v-model="filters.search"
          type="text"
          placeholder="Buscar en detalle/notas..."
          class="search-input"
        >
        <button class="btn btn-sm" @click="clearFilters">Limpiar</button>
      </div>
    </div>

    <!-- View Toggles -->
    <div class="view-toggles">
      <label class="toggle-check">
        <input v-model="showDesglose" type="checkbox" >
        Desglose por razón
      </label>
      <label class="toggle-check">
        <input v-model="showCharts" type="checkbox" >
        Gráficos
      </label>
      <select v-if="showCharts" v-model="chartType" class="chart-type-select">
        <option value="bar">Barras</option>
        <option value="pie">Circular</option>
      </select>
      <span class="count">{{ total }} transacciones</span>
    </div>

    <!-- Desglose -->
    <div v-if="showDesglose" class="desglose-grid">
      <div v-for="[key, label] in reasonOptions" :key="key" class="desglose-item">
        <span class="desglose-label">{{ label }}</span>
        <div class="desglose-values">
          <span class="ing">↑ {{ fmt(summary.byReason[key]?.ingresos || 0) }}</span>
          <span class="gas">↓ {{ fmt(summary.byReason[key]?.gastos || 0) }}</span>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div v-if="showCharts" class="charts-section">
      <div class="charts-grid">
        <!-- Chart 1: Ingresos vs Gastos por Razón -->
        <div class="chart-box">
          <h3>Ingresos vs Gastos por Razón</h3>
          <div v-if="chartType === 'bar'" class="chart-bars">
            <div v-for="(label, idx) in chartRazonData.labels" :key="label" class="bar-group">
              <div class="bar-label">{{ label }}</div>
              <div class="bars">
                <div
                  class="bar ingreso"
                  :style="{
                    width: `${Math.min(100, (chartRazonData.ingresos[idx] / Math.max(...chartRazonData.ingresos, 1)) * 100)}%`,
                  }"
                >
                  {{ fmt(chartRazonData.ingresos[idx]) }}
                </div>
                <div
                  class="bar gasto"
                  :style="{
                    width: `${Math.min(100, (chartRazonData.gastos[idx] / Math.max(...chartRazonData.gastos, 1)) * 100)}%`,
                  }"
                >
                  {{ fmt(chartRazonData.gastos[idx]) }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="chart-pie">
            <div v-for="(label, idx) in chartRazonData.labels" :key="label" class="pie-item">
              <span class="pie-color" :style="{ background: `hsl(${idx * 25}, 70%, 50%)` }" />
              <span class="pie-label">{{ label }}</span>
              <span class="pie-value">{{
                fmt((chartRazonData.ingresos[idx] || 0) - (chartRazonData.gastos[idx] || 0))
              }}</span>
            </div>
          </div>
        </div>

        <!-- Chart 2: Beneficio % por Tipo -->
        <div class="chart-box">
          <h3>Beneficio % por Tipo</h3>
          <div v-if="chartSubcatData.labels.length === 0" class="chart-empty">
            Sin datos de beneficio
          </div>
          <div v-else-if="chartType === 'bar'" class="chart-bars">
            <div v-for="(label, idx) in chartSubcatData.labels" :key="label" class="bar-group">
              <div class="bar-label">{{ label }}</div>
              <div class="bars">
                <div
                  class="bar"
                  :class="chartSubcatData.beneficios[idx] >= 0 ? 'ingreso' : 'gasto'"
                  :style="{ width: `${Math.min(100, Math.abs(chartSubcatData.beneficios[idx]))}%` }"
                >
                  {{ chartSubcatData.beneficios[idx] }}%
                </div>
              </div>
            </div>
          </div>
          <div v-else class="chart-pie">
            <div v-for="(label, idx) in chartSubcatData.labels" :key="label" class="pie-item">
              <span
                class="pie-color"
                :style="{
                  background: chartSubcatData.beneficios[idx] >= 0 ? '#22c55e' : '#ef4444',
                }"
              />
              <span class="pie-label">{{ label }}</span>
              <span
                class="pie-value"
                :class="chartSubcatData.beneficios[idx] >= 0 ? 'positive' : 'negative'"
                >{{ chartSubcatData.beneficios[idx] }}%</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <div v-if="loading" class="loading">Cargando...</div>

      <table v-else class="balance-table">
        <thead>
          <tr>
            <th class="sortable" @click="toggleSort('tipo')">Tipo {{ getSortIcon('tipo') }}</th>
            <th class="sortable" @click="toggleSort('fecha')">Fecha {{ getSortIcon('fecha') }}</th>
            <th class="sortable" @click="toggleSort('razon')">Razón {{ getSortIcon('razon') }}</th>
            <th>Detalle</th>
            <th>Vehículo</th>
            <th>Tipo</th>
            <th class="sortable num" @click="toggleSort('importe')">
              Importe {{ getSortIcon('importe') }}
            </th>
            <th class="num">Ben.%</th>
            <th>Factura</th>
            <th>Estado</th>
            <th class="actions">Acc.</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="sortedEntries.length === 0">
            <td colspan="11" class="empty">No hay transacciones</td>
          </tr>
          <tr v-for="e in sortedEntries" :key="e.id">
            <td>
              <span class="tipo-badge" :class="e.tipo">
                {{ e.tipo === 'ingreso' ? '↑' : '↓' }}
              </span>
            </td>
            <td>{{ fmtDate(e.fecha) }}</td>
            <td>{{ BALANCE_REASONS[e.razon] }}</td>
            <td class="detalle">{{ e.detalle || '—' }}</td>
            <td class="vehiculo">
              <span v-if="e.vehicles" class="vehiculo-badge">
                {{ e.vehicles.brand }} {{ e.vehicles.model }} ({{ e.vehicles.year }})
              </span>
              <span v-else>—</span>
            </td>
            <td>{{ e.types?.name_es || '—' }}</td>
            <td class="num" :class="e.tipo">
              <strong>{{ fmt(e.importe) }}</strong>
            </td>
            <td class="num">
              <span
                v-if="e.tipo === 'ingreso' && e.coste_asociado"
                :class="
                  calculateProfit(e.importe, e.coste_asociado)! >= 0 ? 'profit-pos' : 'profit-neg'
                "
              >
                {{ fmtPercent(calculateProfit(e.importe, e.coste_asociado)) }}
              </span>
              <span v-else>—</span>
            </td>
            <td>
              <a v-if="e.factura_url" :href="e.factura_url" target="_blank" class="factura-link"
                >Ver</a
              >
              <span v-else>—</span>
            </td>
            <td>
              <span class="estado-badge" :class="e.estado">{{
                BALANCE_STATUS_LABELS[e.estado]
              }}</span>
            </td>
            <td class="actions">
              <button class="btn-icon" title="Editar" @click="openEditModal(e)">✏️</button>
              <button class="btn-icon del" title="Eliminar" @click="openDeleteModal(e)">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Entry Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-bg" @click.self="showModal = false">
        <div class="modal modal-lg">
          <div class="modal-head">
            <span>{{ editingId ? '✏️ Editar' : '➕ Nueva' }} Transacción</span>
            <button @click="showModal = false">×</button>
          </div>
          <div class="modal-body">
            <!-- Tipo -->
            <div class="tipo-selector">
              <label :class="{ active: formData.tipo === 'ingreso' }">
                <input v-model="formData.tipo" type="radio" value="ingreso" >
                <span class="tipo-card ingreso">↑ Ingreso</span>
              </label>
              <label :class="{ active: formData.tipo === 'gasto' }">
                <input v-model="formData.tipo" type="radio" value="gasto" >
                <span class="tipo-card gasto">↓ Gasto</span>
              </label>
            </div>

            <div class="row-3">
              <div class="field">
                <label>Fecha *</label>
                <input v-model="formData.fecha" type="date" >
              </div>
              <div class="field">
                <label>Razón *</label>
                <select v-model="formData.razon">
                  <option v-for="[key, label] in reasonOptions" :key="key" :value="key">
                    {{ label }}
                  </option>
                </select>
              </div>
              <div class="field">
                <label>Estado *</label>
                <select v-model="formData.estado">
                  <option v-for="[key, label] in statusOptions" :key="key" :value="key">
                    {{ label }}
                  </option>
                </select>
              </div>
            </div>

            <div class="row-2">
              <div class="field">
                <label>Importe € *</label>
                <input
                  v-model.number="formData.importe"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                >
              </div>
              <div v-if="formData.tipo === 'ingreso'" class="field">
                <label>Coste asociado € (para % beneficio)</label>
                <input
                  v-model.number="formData.coste_asociado"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                >
              </div>
              <div v-else class="field" />
            </div>

            <div class="field">
              <label>Vehículo relacionado</label>
              <select v-model="formData.vehicle_id" class="vehicle-select">
                <option :value="null">— Sin vehículo —</option>
                <option v-for="v in vehicles" :key="v.id" :value="v.id">
                  {{ v.brand }} {{ v.model }} ({{ v.year }}) {{ v.plate ? `- ${v.plate}` : '' }}
                </option>
              </select>
            </div>

            <div class="field">
              <label>Detalle</label>
              <input
                v-model="formData.detalle"
                type="text"
                placeholder="Ej: Cisterna MAN 1234ABC (2020)"
              >
            </div>

            <div class="row-2">
              <div class="field">
                <label>Tipo</label>
                <select v-model="formData.type_id">
                  <option :value="null">— Sin tipo —</option>
                  <option v-for="s in types" :key="s.id" :value="s.id">{{ s.name_es }}</option>
                </select>
              </div>
              <div class="field">
                <label>URL Factura/Recibo</label>
                <input v-model="formData.factura_url" type="url" placeholder="https://..." >
              </div>
            </div>

            <div class="field">
              <label>Notas</label>
              <textarea v-model="formData.notas" rows="2" placeholder="Notas adicionales..." />
            </div>

            <!-- Profit preview -->
            <div
              v-if="formData.tipo === 'ingreso' && formData.coste_asociado && formData.importe"
              class="profit-preview"
            >
              <span>Beneficio estimado:</span>
              <strong
                :class="
                  calculateProfit(formData.importe, formData.coste_asociado)! >= 0
                    ? 'profit-pos'
                    : 'profit-neg'
                "
              >
                {{ fmtPercent(calculateProfit(formData.importe, formData.coste_asociado)) }}
              </strong>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn" @click="showModal = false">Cancelar</button>
            <button class="btn btn-primary" :disabled="saving" @click="handleSave">
              {{ saving ? 'Guardando...' : 'Guardar' }}
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
            <span>🗑️ Eliminar transacción</span>
            <button @click="showDeleteModal = false">×</button>
          </div>
          <div class="modal-body">
            <p>¿Eliminar esta transacción?</p>
            <p class="delete-info">
              <strong>{{ BALANCE_REASONS[deleteTarget?.razon || 'otros'] }}</strong> —
              {{ fmt(deleteTarget?.importe) }}
            </p>
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

    <!-- Export Balance Modal -->
    <Teleport to="body">
      <div v-if="showExportModal" class="modal-bg" @click.self="showExportModal = false">
        <div class="modal">
          <div class="modal-head">
            <span>📥 Exportar Balance</span>
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

            <div class="field">
              <label>Columnas a incluir</label>
              <div class="checkbox-group">
                <label><input v-model="exportColumns.tipo" type="checkbox" > Tipo</label>
                <label><input v-model="exportColumns.fecha" type="checkbox" > Fecha</label>
                <label><input v-model="exportColumns.razon" type="checkbox" > Razón</label>
                <label><input v-model="exportColumns.detalle" type="checkbox" > Detalle</label>
                <label><input v-model="exportColumns.importe" type="checkbox" > Importe</label>
                <label><input v-model="exportColumns.estado" type="checkbox" > Estado</label>
                <label><input v-model="exportColumns.notas" type="checkbox" > Notas</label>
              </div>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn" @click="showExportModal = false">Cancelar</button>
            <button class="btn btn-primary" @click="exportBalance">Exportar</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Export Resumen Modal -->
    <Teleport to="body">
      <div
        v-if="showExportResumenModal"
        class="modal-bg"
        @click.self="showExportResumenModal = false"
      >
        <div class="modal">
          <div class="modal-head">
            <span>📊 Exportar Resumen</span>
            <button @click="showExportResumenModal = false">×</button>
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
              <label>Incluir</label>
              <div class="checkbox-group">
                <label
                  ><input v-model="resumenOptions.totales" type="checkbox" > Totales
                  (Ingresos/Gastos/Neto)</label
                >
                <label
                  ><input v-model="resumenOptions.desglose" type="checkbox" > Desglose por
                  Razón</label
                >
                <label
                  ><input v-model="resumenOptions.mensual" type="checkbox" > Desglose
                  Mensual</label
                >
              </div>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn" @click="showExportResumenModal = false">Cancelar</button>
            <button class="btn btn-primary" @click="exportResumen">Exportar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.balance-page {
  max-width: 1200px;
  margin: 0 auto;
}
.balance-page.fullscreen {
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
  grid-template-columns: repeat(3, 1fr);
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
.summary-card.ingresos {
  background: #dcfce7;
  color: #166534;
}
.summary-card.gastos {
  background: #fee2e2;
  color: #991b1b;
}
.summary-card.neto {
  background: #dbeafe;
  color: #1e40af;
}
.summary-card.neto.positive {
  background: #dcfce7;
  color: #166534;
}
.summary-card.neto.negative {
  background: #fee2e2;
  color: #991b1b;
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
  min-width: 200px;
}

/* View toggles */
.view-toggles {
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
}
.toggle-check input {
  margin: 0;
}
.chart-type-select {
  padding: 4px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 0.8rem;
}
.count {
  margin-left: auto;
  color: #6b7280;
}

/* Desglose */
.desglose-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}
.desglose-item {
  padding: 10px 14px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.desglose-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  display: block;
  margin-bottom: 6px;
}
.desglose-values {
  display: flex;
  gap: 12px;
  font-size: 0.8rem;
}
.desglose-values .ing {
  color: #16a34a;
}
.desglose-values .gas {
  color: #dc2626;
}

/* Charts */
.charts-section {
  margin-bottom: 20px;
}
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.chart-box {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.chart-box h3 {
  margin: 0 0 12px;
  font-size: 0.9rem;
  color: #374151;
}
.chart-empty {
  color: #9ca3af;
  text-align: center;
  padding: 20px;
  font-size: 0.85rem;
}

/* Bar chart */
.chart-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bar-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.bar-label {
  width: 80px;
  font-size: 0.75rem;
  color: #6b7280;
  text-align: right;
  flex-shrink: 0;
}
.bars {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.bar {
  height: 18px;
  border-radius: 3px;
  font-size: 0.65rem;
  color: #fff;
  padding: 0 6px;
  display: flex;
  align-items: center;
  min-width: 40px;
}
.bar.ingreso {
  background: #22c55e;
}
.bar.gasto {
  background: #ef4444;
}

/* Pie chart (list) */
.chart-pie {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pie-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
}
.pie-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}
.pie-label {
  flex: 1;
}
.pie-value {
  font-weight: 600;
}
.pie-value.positive {
  color: #16a34a;
}
.pie-value.negative {
  color: #dc2626;
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
.balance-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.balance-table th {
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
.balance-table th.sortable {
  cursor: pointer;
}
.balance-table th.sortable:hover {
  background: #f3f4f6;
}
.balance-table th.num,
.balance-table td.num {
  text-align: right;
}
.balance-table th.actions {
  text-align: center;
  width: 80px;
}
.balance-table td {
  padding: 10px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}
.balance-table td.empty {
  text-align: center;
  color: #9ca3af;
  padding: 40px;
}
.balance-table td.detalle {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.balance-table td.actions {
  text-align: center;
}

/* Badges */
.tipo-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  font-weight: 700;
}
.tipo-badge.ingreso {
  background: #dcfce7;
  color: #16a34a;
}
.tipo-badge.gasto {
  background: #fee2e2;
  color: #dc2626;
}

.estado-badge {
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 500;
}
.estado-badge.pendiente {
  background: #fef3c7;
  color: #92400e;
}
.estado-badge.pagado {
  background: #dbeafe;
  color: #1e40af;
}
.estado-badge.cobrado {
  background: #dcfce7;
  color: #166534;
}

/* Vehicle column */
.balance-table td.vehiculo {
  max-width: 160px;
}
.vehiculo-badge {
  display: inline-block;
  padding: 3px 8px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

/* Vehicle select in form */
.vehicle-select {
  width: 100%;
}

/* Amount colors */
td.ingreso strong {
  color: #16a34a;
}
td.gasto strong {
  color: #dc2626;
}

/* Profit */
.profit-pos {
  color: #16a34a;
  font-weight: 600;
}
.profit-neg {
  color: #dc2626;
  font-weight: 600;
}

/* Factura link */
.factura-link {
  color: #2563eb;
  text-decoration: none;
  font-size: 0.8rem;
}
.factura-link:hover {
  text-decoration: underline;
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
  max-width: 560px;
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

/* Tipo selector in modal */
.tipo-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}
.tipo-selector label {
  cursor: pointer;
}
.tipo-selector input {
  display: none;
}
.tipo-card {
  display: block;
  padding: 14px;
  text-align: center;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.15s;
}
.tipo-selector label.active .tipo-card.ingreso {
  border-color: #16a34a;
  background: #dcfce7;
}
.tipo-selector label.active .tipo-card.gasto {
  border-color: #dc2626;
  background: #fee2e2;
}

/* Form fields */
.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}
.row-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}
.field label {
  font-size: 0.7rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
}
.field input,
.field select,
.field textarea {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  font-size: 0.85rem;
}
.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: #23424a;
}

/* Radio/Checkbox groups */
.radio-group,
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.radio-group label,
.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  text-transform: none;
  font-weight: normal;
  color: #374151;
}
.radio-group input,
.checkbox-group input {
  margin: 0;
}

/* Profit preview */
.profit-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 0.9rem;
}
.profit-preview strong {
  font-size: 1.1rem;
}

/* Delete info */
.delete-info {
  padding: 12px;
  background: #f3f4f6;
  border-radius: 6px;
  text-align: center;
  margin-bottom: 12px;
}

/* Mobile */
@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: 1fr;
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
  .row-2,
  .row-3 {
    grid-template-columns: 1fr;
  }
  .tipo-selector {
    grid-template-columns: 1fr;
  }
  .balance-table {
    font-size: 0.75rem;
  }
  .balance-table th,
  .balance-table td {
    padding: 8px 6px;
  }
  .desglose-grid {
    grid-template-columns: 1fr 1fr;
  }
  .charts-grid {
    grid-template-columns: 1fr;
  }
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
