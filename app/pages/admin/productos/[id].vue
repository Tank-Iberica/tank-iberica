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
  VERIFICATION_LEVELS,
  LEVEL_ORDER,
  type VerificationDocType,
} from '~/composables/useVehicleVerification'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

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

// Cloudinary + Google Drive
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
  disconnect: _disconnectDrive,
  uploadDocument: driveUploadDocument,
  uploadInvoice: driveUploadInvoice,
  openDocumentsFolder,
  openVehicleFolder,
} = useGoogleDrive()

const vehicleId = computed(() => route.params.id as string)
const vehicle = ref<AdminVehicle | null>(null)
const selectedSubcategoryId = ref<string | null>(null)

// Extended interfaces
interface CharacteristicEntry {
  id: string
  key: string
  value_es: string
  value_en: string
}

// Form data
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

// Images
const images = ref<{ id: string; url: string; position: number }[]>([])
const uploadingImage = ref(false)
const _portadaIndex = ref(0)

// Additional fields
const characteristics = ref<CharacteristicEntry[]>([])
const documents = ref<DocumentEntry[]>([])

// Delete modal
const showDeleteModal = ref(false)
const deleteConfirm = ref('')
const canDelete = computed(() => deleteConfirm.value.toLowerCase() === 'borrar')

// Sell modal
const showSellModal = ref(false)
const sellData = ref({
  sale_price: 0,
  buyer: '',
  sale_date: new Date().toISOString().split('T')[0],
  commission: 0,
  notes: '',
})

// Collapsible sections
const sections = reactive({
  description: false,
  filters: true,
  characteristics: false,
  documents: false,
  financial: true,
  verification: false,
})

// Verification
const verifLevels = VERIFICATION_LEVELS
const verifLevelOrder = LEVEL_ORDER
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

// Document type selector
const docTypeToUpload = ref('ITV')
const docTypeOptions = ['ITV', 'Ficha-Tecnica', 'Contrato', 'Permiso-Circulacion', 'Seguro', 'Otro']

// File naming data for Cloudinary + Drive
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

// Dynamic filters
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

// Published subcategories
const publishedSubcategories = computed(() =>
  subcategories.value.filter((s) => s.status === 'published'),
)

// Junction data: type ↔ subcategory links
const typeSubcategoryLinks = ref<{ type_id: string; subcategory_id: string }[]>([])

async function fetchTypeSubcategoryLinks() {
  const supabase = useSupabaseClient()
  const { data } = await supabase
    .from('subcategory_categories')
    .select('subcategory_id, category_id')
  typeSubcategoryLinks.value = (data as { type_id: string; subcategory_id: string }[]) || []
}

// Published types filtered by selected subcategory
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

// When subcategory changes, reset type_id if not in filtered types
watch(selectedSubcategoryId, () => {
  if (selectedSubcategoryId.value && formData.value.type_id) {
    if (!publishedTypes.value.some((t) => t.id === formData.value.type_id)) {
      formData.value.type_id = null
    }
  }
})

// Show rental price only if Alquiler category is selected
const showRentalPrice = computed(() => formData.value.categories?.includes('alquiler'))

// Auto-detect location_country / province / region from location text
// Prioritize ES field; fall back to EN if ES is empty
// Uses local dictionary first, then Nominatim geocoding for unknown cities
let locationDebounce: ReturnType<typeof setTimeout> | null = null
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

// Load data
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
  // Load documents from vehicle data
  documents.value = (data.documents_json as DocumentEntry[]) || []

  if (data.vehicle_images) {
    const arr = data.vehicle_images as { id: string; url: string; position: number }[]
    images.value = [...arr].sort((a, b) => a.position - b.position)
  }

  // Derive subcategory from vehicle's type via junction table
  if (data.type_id) {
    const link = typeSubcategoryLinks.value.find((l) => l.type_id === data.type_id)
    if (link) {
      selectedSubcategoryId.value = link.subcategory_id
    }
  }
}

// Filter handlers
function updateFilterValue(id: string, value: string | number | boolean) {
  formData.value.attributes_json = { ...formData.value.attributes_json, [id]: value }
}

function getFilterValue(id: string): string | number | boolean | undefined {
  return formData.value.attributes_json[id] as string | number | boolean | undefined
}

// Validation
const isValid = computed(() => {
  return (
    formData.value.brand.trim() &&
    formData.value.model.trim() &&
    formData.value.type_id &&
    (formData.value.categories?.length || 0) > 0
  )
})

// Save
async function handleSave() {
  if (!isValid.value) {
    alert('Completa: Marca, Modelo, Categoría y Tipo')
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

// Delete
async function executeDelete() {
  if (!canDelete.value) return
  const ok = await deleteVehicle(vehicleId.value)
  if (ok) router.push('/admin/productos')
}

// Sell (placeholder)
function executeSell() {
  alert('Funcionalidad de venta pendiente de implementar')
  showSellModal.value = false
}

// Image handlers
async function handleImageUpload(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  uploadingImage.value = true

  const files = Array.from(input.files)
  const currentCount = images.value.length
  const availableSlots = 10 - currentCount

  if (availableSlots <= 0) {
    alert('Máximo 10 imágenes permitidas')
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
  // Reload to get real image IDs from DB
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

// Categories
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

// Characteristics
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

// Documents
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

// Invoice uploads (Drive)
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

// Maintenance
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

// Rentals
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

// Cost calculation (Coste + Mant - Renta)
const totalCost = computed(
  () => (formData.value.acquisition_cost || 0) + totalMaint.value - totalRental.value,
)

// Final profit if sold
const finalProfit = computed(() => {
  return (
    (sellData.value.sale_price || 0) -
    totalCost.value -
    (sellData.value.sale_price * sellData.value.commission) / 100
  )
})

function fmt(val: number | null | undefined): string {
  if (!val && val !== 0) return '—'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(val)
}
</script>

<template>
  <div class="pf">
    <!-- Loading -->
    <div v-if="loading && !vehicle" class="loading">Cargando...</div>

    <template v-else-if="vehicle">
      <!-- Header -->
      <header class="pf-header">
        <div class="pf-left">
          <button class="btn-icon" @click="handleCancel">←</button>
          <h1>{{ vehicle.brand }} {{ vehicle.model }}</h1>
          <span v-if="formData.featured" class="star">★</span>
        </div>
        <div class="pf-right">
          <button
            class="btn"
            :class="{ 'btn-drive-on': driveConnected }"
            :disabled="driveLoading"
            @click="
              driveConnected ? openVehicleFolder(fileNamingData, driveSection) : connectDrive()
            "
          >
            {{ driveConnected ? '📁 Drive' : '🔗 Drive' }}
          </button>
          <button
            v-if="formData.status !== 'sold'"
            class="btn btn-sell"
            @click="showSellModal = true"
          >
            € Vender
          </button>
          <button class="btn btn-danger-outline" @click="showDeleteModal = true">🗑️</button>
          <button class="btn" @click="handleCancel">Cancelar</button>
          <button class="btn btn-primary" :disabled="saving || !isValid" @click="handleSave">
            {{ saving ? 'Guardando...' : '💾 Guardar' }}
          </button>
        </div>
      </header>

      <div v-if="error" class="error-msg">{{ error }}</div>

      <div class="pf-body">
        <!-- === SECTION: Estado === -->
        <div class="section">
          <div class="section-title">Estado</div>
          <div class="estado-row">
            <label class="estado-opt" :class="{ active: formData.status === 'published' }">
              <input v-model="formData.status" type="radio" value="published" >
              <span class="dot green" />Publicado
            </label>
            <label class="estado-opt" :class="{ active: formData.status === 'draft' }">
              <input v-model="formData.status" type="radio" value="draft" >
              <span class="dot gray" />Oculto
            </label>
            <label class="estado-opt" :class="{ active: formData.status === 'rented' }">
              <input v-model="formData.status" type="radio" value="rented" >
              <span class="dot blue" />Alquilado
            </label>
            <label class="estado-opt" :class="{ active: formData.status === 'maintenance' }">
              <input v-model="formData.status" type="radio" value="maintenance" >
              <span class="dot red" />En Taller
            </label>
          </div>
        </div>

        <!-- === SECTION: Online/Offline === -->
        <div class="section">
          <div class="section-title">Visibilidad</div>
          <div class="row-2">
            <label class="radio-card" :class="{ active: formData.is_online }">
              <input v-model="formData.is_online" type="radio" :value="true" >
              <div class="radio-content">
                <strong>🌐 Web (Público)</strong>
                <span>Visible en la web pública</span>
              </div>
            </label>
            <label class="radio-card" :class="{ active: !formData.is_online }">
              <input v-model="formData.is_online" type="radio" :value="false" >
              <div class="radio-content">
                <strong>🤝 Intermediación (Interno)</strong>
                <span>Solo visible para administradores</span>
              </div>
            </label>
          </div>
          <div v-if="!formData.is_online" class="owner-fields">
            <div class="row-3">
              <div class="field">
                <label>Propietario</label>
                <input
                  v-model="formData.owner_name"
                  type="text"
                  placeholder="Nombre del propietario"
                >
              </div>
              <div class="field">
                <label>Contacto</label>
                <input v-model="formData.owner_contact" type="text" placeholder="Tel / Email" >
              </div>
              <div class="field">
                <label>Notas internas</label>
                <input v-model="formData.owner_notes" type="text" placeholder="Notas..." >
              </div>
            </div>
          </div>
        </div>

        <!-- === SECTION: Imágenes === -->
        <div class="section">
          <div class="section-title">Imágenes ({{ images.length }}/10)</div>
          <label for="image-upload-input" class="upload-zone-label">
            {{ uploadingImage ? 'Subiendo...' : '📷 Subir imágenes' }}
            <input
              id="image-upload-input"
              type="file"
              accept="image/*"
              multiple
              :disabled="uploadingImage"
              @change="handleImageUpload"
            >
          </label>
          <div v-if="cloudinaryUploading" class="upload-progress">
            <div class="progress-bar" :style="{ width: cloudinaryProgress + '%' }" />
            <span>{{ cloudinaryProgress }}%</span>
          </div>
          <div v-if="images.length" class="img-grid">
            <div
              v-for="(img, idx) in images"
              :key="img.id"
              class="img-item"
              :class="{ cover: idx === 0 }"
            >
              <img :src="img.url" :alt="`Imagen ${idx + 1}`" >
              <div class="img-overlay">
                <div class="img-actions">
                  <button v-if="idx !== 0" title="Portada" @click="setAsPortada(idx)">⭐</button>
                  <button v-if="idx > 0" title="Mover arriba" @click="moveImage(idx, 'up')">
                    ↑
                  </button>
                  <button
                    v-if="idx < images.length - 1"
                    title="Mover abajo"
                    @click="moveImage(idx, 'down')"
                  >
                    ↓
                  </button>
                  <button class="del" title="Eliminar" @click="handleDeleteImage(img.id)">×</button>
                </div>
              </div>
              <span v-if="idx === 0" class="cover-badge">PORTADA</span>
            </div>
          </div>
          <p v-else class="empty-msg">Sin imágenes. Sube hasta 10 imágenes.</p>
        </div>

        <!-- === SECTION: Categorías === -->
        <div class="section">
          <div class="section-title">Categorías *</div>
          <div class="cat-row">
            <label class="cat-check" :class="{ active: hasCat('venta') }">
              <input type="checkbox" :checked="hasCat('venta')" @change="toggleCategory('venta')" >
              Venta
            </label>
            <label class="cat-check" :class="{ active: hasCat('alquiler') }">
              <input
                type="checkbox"
                :checked="hasCat('alquiler')"
                @change="toggleCategory('alquiler')"
              >
              Alquiler
            </label>
            <label class="cat-check" :class="{ active: hasCat('terceros') }">
              <input
                type="checkbox"
                :checked="hasCat('terceros')"
                @change="toggleCategory('terceros')"
              >
              Terceros
            </label>
            <label class="feat-check">
              <input v-model="formData.featured" type="checkbox" >
              ★ Destacado
            </label>
          </div>
        </div>

        <!-- === SECTION: Datos básicos === -->
        <div class="section">
          <div class="section-title">Datos del vehículo</div>
          <div class="row-2">
            <div class="field">
              <label>Subcategoría</label>
              <select v-model="selectedSubcategoryId">
                <option :value="null">Seleccionar...</option>
                <option v-for="s in publishedSubcategories" :key="s.id" :value="s.id">
                  {{ s.name_es }}
                </option>
              </select>
            </div>
            <div class="field">
              <label>Tipo *</label>
              <select v-model="formData.type_id">
                <option :value="null" disabled>Seleccionar...</option>
                <option v-for="t in publishedTypes" :key="t.id" :value="t.id">
                  {{ t.name_es }}
                </option>
              </select>
            </div>
          </div>
          <div class="row-4">
            <div class="field">
              <label>Marca *</label>
              <input v-model="formData.brand" type="text" placeholder="Scania" >
            </div>
            <div class="field">
              <label>Modelo *</label>
              <input v-model="formData.model" type="text" placeholder="R450" >
            </div>
            <div class="field">
              <label>Año *</label>
              <input v-model.number="formData.year" type="number" placeholder="2023" >
            </div>
            <div class="field" />
          </div>
          <div class="row-4">
            <div class="field">
              <label>Matrícula</label>
              <input v-model="formData.plate" type="text" placeholder="1234-ABC" >
            </div>
            <div class="field">
              <label>Precio Venta €</label>
              <input v-model.number="formData.price" type="number" placeholder="0 = Consultar" >
            </div>
            <div v-if="showRentalPrice" class="field">
              <label>Precio Alquiler €/mes</label>
              <input
                v-model.number="formData.rental_price"
                type="number"
                placeholder="0 = Consultar"
              >
            </div>
            <div v-else class="field" />
            <div class="field" />
          </div>
          <div class="row-2">
            <div class="field">
              <label>Ubicación ES</label>
              <input v-model="formData.location" type="text" placeholder="Madrid, España" >
              <span v-if="formData.location_country" class="location-detected">
                {{ countryFlag(formData.location_country) }} {{ formData.location_country }}
                <template v-if="formData.location_province">
                  · {{ formData.location_province }}</template
                >
                <template v-if="formData.location_region">
                  · {{ formData.location_region }}</template
                >
              </span>
            </div>
            <div class="field">
              <label>Ubicación EN</label>
              <input v-model="formData.location_en" type="text" placeholder="Madrid, Spain" >
            </div>
          </div>
        </div>

        <!-- === SECTION: Descripción === -->
        <div class="section collapsible">
          <button class="section-toggle" @click="sections.description = !sections.description">
            <span>Descripción (300 char)</span>
            <span>{{ sections.description ? '−' : '+' }}</span>
          </button>
          <div v-if="sections.description" class="section-content">
            <div class="row-2">
              <div class="field">
                <label>Descripción ES</label>
                <textarea
                  v-model="formData.description_es"
                  rows="3"
                  maxlength="300"
                  placeholder="Descripción en español..."
                />
                <span class="char-count">{{ (formData.description_es || '').length }}/300</span>
              </div>
              <div class="field">
                <label>Descripción EN</label>
                <textarea
                  v-model="formData.description_en"
                  rows="3"
                  maxlength="300"
                  placeholder="Description in English..."
                />
                <span class="char-count">{{ (formData.description_en || '').length }}/300</span>
              </div>
            </div>
          </div>
        </div>

        <!-- === SECTION: Filtros dinámicos === -->
        <div v-if="dynamicFilters.length" class="section collapsible">
          <button class="section-toggle" @click="sections.filters = !sections.filters">
            <span>Filtros ({{ dynamicFilters.length }})</span>
            <span>{{ sections.filters ? '−' : '+' }}</span>
          </button>
          <div v-if="sections.filters" class="section-content">
            <div class="filters-grid">
              <div v-for="f in dynamicFilters" :key="f.id" class="field-sm">
                <label
                  >{{ f.label_es || f.name }}
                  <span v-if="f.unit" class="hint">({{ f.unit }})</span></label
                >
                <input
                  v-if="f.type === 'caja'"
                  type="text"
                  :value="getFilterValue(f.id)"
                  @input="updateFilterValue(f.id, ($event.target as HTMLInputElement).value)"
                >
                <template v-else-if="f.type === 'desplegable' || f.type === 'desplegable_tick'">
                  <select
                    v-if="((f.options?.choices as string[]) || []).length"
                    :value="getFilterValue(f.id)"
                    @change="updateFilterValue(f.id, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="">—</option>
                    <option v-for="c in (f.options?.choices as string[]) || []" :key="c" :value="c">
                      {{ c }}
                    </option>
                  </select>
                  <input
                    v-else
                    type="text"
                    :value="getFilterValue(f.id)"
                    placeholder="Valor libre"
                    @input="updateFilterValue(f.id, ($event.target as HTMLInputElement).value)"
                  >
                </template>
                <label v-else-if="f.type === 'tick'" class="tick-inline">
                  <input
                    type="checkbox"
                    :checked="!!getFilterValue(f.id)"
                    @change="updateFilterValue(f.id, ($event.target as HTMLInputElement).checked)"
                  >
                  Sí
                </label>
                <input
                  v-else
                  type="number"
                  :value="getFilterValue(f.id)"
                  @input="
                    updateFilterValue(f.id, Number(($event.target as HTMLInputElement).value))
                  "
                >
              </div>
            </div>
          </div>
        </div>

        <!-- === SECTION: Características adicionales === -->
        <div class="section collapsible">
          <button
            class="section-toggle"
            @click="sections.characteristics = !sections.characteristics"
          >
            <span>Características adicionales</span>
            <div class="toggle-actions">
              <button class="btn-add" @click.stop="addCharacteristic">+ Añadir</button>
              <span>{{ sections.characteristics ? '−' : '+' }}</span>
            </div>
          </button>
          <div v-if="sections.characteristics" class="section-content">
            <div v-if="characteristics.length === 0" class="empty-msg">
              Sin características adicionales. Pulsa "+ Añadir" para crear una.
            </div>
            <div v-for="c in characteristics" :key="c.id" class="char-row">
              <input v-model="c.key" type="text" placeholder="Nombre (ej: Motor)" >
              <input v-model="c.value_es" type="text" placeholder="Valor ES" >
              <input v-model="c.value_en" type="text" placeholder="Valor EN" >
              <button class="btn-x" @click="removeCharacteristic(c.id)">×</button>
            </div>
          </div>
        </div>

        <!-- === SECTION: Documentos (Google Drive) === -->
        <div class="section collapsible">
          <button class="section-toggle" @click="sections.documents = !sections.documents">
            <span>Documentos ({{ documents.length }})</span>
            <div class="toggle-actions">
              <button
                v-if="driveConnected"
                class="btn-add"
                title="Abrir carpeta en Drive"
                @click.stop="openDocumentsFolder(fileNamingData, driveSection)"
              >
                📁
              </button>
              <span>{{ sections.documents ? '−' : '+' }}</span>
            </div>
          </button>
          <div v-if="sections.documents" class="section-content">
            <div class="doc-upload-row">
              <select v-model="docTypeToUpload" class="doc-type-select">
                <option v-for="dt in docTypeOptions" :key="dt" :value="dt">{{ dt }}</option>
              </select>
              <label class="upload-zone-label compact">
                {{ driveLoading ? 'Subiendo...' : '📄 Subir documento' }}
                <input type="file" multiple :disabled="driveLoading" @change="handleDocUpload" >
              </label>
            </div>
            <div v-if="driveError" class="error-msg small">{{ driveError }}</div>
            <div v-if="documents.length === 0" class="empty-msg">Sin documentos.</div>
            <div v-for="d in documents" :key="d.id" class="doc-row">
              <a :href="d.url" target="_blank" rel="noopener" class="doc-link">📄 {{ d.name }}</a>
              <span class="doc-type-badge">{{ d.type }}</span>
              <button class="btn-x" @click="removeDocument(d.id)">×</button>
            </div>
          </div>
        </div>

        <!-- === SECTION: Cuentas (Financial) === -->
        <div class="section collapsible financial">
          <button class="section-toggle" @click="sections.financial = !sections.financial">
            <span>💰 Cuentas</span>
            <span class="cost-badge">COSTE TOTAL: {{ fmt(totalCost) }}</span>
          </button>
          <div v-if="sections.financial" class="section-content">
            <div class="row-3">
              <div class="field">
                <label>Precio mínimo €</label>
                <input
                  v-model.number="formData.min_price"
                  type="number"
                  placeholder="Precio mínimo aceptable"
                >
              </div>
              <div class="field">
                <label>Coste adquisición €</label>
                <input
                  v-model.number="formData.acquisition_cost"
                  type="number"
                  placeholder="Coste de compra"
                >
              </div>
              <div class="field">
                <label>Fecha adquisición</label>
                <input v-model="formData.acquisition_date" type="date" >
              </div>
            </div>

            <!-- Maintenance table -->
            <div class="records-block">
              <div class="records-header">
                <span>🔧 Mantenimiento (suma)</span>
                <button class="btn-add" @click="addMaint">+ Añadir</button>
              </div>
              <table v-if="formData.maintenance_records?.length" class="records-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Razón</th>
                    <th>Coste €</th>
                    <th>Factura</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in formData.maintenance_records" :key="r.id">
                    <td>
                      <input
                        type="date"
                        :value="r.date"
                        @input="
                          updateMaint(r.id, 'date', ($event.target as HTMLInputElement).value)
                        "
                      >
                    </td>
                    <td>
                      <input
                        type="text"
                        :value="r.reason"
                        placeholder="Razón"
                        @input="
                          updateMaint(r.id, 'reason', ($event.target as HTMLInputElement).value)
                        "
                      >
                    </td>
                    <td>
                      <input
                        type="number"
                        :value="r.cost"
                        placeholder="0"
                        @input="
                          updateMaint(
                            r.id,
                            'cost',
                            Number(($event.target as HTMLInputElement).value),
                          )
                        "
                      >
                    </td>
                    <td class="invoice-cell">
                      <template v-if="r.invoice_url">
                        <a
                          :href="r.invoice_url"
                          target="_blank"
                          rel="noopener"
                          class="invoice-link"
                          title="Ver factura"
                          >📎 Ver</a
                        >
                        <label class="invoice-change" title="Cambiar factura">
                          ↻
                          <input type="file" @change="handleMaintInvoiceUpload(r.id, $event)" >
                        </label>
                      </template>
                      <label v-else class="invoice-upload">
                        📎 Subir
                        <input
                          type="file"
                          :disabled="driveLoading"
                          @change="handleMaintInvoiceUpload(r.id, $event)"
                        >
                      </label>
                    </td>
                    <td><button class="btn-x" @click="removeMaint(r.id)">×</button></td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" class="text-right">Total Mant:</td>
                    <td colspan="3">
                      <strong>{{ fmt(totalMaint) }}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
              <div v-else class="empty-msg">Sin registros de mantenimiento.</div>
            </div>

            <!-- Rental income table -->
            <div class="records-block">
              <div class="records-header">
                <span>📅 Renta (resta)</span>
                <button class="btn-add" @click="addRental">+ Añadir</button>
              </div>
              <table v-if="formData.rental_records?.length" class="records-table">
                <thead>
                  <tr>
                    <th>Desde</th>
                    <th>Hasta</th>
                    <th>Razón</th>
                    <th>Importe €</th>
                    <th>Factura</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in formData.rental_records" :key="r.id">
                    <td>
                      <input
                        type="date"
                        :value="r.from_date"
                        @input="
                          updateRental(r.id, 'from_date', ($event.target as HTMLInputElement).value)
                        "
                      >
                    </td>
                    <td>
                      <input
                        type="date"
                        :value="r.to_date"
                        @input="
                          updateRental(r.id, 'to_date', ($event.target as HTMLInputElement).value)
                        "
                      >
                    </td>
                    <td>
                      <input
                        type="text"
                        :value="r.notes"
                        placeholder="Razón"
                        @input="
                          updateRental(r.id, 'notes', ($event.target as HTMLInputElement).value)
                        "
                      >
                    </td>
                    <td>
                      <input
                        type="number"
                        :value="r.amount"
                        placeholder="0"
                        @input="
                          updateRental(
                            r.id,
                            'amount',
                            Number(($event.target as HTMLInputElement).value),
                          )
                        "
                      >
                    </td>
                    <td class="invoice-cell">
                      <template v-if="r.invoice_url">
                        <a
                          :href="r.invoice_url"
                          target="_blank"
                          rel="noopener"
                          class="invoice-link"
                          title="Ver factura"
                          >📎 Ver</a
                        >
                        <label class="invoice-change" title="Cambiar factura">
                          ↻
                          <input type="file" @change="handleRentalInvoiceUpload(r.id, $event)" >
                        </label>
                      </template>
                      <label v-else class="invoice-upload">
                        📎 Subir
                        <input
                          type="file"
                          :disabled="driveLoading"
                          @change="handleRentalInvoiceUpload(r.id, $event)"
                        >
                      </label>
                    </td>
                    <td><button class="btn-x" @click="removeRental(r.id)">×</button></td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="4" class="text-right">Total Renta:</td>
                    <td colspan="2">
                      <strong class="green">{{ fmt(totalRental) }}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
              <div v-else class="empty-msg">Sin registros de alquiler.</div>
            </div>

            <!-- Cost summary -->
            <div class="cost-summary">
              <div class="cost-row">
                <span>Coste adquisición</span><span>{{ fmt(formData.acquisition_cost) }}</span>
              </div>
              <div class="cost-row">
                <span>+ Mantenimiento</span><span>{{ fmt(totalMaint) }}</span>
              </div>
              <div class="cost-row">
                <span>− Renta</span><span class="green">{{ fmt(totalRental) }}</span>
              </div>
              <div class="cost-row total">
                <span>COSTE TOTAL</span><span>{{ fmt(totalCost) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- === SECTION: Verificación === -->
        <div class="section collapsible verification">
          <button class="section-toggle" @click="sections.verification = !sections.verification">
            <span>🛡️ {{ $t('admin.vehicleEdit.verification') }}</span>
            <span
              v-if="verifCurrentLevel !== 'none'"
              class="verif-level-badge"
              :class="`level-${verifCurrentLevel}`"
            >
              {{ verifLevelBadge }}
            </span>
          </button>
          <div v-if="sections.verification" class="section-content">
            <!-- Current level indicator -->
            <div class="verif-current">
              <span class="verif-current-label">{{ $t('admin.vehicleEdit.currentLevel') }}:</span>
              <span class="verif-current-value" :class="`level-${verifCurrentLevel}`">
                {{ verifLevelBadge }} {{ $t(`verification.level.${verifCurrentLevel}`) }}
              </span>
            </div>

            <!-- Level progress -->
            <div class="verif-progress">
              <div
                v-for="lvl in verifLevels"
                :key="lvl.level"
                class="verif-progress-step"
                :class="{
                  active: verifLevelOrder[verifCurrentLevel] >= verifLevelOrder[lvl.level],
                  current: verifCurrentLevel === lvl.level,
                }"
              >
                <span class="step-badge">{{ lvl.badge || '○' }}</span>
                <span class="step-label">{{ $t(lvl.labelKey) }}</span>
              </div>
            </div>

            <!-- Document upload area -->
            <div class="verif-docs">
              <div class="verif-docs-header">
                <span>{{ $t('admin.vehicleEdit.documents') }}</span>
              </div>

              <!-- Upload form -->
              <div class="verif-upload-row">
                <select v-model="verifDocType" class="verif-select">
                  <option v-for="dt in verifDocTypes" :key="dt" :value="dt">
                    {{ $t(`verification.docType.${dt}`) }}
                  </option>
                </select>
                <label class="btn btn-outline verif-upload-btn">
                  {{ $t('admin.vehicleEdit.uploadDoc') }}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    hidden
                    :disabled="verifLoading"
                    @change="handleVerifUpload"
                  >
                </label>
              </div>

              <!-- Document list -->
              <div v-if="verifLoading" class="loading-small">{{ $t('common.loading') }}...</div>
              <div v-if="verifError" class="error-msg small">{{ verifError }}</div>

              <div v-if="verifDocs.length === 0 && !verifLoading" class="empty-msg">
                {{ $t('admin.vehicleEdit.noVerifDocs') }}
              </div>

              <div v-for="doc in verifDocs" :key="doc.id" class="verif-doc-row">
                <span class="verif-doc-type">{{ $t(`verification.docType.${doc.doc_type}`) }}</span>
                <span class="verif-doc-status" :class="`status-${doc.status}`">
                  {{ $t(`verification.status.${doc.status}`) }}
                </span>
                <a
                  v-if="doc.file_url"
                  :href="doc.file_url"
                  target="_blank"
                  rel="noopener"
                  class="verif-doc-link"
                >
                  {{ $t('admin.vehicleEdit.viewDoc') }}
                </a>
                <span v-if="doc.rejection_reason" class="verif-doc-rejection">
                  {{ doc.rejection_reason }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Delete Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-bg" @click.self="showDeleteModal = false">
        <div class="modal">
          <div class="modal-head">
            <span>🗑️ Eliminar vehículo</span>
            <button @click="showDeleteModal = false">×</button>
          </div>
          <div class="modal-body">
            <p>
              ¿Eliminar <strong>{{ vehicle?.brand }} {{ vehicle?.model }}</strong
              >?
            </p>
            <p class="warn">Se eliminarán las imágenes y documentos. No se puede deshacer.</p>
            <div class="field">
              <label>Escribe <strong>Borrar</strong> para confirmar:</label>
              <input v-model="deleteConfirm" type="text" placeholder="Borrar" >
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn" @click="showDeleteModal = false">Cancelar</button>
            <button class="btn btn-danger" :disabled="!canDelete" @click="executeDelete">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Sell Modal -->
    <Teleport to="body">
      <div v-if="showSellModal" class="modal-bg" @click.self="showSellModal = false">
        <div class="modal modal-lg">
          <div class="modal-head">
            <span>💰 Registrar Venta</span>
            <button @click="showSellModal = false">×</button>
          </div>
          <div class="modal-body">
            <p>
              Vender <strong>{{ vehicle?.brand }} {{ vehicle?.model }}</strong>
            </p>
            <div class="row-2">
              <div class="field">
                <label>Precio venta final €</label>
                <input v-model.number="sellData.sale_price" type="number" placeholder="0" >
              </div>
              <div class="field">
                <label>Comisión %</label>
                <input v-model.number="sellData.commission" type="number" placeholder="0" >
              </div>
            </div>
            <div class="row-2">
              <div class="field">
                <label>Comprador</label>
                <input v-model="sellData.buyer" type="text" placeholder="Nombre / Empresa" >
              </div>
              <div class="field">
                <label>Fecha venta</label>
                <input v-model="sellData.sale_date" type="date" >
              </div>
            </div>
            <div class="field">
              <label>Notas</label>
              <textarea v-model="sellData.notes" rows="2" placeholder="Notas adicionales..." />
            </div>
            <div class="profit-box">
              <div class="profit-row">
                <span>Precio venta</span><span>{{ fmt(sellData.sale_price) }}</span>
              </div>
              <div class="profit-row">
                <span>− Coste total</span><span>{{ fmt(totalCost) }}</span>
              </div>
              <div class="profit-row">
                <span>− Comisión ({{ sellData.commission }}%)</span
                ><span>{{ fmt((sellData.sale_price * sellData.commission) / 100) }}</span>
              </div>
              <div class="profit-row final" :class="finalProfit >= 0 ? 'pos' : 'neg'">
                <span>BENEFICIO FINAL</span>
                <span>{{ fmt(finalProfit) }}</span>
              </div>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn" @click="showSellModal = false">Cancelar</button>
            <button class="btn btn-primary" @click="executeSell">Confirmar Venta</button>
          </div>
        </div>
      </div>
    </Teleport>
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

/* Header */
.pf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 16px;
  position: sticky;
  top: 0;
  background: #f9fafb;
  z-index: 50;
}
.pf-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pf-left h1 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}
.pf-left .star {
  color: #f59e0b;
  font-size: 1.2rem;
}
.pf-right {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
}
.btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}
.btn-primary {
  background: #23424a;
  color: #fff;
  border: none;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-sell {
  background: #16a34a;
  color: #fff;
  border: none;
}
.btn-danger-outline {
  border-color: #dc2626;
  color: #dc2626;
}
.btn-danger {
  background: #dc2626;
  color: #fff;
  border: none;
}
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-msg {
  background: #fef2f2;
  color: #dc2626;
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 12px;
}

/* Body */
.pf-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Sections */
.section {
  background: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* Collapsible */
.collapsible {
  padding: 0;
}
.section-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
}
.section-toggle:hover {
  background: #f9fafb;
}
.section-content {
  padding: 0 16px 16px;
  border-top: 1px solid #f3f4f6;
}
.toggle-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Estado */
.estado-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.estado-opt {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.estado-opt input {
  display: none;
}
.estado-opt.active {
  border-color: #23424a;
  background: #f0f9ff;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot.green {
  background: #22c55e;
}
.dot.gray {
  background: #9ca3af;
}
.dot.blue {
  background: #3b82f6;
}
.dot.red {
  background: #ef4444;
}

/* Radio cards */
.radio-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
}
.radio-card input {
  margin-top: 2px;
}
.radio-card.active {
  border-color: #23424a;
  background: #f0f9ff;
}
.radio-content {
  display: flex;
  flex-direction: column;
}
.radio-content strong {
  font-size: 0.9rem;
}
.radio-content span {
  font-size: 0.75rem;
  color: #6b7280;
}
.owner-fields {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #f59e0b;
  background: #fffbeb;
  margin: 12px -16px -12px;
  padding: 12px 16px;
  border-radius: 0 0 8px 8px;
}

/* Categories */
.cat-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}
.cat-check {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.cat-check input {
  margin: 0;
}
.cat-check.active {
  border-color: #23424a;
  background: #23424a;
  color: #fff;
}
.feat-check {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: #f59e0b;
  cursor: pointer;
  margin-left: auto;
}
.feat-check input {
  margin: 0;
}

/* Rows */
.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.row-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}
.row-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

/* Fields */
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.field label {
  font-size: 0.7rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
}
.field input,
.field select,
.field textarea {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  font-size: 0.85rem;
}
.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: #23424a;
}
.field-sm {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.field-sm label {
  font-size: 0.65rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
}
.field-sm input,
.field-sm select {
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 0.8rem;
}
.hint {
  font-weight: normal;
  color: #9ca3af;
}
.char-count {
  font-size: 0.65rem;
  color: #9ca3af;
  text-align: right;
}

/* Filters grid */
.filters-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding-top: 10px;
}
.tick-inline {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  cursor: pointer;
}

/* Images & Upload */
.hidden-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
.upload-zone-label {
  display: block;
  width: 100%;
  padding: 16px;
  text-align: center;
  background: #f9fafb;
  border: 2px dashed #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 12px;
}
.upload-zone-label:hover {
  border-color: #23424a;
  background: #f3f4f6;
}
.upload-zone-label input[type='file'] {
  display: none;
}

.upload-zone {
  display: block;
  width: 100%;
  padding: 16px;
  text-align: center;
  background: #f9fafb;
  border: 2px dashed #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 12px;
}
.upload-zone:hover {
  border-color: #23424a;
  background: #f3f4f6;
}

.img-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.img-item {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid transparent;
}
.img-item.cover {
  border-color: #23424a;
}
.img-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.img-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: opacity 0.2s;
}
.img-item:hover .img-overlay {
  opacity: 1;
}
.img-actions {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 4px;
}
.img-actions button {
  width: 26px;
  height: 26px;
  border: none;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
}
.img-actions button.del {
  background: #fee2e2;
  color: #dc2626;
}
.cover-badge {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: #23424a;
  color: #fff;
  font-size: 0.6rem;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 600;
}

/* Characteristics */
.char-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 32px;
  gap: 8px;
  margin-bottom: 8px;
}
.char-row input {
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 0.8rem;
}

/* Documents */
.doc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: #f9fafb;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 0.8rem;
}

/* Buttons */
.btn-add {
  padding: 4px 10px;
  background: #23424a;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
}
.btn-x {
  width: 24px;
  height: 24px;
  border: none;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

/* Empty message */
.empty-msg {
  text-align: center;
  color: #9ca3af;
  font-size: 0.8rem;
  padding: 16px;
}

/* Financial section */
.financial {
  border: 1px solid #d1d5db;
}
.cost-badge {
  padding: 4px 10px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Records table */
.records-block {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}
.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 600;
  font-size: 0.85rem;
}
.records-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}
.records-table th {
  text-align: left;
  padding: 6px 8px;
  background: #f3f4f6;
  font-weight: 500;
  font-size: 0.7rem;
  text-transform: uppercase;
}
.records-table td {
  padding: 4px 8px;
  border-bottom: 1px solid #f3f4f6;
}
.records-table input {
  width: 100%;
  padding: 4px 6px;
  border: 1px solid #e5e7eb;
  border-radius: 3px;
  font-size: 0.75rem;
}
.records-table tfoot td {
  padding-top: 8px;
  border: none;
}
.text-right {
  text-align: right;
}

/* Cost summary */
.cost-summary {
  margin-top: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
}
.cost-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #6b7280;
  padding: 4px 0;
}
.cost-row.total {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
  font-weight: 700;
  font-size: 0.9rem;
  color: #374151;
}
.green {
  color: #16a34a;
}

/* Modal */
.modal-bg {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}
.modal {
  background: #fff;
  border-radius: 10px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}
.modal-lg {
  max-width: 500px;
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
}
.modal-head button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #9ca3af;
}
.modal-body {
  padding: 16px;
}
.modal-body .warn {
  color: #f59e0b;
  font-size: 0.85rem;
  margin-top: 8px;
}
.modal-body .field {
  margin-top: 12px;
}
.modal-body .row-2 {
  margin-bottom: 12px;
}
.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 10px 10px;
}

/* Profit box in sell modal */
.profit-box {
  margin-top: 16px;
  padding: 12px;
  background: #f3f4f6;
  border-radius: 6px;
}
.profit-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #6b7280;
  padding: 4px 0;
}
.profit-row.final {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #d1d5db;
  font-weight: 700;
  font-size: 1rem;
}
.profit-row.final.pos {
  color: #16a34a;
}
.profit-row.final.neg {
  color: #dc2626;
}

/* Mobile */
@media (max-width: 768px) {
  .row-2,
  .row-3,
  .row-4 {
    grid-template-columns: 1fr;
  }
  .estado-row {
    flex-direction: column;
  }
  .cat-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .feat-check {
    margin-left: 0;
    margin-top: 8px;
  }
  .filters-grid {
    grid-template-columns: 1fr;
  }
  .char-row {
    grid-template-columns: 1fr;
  }
  .records-table {
    font-size: 0.7rem;
  }
  .img-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .pf-right {
    flex-wrap: wrap;
  }
}

.location-detected {
  display: block;
  font-size: 11px;
  color: #10b981;
  margin-top: 2px;
  font-weight: 500;
}

/* Drive connection button */
.btn-drive-on {
  background: #f0fdf4;
  border-color: #22c55e;
  color: #16a34a;
}

/* Upload progress bar */
.upload-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.upload-progress .progress-bar {
  flex: 1;
  height: 6px;
  background: #23424a;
  border-radius: 3px;
  transition: width 0.2s;
}
.upload-progress span {
  font-size: 0.7rem;
  color: #6b7280;
}

/* Document upload row */
.doc-upload-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  align-items: stretch;
}
.doc-type-select {
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  font-size: 0.8rem;
  min-width: 140px;
}
.upload-zone-label.compact {
  flex: 1;
  padding: 8px 12px;
  margin-bottom: 0;
}
.error-msg.small {
  font-size: 0.75rem;
  padding: 6px 10px;
  margin-bottom: 8px;
}

/* Document links */
.doc-link {
  color: #23424a;
  text-decoration: none;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.doc-link:hover {
  text-decoration: underline;
}
.doc-type-badge {
  padding: 2px 6px;
  background: #e5e7eb;
  border-radius: 3px;
  font-size: 0.65rem;
  color: #6b7280;
  text-transform: uppercase;
  flex-shrink: 0;
}
.doc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #f9fafb;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 0.8rem;
}

/* Invoice upload cells */
.invoice-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}
.invoice-link {
  color: #23424a;
  text-decoration: none;
  font-size: 0.75rem;
}
.invoice-link:hover {
  text-decoration: underline;
}
.invoice-upload,
.invoice-change {
  cursor: pointer;
  font-size: 0.7rem;
  color: #6b7280;
}
.invoice-upload:hover,
.invoice-change:hover {
  color: #23424a;
}
.invoice-upload input,
.invoice-change input {
  display: none;
}

/* Verification section */
.verif-current {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 6px;
  margin-bottom: 12px;
}
.verif-current-label {
  font-size: 13px;
  color: #6b7280;
}
.verif-current-value {
  font-weight: 600;
  font-size: 14px;
}
.verif-current-value.level-none {
  color: #9ca3af;
}
.verif-current-value.level-verified {
  color: #10b981;
}
.verif-current-value.level-extended {
  color: #059669;
}
.verif-current-value.level-detailed {
  color: #0d9488;
}
.verif-current-value.level-audited {
  color: #f59e0b;
}
.verif-current-value.level-certified {
  color: #8b5cf6;
}

.verif-level-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.verif-level-badge.level-verified {
  background: #d1fae5;
  color: #059669;
}
.verif-level-badge.level-extended {
  background: #d1fae5;
  color: #047857;
}
.verif-level-badge.level-detailed {
  background: #ccfbf1;
  color: #0d9488;
}
.verif-level-badge.level-audited {
  background: #fef3c7;
  color: #d97706;
}
.verif-level-badge.level-certified {
  background: #ede9fe;
  color: #7c3aed;
}

.verif-progress {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.verif-progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 60px;
  padding: 6px 4px;
  border-radius: 6px;
  background: #f3f4f6;
  opacity: 0.5;
  transition: all 0.2s;
}
.verif-progress-step.active {
  opacity: 1;
  background: #ecfdf5;
}
.verif-progress-step.current {
  outline: 2px solid #10b981;
}
.step-badge {
  font-size: 16px;
}
.step-label {
  font-size: 10px;
  text-align: center;
  color: #6b7280;
}

.verif-docs-header {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 8px;
  color: #374151;
}

.verif-upload-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.verif-select {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  min-height: 44px;
}
.verif-upload-btn {
  white-space: nowrap;
  min-height: 44px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.verif-doc-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
  flex-wrap: wrap;
}
.verif-doc-type {
  font-size: 13px;
  font-weight: 500;
  flex: 1;
  min-width: 120px;
}
.verif-doc-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}
.verif-doc-status.status-pending {
  background: #fef3c7;
  color: #d97706;
}
.verif-doc-status.status-verified {
  background: #d1fae5;
  color: #059669;
}
.verif-doc-status.status-rejected {
  background: #fee2e2;
  color: #dc2626;
}
.verif-doc-link {
  font-size: 12px;
  color: #2563eb;
  text-decoration: none;
}
.verif-doc-link:hover {
  text-decoration: underline;
}
.verif-doc-rejection {
  font-size: 12px;
  color: #dc2626;
  width: 100%;
}

.loading-small {
  font-size: 13px;
  color: #6b7280;
  padding: 8px 0;
}
</style>
