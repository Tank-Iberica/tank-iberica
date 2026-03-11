<script lang="ts">
import {
  useAdminBalance,
  type BalanceEntry,
  type BalanceFilters,
  BALANCE_REASONS,
  BALANCE_STATUS_LABELS,
} from '~/composables/admin/useAdminBalance'

interface ColDef {
  header: string
  cell: (e: BalanceEntry) => string
}

function buildExporterColumns(cols: Record<string, boolean>): ColDef[] {
  const defs: ColDef[] = []
  if (cols.tipo)
    defs.push({
      header: 'Tipo',
      cell: (e) => `<td class="${e.tipo}">${e.tipo === 'ingreso' ? '↑' : '↓'}</td>`,
    })
  if (cols.fecha) defs.push({ header: 'Fecha', cell: (e) => `<td>${e.fecha}</td>` })
  if (cols.razon)
    defs.push({ header: 'Razón', cell: (e) => `<td>${BALANCE_REASONS[e.razon]}</td>` })
  if (cols.detalle) defs.push({ header: 'Detalle', cell: (e) => `<td>${e.detalle || ''}</td>` })
  if (cols.importe)
    defs.push({
      header: 'Importe',
      cell: (e) =>
        `<td class="${e.tipo}">${e.tipo === 'ingreso' ? '+' : '-'}${e.importe.toFixed(2)}€</td>`,
    })
  if (cols.estado)
    defs.push({ header: 'Estado', cell: (e) => `<td>${BALANCE_STATUS_LABELS[e.estado]}</td>` })
  if (cols.notas) defs.push({ header: 'Notas', cell: (e) => `<td>${e.notas || ''}</td>` })
  return defs
}

function buildExporterTotalesHtml(s: {
  totalIngresos: number
  totalGastos: number
  balanceNeto: number
}): string {
  const netoClass = s.balanceNeto >= 0 ? 'positive' : 'negative'
  return `<h2>Totales</h2><table>
    <tr><td>Total Ingresos</td><td class="positive">+${s.totalIngresos.toFixed(2)}€</td></tr>
    <tr><td>Total Gastos</td><td class="negative">-${s.totalGastos.toFixed(2)}€</td></tr>
    <tr><td><strong>Balance Neto</strong></td><td class="${netoClass}"><strong>${s.balanceNeto.toFixed(2)}€</strong></td></tr>
  </table>`
}

function buildExporterDesgloseHtml(
  byReason: Record<string, { ingresos: number; gastos: number }>,
): string {
  let html = `<h2>Desglose por Razón</h2><table><thead><tr><th>Razón</th><th>Ingresos</th><th>Gastos</th><th>Neto</th></tr></thead><tbody>`
  for (const [key, label] of Object.entries(BALANCE_REASONS)) {
    const data = byReason[key]
    if (!data || (data.ingresos <= 0 && data.gastos <= 0)) continue
    const neto = (data.ingresos || 0) - (data.gastos || 0)
    const netoClass = neto >= 0 ? 'positive' : 'negative'
    html += `<tr><td>${label}</td><td class="positive">+${(data.ingresos || 0).toFixed(2)}€</td><td class="negative">-${(data.gastos || 0).toFixed(2)}€</td><td class="${netoClass}">${neto.toFixed(2)}€</td></tr>`
  }
  return html + '</tbody></table>'
}

function buildExporterMensualHtml(
  monthly: Iterable<[string, { ingresos: number; gastos: number }]>,
): string {
  let html = `<h2>Desglose Mensual</h2><table><thead><tr><th>Mes</th><th>Ingresos</th><th>Gastos</th><th>Neto</th></tr></thead><tbody>`
  for (const [month, data] of monthly) {
    const neto = data.ingresos - data.gastos
    const netoClass = neto >= 0 ? 'positive' : 'negative'
    html += `<tr><td>${month}</td><td class="positive">+${data.ingresos.toFixed(2)}€</td><td class="negative">-${data.gastos.toFixed(2)}€</td><td class="${netoClass}">${neto.toFixed(2)}€</td></tr>`
  }
  return html + '</tbody></table>'
}

function buildExporterResumenSections(
  opts: Record<string, boolean>,
  summaryData: {
    totalIngresos: number
    totalGastos: number
    balanceNeto: number
    byReason: Record<string, { ingresos: number; gastos: number }>
  },
  monthly: Iterable<[string, { ingresos: number; gastos: number }]>,
): string {
  const parts: string[] = []
  if (opts.totales) parts.push(buildExporterTotalesHtml(summaryData))
  if (opts.desglose) parts.push(buildExporterDesgloseHtml(summaryData.byReason))
  if (opts.mensual) parts.push(buildExporterMensualHtml(monthly))
  return parts.join('')
}

const EXPORTER_PDF_STYLE = `
  body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: var(--font-size-xs); margin: 0; color: var(--text-primary); }
  h1 { font-size: var(--font-size-lg); }
  table { width: 100%; border-collapse: collapse; margin-top: var(--spacing-5); }
  th, td { border: 1px solid #ccc; padding: 0.375rem var(--spacing-2); text-align: left; }
  th { background: var(--bg-secondary); }
  .ingreso { color: green; }
  .gasto { color: red; }
  .totals { margin-top: var(--spacing-5); }
  @media print { body { margin: 0; } }
`

const EXPORTER_RESUMEN_STYLE = `
  body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: var(--font-size-xs); margin: 0; color: var(--text-primary); }
  h1, h2 { margin-bottom: 0.625rem; }
  h1 { font-size: var(--font-size-lg); }
  h2 { font-size: var(--font-size-sm); margin-top: var(--spacing-5); }
  table { width: 100%; border-collapse: collapse; margin-bottom: var(--spacing-5); }
  th, td { border: 1px solid #ccc; padding: 0.375rem var(--spacing-2); text-align: right; }
  th { background: var(--bg-secondary); text-align: left; }
  td:first-child { text-align: left; }
  .positive { color: green; }
  .negative { color: red; }
  @media print { body { margin: 0; } }
`

function buildBalanceExportPdfHtml(
  data: BalanceEntry[],
  colDefs: ColDef[],
  yearLabel: string,
  totals: { totalIngresos: number; totalGastos: number; balanceNeto: number },
): string {
  const headerCells = colDefs.map((c) => `<th>${c.header}</th>`).join('')
  const bodyRows = data
    .map((e) => '<tr>' + colDefs.map((c) => c.cell(e)).join('') + '</tr>')
    .join('')
  return `<!DOCTYPE html><html><head><title>Balance ${yearLabel}</title>
    <style>${EXPORTER_PDF_STYLE}</style>
  </head><body>
    <h1>Balance ${yearLabel}</h1>
    <p>Generado: ${new Date().toLocaleDateString('es-ES')}</p>
    <table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>
    <div class="totals">
      <p><strong>Total Ingresos:</strong> +${totals.totalIngresos.toFixed(2)}€</p>
      <p><strong>Total Gastos:</strong> -${totals.totalGastos.toFixed(2)}€</p>
      <p><strong>Balance Neto:</strong> ${totals.balanceNeto.toFixed(2)}€</p>
    </div>
  </body></html>`
}

function buildResumenExportPdfHtml(yearLabel: string, sectionsHtml: string): string {
  return `<!DOCTYPE html><html><head><title>Resumen Balance</title>
    <style>${EXPORTER_RESUMEN_STYLE}</style>
  </head><body>
    <h1>Resumen Balance ${yearLabel}</h1>
    <p>Generado: ${new Date().toLocaleDateString('es-ES')}</p>
    ${sectionsHtml}
  </body></html>`
}

function printExportHTML(html: string, onError: () => void): void {
  const existingFrame = document.getElementById('print-frame')
  if (existingFrame) existingFrame.remove()

  const iframe = document.createElement('iframe')
  iframe.id = 'print-frame'
  iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:0;height:0;border:none;'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
    onError()
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
      const win = globalThis.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
        win.focus()
        win.print()
      }
    }
  }, 100)
}
</script>

<script setup lang="ts">
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

const EXCEL_COLUMNS: Array<{
  key: keyof typeof exportColumns
  header: string
  cell: (e: BalanceEntry) => string
}> = [
  { key: 'tipo', header: 'Tipo', cell: (e) => (e.tipo === 'ingreso' ? 'Ingreso' : 'Gasto') },
  { key: 'fecha', header: 'Fecha', cell: (e) => e.fecha },
  { key: 'razon', header: 'Razón', cell: (e) => BALANCE_REASONS[e.razon] },
  { key: 'detalle', header: 'Detalle', cell: (e) => e.detalle || '' },
  {
    key: 'importe',
    header: 'Importe',
    cell: (e) => `${e.tipo === 'ingreso' ? '+' : '-'}${e.importe.toFixed(2)}€`,
  },
  { key: 'estado', header: 'Estado', cell: (e) => BALANCE_STATUS_LABELS[e.estado] },
  { key: 'notas', header: 'Notas', cell: (e) => e.notas || '' },
]

function exportToExcel(data: BalanceEntry[]) {
  const activeCols = EXCEL_COLUMNS.filter((c) => exportColumns[c.key])
  const headers = activeCols.map((c) => c.header)
  const rows = data.map((e) => activeCols.map((c) => c.cell(e)))

  const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
  downloadFile(csv, `balance_${filters.year || 'todos'}.csv`, 'text/csv')
}

function exportToPDF(data: BalanceEntry[]) {
  const colDefs = buildExporterColumns(exportColumns)
  const yearLabel = String(filters.year || 'Todos los años')
  const html = buildBalanceExportPdfHtml(data, colDefs, yearLabel, summary.value)
  printExportHTML(html, () => toast.error(t('toast.printFailed')))
}

function exportResumen() {
  if (exportFormat.value === 'excel') {
    exportResumenExcel()
  } else {
    exportResumenPDF()
  }
}

function buildTotalesLines(s: typeof summary.value): string[] {
  return [
    `TOTAL INGRESOS;+${s.totalIngresos.toFixed(2)}€;;`,
    `TOTAL GASTOS;;-${s.totalGastos.toFixed(2)}€;`,
    `BALANCE NETO;;;${s.balanceNeto.toFixed(2)}€`,
    '',
  ]
}

function buildDesgloseLines(s: typeof summary.value): string[] {
  const lines = ['DESGLOSE POR RAZÓN;;;']
  for (const [key, label] of Object.entries(BALANCE_REASONS)) {
    const data = s.byReason[key]
    if (!data) continue
    const neto = (data.ingresos || 0) - (data.gastos || 0)
    lines.push(
      `${label};+${(data.ingresos || 0).toFixed(2)}€;-${(data.gastos || 0).toFixed(2)}€;${neto.toFixed(2)}€`,
    )
  }
  lines.push('')
  return lines
}

function buildMensualLines(monthly: [string, { ingresos: number; gastos: number }][]): string[] {
  const lines = ['DESGLOSE MENSUAL;;;']
  for (const [month, data] of monthly) {
    const neto = data.ingresos - data.gastos
    lines.push(
      `${month};+${data.ingresos.toFixed(2)}€;-${data.gastos.toFixed(2)}€;${neto.toFixed(2)}€`,
    )
  }
  return lines
}

function exportResumenExcel() {
  const lines: string[] = ['Concepto;Ingresos;Gastos;Neto']
  if (resumenOptions.totales) lines.push(...buildTotalesLines(summary.value))
  if (resumenOptions.desglose) lines.push(...buildDesgloseLines(summary.value))
  if (resumenOptions.mensual) lines.push(...buildMensualLines(monthlyBreakdown.value))
  downloadFile(lines.join('\n'), `resumen_balance_${filters.year || 'todos'}.csv`, 'text/csv')
}

function exportResumenPDF() {
  const yearLabel = String(filters.year || 'Todos los años')
  const sections = buildExporterResumenSections(resumenOptions, summary.value, monthlyBreakdown.value)
  const html = buildResumenExportPdfHtml(yearLabel, sections)
  printExportHTML(html, () => toast.error(t('toast.printFailed')))
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
            <label><input v-model="exportFormat" type="radio" value="pdf" /> PDF (Imprimir)</label>
            <label><input v-model="exportFormat" type="radio" value="excel" /> Excel (CSV)</label>
          </div>
        </div>

        <div class="option-group">
          <label class="option-label">Columnas a incluir:</label>
          <div class="checkbox-grid">
            <label><input v-model="exportColumns.tipo" type="checkbox" /> Tipo</label>
            <label><input v-model="exportColumns.fecha" type="checkbox" /> Fecha</label>
            <label><input v-model="exportColumns.razon" type="checkbox" /> Razón</label>
            <label><input v-model="exportColumns.detalle" type="checkbox" /> Detalle</label>
            <label><input v-model="exportColumns.importe" type="checkbox" /> Importe</label>
            <label><input v-model="exportColumns.estado" type="checkbox" /> Estado</label>
            <label><input v-model="exportColumns.notas" type="checkbox" /> Notas</label>
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
              ><input v-model="resumenOptions.totales" type="checkbox" /> Totales
              (Ingresos/Gastos/Balance)</label
            >
            <label
              ><input v-model="resumenOptions.desglose" type="checkbox" /> Desglose por Razón</label
            >
            <label
              ><input v-model="resumenOptions.mensual" type="checkbox" /> Desglose Mensual</label
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
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.tool-header {
  padding: var(--spacing-4) var(--spacing-5);
  background: var(--color-gray-50);
  border-bottom: 1px solid var(--color-gray-200);
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
  gap: var(--spacing-4);
  padding: var(--spacing-4) var(--spacing-5);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--color-gray-200);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.summary-item .label {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--color-gray-500);
  font-weight: 500;
}

.summary-item .value {
  font-size: 1rem;
  font-weight: 600;
}

.summary-item.positive .value {
  color: var(--color-success);
}

.summary-item.negative .value {
  color: var(--color-error);
}

/* Export Sections */
.export-sections {
  padding: var(--spacing-5);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.export-section {
  padding-bottom: var(--spacing-6);
  border-bottom: 1px solid var(--color-gray-200);
}

.export-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.export-section h3 {
  margin: 0 0 var(--spacing-2);
  font-size: 1rem;
  color: var(--color-gray-700);
}

.section-desc {
  margin: 0 0 var(--spacing-4);
  color: var(--color-gray-500);
  font-size: 0.85rem;
}

/* Filter Row */
.filter-row {
  display: flex;
  gap: var(--spacing-3);
  flex-wrap: wrap;
}

.select-input {
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  min-width: 10rem;
}

/* Option Groups */
.option-group {
  margin-bottom: var(--spacing-4);
}

.option-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-gray-700);
  margin-bottom: var(--spacing-2);
}

.radio-group,
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.radio-group.horizontal {
  flex-direction: row;
  gap: var(--spacing-5);
}

.radio-group label,
.checkbox-group label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--color-gray-700);
}

.radio-group input,
.checkbox-group input {
  margin: 0;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--spacing-2);
}

.checkbox-grid label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.85rem;
  cursor: pointer;
}

/* Buttons */
.btn {
  padding: 0.625rem var(--spacing-5);
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn:hover {
  background: var(--color-gray-50);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-secondary {
  background: var(--color-gray-500);
  color: var(--color-white);
  border: none;
}

.btn-secondary:hover {
  background: var(--color-gray-600);
}

.btn-lg {
  padding: var(--spacing-3) var(--spacing-6);
  font-size: 1rem;
  font-weight: 500;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile */
@media (max-width: 48em) {
  .preview-summary {
    gap: var(--spacing-3);
  }

  .summary-item {
    flex: 1;
    min-width: 5rem;
  }

  .radio-group.horizontal {
    flex-direction: column;
    gap: var(--spacing-2);
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
