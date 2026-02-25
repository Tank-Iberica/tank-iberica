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

// ─── Empty form helper ──────────────────────────────────────
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

  // ─── Monthly breakdown for export ────────────────────────
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
    if (sortCol.value !== col) return '\u2195'
    return sortAsc.value ? '\u2191' : '\u2193'
  }

  // ─── Fullscreen ──────────────────────────────────────────
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      balanceSection.value?.requestFullscreen()
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
      exportToExcel(dataToExport)
    } else {
      exportToPDF(dataToExport)
    }
    showExportModal.value = false
  }

  function exportToExcel(data: BalanceEntry[]) {
    const headers: string[] = []
    if (exportColumns.tipo) headers.push('Tipo')
    if (exportColumns.fecha) headers.push('Fecha')
    if (exportColumns.razon) headers.push('Raz\u00F3n')
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
        row.push(`${e.tipo === 'ingreso' ? '+' : '-'}${e.importe.toFixed(2)}\u20AC`)
      if (exportColumns.estado) row.push(BALANCE_STATUS_LABELS[e.estado])
      if (exportColumns.notas) row.push(e.notas || '')
      return row
    })

    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    downloadFile(csv, `balance_${filters.year || 'todos'}.csv`, 'text/csv')
  }

  function exportToPDF(data: BalanceEntry[]) {
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
    <p class="subtitle">Balance ${filters.year || 'Todos los a\u00F1os'}</p>
    <p class="date">Generado: ${new Date().toLocaleDateString('es-ES')}</p>
    <table><thead><tr>`

    if (exportColumns.tipo) html += '<th>Tipo</th>'
    if (exportColumns.fecha) html += '<th>Fecha</th>'
    if (exportColumns.razon) html += '<th>Raz\u00F3n</th>'
    if (exportColumns.detalle) html += '<th>Detalle</th>'
    if (exportColumns.importe) html += '<th>Importe</th>'
    if (exportColumns.estado) html += '<th>Estado</th>'
    if (exportColumns.notas) html += '<th>Notas</th>'

    html += '</tr></thead><tbody>'

    for (const e of data) {
      html += '<tr>'
      if (exportColumns.tipo)
        html += `<td class="${e.tipo}">${e.tipo === 'ingreso' ? '\u2191' : '\u2193'}</td>`
      if (exportColumns.fecha) html += `<td>${e.fecha}</td>`
      if (exportColumns.razon) html += `<td>${BALANCE_REASONS[e.razon]}</td>`
      if (exportColumns.detalle) html += `<td>${e.detalle || ''}</td>`
      if (exportColumns.importe)
        html += `<td class="${e.tipo}">${e.tipo === 'ingreso' ? '+' : '-'}${e.importe.toFixed(2)}\u20AC</td>`
      if (exportColumns.estado) html += `<td>${BALANCE_STATUS_LABELS[e.estado]}</td>`
      if (exportColumns.notas) html += `<td>${e.notas || ''}</td>`
      html += '</tr>'
    }

    html += `</tbody></table>
    <div class="totals">
      <p><strong>Total Ingresos:</strong> <span class="ingreso">+${summary.value.totalIngresos.toFixed(2)}\u20AC</span></p>
      <p><strong>Total Gastos:</strong> <span class="gasto">-${summary.value.totalGastos.toFixed(2)}\u20AC</span></p>
      <p><strong>Balance Neto:</strong> <strong>${summary.value.balanceNeto.toFixed(2)}\u20AC</strong></p>
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
      lines.push(`TOTAL INGRESOS;+${summary.value.totalIngresos.toFixed(2)}\u20AC;;`)
      lines.push(`TOTAL GASTOS;;-${summary.value.totalGastos.toFixed(2)}\u20AC;`)
      lines.push(`BALANCE NETO;;;${summary.value.balanceNeto.toFixed(2)}\u20AC`)
      lines.push('')
    }

    if (resumenOptions.desglose) {
      lines.push('DESGLOSE POR RAZ\u00D3N;;;')
      for (const [key, label] of Object.entries(BALANCE_REASONS)) {
        const data = summary.value.byReason[key]
        if (data) {
          const neto = (data.ingresos || 0) - (data.gastos || 0)
          lines.push(
            `${label};+${(data.ingresos || 0).toFixed(2)}\u20AC;-${(data.gastos || 0).toFixed(2)}\u20AC;${neto.toFixed(2)}\u20AC`,
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
          `${month};+${data.ingresos.toFixed(2)}\u20AC;-${data.gastos.toFixed(2)}\u20AC;${neto.toFixed(2)}\u20AC`,
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
    <p class="subtitle">Resumen Balance ${filters.year || 'Todos los a\u00F1os'}</p>
    <p class="date">Generado: ${new Date().toLocaleDateString('es-ES')}</p>`

    if (resumenOptions.totales) {
      html += `<h2>Totales</h2>
      <table>
        <tr><td>Total Ingresos</td><td class="positive">+${summary.value.totalIngresos.toFixed(2)}\u20AC</td></tr>
        <tr><td>Total Gastos</td><td class="negative">-${summary.value.totalGastos.toFixed(2)}\u20AC</td></tr>
        <tr><td><strong>Balance Neto</strong></td><td class="${summary.value.balanceNeto >= 0 ? 'positive' : 'negative'}"><strong>${summary.value.balanceNeto.toFixed(2)}\u20AC</strong></td></tr>
      </table>`
    }

    if (resumenOptions.desglose) {
      html += `<h2>Desglose por Raz\u00F3n</h2>
      <table><thead><tr><th>Raz\u00F3n</th><th>Ingresos</th><th>Gastos</th><th>Neto</th></tr></thead><tbody>`
      for (const [key, label] of Object.entries(BALANCE_REASONS)) {
        const data = summary.value.byReason[key]
        if (data && (data.ingresos > 0 || data.gastos > 0)) {
          const neto = (data.ingresos || 0) - (data.gastos || 0)
          html += `<tr><td>${label}</td><td class="positive">+${(data.ingresos || 0).toFixed(2)}\u20AC</td><td class="negative">-${(data.gastos || 0).toFixed(2)}\u20AC</td><td class="${neto >= 0 ? 'positive' : 'negative'}">${neto.toFixed(2)}\u20AC</td></tr>`
        }
      }
      html += '</tbody></table>'
    }

    if (resumenOptions.mensual) {
      html += `<h2>Desglose Mensual</h2>
      <table><thead><tr><th>Mes</th><th>Ingresos</th><th>Gastos</th><th>Neto</th></tr></thead><tbody>`
      for (const [month, data] of monthlyBreakdown.value) {
        const neto = data.ingresos - data.gastos
        html += `<tr><td>${month}</td><td class="positive">+${data.ingresos.toFixed(2)}\u20AC</td><td class="negative">-${data.gastos.toFixed(2)}\u20AC</td><td class="${neto >= 0 ? 'positive' : 'negative'}">${neto.toFixed(2)}\u20AC</td></tr>`
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
      toast.error('toast.printBlocked')
      return
    }

    doc.open()
    doc.write(html)
    doc.close()

    iframe.onload = () => {
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
        } else {
          toast.error('toast.printBlocked')
        }
      }
    }

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
