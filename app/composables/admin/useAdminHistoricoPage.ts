/**
 * Page-level composable for admin/historico.vue
 * Orchestrates filters, sorting, modals, export, and formatting.
 * Does NOT call onMounted — the page is responsible for lifecycle hooks.
 */
import {
  useAdminHistorico,
  type HistoricoEntry,
  type HistoricoFilters,
  SALE_CATEGORIES,
} from '~/composables/admin/useAdminHistorico'

// ---------- Module-scoped types ----------

export type SortColumn = 'sale_date' | 'sale_price' | 'benefit' | 'brand'

export type ExportFormat = 'excel' | 'pdf'

export type ExportScope = 'all' | 'filtered'

export interface HistoricoPageFilters extends HistoricoFilters {
  type_id?: string | null
}

// ---------- Composable ----------

export function useAdminHistoricoPage() {
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

  // ---- Filters ----
  const filters = reactive<HistoricoPageFilters>({
    year: null,
    sale_category: null,
    subcategory_id: null,
    type_id: null,
    brand: null,
    search: '',
  })

  const categoryOptions = Object.entries(SALE_CATEGORIES) as [string, string][]

  function clearFilters() {
    filters.year = null
    filters.sale_category = null
    filters.subcategory_id = null
    filters.type_id = null
    filters.brand = null
    filters.search = ''
  }

  // ---- Column group toggles ----
  const showDocs = ref(false)
  const showTecnico = ref(false)
  const showAlquiler = ref(false)

  // ---- Sort ----
  const sortCol = ref<SortColumn>('sale_date')
  const sortAsc = ref(false)

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

  function toggleSort(col: SortColumn) {
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

  // ---- Fullscreen ----
  const isFullscreen = ref(false)
  const historicoSection = ref<HTMLElement | null>(null)

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

  // ---- Restore modal ----
  const showRestoreModal = ref(false)
  const restoreTarget = ref<HistoricoEntry | null>(null)
  const restoreConfirm = ref('')
  const canRestore = computed(() => restoreConfirm.value.toLowerCase() === 'restaurar')

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

  // ---- Delete modal ----
  const showDeleteModal = ref(false)
  const deleteTarget = ref<HistoricoEntry | null>(null)
  const deleteConfirm = ref('')
  const canDelete = computed(() => deleteConfirm.value.toLowerCase() === 'borrar')

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

  // ---- Detail modal ----
  const showDetailModal = ref(false)
  const detailEntry = ref<HistoricoEntry | null>(null)

  function openDetailModal(entry: HistoricoEntry) {
    detailEntry.value = entry
    showDetailModal.value = true
  }

  // ---- Export modal ----
  const showExportModal = ref(false)
  const exportFormat = ref<ExportFormat>('excel')
  const exportDataScope = ref<ExportScope>('filtered')

  function exportHistorico() {
    const dataToExport = (
      exportDataScope.value === 'all' ? [...entries.value] : [...sortedEntries.value]
    ) as HistoricoEntry[]

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
      'A\u00F1o',
      'Categor\u00EDa',
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
      e.sale_price ? `${e.sale_price.toFixed(2)}\u20AC` : '',
      e.total_cost ? `${e.total_cost.toFixed(2)}\u20AC` : '',
      e.benefit ? `${e.benefit.toFixed(2)}\u20AC` : '',
      e.benefit_percent ? `${e.benefit_percent}%` : '',
    ])

    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    downloadFile(csv, `historico_${filters.year || 'todos'}.csv`, 'text/csv')
  }

  function exportToPDF(data: HistoricoEntry[]) {
    let html = `<!DOCTYPE html><html><head><title>Hist\u00F3rico de Ventas - Tracciona</title>
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
    <p class="subtitle">Hist\u00F3rico de Ventas ${filters.year || 'Todos los a\u00F1os'}</p>
    <p class="date">Generado: ${new Date().toLocaleDateString('es-ES')} | Total: ${data.length} ventas</p>
    <table><thead><tr>
      <th>Marca</th><th>Modelo</th><th>A\u00F1o</th><th>Categor\u00EDa</th>
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

  // ---- Formatting helpers ----
  function fmt(val: number | null | undefined): string {
    if (val === null || val === undefined) return '\u2014'
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

  return {
    // Data layer pass-through
    entries,
    loading,
    saving,
    error,
    total,
    availableYears,
    availableBrands,
    summary,
    fetchEntries,

    // Filters
    filters,
    categoryOptions,
    clearFilters,

    // Column toggles
    showDocs,
    showTecnico,
    showAlquiler,

    // Sort
    sortCol,
    sortAsc,
    sortedEntries,
    toggleSort,
    getSortIcon,

    // Fullscreen
    isFullscreen,
    historicoSection,
    toggleFullscreen,
    onFullscreenChange,

    // Restore modal
    showRestoreModal,
    restoreTarget,
    restoreConfirm,
    canRestore,
    openRestoreModal,
    handleRestore,

    // Delete modal
    showDeleteModal,
    deleteTarget,
    deleteConfirm,
    canDelete,
    openDeleteModal,
    handleDelete,

    // Detail modal
    showDetailModal,
    detailEntry,
    openDetailModal,

    // Export modal
    showExportModal,
    exportFormat,
    exportDataScope,
    exportHistorico,

    // Formatting
    fmt,
    fmtDate,
  }
}
