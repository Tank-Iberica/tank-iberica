<script setup lang="ts">
/**
 * Bulk Vehicle Import
 * Allows dealers to import multiple vehicles via CSV file.
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()
const router = useRouter()
const { userId } = useAuth()
const { dealerProfile, loadDealer } = useDealerDashboard()
const { canPublish, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

interface CategoryOption {
  id: string
  name: Record<string, string>
  slug: string
}

interface SubcategoryOption {
  id: string
  name: Record<string, string>
  slug: string
  category_id: string
}

interface ParsedRow {
  brand: string
  model: string
  year: number | null
  km: number | null
  price: number | null
  category: string
  subcategory: string
  description: string
  location: string
  isValid: boolean
  errors: string[]
}

const categories = ref<CategoryOption[]>([])
const subcategories = ref<SubcategoryOption[]>([])
const activeListingsCount = ref(0)
const step = ref<1 | 2 | 3>(1)
const file = ref<File | null>(null)
const parsedRows = ref<ParsedRow[]>([])
const publishing = ref(false)
const progress = ref(0)
const publishedCount = ref(0)
const errorCount = ref(0)
const error = ref<string | null>(null)

async function loadFormData(): Promise<void> {
  const dealer = dealerProfile.value || (await loadDealer())
  if (!dealer) return

  await fetchSubscription()

  const [catRes, subRes, countRes] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('slug'),
    supabase.from('subcategories').select('id, name, slug, category_id').order('slug'),
    supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('dealer_id', dealer.id)
      .eq('status', 'published'),
  ])

  categories.value = (catRes.data || []) as CategoryOption[]
  subcategories.value = (subRes.data || []) as SubcategoryOption[]
  activeListingsCount.value = countRes.count || 0
}

onMounted(loadFormData)

function handleFileUpload(event: Event): void {
  const target = event.target as HTMLInputElement
  const uploadedFile = target.files?.[0]

  if (!uploadedFile) return

  if (uploadedFile.name.endsWith('.xlsx')) {
    error.value = t('dashboard.import.errors.xlsxNotSupported')
    file.value = null
    return
  }

  if (!uploadedFile.name.endsWith('.csv')) {
    error.value = t('dashboard.import.errors.invalidFileType')
    file.value = null
    return
  }

  file.value = uploadedFile
  error.value = null
}

async function parseFile(): Promise<void> {
  if (!file.value) return

  const reader = new FileReader()

  reader.onload = (e) => {
    const text = e.target?.result as string
    const lines = text.split('\n').filter((line) => line.trim())

    if (lines.length < 2) {
      error.value = t('dashboard.import.errors.emptyFile')
      return
    }

    // Parse header
    const headerLine = lines[0]
    const separator = headerLine.includes(';') ? ';' : ','

    // Parse rows
    const rows: ParsedRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const cols = line.split(separator).map((col) => col.trim().replace(/^"|"$/g, ''))

      const row: ParsedRow = {
        brand: cols[0] || '',
        model: cols[1] || '',
        year: cols[2] ? Number.parseInt(cols[2], 10) : null,
        km: cols[3] ? Number.parseInt(cols[3], 10) : null,
        price: cols[4] ? Number.parseFloat(cols[4]) : null,
        category: cols[5] || '',
        subcategory: cols[6] || '',
        description: cols[7] || '',
        location: cols[8] || '',
        isValid: true,
        errors: [],
      }

      // Validation
      if (!row.brand) {
        row.isValid = false
        row.errors.push(t('dashboard.import.errors.requiredField', { field: 'marca' }))
      }
      if (!row.model) {
        row.isValid = false
        row.errors.push(t('dashboard.import.errors.requiredField', { field: 'modelo' }))
      }
      if (row.price !== null && row.price <= 0) {
        row.isValid = false
        row.errors.push(t('dashboard.import.errors.invalidPrice'))
      }
      if (row.year !== null && (row.year < 1950 || row.year > new Date().getFullYear() + 1)) {
        row.isValid = false
        row.errors.push(t('dashboard.import.errors.invalidYear'))
      }

      rows.push(row)
    }

    parsedRows.value = rows
    step.value = 2
  }

  reader.onerror = () => {
    error.value = t('dashboard.import.errors.fileReadError')
  }

  reader.readAsText(file.value)
}

async function publishVehicles(asDraft: boolean): Promise<void> {
  const dealer = dealerProfile.value
  if (!dealer) return

  const validRows = parsedRows.value.filter((row) => row.isValid)

  if (validRows.length === 0) {
    error.value = t('dashboard.import.errors.noValidRows')
    return
  }

  // Check plan limits
  const targetStatus = asDraft ? 'draft' : 'published'
  const newPublishedCount = targetStatus === 'published' ? validRows.length : 0

  if (!canPublish(activeListingsCount.value + newPublishedCount - 1)) {
    error.value = t('dashboard.vehicles.limitReached')
    return
  }

  publishing.value = true
  publishedCount.value = 0
  errorCount.value = 0
  progress.value = 0
  step.value = 3

  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i]

    try {
      // Find category and subcategory IDs
      let categoryId: string | null = null
      let subcategoryId: string | null = null

      if (row.category) {
        const cat = categories.value.find(
          (c) => c.slug === row.category.toLowerCase() || c.name.es === row.category,
        )
        categoryId = cat?.id || null
      }

      if (row.subcategory && categoryId) {
        const sub = subcategories.value.find(
          (s) =>
            s.category_id === categoryId &&
            (s.slug === row.subcategory.toLowerCase() || s.name.es === row.subcategory),
        )
        subcategoryId = sub?.id || null
      }

      // Generate slug
      const slug = `${row.brand}-${row.model}-${row.year || ''}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036F]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const { error: err } = await supabase.from('vehicles').insert({
        dealer_id: dealer.id,
        brand: row.brand,
        model: row.model,
        year: row.year,
        km: row.km,
        price: row.price,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        description_es: row.description || null,
        location: row.location || null,
        slug,
        status: targetStatus,
        views: 0,
        is_online: true,
        vertical: getVerticalSlug(),
      })

      if (err) {
        errorCount.value++
      } else {
        publishedCount.value++
      }
    } catch {
      errorCount.value++
    }

    progress.value = Math.round(((i + 1) / validRows.length) * 100)
  }

  publishing.value = false
}

function downloadTemplate(): void {
  const headers = [
    'marca',
    'modelo',
    'año',
    'km',
    'precio',
    'categoría',
    'subcategoría',
    'descripción',
    'ubicación',
  ]
  const exampleRow = [
    'Schmitz',
    'S.KO Cool',
    '2018',
    '350000',
    '25000',
    'semitrailers',
    'refrigerated',
    'Semirremolque frigorífico en excelente estado',
    'Madrid',
  ]

  const csvContent = [headers.join(';'), exampleRow.join(';')].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = 'plantilla_importacion_vehiculos.csv'
  link.click()

  URL.revokeObjectURL(url)
}

const validRowsCount = computed(() => parsedRows.value.filter((r) => r.isValid).length)
const invalidRowsCount = computed(() => parsedRows.value.filter((r) => !r.isValid).length)
</script>

<template>
  <div class="import-page">
    <header class="page-header">
      <NuxtLink to="/dashboard/vehiculos" class="back-link">
        {{ t('common.back') }}
      </NuxtLink>
      <h1>{{ t('dashboard.import.title') }}</h1>
      <p class="subtitle">{{ t('dashboard.import.subtitle') }}</p>
    </header>

    <!-- Step 1: Upload -->
    <section v-if="step === 1" class="step-section">
      <div class="upload-area">
        <h2>{{ t('dashboard.import.uploadFile') }}</h2>
        <p class="hint">{{ t('dashboard.import.supportedFormats') }}</p>

        <input
          id="file-upload"
          type="file"
          accept=".csv"
          class="file-input"
          @change="handleFileUpload"
        >
        <label for="file-upload" class="file-label">
          <span v-if="!file">{{ t('dashboard.import.chooseFile') }}</span>
          <span v-else class="file-name">{{ file.name }}</span>
        </label>

        <button type="button" class="btn-secondary" @click="downloadTemplate">
          {{ t('dashboard.import.downloadTemplate') }}
        </button>

        <div v-if="error" class="alert-error">{{ error }}</div>

        <button v-if="file" type="button" class="btn-primary" @click="parseFile">
          {{ t('dashboard.import.preview') }}
        </button>
      </div>
    </section>

    <!-- Step 2: Preview -->
    <section v-if="step === 2" class="step-section">
      <div class="preview-header">
        <h2>{{ t('dashboard.import.preview') }}</h2>
        <div class="preview-stats">
          <span class="stat-valid">{{ validRowsCount }} {{ t('dashboard.import.valid') }}</span>
          <span v-if="invalidRowsCount > 0" class="stat-invalid">
            {{ invalidRowsCount }} {{ t('dashboard.import.invalid') }}
          </span>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="preview-table">
          <thead>
            <tr>
              <th>{{ t('dashboard.import.status') }}</th>
              <th>{{ t('dashboard.vehicles.brand') }}</th>
              <th>{{ t('dashboard.vehicles.model') }}</th>
              <th>{{ t('dashboard.vehicles.year') }}</th>
              <th>{{ t('dashboard.vehicles.km') }}</th>
              <th>{{ t('dashboard.vehicles.price') }}</th>
              <th>{{ t('dashboard.vehicles.category') }}</th>
              <th>{{ t('dashboard.import.errors.title') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, idx) in parsedRows"
              :key="idx"
              :class="{ 'row-invalid': !row.isValid }"
            >
              <td>
                <span v-if="row.isValid" class="status-ok">✓</span>
                <span v-else class="status-error">✗</span>
              </td>
              <td>{{ row.brand || '-' }}</td>
              <td>{{ row.model || '-' }}</td>
              <td>{{ row.year || '-' }}</td>
              <td>{{ row.km || '-' }}</td>
              <td>{{ row.price || '-' }}</td>
              <td>{{ row.category || '-' }}</td>
              <td>
                <span v-if="row.errors.length > 0" class="error-list">
                  {{ row.errors.join(', ') }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="preview-actions">
        <button type="button" class="btn-secondary" @click="step = 1">
          {{ t('dashboard.import.back') }}
        </button>
        <button
          v-if="validRowsCount > 0"
          type="button"
          class="btn-secondary"
          @click="publishVehicles(true)"
        >
          {{ t('dashboard.import.publishDraft') }}
        </button>
        <button
          v-if="validRowsCount > 0"
          type="button"
          class="btn-primary"
          @click="publishVehicles(false)"
        >
          {{ t('dashboard.import.publishAll') }}
        </button>
      </div>
    </section>

    <!-- Step 3: Publishing -->
    <section v-if="step === 3" class="step-section">
      <div class="publish-progress">
        <h2 v-if="publishing">{{ t('dashboard.import.publishing') }}</h2>
        <h2 v-else>{{ t('dashboard.import.success') }}</h2>

        <div v-if="publishing" class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }" />
        </div>
        <p v-if="publishing" class="progress-text">{{ progress }}%</p>

        <div v-if="!publishing" class="result-summary">
          <div class="result-stat">
            <span class="result-label">{{ t('dashboard.import.successCount') }}:</span>
            <span class="result-value success">{{ publishedCount }}</span>
          </div>
          <div v-if="errorCount > 0" class="result-stat">
            <span class="result-label">{{ t('dashboard.import.errorCount') }}:</span>
            <span class="result-value error">{{ errorCount }}</span>
          </div>
        </div>

        <button
          v-if="!publishing"
          type="button"
          class="btn-primary"
          @click="router.push('/dashboard/vehiculos')"
        >
          {{ t('dashboard.import.back') }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.import-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.back-link {
  color: var(--color-primary, #23424a);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
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
  font-size: 0.95rem;
}

/* Step Section */
.step-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Upload Area */
.upload-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  text-align: center;
  padding: 20px;
}

.upload-area h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
}

.hint {
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
}

.file-input {
  display: none;
}

.file-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 12px 24px;
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.file-label:hover {
  border-color: var(--color-primary, #23424a);
  background: #f1f5f9;
}

.file-name {
  color: var(--color-primary, #23424a);
  font-weight: 600;
}

.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  width: 100%;
  max-width: 500px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: #1a3238;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #f8fafc;
}

/* Preview */
.preview-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.preview-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
}

.preview-stats {
  display: flex;
  gap: 16px;
  font-size: 0.9rem;
  font-weight: 500;
}

.stat-valid {
  color: #16a34a;
}

.stat-invalid {
  color: #dc2626;
}

.table-wrapper {
  overflow-x: auto;
  margin-bottom: 20px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.preview-table th {
  text-align: left;
  padding: 12px 8px;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
}

.preview-table td {
  padding: 12px 8px;
  border-bottom: 1px solid #f1f5f9;
}

.row-invalid {
  background: #fef2f2;
}

.status-ok {
  color: #16a34a;
  font-weight: 700;
  font-size: 1.1rem;
}

.status-error {
  color: #dc2626;
  font-weight: 700;
  font-size: 1.1rem;
}

.error-list {
  color: #dc2626;
  font-size: 0.8rem;
}

.preview-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

/* Publishing */
.publish-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px 20px;
  text-align: center;
}

.publish-progress h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #1e293b;
}

.progress-bar {
  width: 100%;
  max-width: 500px;
  height: 12px;
  background: #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary, #23424a), #16a34a);
  transition: width 0.3s ease;
}

.progress-text {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #475569;
}

.result-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 400px;
}

.result-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #f8fafc;
  border-radius: 8px;
}

.result-label {
  font-weight: 500;
  color: #64748b;
}

.result-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.result-value.success {
  color: #16a34a;
}

.result-value.error {
  color: #dc2626;
}

@media (min-width: 768px) {
  .import-page {
    padding: 24px;
  }

  .preview-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .preview-actions {
    flex-wrap: nowrap;
  }
}
</style>
