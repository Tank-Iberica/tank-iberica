<script setup lang="ts">
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
import { useGoogleDrive } from '~/composables/admin/useGoogleDrive'
import {
  generateVehiclePublicId,
  generateCloudinaryContext,
  generateVehicleAltText,
  type FileNamingData,
} from '~/utils/fileNaming'
import {
  useVehicleVerification,
  type VerificationDocType,
} from '~/composables/useVehicleVerification'
import { parseLocationText, geocodeLocation } from '~/utils/parseLocation'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { t } = useI18n()
const toast = useToast()
const route = useRoute()
const router = useRouter()

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

const { types, fetchTypes } = useAdminTypes()
const { subcategories, fetchSubcategories } = useAdminSubcategories()
const { filters: allFilters, fetchFilters } = useAdminFilters()

const {
  upload: uploadToCloudinary,
  uploading: cloudinaryUploading,
  progress: cloudinaryProgress,
} = useCloudinaryUpload()

const {
  connected: driveConnected,
  loading: driveLoading,
  error: driveError,
  connect: connectDrive,
  uploadDocument: driveUploadDocument,
  uploadInvoice: driveUploadInvoice,
  openDocumentsFolder,
  openVehicleFolder,
} = useGoogleDrive()

const vehicleId = computed(() => route.params.id as string)
const vehicle = ref<AdminVehicle | null>(null)
const selectedSubcategoryId = ref<string | null>(null)

interface CharacteristicEntry {
  id: string
  key: string
  value_es: string
  value_en: string
}

const formData = ref<VehicleFormData>({
  brand: '',
  model: '',
  year: null,
  price: null,
  rental_price: null,
  category: 'venta',
  categories: [],
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
const uploadingImage = ref(false)
const characteristics = ref<CharacteristicEntry[]>([])
const documents = ref<DocumentEntry[]>([])

const showDeleteModal = ref(false)
const deleteConfirm = ref('')
const canDelete = computed(() => deleteConfirm.value.toLowerCase() === 'borrar')

const showSellModal = ref(false)
const sellData = ref({
  sale_price: 0,
  buyer: '',
  sale_date: new Date().toISOString().split('T')[0],
  commission: 0,
  notes: '',
})

const sections = reactive({
  description: false,
  filters: true,
  characteristics: false,
  documents: false,
  financial: true,
  verification: false,
})

const verifDocTypes: VerificationDocType[] = [
  'ficha_tecnica',
  'foto_km',
  'fotos_exteriores',
  'placa_fabricante',
  'permiso_circulacion',
  'tarjeta_itv',
  'adr',
  'atp',
  'exolum',
  'estanqueidad',
]
const verifDocType = ref<VerificationDocType>('ficha_tecnica')
const verifDocs = ref<import('~/composables/useVehicleVerification').VerificationDocument[]>([])
const verifLoading = ref(false)
const verifError = ref<string | null>(null)
const verifCurrentLevel =
  ref<import('~/composables/useVehicleVerification').VerificationLevel>('none')
const verifLevelBadge = computed(() => {
  const { VERIFICATION_LEVELS } = useVehicleVerification(vehicleId.value)
  const def = VERIFICATION_LEVELS.find((l) => l.level === verifCurrentLevel.value)
  return def?.badge || ''
})

let verifComposable: ReturnType<typeof useVehicleVerification> | null = null

async function initVerification() {
  verifComposable = useVehicleVerification(vehicleId.value)
  verifLoading.value = true
  await verifComposable.fetchDocuments()
  verifDocs.value = verifComposable.documents.value
  verifCurrentLevel.value = verifComposable.currentLevel.value
  verifLoading.value = false
  verifError.value = verifComposable.error.value
}

async function handleVerifUpload(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length || !verifComposable) return
  verifLoading.value = true

  const file = input.files[0]!
  const result = await uploadToCloudinary(file, {
    publicId: `verif/${vehicleId.value}/${verifDocType.value}_${Date.now()}`,
    tags: ['verification', verifDocType.value],
  })

  if (result) {
    await verifComposable.uploadDocument(verifDocType.value, result.secure_url)
    verifDocs.value = verifComposable.documents.value
    verifCurrentLevel.value = verifComposable.currentLevel.value
    verifError.value = verifComposable.error.value
  }

  verifLoading.value = false
  input.value = ''
}

const docTypeToUpload = ref('ITV')
const docTypeOptions = ['ITV', 'Ficha-Tecnica', 'Contrato', 'Permiso-Circulacion', 'Seguro', 'Otro']

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

const driveSection = computed(() =>
  formData.value.is_online ? ('Vehiculos' as const) : ('Intermediacion' as const),
)

const dynamicFilters = computed<AdminFilter[]>(() => {
  if (!formData.value.type_id) return []
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

const typeSubcategoryLinks = ref<{ type_id: string; subcategory_id: string }[]>([])

async function fetchTypeSubcategoryLinks() {
  const supabase = useSupabaseClient()
  const { data } = await supabase
    .from('subcategory_categories')
    .select('subcategory_id, category_id')
  typeSubcategoryLinks.value = (data as { type_id: string; subcategory_id: string }[]) || []
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

onMounted(async () => {
  await Promise.all([
    fetchSubcategories(),
    fetchTypes(),
    fetchFilters(),
    fetchTypeSubcategoryLinks(),
  ])
  await loadVehicle()
  await initVerification()
})

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

function updateFilterValue(id: string, value: string | number | boolean) {
  formData.value.attributes_json = { ...formData.value.attributes_json, [id]: value }
}

const isValid = computed(() => {
  return (
    formData.value.brand.trim() &&
    formData.value.model.trim() &&
    formData.value.type_id &&
    (formData.value.categories?.length || 0) > 0
  )
})

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

async function handleImageUpload(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  uploadingImage.value = true

  const files = Array.from(input.files)
  const currentCount = images.value.length
  const availableSlots = 10 - currentCount

  if (availableSlots <= 0) {
    toast.warning(t('toast.maxImagesReached'))
    input.value = ''
    uploadingImage.value = false
    return
  }

  const filesToUpload = files.slice(0, availableSlots)

  for (let i = 0; i < filesToUpload.length; i++) {
    const file = filesToUpload[i]
    const imageIndex = currentCount + i + 1
    const naming = fileNamingData.value
    const publicId = generateVehiclePublicId(naming, imageIndex)
    const context = generateCloudinaryContext(naming)
    const altText = generateVehicleAltText(naming, imageIndex)

    const result = await uploadToCloudinary(file, {
      publicId,
      context,
      tags: [
        naming.brand?.toLowerCase(),
        naming.subcategory?.toLowerCase(),
        naming.type?.toLowerCase(),
      ].filter(Boolean) as string[],
    })

    if (result) {
      const ok = await addImage(vehicleId.value, {
        cloudinary_public_id: result.public_id,
        url: result.secure_url,
        alt_text: altText,
      })
      if (ok) {
        images.value.push({
          id: crypto.randomUUID(),
          url: result.secure_url,
          position: currentCount + i,
        })
      }
    }
  }

  uploadingImage.value = false
  input.value = ''
  await loadVehicle()
}

async function handleDeleteImage(id: string) {
  if (!confirm('¿Eliminar imagen?')) return
  const ok = await deleteImage(id)
  if (ok) images.value = images.value.filter((i) => i.id !== id)
}

async function setAsPortada(index: number) {
  if (index === 0) return
  const arr = [...images.value]
  const img = arr.splice(index, 1)[0]
  arr.unshift(img)
  const updates = arr.map((img, i) => ({ id: img.id, position: i }))
  const ok = await reorderImages(updates)
  if (ok) images.value = arr.map((img, i) => ({ ...img, position: i }))
}

async function moveImage(index: number, dir: 'up' | 'down') {
  const newIdx = dir === 'up' ? index - 1 : index + 1
  if (newIdx < 0 || newIdx >= images.value.length) return
  const arr = [...images.value]
  ;[arr[index], arr[newIdx]] = [arr[newIdx], arr[index]]
  const updates = arr.map((img, i) => ({ id: img.id, position: i }))
  const ok = await reorderImages(updates)
  if (ok) images.value = arr.map((img, i) => ({ ...img, position: i }))
}

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

async function handleDocUpload(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return

  if (!driveConnected.value) {
    const ok = await connectDrive()
    if (!ok) {
      input.value = ''
      return
    }
  }

  const files = Array.from(input.files)
  for (const file of files) {
    try {
      const result = await driveUploadDocument(
        file,
        fileNamingData.value,
        docTypeToUpload.value,
        driveSection.value,
      )
      documents.value.push({
        id: crypto.randomUUID(),
        name: result.name,
        url: result.url,
        type: docTypeToUpload.value,
        uploaded_at: new Date().toISOString(),
      })
    } catch {
      // error is set in the composable
    }
  }
  input.value = ''
}

function removeDocument(id: string) {
  documents.value = documents.value.filter((d) => d.id !== id)
}

async function handleMaintInvoiceUpload(maintId: string, e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return

  if (!driveConnected.value) {
    const ok = await connectDrive()
    if (!ok) {
      input.value = ''
      return
    }
  }

  const file = input.files[0]
  const maint = formData.value.maintenance_records?.find((r) => r.id === maintId)
  try {
    const result = await driveUploadInvoice(
      file,
      fileNamingData.value,
      'Mantenimiento',
      maint?.date,
      driveSection.value,
    )
    updateMaint(maintId, 'invoice_url' as keyof MaintenanceEntry, result.url)
  } catch {
    // error set in composable
  }
  input.value = ''
}

async function handleRentalInvoiceUpload(rentalId: string, e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return

  if (!driveConnected.value) {
    const ok = await connectDrive()
    if (!ok) {
      input.value = ''
      return
    }
  }

  const file = input.files[0]
  const rental = formData.value.rental_records?.find((r) => r.id === rentalId)
  try {
    const result = await driveUploadInvoice(
      file,
      fileNamingData.value,
      'Renta',
      rental?.from_date,
      driveSection.value,
    )
    updateRental(rentalId, 'invoice_url' as keyof RentalEntry, result.url)
  } catch {
    // error set in composable
  }
  input.value = ''
}

function addMaint() {
  formData.value.maintenance_records = [
    ...(formData.value.maintenance_records || []),
    {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
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
    formData.value.maintenance_records?.map((r) => (r.id === id ? { ...r, [field]: val } : r)) || []
}

const totalMaint = computed(() =>
  (formData.value.maintenance_records || []).reduce((s, r) => s + (r.cost || 0), 0),
)

function addRental() {
  const today = new Date().toISOString().split('T')[0]
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

const totalRental = computed(() =>
  (formData.value.rental_records || []).reduce((s, r) => s + (r.amount || 0), 0),
)

const totalCost = computed(
  () => (formData.value.acquisition_cost || 0) + totalMaint.value - totalRental.value,
)

const finalProfit = computed(() => {
  return (
    (sellData.value.sale_price || 0) -
    totalCost.value -
    (sellData.value.sale_price * sellData.value.commission) / 100
  )
})
</script>

<template>
  <div class="pf">
    <div v-if="loading && !vehicle" class="loading">Cargando...</div>

    <template v-else-if="vehicle">
      <AdminProductoHeader
        :vehicle="vehicle"
        :featured="formData.featured"
        :saving="saving"
        :is-valid="isValid"
        :drive-connected="driveConnected"
        :drive-loading="driveLoading"
        :file-naming-data="fileNamingData"
        :drive-section="driveSection"
        @back="handleCancel"
        @drive-connect="connectDrive"
        @drive-open="openVehicleFolder(fileNamingData, driveSection)"
        @sell="showSellModal = true"
        @delete="showDeleteModal = true"
        @cancel="handleCancel"
        @save="handleSave"
      />

      <div v-if="error" class="error-msg">{{ error }}</div>

      <div class="pf-body">
        <AdminProductoStatus v-model="formData.status" />

        <AdminProductoVisibilidad
          v-model:is-online="formData.is_online"
          v-model:owner-name="formData.owner_name"
          v-model:owner-contact="formData.owner_contact"
          v-model:owner-notes="formData.owner_notes"
        />

        <AdminProductoImages
          :images="images"
          :uploading="uploadingImage"
          :cloudinary-uploading="cloudinaryUploading"
          :cloudinary-progress="cloudinaryProgress"
          @upload="handleImageUpload"
          @delete="handleDeleteImage"
          @set-portada="setAsPortada"
          @move="moveImage"
        />

        <AdminProductoBasicInfo
          v-model:categories="formData.categories"
          v-model:featured="formData.featured"
          v-model:selected-subcategory-id="selectedSubcategoryId"
          v-model:type-id="formData.type_id"
          v-model:brand="formData.brand"
          v-model:model="formData.model"
          v-model:year="formData.year"
          v-model:plate="formData.plate"
          v-model:price="formData.price"
          v-model:rental-price="formData.rental_price"
          v-model:location="formData.location"
          v-model:location-en="formData.location_en"
          :subcategories="publishedSubcategories"
          :types="publishedTypes"
          :show-rental-price="showRentalPrice"
          :location-country="formData.location_country"
          :location-province="formData.location_province"
          :location-region="formData.location_region"
        />

        <AdminProductoDescription
          v-model:open="sections.description"
          v-model:description-es="formData.description_es"
          v-model:description-en="formData.description_en"
        />

        <AdminProductoFilters
          v-model:open="sections.filters"
          :filters="dynamicFilters"
          :attributes-json="formData.attributes_json"
          @update-filter="updateFilterValue"
        />

        <AdminProductoCharacteristics
          v-model:open="sections.characteristics"
          :characteristics="characteristics"
          @add="addCharacteristic"
          @remove="removeCharacteristic"
          @update="updateCharacteristic"
        />

        <AdminProductoDocuments
          v-model:open="sections.documents"
          v-model:doc-type-to-upload="docTypeToUpload"
          :documents="documents"
          :doc-type-options="docTypeOptions"
          :drive-connected="driveConnected"
          :drive-loading="driveLoading"
          :drive-error="driveError"
          :file-naming-data="fileNamingData"
          :drive-section="driveSection"
          @upload="handleDocUpload"
          @remove="removeDocument"
          @open-folder="openDocumentsFolder(fileNamingData, driveSection)"
        />

        <AdminProductoFinancial
          v-model:open="sections.financial"
          v-model:acquisition-cost="formData.acquisition_cost"
          v-model:acquisition-date="formData.acquisition_date"
          v-model:min-price="formData.min_price"
          :maintenance-records="formData.maintenance_records || []"
          :rental-records="formData.rental_records || []"
          :total-maint="totalMaint"
          :total-rental="totalRental"
          :total-cost="totalCost"
          :drive-loading="driveLoading"
          :file-naming-data="fileNamingData"
          :drive-section="driveSection"
          @add-maint="addMaint"
          @remove-maint="removeMaint"
          @update-maint="updateMaint"
          @add-rental="addRental"
          @remove-rental="removeRental"
          @update-rental="updateRental"
          @upload-maint-invoice="handleMaintInvoiceUpload"
          @upload-rental-invoice="handleRentalInvoiceUpload"
        />

        <AdminProductoVerification
          v-model:open="sections.verification"
          v-model:doc-type="verifDocType"
          :current-level="verifCurrentLevel"
          :level-badge="verifLevelBadge"
          :documents="verifDocs"
          :doc-types="verifDocTypes"
          :loading="verifLoading"
          :error="verifError"
          @upload="handleVerifUpload"
        />
      </div>
    </template>

    <AdminProductoDeleteModal
      v-model:show="showDeleteModal"
      v-model:delete-confirm="deleteConfirm"
      :vehicle-brand="vehicle?.brand || ''"
      :vehicle-model="vehicle?.model || ''"
      :can-delete="canDelete"
      @delete="executeDelete"
    />

    <AdminProductoSellModal
      v-model:show="showSellModal"
      v-model:sell-data="sellData"
      :vehicle-brand="vehicle?.brand || ''"
      :vehicle-model="vehicle?.model || ''"
      :total-cost="totalCost"
      :final-profit="finalProfit"
      @sell="executeSell"
    />
  </div>
</template>

<style scoped>
.pf {
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 40px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.error-msg {
  background: #fef2f2;
  color: #dc2626;
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.pf-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
