/**
 * Composable for the "New Product" form page.
 * Extracts all reactive state, computed properties, watchers, and handler functions
 * from the original `nuevo.vue` page into a reusable composable.
 */
import {
  useAdminVehicles,
  type VehicleFormData,
  type MaintenanceEntry,
  type RentalEntry,
} from '~/composables/admin/useAdminVehicles'
import { useAdminTypes } from '~/composables/admin/useAdminTypes'
import { useAdminSubcategories } from '~/composables/admin/useAdminSubcategories'
import { useAdminFilters, type AdminFilter } from '~/composables/admin/useAdminFilters'
import { useCloudinaryUpload } from '~/composables/admin/useCloudinaryUpload'
import {
  generateVehiclePublicId,
  generateCloudinaryContext,
  generateVehicleAltText,
  type FileNamingData,
} from '~/utils/fileNaming'
import { localizedName } from '~/composables/useLocalized'
import { parseLocationText, geocodeLocation } from '~/utils/parseLocation'
import { countryFlag } from '~/utils/geoData'

// ── Types ──────────────────────────────────────────────
export interface CharacteristicEntry {
  id: string
  key: string
  value_es: string
  value_en: string
}

export interface PendingImage {
  id: string
  file: File
  previewUrl: string
}

export interface SectionState {
  description: boolean
  filters: boolean
  characteristics: boolean
  documents: boolean
  financial: boolean
}

/** Extended form data that includes type_id (used in the form but not in base VehicleFormData) */
interface ProductFormData extends VehicleFormData {
  type_id: string | null
}

// ── Composable ─────────────────────────────────────────
export function useAdminProductForm() {
  const { t, locale } = useI18n()
  const toast = useToast()
  const router = useRouter()

  const { saving, error, createVehicle, addImage } = useAdminVehicles()
  const { types, fetchTypes } = useAdminTypes()
  const { subcategories, fetchSubcategories } = useAdminSubcategories()
  const { filters: allFilters, fetchFilters } = useAdminFilters()

  const {
    upload: uploadToCloudinary,
    uploading: cloudinaryUploading,
    progress: cloudinaryProgress,
  } = useCloudinaryUpload()

  // ── Refs ─────────────────────────────────────────────
  const selectedSubcategoryId = ref<string | null>(null)

  const formData = ref<ProductFormData>({
    brand: '',
    model: '',
    year: null,
    price: null,
    rental_price: null,
    category: 'venta',
    categories: [],
    subcategory_id: null,
    type_id: null,
    location: null,
    location_en: null,
    location_country: null,
    location_province: null,
    location_region: null,
    description_es: null,
    description_en: null,
    attributes_json: {},
    status: 'draft',
    featured: false,
    plate: null,
    acquisition_cost: null,
    acquisition_date: null,
    min_price: null,
    is_online: true,
    owner_name: null,
    owner_contact: null,
    owner_notes: null,
    maintenance_records: [],
    rental_records: [],
  })

  const characteristics = ref<CharacteristicEntry[]>([])
  const documents = ref<{ id: string; name: string; url: string }[]>([])

  const pendingImages = ref<PendingImage[]>([])
  const uploadingImages = ref(false)

  const sections = reactive<SectionState>({
    description: false,
    filters: true,
    characteristics: false,
    documents: false,
    financial: false,
  })

  // ── Junction data: type ↔ subcategory links ──────────
  const typeSubcategoryLinks = ref<{ type_id: string; subcategory_id: string }[]>([])

  async function fetchTypeSubcategoryLinks() {
    const supabase = useSupabaseClient()
    const { data } = await supabase
      .from('subcategory_categories')
      .select('subcategory_id, category_id')
    typeSubcategoryLinks.value =
      (data as unknown as { type_id: string; subcategory_id: string }[]) || []
  }

  // ── Location debounce ────────────────────────────────
  let locationDebounce: ReturnType<typeof setTimeout> | null = null

  // ── Computed ─────────────────────────────────────────
  const dynamicFilters = computed(() => {
    if (!formData.value.type_id) return [] as AdminFilter[]
    const sub = types.value.find((s) => s.id === formData.value.type_id)
    if (!sub?.applicable_filters?.length) {
      return allFilters.value.filter((f) => f.status === 'published')
    }
    return allFilters.value.filter(
      (f) => sub.applicable_filters?.includes(f.id) && f.status !== 'archived',
    )
  })

  const publishedSubcategories = computed(() =>
    subcategories.value.filter((s) => s.status === 'published'),
  )

  const publishedTypes = computed(() => {
    const all = types.value.filter((t) => t.status === 'published')
    if (!selectedSubcategoryId.value) return all
    const linkedTypeIds = new Set(
      typeSubcategoryLinks.value
        .filter((l) => l.subcategory_id === selectedSubcategoryId.value)
        .map((l) => l.type_id),
    )
    return all.filter((t) => linkedTypeIds.has(t.id))
  })

  const fileNamingData = computed<FileNamingData>(() => {
    const type = types.value.find((t) => t.id === formData.value.type_id)
    const subcatId = selectedSubcategoryId.value
    const subcat = subcategories.value.find((s) => s.id === subcatId)
    return {
      id: 'new',
      brand: formData.value.brand,
      year: formData.value.year,
      plate: formData.value.plate,
      subcategory: subcat?.name_es || null,
      type: type?.name_es || null,
    }
  })

  const showRentalPrice = computed(() => formData.value.categories?.includes('alquiler'))

  const isValid = computed(() => {
    return (
      formData.value.brand.trim() &&
      formData.value.model.trim() &&
      formData.value.type_id &&
      (formData.value.categories?.length || 0) > 0
    )
  })

  const totalMaint = computed(() =>
    (formData.value.maintenance_records || []).reduce((s, r) => s + (r.cost || 0), 0),
  )

  const totalRental = computed(() =>
    (formData.value.rental_records || []).reduce((s, r) => s + (r.amount || 0), 0),
  )

  const totalCost = computed(
    () => (formData.value.acquisition_cost || 0) + totalMaint.value - totalRental.value,
  )

  // ── Watchers ─────────────────────────────────────────
  // When subcategory changes, reset type_id if not in filtered types
  watch(selectedSubcategoryId, () => {
    if (selectedSubcategoryId.value && formData.value.type_id) {
      if (!publishedTypes.value.some((t) => t.id === formData.value.type_id)) {
        formData.value.type_id = null
      }
    }
  })

  // Auto-detect location_country / province / region from location text
  watch([() => formData.value.location, () => formData.value.location_en], ([es, en]) => {
    const text = es || en
    // Instant: local dictionary
    const parsed = parseLocationText(text)
    formData.value.location_country = parsed.country
    formData.value.location_province = parsed.province
    formData.value.location_region = parsed.region

    // Async fallback: geocode if province unknown or no country detected
    if ((!parsed.province || !parsed.country) && text) {
      if (locationDebounce) clearTimeout(locationDebounce)
      locationDebounce = setTimeout(async () => {
        const geo = await geocodeLocation(text)
        formData.value.location_country = geo.country
        formData.value.location_province = geo.province
        formData.value.location_region = geo.region
      }, 800)
    }
  })

  // ── Filter handlers ──────────────────────────────────
  function updateFilterValue(id: string, value: string | number | boolean) {
    formData.value.attributes_json = { ...formData.value.attributes_json, [id]: value }
  }

  function getFilterValue(id: string): string | number | boolean | undefined {
    return formData.value.attributes_json[id] as string | number | boolean | undefined
  }

  // ── Categories ───────────────────────────────────────
  function toggleCategory(cat: string) {
    const cats = formData.value.categories || []
    const idx = cats.indexOf(cat)
    if (idx === -1) formData.value.categories = [...cats, cat]
    else formData.value.categories = cats.filter((c) => c !== cat)
    if (formData.value.categories?.length) {
      formData.value.category = formData.value.categories[0] as 'alquiler' | 'venta' | 'terceros'
    }
  }

  function hasCat(cat: string): boolean {
    return formData.value.categories?.includes(cat) || false
  }

  // ── Characteristics ──────────────────────────────────
  function addCharacteristic() {
    characteristics.value.push({
      id: crypto.randomUUID(),
      key: '',
      value_es: '',
      value_en: '',
    })
  }

  function removeCharacteristic(id: string) {
    characteristics.value = characteristics.value.filter((c) => c.id !== id)
  }

  // ── Pending Images ───────────────────────────────────
  function handleImageSelect(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files?.length) return

    const maxImages = 10
    const currentCount = pendingImages.value.length
    const availableSlots = maxImages - currentCount

    if (availableSlots <= 0) {
      toast.warning(t('toast.maxImagesReached'))
      input.value = ''
      return
    }

    const filesToAdd = Array.from(input.files).slice(0, availableSlots)

    for (const file of filesToAdd) {
      const previewUrl = URL.createObjectURL(file)
      pendingImages.value.push({
        id: crypto.randomUUID(),
        file,
        previewUrl,
      })
    }

    input.value = ''
  }

  function removePendingImage(id: string) {
    const img = pendingImages.value.find((i) => i.id === id)
    if (img) {
      URL.revokeObjectURL(img.previewUrl)
      pendingImages.value = pendingImages.value.filter((i) => i.id !== id)
    }
  }

  function movePendingImage(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= pendingImages.value.length) return
    const arr = [...pendingImages.value]
    const temp = arr[index]!
    arr[index] = arr[newIndex]!
    arr[newIndex] = temp
    pendingImages.value = arr
  }

  // ── Documents ────────────────────────────────────────
  function handleDocUpload(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files?.length) return
    toast.info(t('toast.documentsRequireConfig'))
    input.value = ''
  }

  function removeDocument(id: string) {
    documents.value = documents.value.filter((d) => d.id !== id)
  }

  // ── Maintenance ──────────────────────────────────────
  function addMaint() {
    formData.value.maintenance_records = [
      ...(formData.value.maintenance_records || []),
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString().split('T')[0] ?? '',
        reason: '',
        cost: 0,
        invoice_url: undefined,
      },
    ]
  }

  function removeMaint(id: string) {
    formData.value.maintenance_records =
      formData.value.maintenance_records?.filter((r) => r.id !== id) || []
  }

  function updateMaint(id: string, field: keyof MaintenanceEntry, val: string | number) {
    formData.value.maintenance_records =
      formData.value.maintenance_records?.map((r) => (r.id === id ? { ...r, [field]: val } : r)) ||
      []
  }

  // ── Rentals ──────────────────────────────────────────
  function addRental() {
    const today = new Date().toISOString().split('T')[0] ?? ''
    formData.value.rental_records = [
      ...(formData.value.rental_records || []),
      {
        id: crypto.randomUUID(),
        from_date: today,
        to_date: today,
        amount: 0,
        notes: '',
      },
    ]
  }

  function removeRental(id: string) {
    formData.value.rental_records = formData.value.rental_records?.filter((r) => r.id !== id) || []
  }

  function updateRental(id: string, field: keyof RentalEntry, val: string | number) {
    formData.value.rental_records =
      formData.value.rental_records?.map((r) => (r.id === id ? { ...r, [field]: val } : r)) || []
  }

  // ── Save / Cancel ────────────────────────────────────
  async function handleSave() {
    if (!isValid.value) {
      toast.warning(t('toast.completeRequired'))
      return
    }

    // 1. Create vehicle first
    const vehicleId = await createVehicle(formData.value)
    if (!vehicleId) return

    // 2. Upload pending images via Cloudinary
    if (pendingImages.value.length > 0) {
      uploadingImages.value = true

      // Update fileNamingData with the real vehicle ID
      const naming: FileNamingData = {
        ...fileNamingData.value,
        id: vehicleId,
      }

      for (let i = 0; i < pendingImages.value.length; i++) {
        const img = pendingImages.value[i]!
        const imageIndex = i + 1
        const publicId = generateVehiclePublicId(naming, imageIndex)
        const context = generateCloudinaryContext(naming)
        const altText = generateVehicleAltText(naming, imageIndex)

        const result = await uploadToCloudinary(img.file, {
          publicId,
          context,
          tags: [
            naming.brand?.toLowerCase(),
            naming.subcategory?.toLowerCase(),
            naming.type?.toLowerCase(),
          ].filter(Boolean) as string[],
        })

        if (result) {
          await addImage(vehicleId, {
            cloudinary_public_id: result.public_id,
            url: result.secure_url,
            alt_text: altText,
          })
        }

        URL.revokeObjectURL(img.previewUrl)
      }

      uploadingImages.value = false
    }

    // 3. Redirect to products list
    router.push('/admin/productos')
  }

  function handleCancel() {
    router.push('/admin/productos')
  }

  // ── Format helper ────────────────────────────────────
  function fmt(val: number | null | undefined): string {
    if (!val && val !== 0) return '—'
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(val)
  }

  // ── Init (called from onMounted in page) ─────────────
  async function init() {
    await Promise.all([
      fetchSubcategories(),
      fetchTypes(),
      fetchFilters(),
      fetchTypeSubcategoryLinks(),
    ])
  }

  return {
    // External state
    saving,
    error,
    cloudinaryUploading,
    cloudinaryProgress,
    locale,

    // Refs
    selectedSubcategoryId,
    formData,
    characteristics,
    documents,
    pendingImages,
    uploadingImages,
    sections,

    // Computed
    dynamicFilters,
    publishedSubcategories,
    publishedTypes,
    showRentalPrice,
    isValid,
    totalMaint,
    totalRental,
    totalCost,

    // Functions
    init,
    updateFilterValue,
    getFilterValue,
    toggleCategory,
    hasCat,
    addCharacteristic,
    removeCharacteristic,
    handleImageSelect,
    removePendingImage,
    movePendingImage,
    handleDocUpload,
    removeDocument,
    addMaint,
    removeMaint,
    updateMaint,
    addRental,
    removeRental,
    updateRental,
    handleSave,
    handleCancel,
    fmt,

    // Re-exports for template use
    localizedName,
    countryFlag,
  }
}
