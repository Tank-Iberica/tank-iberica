/**
 * useDashboardImportar
 *
 * All reactive state, computed properties, and import logic for the
 * Bulk Vehicle Import page (/dashboard/vehiculos/importar).
 *
 * The composable does NOT call onMounted — expose an init() function instead.
 */

// ────────────────────────────────────────────
// Types (module-scoped — only used by this feature)
// ────────────────────────────────────────────

export interface CategoryOption {
  id: string
  name: Record<string, string>
  slug: string
}

export interface SubcategoryOption {
  id: string
  name: Record<string, string>
  slug: string
  category_id: string
}

export interface ParsedRow {
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

export type ImportStep = 1 | 2 | 3

// ────────────────────────────────────────────
// Composable
// ────────────────────────────────────────────

export function useDashboardImportar() {
  const { t } = useI18n()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const { userId } = useAuth()
  const { dealerProfile, loadDealer } = useDealerDashboard()
  const { canPublish, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

  // ---------- State ----------

  const categories = ref<CategoryOption[]>([])
  const subcategories = ref<SubcategoryOption[]>([])
  const activeListingsCount = ref(0)
  const step = ref<ImportStep>(1)
  const file = ref<File | null>(null)
  const parsedRows = ref<ParsedRow[]>([])
  const publishing = ref(false)
  const progress = ref(0)
  const publishedCount = ref(0)
  const errorCount = ref(0)
  const error = ref<string | null>(null)

  // ---------- Computed ----------

  const validRowsCount = computed(() => parsedRows.value.filter((r) => r.isValid).length)
  const invalidRowsCount = computed(() => parsedRows.value.filter((r) => !r.isValid).length)

  // ---------- Data loading ----------

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
    subcategories.value = (subRes.data || []) as unknown as SubcategoryOption[]
    activeListingsCount.value = countRes.count || 0
  }

  // ---------- File handling ----------

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

  // ---------- CSV Parsing ----------

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
      const headerLine = lines[0]!
      const separator = headerLine.includes(';') ? ';' : ','

      // Parse rows
      const rows: ParsedRow[] = []
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]!.trim()
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

  // ---------- Publishing ----------

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
      const row = validRows[i]!

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
        } as never)

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

  // ---------- Template download ----------

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

  // ---------- Navigation ----------

  function navigateToVehicles(): void {
    router.push('/dashboard/vehiculos')
  }

  function goToStep(target: ImportStep): void {
    step.value = target
  }

  // ---------- Init (no onMounted) ----------

  async function init(): Promise<void> {
    await loadFormData()
  }

  return {
    // State
    step,
    file,
    parsedRows,
    publishing,
    progress,
    publishedCount,
    errorCount,
    error,

    // Computed
    validRowsCount,
    invalidRowsCount,

    // Functions
    handleFileUpload,
    parseFile,
    publishVehicles,
    downloadTemplate,
    navigateToVehicles,
    goToStep,
    init,
  }
}
