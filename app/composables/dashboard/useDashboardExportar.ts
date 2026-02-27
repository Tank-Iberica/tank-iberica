/**
 * useDashboardExportar
 *
 * All reactive state, computed properties, and export logic for the
 * Catalog Export page (/dashboard/herramientas/exportar).
 *
 * The composable does NOT call onMounted — expose an init() function instead.
 */

// ────────────────────────────────────────────
// Types (module-scoped — only used by this feature)
// ────────────────────────────────────────────

export interface ExportVehicle {
  id: string
  brand: string
  model: string
  year: number | null
  km: number | null
  price: number | null
  category: string
  location: string | null
  status: string
  description_es: string | null
  description_en: string | null
  vehicle_images: { url: string; position: number }[]
  subcategories: {
    name?: Record<string, string> | null
    name_es: string
    name_en: string | null
  } | null
}

export type CsvColumn =
  | 'brand'
  | 'model'
  | 'year'
  | 'km'
  | 'price'
  | 'category'
  | 'location'
  | 'status'

export interface CsvColumnOption {
  key: CsvColumn
  label: string
  enabled: boolean
}

// ────────────────────────────────────────────
// Composable
// ────────────────────────────────────────────

export function useDashboardExportar() {
  const { t, locale } = useI18n()
  const supabase = useSupabaseClient()
  const { userId } = useAuth()
  const { dealerProfile, loadDealer } = useDealerDashboard()
  const { canExport, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

  // ---------- State ----------

  const vehicles = ref<ExportVehicle[]>([])
  const loading = ref(false)
  const exporting = ref(false)
  const error = ref<string | null>(null)

  // Filters
  const statusFilter = ref<'all' | 'published'>('published')
  const categoryFilter = ref<string | null>(null)

  // Export format
  const exportFormat = ref<'csv' | 'pdf'>('csv')

  // CSV column selection
  const csvColumns = ref<CsvColumnOption[]>([
    { key: 'brand', label: '', enabled: true },
    { key: 'model', label: '', enabled: true },
    { key: 'year', label: '', enabled: true },
    { key: 'km', label: '', enabled: true },
    { key: 'price', label: '', enabled: true },
    { key: 'category', label: '', enabled: true },
    { key: 'location', label: '', enabled: true },
    { key: 'status', label: '', enabled: true },
  ])

  // ---------- Computed ----------

  const filteredVehicles = computed(() => {
    let result = vehicles.value

    if (statusFilter.value === 'published') {
      result = result.filter((v) => v.status === 'published')
    }

    if (categoryFilter.value) {
      result = result.filter((v) => v.category === categoryFilter.value)
    }

    return result
  })

  const vehicleCount = computed(() => filteredVehicles.value.length)

  const availableCategories = computed(() => {
    const cats = new Set<string>()
    for (const v of vehicles.value) {
      if (v.category) cats.add(v.category)
    }
    return Array.from(cats).sort()
  })

  const selectedColumnsCount = computed(() => csvColumns.value.filter((c) => c.enabled).length)

  // ---------- Data loading ----------

  async function loadVehicles() {
    loading.value = true
    error.value = null

    try {
      const dealer = dealerProfile.value || (await loadDealer())
      if (!dealer) {
        error.value = t('dashboard.tools.export.errorNoDealer')
        return
      }

      const { data, error: err } = await supabase
        .from('vehicles')
        .select(
          'id, brand, model, year, price, category, location, status, description_es, description_en, vehicle_images(url, position), subcategories(name, name_es, name_en)',
        )
        .eq('dealer_id', dealer.id)
        .order('created_at', { ascending: false })

      if (err) throw err

      // Map km from attributes_json if present
      const raw = (data || []) as unknown as Array<
        ExportVehicle & { attributes_json?: Record<string, unknown> }
      >
      vehicles.value = raw.map((v) => ({
        ...v,
        km: (v.attributes_json?.km as number) ?? null,
      }))
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || t('dashboard.tools.export.errorLoading')
    } finally {
      loading.value = false
    }
  }

  // ---------- CSV helpers ----------

  function getColumnLabel(key: CsvColumn): string {
    const labels: Record<CsvColumn, string> = {
      brand: t('dashboard.tools.export.columns.brand'),
      model: t('dashboard.tools.export.columns.model'),
      year: t('dashboard.tools.export.columns.year'),
      km: t('dashboard.tools.export.columns.km'),
      price: t('dashboard.tools.export.columns.price'),
      category: t('dashboard.tools.export.columns.category'),
      location: t('dashboard.tools.export.columns.location'),
      status: t('dashboard.tools.export.columns.status'),
    }
    return labels[key]
  }

  function getCellValue(vehicle: ExportVehicle, key: CsvColumn): string {
    switch (key) {
      case 'brand':
        return vehicle.brand || ''
      case 'model':
        return vehicle.model || ''
      case 'year':
        return vehicle.year ? String(vehicle.year) : ''
      case 'km':
        return vehicle.km ? String(vehicle.km) : ''
      case 'price':
        return vehicle.price ? vehicle.price.toFixed(2) : ''
      case 'category':
        if (vehicle.subcategories) {
          const jsonb = vehicle.subcategories.name?.[locale.value]
          if (jsonb) return jsonb
          return (
            (locale.value === 'en'
              ? vehicle.subcategories.name_en
              : vehicle.subcategories.name_es) || vehicle.category
          )
        }
        return vehicle.category
      case 'location':
        return vehicle.location || ''
      case 'status':
        return vehicle.status
      default:
        return ''
    }
  }

  // ---------- CSV Export ----------

  async function exportCSV() {
    exporting.value = true

    try {
      const ExcelJS = await import('exceljs')

      const enabledCols = csvColumns.value.filter((c) => c.enabled)
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Catalog')

      // Set columns with headers
      worksheet.columns = enabledCols.map((c) => ({
        header: getColumnLabel(c.key),
        key: c.key,
        width: 15,
      }))

      // Add data rows
      filteredVehicles.value.forEach((v) => {
        const rowData: Record<string, string> = {}
        enabledCols.forEach((c) => {
          rowData[c.key] = getCellValue(v, c.key)
        })
        worksheet.addRow(rowData)
      })

      const companyName = dealerProfile.value?.company_name || 'catalog'
      const fileName = `${companyName.replace(/\s+/g, '_')}_catalog_${new Date().toISOString().split('T')[0]}.csv`

      // Generate CSV buffer and download
      const buffer = await workbook.csv.writeBuffer()
      const blob = new Blob([buffer], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : t('dashboard.tools.export.errorExport')
    } finally {
      exporting.value = false
    }
  }

  // ---------- PDF Export ----------

  async function exportPDF() {
    exporting.value = true

    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = 210
      const pageHeight = 297
      const margin = 20
      const contentWidth = pageWidth - margin * 2

      const dealer = dealerProfile.value
      const companyName = dealer?.company_name || 'Tracciona'
      const profileUrl = dealer?.slug
        ? `https://tracciona.com/dealer/${dealer.slug}`
        : 'https://tracciona.com'

      // --- Cover page ---
      doc.setFillColor(35, 66, 74) // #23424A
      doc.rect(0, 0, pageWidth, pageHeight, 'F')

      // Company name centered
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(32)
      doc.text(companyName, pageWidth / 2, 100, { align: 'center' })

      // Subtitle
      doc.setFontSize(14)
      doc.text(t('dashboard.tools.export.pdfSubtitle'), pageWidth / 2, 120, { align: 'center' })

      // Vehicle count
      doc.setFontSize(12)
      doc.text(
        `${vehicleCount.value} ${t('dashboard.tools.export.pdfVehicles')}`,
        pageWidth / 2,
        140,
        { align: 'center' },
      )

      // Date
      doc.setFontSize(10)
      doc.text(
        new Date().toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        pageWidth / 2,
        155,
        { align: 'center' },
      )

      // Profile URL at bottom
      doc.setFontSize(9)
      doc.text(profileUrl, pageWidth / 2, pageHeight - 30, { align: 'center' })

      // --- Vehicle pages ---
      for (const vehicle of filteredVehicles.value) {
        doc.addPage()

        let yPos = margin

        // Header bar
        doc.setFillColor(35, 66, 74)
        doc.rect(0, 0, pageWidth, 15, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(10)
        doc.text(companyName, margin, 10)
        doc.text(profileUrl, pageWidth - margin, 10, { align: 'right' })

        yPos = 25

        // Vehicle image placeholder area
        doc.setFillColor(240, 240, 240)
        doc.rect(margin, yPos, contentWidth, 80, 'F')

        // Image indicator
        doc.setTextColor(150, 150, 150)
        doc.setFontSize(10)
        const imgCount = vehicle.vehicle_images?.length || 0
        doc.text(
          imgCount > 0
            ? `[${t('dashboard.tools.export.pdfMainPhoto')} - ${vehicle.vehicle_images[0]?.url || ''}]`
            : `[${t('dashboard.tools.export.pdfNoPhoto')}]`,
          pageWidth / 2,
          yPos + 40,
          { align: 'center', maxWidth: contentWidth - 10 },
        )

        yPos += 90

        // Vehicle title
        doc.setTextColor(35, 66, 74)
        doc.setFontSize(22)
        const vehicleTitle = `${vehicle.brand} ${vehicle.model}`
        doc.text(vehicleTitle, margin, yPos)
        yPos += 10

        // Year
        if (vehicle.year) {
          doc.setFontSize(14)
          doc.setTextColor(100, 100, 100)
          doc.text(String(vehicle.year), margin, yPos)
          yPos += 10
        }

        // Price
        if (vehicle.price) {
          doc.setFontSize(20)
          doc.setTextColor(35, 66, 74)
          const priceStr = new Intl.NumberFormat(locale.value === 'en' ? 'en-GB' : 'es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
          }).format(vehicle.price)
          doc.text(priceStr, margin, yPos)
          yPos += 12
        }

        // Divider
        doc.setDrawColor(220, 220, 220)
        doc.line(margin, yPos, pageWidth - margin, yPos)
        yPos += 8

        // Specs grid
        doc.setFontSize(10)
        const specs: Array<{ label: string; value: string }> = []

        if (vehicle.category) {
          let catLabel = vehicle.category
          if (vehicle.subcategories) {
            const jsonb = vehicle.subcategories.name?.[locale.value]
            catLabel =
              jsonb ||
              (locale.value === 'en'
                ? vehicle.subcategories.name_en
                : vehicle.subcategories.name_es) ||
              vehicle.category
          }
          specs.push({ label: t('dashboard.tools.export.columns.category'), value: catLabel })
        }
        if (vehicle.year) {
          specs.push({
            label: t('dashboard.tools.export.columns.year'),
            value: String(vehicle.year),
          })
        }
        if (vehicle.km) {
          specs.push({
            label: t('dashboard.tools.export.columns.km'),
            value:
              new Intl.NumberFormat(locale.value === 'en' ? 'en-GB' : 'es-ES').format(vehicle.km) +
              ' km',
          })
        }
        if (vehicle.location) {
          specs.push({
            label: t('dashboard.tools.export.columns.location'),
            value: vehicle.location,
          })
        }

        const colWidth = contentWidth / 2
        for (let i = 0; i < specs.length; i++) {
          const col = i % 2
          const row = Math.floor(i / 2)
          const xPos = margin + col * colWidth
          const specY = yPos + row * 16

          const spec = specs[i]
          if (!spec) continue
          doc.setTextColor(100, 100, 100)
          doc.text(spec.label, xPos, specY)
          doc.setTextColor(30, 30, 30)
          doc.setFont('helvetica', 'bold')
          doc.text(spec.value, xPos, specY + 6)
          doc.setFont('helvetica', 'normal')
        }

        yPos += Math.ceil(specs.length / 2) * 16 + 8

        // Description
        const desc = locale.value === 'en' ? vehicle.description_en : vehicle.description_es
        if (desc) {
          doc.setDrawColor(220, 220, 220)
          doc.line(margin, yPos, pageWidth - margin, yPos)
          yPos += 8

          doc.setFontSize(9)
          doc.setTextColor(60, 60, 60)
          const lines = doc.splitTextToSize(desc, contentWidth) as string[]
          const maxLines = Math.min(lines.length, 12)
          for (let i = 0; i < maxLines; i++) {
            const line = lines[i]
            if (line !== undefined) doc.text(line, margin, yPos)
            yPos += 5
          }
          if (lines.length > 12) {
            doc.text('...', margin, yPos)
          }
        }

        // Footer with QR URL
        doc.setFillColor(245, 245, 245)
        doc.rect(0, pageHeight - 20, pageWidth, 20, 'F')
        doc.setTextColor(100, 100, 100)
        doc.setFontSize(8)
        doc.text(profileUrl, pageWidth / 2, pageHeight - 10, { align: 'center' })
        doc.text(companyName, margin, pageHeight - 10)
        doc.text(
          `${t('dashboard.tools.export.pdfPage')} ${doc.getNumberOfPages()}`,
          pageWidth - margin,
          pageHeight - 10,
          { align: 'right' },
        )
      }

      const fileName = `${companyName.replace(/\s+/g, '_')}_catalog_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : t('dashboard.tools.export.errorExport')
    } finally {
      exporting.value = false
    }
  }

  // ---------- Actions ----------

  function handleExport() {
    if (exportFormat.value === 'csv') {
      exportCSV()
    } else {
      exportPDF()
    }
  }

  function toggleColumn(index: number) {
    const col = csvColumns.value[index]
    if (col) col.enabled = !col.enabled
  }

  function toggleAllColumns(enabled: boolean) {
    csvColumns.value.forEach((c) => {
      c.enabled = enabled
    })
  }

  // ---------- Init (no onMounted) ----------

  async function init() {
    await Promise.all([loadVehicles(), fetchSubscription()])
  }

  return {
    // State
    vehicles,
    loading,
    exporting,
    error,
    statusFilter,
    categoryFilter,
    exportFormat,
    csvColumns,

    // Computed
    filteredVehicles,
    vehicleCount,
    availableCategories,
    selectedColumnsCount,

    // Dependencies
    canExport,
    dealerProfile,

    // Functions
    getColumnLabel,
    handleExport,
    toggleColumn,
    toggleAllColumns,
    init,
  }
}
