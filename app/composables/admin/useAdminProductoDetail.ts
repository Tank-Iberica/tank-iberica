/**
 * Admin Producto Detail Composable — Orchestrator
 * Extracted from app/pages/admin/productos/[id].vue
 *
 * Verification          → useAdminProductoDetailVerif
 * Image management      → useAdminProductoDetailImages
 * Records & documents   → useAdminProductoDetailRecords
 */
import {
  useAdminVehicles,
  type VehicleFormData,
  type AdminVehicle,
  type MaintenanceEntry,
  type RentalEntry,
  type DocumentEntry,
} from '~/composables/admin/useAdminVehicles'
import { useAdminTypes } from '~/composables/admin/useAdminTypes'
import { useAdminSubcategories } from '~/composables/admin/useAdminSubcategories'
import { useAdminFilters, type AdminFilter } from '~/composables/admin/useAdminFilters'
import { useCloudinaryUpload } from '~/composables/admin/useCloudinaryUpload'
import type { FileNamingData } from '~/utils/fileNaming'
import { parseLocationText, geocodeLocation } from '~/utils/parseLocation'
import { useAdminProductoDetailVerif } from '~/composables/admin/useAdminProductoDetailVerif'
import { useAdminProductoDetailImages } from '~/composables/admin/useAdminProductoDetailImages'
import { useAdminProductoDetailRecords } from '~/composables/admin/useAdminProductoDetailRecords'

export interface CharacteristicEntry {
  id: string
  key: string
  value_es: string
  value_en: string
}

export function useAdminProductoDetail() {
  const { t } = useI18n()
  const toast = useToast()
  const route = useRoute()
  const router = useRouter()

  // --- Admin vehicles CRUD ---
  const {
    loading,
    saving,
    error,
    fetchById,
    updateVehicle,
    deleteVehicle,
    addImage,
    deleteImage,
    reorderImages,
  } = useAdminVehicles()

  // --- Catalog data ---
  const { types, fetchTypes } = useAdminTypes()
  const { subcategories, fetchSubcategories } = useAdminSubcategories()
  const { filters: allFilters, fetchFilters } = useAdminFilters()

  // --- Cloudinary ---
  const {
    upload: uploadToCloudinary,
    uploading: cloudinaryUploading,
    progress: cloudinaryProgress,
  } = useCloudinaryUpload()

  // --- Core state ---
  const vehicleId = computed(() => route.params.id as string)
  const vehicle = ref<AdminVehicle | null>(null)
  const selectedSubcategoryId = ref<string | null>(null)

  const formData = ref<VehicleFormData>({
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

  const images = ref<{ id: string; url: string; position: number }[]>([])
  const characteristics = ref<CharacteristicEntry[]>([])
  const documents = ref<DocumentEntry[]>([])

  // --- Delete modal ---
  const showDeleteModal = ref(false)
  const deleteConfirm = ref('')
  const canDelete = computed(() => deleteConfirm.value.toLowerCase() === 'borrar')

  // --- Sell modal ---
  const showSellModal = ref(false)
  const sellData = ref({
    sale_price: 0,
    buyer: '',
    sale_date: new Date().toISOString().split('T')[0] ?? '',
    commission: 0,
    notes: '',
  })

  // --- Collapsible sections ---
  const sections = reactive({
    description: false,
    filters: true,
    characteristics: false,
    documents: false,
    financial: true,
    verification: false,
  })

  // --- File naming ---
  const fileNamingData = computed<FileNamingData>(() => {
    const type = types.value.find((t) => t.id === formData.value.type_id)
    const subcatId = selectedSubcategoryId.value
    const subcat = subcategories.value.find((s) => s.id === subcatId)
    return {
      id: vehicle.value?.internal_id || vehicleId.value,
      brand: formData.value.brand,
      year: formData.value.year,
      plate: formData.value.plate,
      subcategory: subcat?.name_es || null,
      type: type?.name_es || null,
    }
  })

  // --- Dynamic filters ---
  const dynamicFilters = computed<AdminFilter[]>(() => {
    if (!formData.value.type_id) return []
    const sub = types.value.find((s) => s.id === formData.value.type_id)
    if (!sub?.applicable_filters?.length) {
      return allFilters.value.filter((f) => f.status === 'published') as AdminFilter[]
    }
    return allFilters.value.filter(
      (f) => sub.applicable_filters?.includes(f.id) && f.status !== 'archived',
    ) as AdminFilter[]
  })

  // --- Subcategory / type filtering ---
  const publishedSubcategories = computed(() =>
    subcategories.value.filter((s) => s.status === 'published'),
  )

  const typeSubcategoryLinks = ref<{ type_id: string; subcategory_id: string }[]>([])

  async function fetchTypeSubcategoryLinks() {
    const supabase = useSupabaseClient()
    const { data } = await supabase
      .from('subcategory_categories')
      .select('subcategory_id, category_id')
    typeSubcategoryLinks.value =
      (data as unknown as { type_id: string; subcategory_id: string }[]) || []
  }

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

  // --- Watchers ---
  watch(selectedSubcategoryId, () => {
    if (selectedSubcategoryId.value && formData.value.type_id) {
      if (!publishedTypes.value.some((t) => t.id === formData.value.type_id)) {
        formData.value.type_id = null
      }
    }
  })

  const showRentalPrice = computed(() => formData.value.categories?.includes('alquiler'))

  let locationDebounce: ReturnType<typeof setTimeout> | null = null
  watch([() => formData.value.location, () => formData.value.location_en], ([es, en]) => {
    const text = es || en
    const parsed = parseLocationText(text)
    formData.value.location_country = parsed.country
    formData.value.location_province = parsed.province
    formData.value.location_region = parsed.region

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

  // --- Load vehicle ---
  async function loadVehicle() {
    const data = await fetchById(vehicleId.value)
    if (!data) {
      router.push('/admin/productos')
      return
    }
    vehicle.value = data
    formData.value = {
      brand: data.brand,
      model: data.model,
      year: data.year || null,
      price: data.price || null,
      rental_price: data.rental_price || null,
      category: data.category as 'alquiler' | 'venta' | 'terceros',
      categories: data.categories || [data.category],
      subcategory_id:
        (data as unknown as { subcategory_id?: string | null }).subcategory_id ?? null,
      type_id: data.type_id || null,
      location: data.location || null,
      location_en: data.location_en || null,
      location_country: data.location_country || null,
      location_province: data.location_province || null,
      location_region: data.location_region || null,
      description_es: data.description_es || null,
      description_en: data.description_en || null,
      attributes_json: (data.attributes_json as Record<string, unknown>) || {},
      status: data.status,
      featured: data.featured || false,
      plate: data.plate || null,
      acquisition_cost: data.acquisition_cost || null,
      acquisition_date: data.acquisition_date || null,
      min_price: data.min_price || null,
      is_online: data.is_online ?? true,
      owner_name: data.owner_name || null,
      owner_contact: data.owner_contact || null,
      owner_notes: data.owner_notes || null,
      maintenance_records: (data.maintenance_records as MaintenanceEntry[]) || [],
      rental_records: (data.rental_records as RentalEntry[]) || [],
      documents_json: (data.documents_json as DocumentEntry[]) || [],
    }
    documents.value = (data.documents_json as DocumentEntry[]) || []

    if (data.vehicle_images) {
      const arr = data.vehicle_images as { id: string; url: string; position: number }[]
      images.value = [...arr].sort((a, b) => a.position - b.position)
    }

    if (data.type_id) {
      const link = typeSubcategoryLinks.value.find((l) => l.type_id === data.type_id)
      if (link) {
        selectedSubcategoryId.value = link.subcategory_id
      }
    }
  }

  // --- Filter value update ---
  function updateFilterValue(id: string, value: string | number | boolean) {
    formData.value.attributes_json = { ...formData.value.attributes_json, [id]: value }
  }

  // --- Form validation ---
  const isValid = computed(() => {
    return (
      formData.value.brand.trim() &&
      formData.value.model.trim() &&
      formData.value.type_id &&
      (formData.value.categories?.length || 0) > 0
    )
  })

  // --- Save / Cancel / Delete / Sell ---
  async function handleSave() {
    if (!isValid.value) {
      toast.warning(t('toast.completeRequired'))
      return
    }
    const ok = await updateVehicle(vehicleId.value, {
      ...formData.value,
      documents_json: documents.value,
    })
    if (ok) router.push('/admin/productos')
  }

  function handleCancel() {
    router.push('/admin/productos')
  }

  async function executeDelete() {
    if (!canDelete.value) return
    const ok = await deleteVehicle(vehicleId.value)
    if (ok) router.push('/admin/productos')
  }

  function executeSell() {
    toast.info(t('toast.saleFeaturePending'))
    showSellModal.value = false
  }

  // --- Characteristics ---
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

  function updateCharacteristic(id: string, field: keyof CharacteristicEntry, value: string) {
    const char = characteristics.value.find((c) => c.id === id)
    if (char) char[field] = value
  }

  // -------------------------------------------------------------------------
  // Sub-composables
  // -------------------------------------------------------------------------

  const verif = useAdminProductoDetailVerif({ vehicleId, uploadToCloudinary })

  const imagesMgr = useAdminProductoDetailImages({
    vehicleId,
    fileNamingData,
    images,
    uploadToCloudinary,
    addImage,
    deleteImage,
    reorderImages,
    loadVehicle,
  })

  const records = useAdminProductoDetailRecords({ formData, fileNamingData, documents })

  const finalProfit = computed(() => {
    return (
      (sellData.value.sale_price || 0) -
      records.totalCost.value -
      (sellData.value.sale_price * sellData.value.commission) / 100
    )
  })

  // --- Init (replaces onMounted) ---
  async function init() {
    await Promise.all([
      fetchSubcategories(),
      fetchTypes(),
      fetchFilters(),
      fetchTypeSubcategoryLinks(),
    ])
    await loadVehicle()
    await verif.initVerification()
  }

  return {
    // State
    loading,
    saving,
    error,
    vehicle,
    vehicleId,
    formData,
    images,
    cloudinaryUploading,
    cloudinaryProgress,
    characteristics,
    documents,
    selectedSubcategoryId,
    // Modals
    showDeleteModal,
    deleteConfirm,
    canDelete,
    showSellModal,
    sellData,
    sections,
    // File naming
    fileNamingData,
    // Catalog
    publishedSubcategories,
    publishedTypes,
    dynamicFilters,
    showRentalPrice,
    // Validation
    isValid,
    // Financial
    finalProfit,
    // Actions
    init,
    handleSave,
    handleCancel,
    executeDelete,
    executeSell,
    addCharacteristic,
    removeCharacteristic,
    updateCharacteristic,
    updateFilterValue,
    // Sub-composable returns (spread)
    ...verif,
    ...imagesMgr,
    ...records,
  }
}
