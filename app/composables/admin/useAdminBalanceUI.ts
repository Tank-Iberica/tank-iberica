/**
 * Admin Balance UI Composable
 * UI-specific logic: filters, modals, sort, export, chart data, view toggles, format helpers.
 * The data layer (CRUD, entries, summary) lives in useAdminBalance.
 */
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
import { useToast } from '~/composables/useToast'

// ─── Resumen PDF section builders ───────────────────────────
function buildResumenTotalesHtml(s: {
  totalIngresos: number
  totalGastos: number
  balanceNeto: number
}): string {
  const netoClass = s.balanceNeto >= 0 ? 'positive' : 'negative'
  return `<h2>Totales</h2>
  <table>
    <tr><td>Total Ingresos</td><td class="positive">+${s.totalIngresos.toFixed(2)}\u20AC</td></tr>
    <tr><td>Total Gastos</td><td class="negative">-${s.totalGastos.toFixed(2)}\u20AC</td></tr>
    <tr><td><strong>Balance Neto</strong></td><td class="${netoClass}"><strong>${s.balanceNeto.toFixed(2)}\u20AC</strong></td></tr>
  </table>`
}

function buildResumenDesgloseHtml(
  byReason: Record<string, { ingresos: number; gastos: number }>,
): string {
  let html = `<h2>Desglose por Raz\u00F3n</h2>
  <table><thead><tr><th>Raz\u00F3n</th><th>Ingresos</th><th>Gastos</th><th>Neto</th></tr></thead><tbody>`
  for (const [key, label] of Object.entries(BALANCE_REASONS)) {
    const data = byReason[key]
    if (!data || (data.ingresos <= 0 && data.gastos <= 0)) continue
    const neto = (data.ingresos || 0) - (data.gastos || 0)
    const netoClass = neto >= 0 ? 'positive' : 'negative'
    html += `<tr><td>${label}</td><td class="positive">+${(data.ingresos || 0).toFixed(2)}\u20AC</td><td class="negative">-${(data.gastos || 0).toFixed(2)}\u20AC</td><td class="${netoClass}">${neto.toFixed(2)}\u20AC</td></tr>`
  }
  return html + '</tbody></table>'
}

function buildResumenMensualHtml(
  monthly: Map<string, { ingresos: number; gastos: number }>,
): string {
  let html = `<h2>Desglose Mensual</h2>
  <table><thead><tr><th>Mes</th><th>Ingresos</th><th>Gastos</th><th>Neto</th></tr></thead><tbody>`
  for (const [month, data] of monthly) {
    const neto = data.ingresos - data.gastos
    const netoClass = neto >= 0 ? 'positive' : 'negative'
    html += `<tr><td>${month}</td><td class="positive">+${data.ingresos.toFixed(2)}\u20AC</td><td class="negative">-${data.gastos.toFixed(2)}\u20AC</td><td class="${netoClass}">${neto.toFixed(2)}\u20AC</td></tr>`
  }
  return html + '</tbody></table>'
}

function buildResumenSections(
  opts: Record<string, boolean>,
  summaryData: {
    totalIngresos: number
    totalGastos: number
    balanceNeto: number
    byReason: Record<string, { ingresos: number; gastos: number }>
  },
  monthly: Map<string, { ingresos: number; gastos: number }>,
): string {
  const parts: string[] = []
  if (opts.totales) parts.push(buildResumenTotalesHtml(summaryData))
  if (opts.desglose) parts.push(buildResumenDesgloseHtml(summaryData.byReason))
  if (opts.mensual) parts.push(buildResumenMensualHtml(monthly))
  return parts.join('')
}

// ─── Column definition builder for PDF/Excel exports ───────
interface BalanceColumnDef {
  header: string
  cell: (e: BalanceEntry) => string
}

const ALL_BALANCE_COLS: Array<{ key: string } & BalanceColumnDef> = [
  {
    key: 'tipo',
    header: 'Tipo',
    cell: (e) => `<td class="${e.tipo}">${e.tipo === 'ingreso' ? '\u2191' : '\u2193'}</td>`,
  },
  { key: 'fecha', header: 'Fecha', cell: (e) => `<td>${e.fecha}</td>` },
  { key: 'razon', header: 'Raz\u00F3n', cell: (e) => `<td>${BALANCE_REASONS[e.razon]}</td>` },
  { key: 'detalle', header: 'Detalle', cell: (e) => `<td>${e.detalle || ''}</td>` },
  {
    key: 'importe',
    header: 'Importe',
    cell: (e) =>
      `<td class="${e.tipo}">${e.tipo === 'ingreso' ? '+' : '-'}${e.importe.toFixed(2)}\u20AC</td>`,
  },
  { key: 'estado', header: 'Estado', cell: (e) => `<td>${BALANCE_STATUS_LABELS[e.estado]}</td>` },
  { key: 'notas', header: 'Notas', cell: (e) => `<td>${e.notas || ''}</td>` },
]

function buildBalanceColumnDefs(cols: Record<string, boolean>): BalanceColumnDef[] {
  return ALL_BALANCE_COLS.filter((c) => cols[c.key])
}

// ─── Resumen Excel section builders ─────────────────────────
function buildResumenTotalesLines(s: {
  totalIngresos: number
  totalGastos: number
  balanceNeto: number
}): string[] {
  return [
    `TOTAL INGRESOS;+${s.totalIngresos.toFixed(2)}\u20AC;;`,
    `TOTAL GASTOS;;-${s.totalGastos.toFixed(2)}\u20AC;`,
    `BALANCE NETO;;;${s.balanceNeto.toFixed(2)}\u20AC`,
    '',
  ]
}

function buildResumenDesgloseLines(s: {
  byReason: Record<string, { ingresos: number; gastos: number }>
}): string[] {
  const lines = ['DESGLOSE POR RAZ\u00D3N;;;']
  for (const [key, label] of Object.entries(BALANCE_REASONS)) {
    const data = s.byReason[key]
    if (!data) continue
    const neto = (data.ingresos || 0) - (data.gastos || 0)
    lines.push(
      `${label};+${(data.ingresos || 0).toFixed(2)}\u20AC;-${(data.gastos || 0).toFixed(2)}\u20AC;${neto.toFixed(2)}\u20AC`,
    )
  }
  lines.push('')
  return lines
}

function buildResumenMensualLines(
  monthly: [string, { ingresos: number; gastos: number }][],
): string[] {
  const lines = ['DESGLOSE MENSUAL;;;']
  for (const [month, data] of monthly) {
    const neto = data.ingresos - data.gastos
    lines.push(
      `${month};+${data.ingresos.toFixed(2)}\u20AC;-${data.gastos.toFixed(2)}\u20AC;${neto.toFixed(2)}\u20AC`,
    )
  }
  return lines
}

// ─── PDF styles (shared between balance & resumen) ──────────
const BALANCE_PDF_STYLE = `
  body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 12px; margin: 0; color: #1F2A2A; }
  .header { background: linear-gradient(135deg, #1A3238 0%, #23424A 100%); color: white; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; }
  .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 1px; }
  .header-accent { width: 45px; height: 2px; background: #7FD1C8; margin-top: 6px; }
  .header-info { font-size: 9px; text-align: right; line-height: 1.8; opacity: 0.85; }
  .content { padding: 20px 24px; }
  .subtitle { font-size: 14px; color: #23424A; font-weight: 700; margin: 0 0 4px; }
  .date { font-size: 11px; color: #4A5A5A; margin: 0 0 16px; }
  .footer { background: #23424A; color: white; text-align: center; padding: 10px; font-size: 9px; margin-top: 24px; }
  @media print { body { margin: 0; } .footer { position: fixed; bottom: 0; left: 0; right: 0; } }`

const BALANCE_PDF_HEADER = `<div class="header">
  <div><h1>TRACCIONA</h1><div class="header-accent"></div></div>
  <div class="header-info">${useSiteUrl().replace('https://', '').replace('http://', '').toUpperCase()}<br>info@${useSiteUrl().replace('https://', '').replace('http://', '')}<br>+34 645 779 594</div>
</div>`

function buildBalancePdfHtml(
  data: BalanceEntry[],
  colDefs: BalanceColumnDef[],
  yearLabel: string,
  totals: { totalIngresos: number; totalGastos: number; balanceNeto: number },
): string {
  const tableStyle = `
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { background: #23424A; color: white; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
  td { border-bottom: 1px solid #e5e7eb; padding: 7px 10px; text-align: left; font-size: 11px; }
  tr:nth-child(even) td { background: #f9fafb; }
  .ingreso { color: #059669; font-weight: 600; }
  .gasto { color: #dc2626; font-weight: 600; }
  .totals { margin-top: 20px; padding: 16px; background: #f3f4f6; border-radius: 8px; }
  .totals p { margin: 4px 0; font-size: 12px; }`

  const headers = colDefs.map((c) => `<th>${c.header}</th>`).join('')
  const rows = data.map((e) => '<tr>' + colDefs.map((c) => c.cell(e)).join('') + '</tr>').join('')

  return `<!DOCTYPE html><html><head><title>Balance ${yearLabel} - Tracciona</title>
  <style>${BALANCE_PDF_STYLE}${tableStyle}</style>
  </head><body>${BALANCE_PDF_HEADER}
  <div class="content">
  <p class="subtitle">Balance ${yearLabel}</p>
  <p class="date">Generado: ${new Date().toLocaleDateString('es-ES')}</p>
  <table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>
  <div class="totals">
    <p><strong>Total Ingresos:</strong> <span class="ingreso">+${totals.totalIngresos.toFixed(2)}\u20AC</span></p>
    <p><strong>Total Gastos:</strong> <span class="gasto">-${totals.totalGastos.toFixed(2)}\u20AC</span></p>
    <p><strong>Balance Neto:</strong> <strong>${totals.balanceNeto.toFixed(2)}\u20AC</strong></p>
  </div></div>
  <div class="footer">TRACCIONA.COM</div></body></html>`
}

function buildResumenPdfHtml(yearLabel: string, resumenSectionsHtml: string): string {
  const tableStyle = `
  h2 { font-size: 13px; color: #23424A; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #23424A; color: white; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
  td { border-bottom: 1px solid #e5e7eb; padding: 7px 10px; text-align: right; font-size: 11px; }
  td:first-child { text-align: left; }
  tr:nth-child(even) td { background: #f9fafb; }
  .positive { color: #059669; font-weight: 600; }
  .negative { color: #dc2626; font-weight: 600; }`

  return `<!DOCTYPE html><html><head><title>Resumen Balance - Tracciona</title>
  <style>${BALANCE_PDF_STYLE}${tableStyle}</style>
  </head><body>${BALANCE_PDF_HEADER}
  <div class="content">
  <p class="subtitle">Resumen Balance ${yearLabel}</p>
  <p class="date">Generado: ${new Date().toLocaleDateString('es-ES')}</p>
  ${resumenSectionsHtml}</div>
  <div class="footer">TRACCIONA.COM</div></body></html>`
}

/** Print HTML via hidden iframe with fallback to popup window. */
function printHTMLContent(html: string, onError: () => void): void {
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
  doc.write(html) // NOSONAR typescript:S1874
  doc.close()

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch {
      const win = globalThis.open('', '_blank')
      if (win) {
        win.document.write(html) // NOSONAR typescript:S1874
        win.document.close()
        win.focus()
        win.print()
      } else {
        onError()
      }
    }
  }

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch {
      /* Silent fail - onload will handle it */
    }
  }, 100)
}

// ─── Empty form helper ──────────────────────────────────────
function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function getEmptyForm(): BalanceFormData {
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
  } as BalanceFormData
}

// ─── Format helpers ─────────────────────────────────────────
export function fmt(val: number | null | undefined): string {
  if (val === null || val === undefined) return '\u2014'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(val)
}

export function fmtDate(date: string): string {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function fmtPercent(val: number | null): string {
  if (val === null) return '\u2014'
  return `${val > 0 ? '+' : ''}${val}%`
}

// ─── Composable ─────────────────────────────────────────────
export function useAdminBalanceUI() {
  const toast = useToast()

  // ─── Data layer ──────────────────────────────────────────
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

  // ─── Filters ─────────────────────────────────────────────
  const filters = reactive<BalanceFilters & { type_id?: string | null }>({
    year: new Date().getFullYear(),
    tipo: null,
    razon: null,
    estado: null,
    subcategory_id: null,
    type_id: null,
    search: '',
  })

  // ─── Modal state ─────────────────────────────────────────
  const showModal = ref(false)
  const editingId = ref<string | null>(null)
  const formData = ref<BalanceFormData>(getEmptyForm())

  // ─── Delete modal ────────────────────────────────────────
  const showDeleteModal = ref(false)
  const deleteTarget = ref<BalanceEntry | null>(null)
  const deleteConfirm = ref('')
  const canDelete = computed(() => deleteConfirm.value.toLowerCase() === 'borrar')

  // ─── Export modals ───────────────────────────────────────
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

  // ─── View state ──────────────────────────────────────────
  const showDesglose = ref(false)
  const showCharts = ref(false)
  const chartType = ref<'bar' | 'pie'>('bar')
  const isFullscreen = ref(false)
  const balanceSection = ref<HTMLElement | null>(null)

  // ─── Sort ────────────────────────────────────────────────
  const sortCol = ref<'fecha' | 'importe' | 'tipo' | 'razon'>('fecha')
  const sortAsc = ref(false)

  const SORT_COMPARATORS: Record<string, (a: BalanceEntry, b: BalanceEntry) => number> = {
    fecha: (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    importe: (a, b) => a.importe - b.importe,
    tipo: (a, b) => a.tipo.localeCompare(b.tipo),
    razon: (a, b) => a.razon.localeCompare(b.razon),
  }

  const sortedEntries = computed(() => {
    const arr = [...entries.value]
    const cmpFn = SORT_COMPARATORS[sortCol.value]
    if (!cmpFn) return arr
    arr.sort((a, b) => (sortAsc.value ? cmpFn(a, b) : -cmpFn(a, b)))
    return arr
  })

  // ─── Monthly breakdown for export ────────────────────────
  const monthlyBreakdown = computed(() => {
    const months: Record<string, { ingresos: number; gastos: number }> = {}
    for (const e of entries.value) {
      const month = e.fecha.substring(0, 7) // YYYY-MM
      months[month] ??= { ingresos: 0, gastos: 0 }
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
    if (sortCol.value !== col) return '\u2195'
    return sortAsc.value ? '\u2191' : '\u2193'
  }

  // ─── Fullscreen ──────────────────────────────────────────
  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
      isFullscreen.value = false
    } else {
      balanceSection.value?.requestFullscreen()
      isFullscreen.value = true
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

  // ─── Modal actions ───────────────────────────────────────
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
    } as BalanceFormData
    showModal.value = true
  }

  async function handleSave() {
    if (!formData.value.importe || formData.value.importe <= 0) {
      toast.error('toast.amountRequired')
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

  // ─── Export functions ────────────────────────────────────
  function exportBalance() {
    const dataToExport = exportDataScope.value === 'all' ? entries.value : sortedEntries.value

    if (exportFormat.value === 'excel') {
      exportToExcel(dataToExport as BalanceEntry[])
    } else {
      exportToPDF(dataToExport as BalanceEntry[])
    }
    showExportModal.value = false
  }

  const EXCEL_COL_DEFS: Array<{
    key: keyof typeof exportColumns
    header: string
    cell: (e: BalanceEntry) => string
  }> = [
    { key: 'tipo', header: 'Tipo', cell: (e) => (e.tipo === 'ingreso' ? 'Ingreso' : 'Gasto') },
    { key: 'fecha', header: 'Fecha', cell: (e) => e.fecha },
    { key: 'razon', header: 'Raz\u00F3n', cell: (e) => BALANCE_REASONS[e.razon] },
    { key: 'detalle', header: 'Detalle', cell: (e) => e.detalle || '' },
    {
      key: 'importe',
      header: 'Importe',
      cell: (e) => `${e.tipo === 'ingreso' ? '+' : '-'}${e.importe.toFixed(2)}\u20AC`,
    },
    { key: 'estado', header: 'Estado', cell: (e) => BALANCE_STATUS_LABELS[e.estado] },
    { key: 'notas', header: 'Notas', cell: (e) => e.notas || '' },
  ]

  function exportToExcel(data: BalanceEntry[]) {
    const activeCols = EXCEL_COL_DEFS.filter((c) => exportColumns[c.key])
    const headers = activeCols.map((c) => c.header)
    const rows = data.map((e) => activeCols.map((c) => c.cell(e)))
    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    downloadFile(csv, `balance_${filters.year || 'todos'}.csv`, 'text/csv')
  }

  function exportToPDF(data: BalanceEntry[]) {
    const colDefs = buildBalanceColumnDefs(exportColumns)
    const yearLabel = String(filters.year || 'Todos los a\u00F1os')
    const html = buildBalancePdfHtml(data, colDefs, yearLabel, summary.value)
    printHTMLContent(html, () => toast.error('toast.printBlocked'))
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
    if (resumenOptions.totales) lines.push(...buildResumenTotalesLines(summary.value))
    if (resumenOptions.desglose) lines.push(...buildResumenDesgloseLines(summary.value))
    if (resumenOptions.mensual) lines.push(...buildResumenMensualLines(monthlyBreakdown.value))
    downloadFile(lines.join('\n'), `resumen_balance_${filters.year || 'todos'}.csv`, 'text/csv')
  }

  function exportResumenPDF() {
    const yearLabel = String(filters.year || 'Todos los a\u00F1os')
    const sections = buildResumenSections(
      resumenOptions,
      summary.value,
      new Map(monthlyBreakdown.value),
    )
    const html = buildResumenPdfHtml(yearLabel, sections)
    printHTMLContent(html, () => toast.error('toast.printBlocked'))
  }

  // ─── Clear filters ───────────────────────────────────────
  function clearFilters() {
    filters.year = null
    filters.tipo = null
    filters.razon = null
    filters.estado = null
    filters.subcategory_id = null
    filters.type_id = null
    filters.search = ''
  }

  // ─── Chart data ──────────────────────────────────────────
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

    for (const [name, data] of Object.entries(
      (summary.value as unknown as { bySubcategory: Record<string, { beneficio: number }> })
        .bySubcategory || {},
    )) {
      if (data.beneficio !== 0) {
        labels.push(name)
        beneficios.push(data.beneficio)
      }
    }
    return { labels, beneficios }
  })

  // ─── Reason / status options ─────────────────────────────
  const reasonOptions = Object.entries(BALANCE_REASONS) as [BalanceReason, string][]
  const statusOptions = Object.entries(BALANCE_STATUS_LABELS) as [BalanceStatus, string][]

  return {
    // Data layer (re-exported)
    entries,
    loading,
    saving,
    error,
    total,
    availableYears,
    summary,
    fetchEntries,
    calculateProfit,

    // Related data
    types,
    fetchTypes,
    subcategories,
    fetchSubcategories,
    vehicles,
    fetchVehicles,

    // Filters
    filters,
    clearFilters,

    // Modal state
    showModal,
    editingId,
    formData,
    showDeleteModal,
    deleteTarget,
    deleteConfirm,
    canDelete,

    // Export state
    showExportModal,
    showExportResumenModal,
    exportFormat,
    exportDataScope,
    exportColumns,
    resumenOptions,

    // View state
    showDesglose,
    showCharts,
    chartType,
    isFullscreen,
    balanceSection,

    // Sort
    sortCol,
    sortAsc,
    sortedEntries,
    toggleSort,
    getSortIcon,

    // Modal actions
    openNewModal,
    openEditModal,
    handleSave,
    openDeleteModal,
    handleDelete,

    // Export
    exportBalance,
    exportResumen,

    // Chart data
    chartRazonData,
    chartSubcatData,

    // Options
    reasonOptions,
    statusOptions,

    // Fullscreen
    toggleFullscreen,
  }
}
