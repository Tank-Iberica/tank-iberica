<script setup lang="ts">
import {
  useAdminBalance,
  type BalanceEntry,
  type BalanceFilters,
  BALANCE_REASONS,
  BALANCE_STATUS_LABELS,
} from '~/composables/admin/useAdminBalance'

const { t } = useI18n()
const toast = useToast()

const { entries, loading, availableYears, summary, fetchEntries } = useAdminBalance()

// Filters for balance export
const filters = reactive<BalanceFilters>({
  year: new Date().getFullYear(),
  tipo: null,
  razon: null,
  estado: null,
  subcategory_id: null,
  type_id: null,
  search: '',
})

// Export options for balance
const exportFormat = ref<'excel' | 'pdf'>('pdf')
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

// Load data
onMounted(async () => {
  await fetchEntries(filters)
})

// Watch filters
watch(
  filters,
  () => {
    fetchEntries(filters)
  },
  { deep: true },
)

// Monthly breakdown for export
const monthlyBreakdown = computed(() => {
  const months: Record<string, { ingresos: number; gastos: number }> = {}
  for (const e of entries.value) {
    const month = e.fecha.substring(0, 7)
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

// Export functions
async function exportBalance() {
  let dataToExport = [...entries.value]

  if (exportDataScope.value === 'all') {
    // Fetch all entries without filters for full export
    await fetchEntries({})
    dataToExport = [...entries.value]
    // Re-fetch with current filters to restore the view
    await fetchEntries(filters)
  }

  if (exportFormat.value === 'excel') {
    exportToExcel(dataToExport)
  } else {
    exportToPDF(dataToExport)
  }
}

function exportToExcel(data: BalanceEntry[]) {
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
  let html = `<!DOCTYPE html><html><head><title>Balance ${filters.year || 'Todos'}</title>
    <style>
      body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 12px; margin: 0; color: #1F2A2A; }
      h1 { font-size: 18px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
      th { background: #f3f4f6; }
      .ingreso { color: green; }
      .gasto { color: red; }
      .totals { margin-top: 20px; }
      @media print { body { margin: 0; } }
    </style>
  </head><body>
    <h1>Balance ${filters.year || 'Todos los años'}</h1>
    <p>Generado: ${new Date().toLocaleDateString('es-ES')}</p>
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
      <p><strong>Total Ingresos:</strong> +${summary.value.totalIngresos.toFixed(2)}€</p>
      <p><strong>Total Gastos:</strong> -${summary.value.totalGastos.toFixed(2)}€</p>
      <p><strong>Balance Neto:</strong> ${summary.value.balanceNeto.toFixed(2)}€</p>
    </div>
  </body></html>`

  printHTML(html)
}

function exportResumen() {
  if (exportFormat.value === 'excel') {
    exportResumenExcel()
  } else {
    exportResumenPDF()
  }
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
  let html = `<!DOCTYPE html><html><head><title>Resumen Balance</title>
    <style>
      body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 12px; margin: 0; color: #1F2A2A; }
      h1, h2 { margin-bottom: 10px; }
      h1 { font-size: 18px; }
      h2 { font-size: 14px; margin-top: 20px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: right; }
      th { background: #f3f4f6; text-align: left; }
      td:first-child { text-align: left; }
      .positive { color: green; }
      .negative { color: red; }
      @media print { body { margin: 0; } }
    </style>
  </head><body>
    <h1>Resumen Balance ${filters.year || 'Todos los años'}</h1>
    <p>Generado: ${new Date().toLocaleDateString('es-ES')}</p>`

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

  html += '</body></html>'

  printHTML(html)
}

function printHTML(html: string) {
  const existingFrame = document.getElementById('print-frame')
  if (existingFrame) {
    existingFrame.remove()
  }

  const iframe = document.createElement('iframe')
  iframe.id = 'print-frame'
  iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:0;height:0;border:none;'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
    toast.error(t('toast.printFailed'))
    return
  }

  doc.open()
  doc.write(html)
  doc.close()

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch {
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
        win.focus()
        win.print()
      }
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

function fmt(val: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(val)
}
</script>

<template>
  <div class="tool-content">
    <div class="tool-header">
      <h2>📊 Exportar Balance y Resúmenes</h2>
    </div>

    <!-- Preview Summary -->
    <div class="preview-summary">
      <div class="summary-item">
        <span class="label">Período:</span>
        <span class="value">{{ filters.year || 'Todos los años' }}</span>
      </div>
      <div class="summary-item positive">
        <span class="label">Ingresos:</span>
        <span class="value">{{ fmt(summary.totalIngresos) }}</span>
      </div>
      <div class="summary-item negative">
        <span class="label">Gastos:</span>
        <span class="value">{{ fmt(summary.totalGastos) }}</span>
      </div>
      <div class="summary-item" :class="summary.balanceNeto >= 0 ? 'positive' : 'negative'">
        <span class="label">Balance:</span>
        <span class="value">{{ fmt(summary.balanceNeto) }}</span>
      </div>
      <div class="summary-item">
        <span class="label">Transacciones:</span>
        <span class="value">{{ entries.length }}</span>
      </div>
    </div>

    <!-- Export Options -->
    <div class="export-sections">
      <!-- Section 1: Filters -->
      <div class="export-section">
        <h3>1. Seleccionar Período</h3>
        <div class="filter-row">
          <select v-model="filters.year" class="select-input">
            <option :value="null">Todos los años</option>
            <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
          </select>
          <select v-model="filters.tipo" class="select-input">
            <option :value="null">Todos los tipos</option>
            <option value="ingreso">Solo Ingresos</option>
            <option value="gasto">Solo Gastos</option>
          </select>
        </div>
      </div>

      <!-- Section 2: Export Balance -->
      <div class="export-section">
        <h3>2. Exportar Balance Completo</h3>
        <p class="section-desc">Genera un listado detallado de todas las transacciones</p>

        <div class="option-group">
          <label class="option-label">Formato:</label>
          <div class="radio-group horizontal">
            <label><input v-model="exportFormat" type="radio" value="pdf" > PDF (Imprimir)</label>
            <label><input v-model="exportFormat" type="radio" value="excel" > Excel (CSV)</label>
          </div>
        </div>

        <div class="option-group">
          <label class="option-label">Columnas a incluir:</label>
          <div class="checkbox-grid">
            <label><input v-model="exportColumns.tipo" type="checkbox" > Tipo</label>
            <label><input v-model="exportColumns.fecha" type="checkbox" > Fecha</label>
            <label><input v-model="exportColumns.razon" type="checkbox" > Razón</label>
            <label><input v-model="exportColumns.detalle" type="checkbox" > Detalle</label>
            <label><input v-model="exportColumns.importe" type="checkbox" > Importe</label>
            <label><input v-model="exportColumns.estado" type="checkbox" > Estado</label>
            <label><input v-model="exportColumns.notas" type="checkbox" > Notas</label>
          </div>
        </div>

        <button class="btn btn-primary btn-lg" :disabled="loading" @click="exportBalance">
          {{ exportFormat === 'pdf' ? '🖨️ Generar PDF' : '📥 Descargar Excel' }}
        </button>
      </div>

      <!-- Section 3: Export Summary -->
      <div class="export-section">
        <h3>3. Exportar Resumen</h3>
        <p class="section-desc">Genera un resumen financiero con totales y desgloses</p>

        <div class="option-group">
          <label class="option-label">Incluir en el resumen:</label>
          <div class="checkbox-group">
            <label
              ><input v-model="resumenOptions.totales" type="checkbox" > Totales
              (Ingresos/Gastos/Balance)</label
            >
            <label
              ><input v-model="resumenOptions.desglose" type="checkbox" > Desglose por Razón</label
            >
            <label
              ><input v-model="resumenOptions.mensual" type="checkbox" > Desglose Mensual</label
            >
          </div>
        </div>

        <button class="btn btn-secondary btn-lg" :disabled="loading" @click="exportResumen">
          {{ exportFormat === 'pdf' ? '🖨️ Generar Resumen PDF' : '📥 Descargar Resumen Excel' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-content {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.tool-header {
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tool-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

/* Preview Summary */
.preview-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px 20px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-item .label {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: #6b7280;
  font-weight: 500;
}

.summary-item .value {
  font-size: 1rem;
  font-weight: 600;
}

.summary-item.positive .value {
  color: #16a34a;
}

.summary-item.negative .value {
  color: #dc2626;
}

/* Export Sections */
.export-sections {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.export-section {
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.export-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.export-section h3 {
  margin: 0 0 8px;
  font-size: 1rem;
  color: #374151;
}

.section-desc {
  margin: 0 0 16px;
  color: #6b7280;
  font-size: 0.85rem;
}

/* Filter Row */
.filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.select-input {
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  min-width: 160px;
}

/* Option Groups */
.option-group {
  margin-bottom: 16px;
}

.option-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.radio-group,
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-group.horizontal {
  flex-direction: row;
  gap: 20px;
}

.radio-group label,
.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #374151;
}

.radio-group input,
.checkbox-group input {
  margin: 0;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.checkbox-grid label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  cursor: pointer;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn:hover {
  background: #f9fafb;
}

.btn-primary {
  background: #23424a;
  color: #fff;
  border: none;
}

.btn-primary:hover {
  background: #1a3238;
}

.btn-secondary {
  background: #6b7280;
  color: #fff;
  border: none;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-lg {
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 500;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile */
@media (max-width: 768px) {
  .preview-summary {
    gap: 12px;
  }

  .summary-item {
    flex: 1;
    min-width: 80px;
  }

  .radio-group.horizontal {
    flex-direction: column;
    gap: 8px;
  }

  .checkbox-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-row {
    flex-direction: column;
  }

  .select-input {
    width: 100%;
  }
}
</style>
