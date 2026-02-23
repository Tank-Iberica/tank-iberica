<script setup lang="ts">
/**
 * Catalog Export Tool
 * Export dealer vehicle catalog as CSV (column-selectable) or professional PDF.
 * Plan: Basico+ (requires canExport from subscription).
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

interface ExportVehicle {
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
  subcategories: { name_es: string; name_en: string | null } | null
}

type CsvColumn = 'brand' | 'model' | 'year' | 'km' | 'price' | 'category' | 'location' | 'status'

interface CsvColumnOption {
  key: CsvColumn
  label: string
  enabled: boolean
}

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
        'id, brand, model, year, price, category, location, status, description_es, description_en, vehicle_images(url, position), subcategories(name_es, name_en)',
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

// ---------- CSV Export ----------

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
      return vehicle.subcategories
        ? (locale.value === 'en' ? vehicle.subcategories.name_en : vehicle.subcategories.name_es) ||
            vehicle.category
        : vehicle.category
    case 'location':
      return vehicle.location || ''
    case 'status':
      return vehicle.status
    default:
      return ''
  }
}

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
        const catLabel = vehicle.subcategories
          ? (locale.value === 'en'
              ? vehicle.subcategories.name_en
              : vehicle.subcategories.name_es) || vehicle.category
          : vehicle.category
        specs.push({ label: t('dashboard.tools.export.columns.category'), value: catLabel })
      }
      if (vehicle.year) {
        specs.push({ label: t('dashboard.tools.export.columns.year'), value: String(vehicle.year) })
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
        specs.push({ label: t('dashboard.tools.export.columns.location'), value: vehicle.location })
      }

      const colWidth = contentWidth / 2
      for (let i = 0; i < specs.length; i++) {
        const col = i % 2
        const row = Math.floor(i / 2)
        const xPos = margin + col * colWidth
        const specY = yPos + row * 16

        doc.setTextColor(100, 100, 100)
        doc.text(specs[i].label, xPos, specY)
        doc.setTextColor(30, 30, 30)
        doc.setFont('helvetica', 'bold')
        doc.text(specs[i].value, xPos, specY + 6)
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
          doc.text(lines[i], margin, yPos)
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
  csvColumns.value[index].enabled = !csvColumns.value[index].enabled
}

function toggleAllColumns(enabled: boolean) {
  csvColumns.value.forEach((c) => {
    c.enabled = enabled
  })
}

// ---------- Lifecycle ----------

onMounted(async () => {
  await Promise.all([loadVehicles(), fetchSubscription()])
})
</script>

<template>
  <div class="export-page">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h1>{{ t('dashboard.tools.export.title') }}</h1>
        <p class="subtitle">{{ t('dashboard.tools.export.subtitle') }}</p>
      </div>
      <NuxtLink to="/dashboard" class="btn-back">
        {{ t('dashboard.tools.export.backToDashboard') }}
      </NuxtLink>
    </header>

    <!-- Plan gate -->
    <div v-if="!canExport" class="plan-gate">
      <div class="gate-icon">&#128274;</div>
      <h2>{{ t('dashboard.tools.export.planRequired') }}</h2>
      <p>{{ t('dashboard.tools.export.planRequiredDesc') }}</p>
      <NuxtLink to="/dashboard/suscripcion" class="btn-primary">
        {{ t('dashboard.tools.export.upgradePlan') }}
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Error -->
      <div v-if="error" class="alert-error">{{ error }}</div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner" />
        <span>{{ t('common.loading') }}...</span>
      </div>

      <template v-else>
        <!-- Filter & Format Options -->
        <div class="options-card">
          <h2>{{ t('dashboard.tools.export.options') }}</h2>

          <div class="options-grid">
            <!-- Status filter -->
            <div class="field">
              <label>{{ t('dashboard.tools.export.statusFilter') }}</label>
              <select v-model="statusFilter" class="field-select">
                <option value="all">{{ t('dashboard.tools.export.allVehicles') }}</option>
                <option value="published">{{ t('dashboard.tools.export.publishedOnly') }}</option>
              </select>
            </div>

            <!-- Category filter -->
            <div class="field">
              <label>{{ t('dashboard.tools.export.categoryFilter') }}</label>
              <select v-model="categoryFilter" class="field-select">
                <option :value="null">{{ t('dashboard.tools.export.allCategories') }}</option>
                <option v-for="cat in availableCategories" :key="cat" :value="cat">
                  {{ cat }}
                </option>
              </select>
            </div>

            <!-- Export format -->
            <div class="field">
              <label>{{ t('dashboard.tools.export.format') }}</label>
              <div class="format-toggle">
                <button
                  class="format-btn"
                  :class="{ active: exportFormat === 'csv' }"
                  @click="exportFormat = 'csv'"
                >
                  CSV
                </button>
                <button
                  class="format-btn"
                  :class="{ active: exportFormat === 'pdf' }"
                  @click="exportFormat = 'pdf'"
                >
                  PDF {{ t('dashboard.tools.export.catalog') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Vehicle count -->
          <div class="vehicle-count">
            <strong>{{ vehicleCount }}</strong> {{ t('dashboard.tools.export.vehiclesToExport') }}
          </div>
        </div>

        <!-- CSV Column selection -->
        <div v-if="exportFormat === 'csv'" class="options-card">
          <div class="columns-header">
            <h2>{{ t('dashboard.tools.export.selectColumns') }}</h2>
            <div class="columns-actions">
              <button class="btn-text" @click="toggleAllColumns(true)">
                {{ t('dashboard.tools.export.selectAll') }}
              </button>
              <button class="btn-text" @click="toggleAllColumns(false)">
                {{ t('dashboard.tools.export.deselectAll') }}
              </button>
            </div>
          </div>
          <p class="columns-count">
            {{ selectedColumnsCount }} {{ t('dashboard.tools.export.columnsSelected') }}
          </p>
          <div class="columns-grid">
            <label v-for="(col, idx) in csvColumns" :key="col.key" class="column-checkbox">
              <input type="checkbox" :checked="col.enabled" @change="toggleColumn(idx)" >
              <span>{{ getColumnLabel(col.key) }}</span>
            </label>
          </div>
        </div>

        <!-- PDF preview info -->
        <div v-if="exportFormat === 'pdf'" class="options-card">
          <h2>{{ t('dashboard.tools.export.pdfPreview') }}</h2>
          <div class="pdf-info">
            <div class="pdf-info-item">
              <span class="info-label">{{ t('dashboard.tools.export.pdfCoverPage') }}</span>
              <span>{{ dealerProfile?.company_name || '--' }}</span>
            </div>
            <div class="pdf-info-item">
              <span class="info-label">{{ t('dashboard.tools.export.pdfPages') }}</span>
              <span>{{ vehicleCount + 1 }} {{ t('dashboard.tools.export.pdfPagesCount') }}</span>
            </div>
            <div class="pdf-info-item">
              <span class="info-label">{{ t('dashboard.tools.export.pdfLayout') }}</span>
              <span>{{ t('dashboard.tools.export.pdfLayoutDesc') }}</span>
            </div>
            <div class="pdf-info-item">
              <span class="info-label">{{ t('dashboard.tools.export.pdfFooter') }}</span>
              <span>{{ t('dashboard.tools.export.pdfFooterDesc') }}</span>
            </div>
          </div>
        </div>

        <!-- Export button -->
        <button
          class="btn-primary btn-export"
          :disabled="exporting || vehicleCount === 0"
          @click="handleExport"
        >
          <span v-if="exporting" class="spinner-sm" />
          <span v-else>
            {{
              exportFormat === 'csv'
                ? t('dashboard.tools.export.downloadCSV')
                : t('dashboard.tools.export.downloadPDF')
            }}
          </span>
        </button>
      </template>
    </template>
  </div>
</template>

<style scoped>
.export-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.btn-back {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 10px 16px;
  background: white;
  color: var(--color-primary, #23424a);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  font-size: 0.9rem;
  align-self: flex-start;
}

.btn-back:hover {
  background: #f8fafc;
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

/* Options card */
.options-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.options-card h2 {
  margin: 0 0 16px;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1e293b;
}

.options-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
}

.field-select {
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  color: #1e293b;
}

.field-select:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
}

/* Format toggle */
.format-toggle {
  display: flex;
  gap: 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.format-btn {
  flex: 1;
  min-height: 44px;
  padding: 10px 16px;
  border: none;
  background: white;
  font-size: 0.9rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.format-btn + .format-btn {
  border-left: 1px solid #e5e7eb;
}

.format-btn.active {
  background: var(--color-primary, #23424a);
  color: white;
}

/* Vehicle count */
.vehicle-count {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f0f9ff;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1e40af;
}

/* Column selection */
.columns-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.columns-header h2 {
  margin: 0;
}

.columns-actions {
  display: flex;
  gap: 12px;
}

.btn-text {
  background: none;
  border: none;
  color: var(--color-primary, #23424a);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 4px 8px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.btn-text:hover {
  text-decoration: underline;
}

.columns-count {
  margin: 0 0 12px;
  font-size: 0.8rem;
  color: #64748b;
}

.columns-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.column-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #374151;
  min-height: 44px;
  transition: background 0.15s;
}

.column-checkbox:hover {
  background: #f1f5f9;
}

.column-checkbox input {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary, #23424a);
}

/* PDF preview info */
.pdf-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pdf-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.9rem;
}

.pdf-info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #64748b;
  font-weight: 500;
}

/* Buttons */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 12px 24px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
  gap: 8px;
}

.btn-primary:hover {
  background: #1a3238;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-export {
  align-self: stretch;
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
  width: 18px;
  height: 18px;
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

/* Responsive */
@media (min-width: 480px) {
  .columns-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 768px) {
  .export-page {
    padding: 24px;
  }

  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .btn-back {
    align-self: center;
  }

  .options-grid {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .options-grid .field {
    flex: 1;
    min-width: 180px;
  }
}
</style>
