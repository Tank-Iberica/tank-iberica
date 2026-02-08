<script setup lang="ts">
import {
  useAdminVehicles,
  type VehicleFormData,
  type MaintenanceEntry,
  type RentalEntry,
} from '~/composables/admin/useAdminVehicles'
import { useAdminTypes } from '~/composables/admin/useAdminTypes'
import { useAdminSubcategories } from '~/composables/admin/useAdminSubcategories'
import { useAdminFilters, type AdminFilter } from '~/composables/admin/useAdminFilters'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const router = useRouter()

const { saving, error, createVehicle, addImage: _addImage } = useAdminVehicles()
const { types, fetchTypes } = useAdminTypes()
const { subcategories, fetchSubcategories } = useAdminSubcategories()
const { filters: allFilters, fetchFilters } = useAdminFilters()

// Extended interfaces for additional fields
interface CharacteristicEntry {
  id: string
  key: string
  value_es: string
  value_en: string
}

// Form data
const selectedSubcategoryId = ref<string | null>(null)

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
  filters_json: {},
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

// Additional fields
const characteristics = ref<CharacteristicEntry[]>([])
const documents = ref<{ id: string; name: string; url: string }[]>([])

// Pending images (selected but not yet uploaded)
interface PendingImage {
  id: string
  file: File
  previewUrl: string
}
const pendingImages = ref<PendingImage[]>([])
const uploadingImages = ref(false)

// Collapsible sections
const sections = reactive({
  description: false,
  filters: true,
  characteristics: false,
  documents: false,
  financial: false,
})

// Dynamic filters
const dynamicFilters = computed<AdminFilter[]>(() => {
  if (!formData.value.type_id) return []
  const sub = types.value.find(s => s.id === formData.value.type_id)
  if (!sub?.applicable_filters?.length) {
    return allFilters.value.filter(f => f.status === 'published')
  }
  return allFilters.value.filter(f =>
    sub.applicable_filters?.includes(f.id) && f.status !== 'archived',
  )
})

// Published subcategories
const publishedSubcategories = computed(() =>
  subcategories.value.filter(s => s.status === 'published'),
)

// Junction data: type ↔ subcategory links
const typeSubcategoryLinks = ref<{ type_id: string; subcategory_id: string }[]>([])

async function fetchTypeSubcategoryLinks() {
  const supabase = useSupabaseClient()
  const { data } = await supabase
    .from('type_subcategories')
    .select('type_id, subcategory_id')
  typeSubcategoryLinks.value = (data as { type_id: string; subcategory_id: string }[]) || []
}

// Published types filtered by selected subcategory
const publishedTypes = computed(() => {
  const all = types.value.filter(t => t.status === 'published')
  if (!selectedSubcategoryId.value) return all
  const linkedTypeIds = new Set(
    typeSubcategoryLinks.value
      .filter(l => l.subcategory_id === selectedSubcategoryId.value)
      .map(l => l.type_id)
  )
  return all.filter(t => linkedTypeIds.has(t.id))
})

// When subcategory changes, reset type_id if not in filtered types
watch(selectedSubcategoryId, () => {
  if (selectedSubcategoryId.value && formData.value.type_id) {
    if (!publishedTypes.value.some(t => t.id === formData.value.type_id)) {
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
  await Promise.all([fetchSubcategories(), fetchTypes(), fetchFilters(), fetchTypeSubcategoryLinks()])
})

// Filter handlers
function updateFilterValue(id: string, value: string | number | boolean) {
  formData.value.filters_json = { ...formData.value.filters_json, [id]: value }
}

function getFilterValue(id: string): string | number | boolean | undefined {
  return formData.value.filters_json[id] as string | number | boolean | undefined
}

// Validation
const isValid = computed(() => {
  return formData.value.brand.trim() &&
    formData.value.model.trim() &&
    formData.value.type_id &&
    (formData.value.categories?.length || 0) > 0
})

// Save
async function handleSave() {
  if (!isValid.value) {
    alert('Completa: Marca, Modelo, Categoría y Tipo')
    return
  }

  // 1. Create vehicle first
  const vehicleId = await createVehicle(formData.value)
  if (!vehicleId) return

  // 2. Upload pending images if any
  if (pendingImages.value.length > 0) {
    uploadingImages.value = true

    for (const img of pendingImages.value) {
      // TODO: Replace with actual Cloudinary upload
      // For now, we'll skip the upload and show a message
      // In production, this would be:
      // const cloudinaryResult = await uploadToCloudinary(img.file)
      // await addImage(vehicleId, {
      //   cloudinary_public_id: cloudinaryResult.public_id,
      //   url: cloudinaryResult.secure_url,
      //   thumbnail_url: cloudinaryResult.thumbnail_url,
      // })

      // Clean up preview URL
      URL.revokeObjectURL(img.previewUrl)
    }

    uploadingImages.value = false

    if (pendingImages.value.length > 0) {
      alert(`Vehículo creado. ${pendingImages.value.length} imagen(es) pendiente(s) de subir - configura Cloudinary para completar la subida.`)
    }
  }

  // 3. Redirect to products list
  router.push('/admin/productos')
}

function handleCancel() {
  router.push('/admin/productos')
}

// Categories
function toggleCategory(cat: string) {
  const cats = formData.value.categories || []
  const idx = cats.indexOf(cat)
  if (idx === -1) formData.value.categories = [...cats, cat]
  else formData.value.categories = cats.filter(c => c !== cat)
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
  characteristics.value = characteristics.value.filter(c => c.id !== id)
}

// Pending Images
function handleImageSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return

  const maxImages = 10
  const currentCount = pendingImages.value.length
  const availableSlots = maxImages - currentCount

  if (availableSlots <= 0) {
    alert('Máximo 10 imágenes permitidas')
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
  const img = pendingImages.value.find(i => i.id === id)
  if (img) {
    URL.revokeObjectURL(img.previewUrl)
    pendingImages.value = pendingImages.value.filter(i => i.id !== id)
  }
}

function movePendingImage(index: number, direction: 'up' | 'down') {
  const newIndex = direction === 'up' ? index - 1 : index + 1
  if (newIndex < 0 || newIndex >= pendingImages.value.length) return
  const arr = [...pendingImages.value]
  ;[arr[index], arr[newIndex]] = [arr[newIndex], arr[index]]
  pendingImages.value = arr
}

// Documents
function handleDocUpload(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  alert('La subida de documentos requiere configuración del almacenamiento.')
  input.value = ''
}

function removeDocument(id: string) {
  documents.value = documents.value.filter(d => d.id !== id)
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
  formData.value.maintenance_records = formData.value.maintenance_records?.filter(r => r.id !== id) || []
}

function updateMaint(id: string, field: keyof MaintenanceEntry, val: string | number) {
  formData.value.maintenance_records = formData.value.maintenance_records?.map(r =>
    r.id === id ? { ...r, [field]: val } : r,
  ) || []
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
  formData.value.rental_records = formData.value.rental_records?.filter(r => r.id !== id) || []
}

function updateRental(id: string, field: keyof RentalEntry, val: string | number) {
  formData.value.rental_records = formData.value.rental_records?.map(r =>
    r.id === id ? { ...r, [field]: val } : r,
  ) || []
}

const totalRental = computed(() =>
  (formData.value.rental_records || []).reduce((s, r) => s + (r.amount || 0), 0),
)

// Cost calculation (like original: Coste + Mant - Renta)
const totalCost = computed(() =>
  (formData.value.acquisition_cost || 0) + totalMaint.value - totalRental.value,
)

function fmt(val: number | null | undefined): string {
  if (!val && val !== 0) return '—'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(val)
}
</script>

<template>
  <div class="pf">
    <!-- Header -->
    <header class="pf-header">
      <div class="pf-left">
        <button class="btn-icon" @click="handleCancel">←</button>
        <h1>Nuevo Vehículo</h1>
      </div>
      <div class="pf-right">
        <button class="btn" @click="handleCancel">Cancelar</button>
        <button class="btn btn-primary" :disabled="saving || uploadingImages || !isValid" @click="handleSave">
          {{ uploadingImages ? 'Subiendo imágenes...' : saving ? 'Guardando...' : '💾 Guardar' }}
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
            <input v-model="formData.status" type="radio" value="published">
            <span class="dot green" />Publicado
          </label>
          <label class="estado-opt" :class="{ active: formData.status === 'draft' }">
            <input v-model="formData.status" type="radio" value="draft">
            <span class="dot gray" />Oculto
          </label>
          <label class="estado-opt" :class="{ active: formData.status === 'rented' }">
            <input v-model="formData.status" type="radio" value="rented">
            <span class="dot blue" />Alquilado
          </label>
          <label class="estado-opt" :class="{ active: formData.status === 'maintenance' }">
            <input v-model="formData.status" type="radio" value="maintenance">
            <span class="dot red" />En Taller
          </label>
        </div>
      </div>

      <!-- === SECTION: Online/Offline === -->
      <div class="section">
        <div class="section-title">Visibilidad</div>
        <div class="row-2">
          <label class="radio-card" :class="{ active: formData.is_online }">
            <input v-model="formData.is_online" type="radio" :value="true">
            <div class="radio-content">
              <strong>🌐 Web (Público)</strong>
              <span>Visible en la web pública</span>
            </div>
          </label>
          <label class="radio-card" :class="{ active: !formData.is_online }">
            <input v-model="formData.is_online" type="radio" :value="false">
            <div class="radio-content">
              <strong>🤝 Intermediación (Interno)</strong>
              <span>Solo visible para administradores</span>
            </div>
          </label>
        </div>
        <!-- Owner fields for offline -->
        <div v-if="!formData.is_online" class="owner-fields">
          <div class="row-3">
            <div class="field">
              <label>Propietario</label>
              <input v-model="formData.owner_name" type="text" placeholder="Nombre del propietario">
            </div>
            <div class="field">
              <label>Contacto</label>
              <input v-model="formData.owner_contact" type="text" placeholder="Tel / Email">
            </div>
            <div class="field">
              <label>Notas internas</label>
              <input v-model="formData.owner_notes" type="text" placeholder="Notas...">
            </div>
          </div>
        </div>
      </div>

      <!-- === SECTION: Imágenes === -->
      <div class="section">
        <div class="section-title">Imágenes ({{ pendingImages.length }}/10)</div>
        <label for="image-upload-input" class="upload-zone-label">
          📷 Seleccionar imágenes
          <input
            id="image-upload-input"
            type="file"
            accept="image/*"
            multiple
            @change="handleImageSelect"
          >
        </label>
        <div v-if="pendingImages.length" class="img-grid">
          <div v-for="(img, idx) in pendingImages" :key="img.id" class="img-item" :class="{ cover: idx === 0 }">
            <img :src="img.previewUrl" :alt="`Imagen ${idx + 1}`">
            <div class="img-overlay">
              <div class="img-actions">
                <button v-if="idx > 0" type="button" title="Mover arriba" @click="movePendingImage(idx, 'up')">↑</button>
                <button v-if="idx < pendingImages.length - 1" type="button" title="Mover abajo" @click="movePendingImage(idx, 'down')">↓</button>
                <button type="button" class="del" title="Eliminar" @click="removePendingImage(img.id)">×</button>
              </div>
            </div>
            <span v-if="idx === 0" class="cover-badge">PORTADA</span>
          </div>
        </div>
        <p v-if="pendingImages.length" class="img-hint">
          Las imágenes se subirán al guardar el vehículo
        </p>
      </div>

      <!-- === SECTION: Categorías === -->
      <div class="section">
        <div class="section-title">Categorías *</div>
        <div class="cat-row">
          <label class="cat-check" :class="{ active: hasCat('venta') }">
            <input type="checkbox" :checked="hasCat('venta')" @change="toggleCategory('venta')">
            Venta
          </label>
          <label class="cat-check" :class="{ active: hasCat('alquiler') }">
            <input type="checkbox" :checked="hasCat('alquiler')" @change="toggleCategory('alquiler')">
            Alquiler
          </label>
          <label class="cat-check" :class="{ active: hasCat('terceros') }">
            <input type="checkbox" :checked="hasCat('terceros')" @change="toggleCategory('terceros')">
            Terceros
          </label>
          <label class="feat-check">
            <input v-model="formData.featured" type="checkbox">
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
              <option v-for="s in publishedSubcategories" :key="s.id" :value="s.id">{{ s.name_es }}</option>
            </select>
          </div>
          <div class="field">
            <label>Tipo *</label>
            <select v-model="formData.type_id">
              <option :value="null" disabled>Seleccionar...</option>
              <option v-for="t in publishedTypes" :key="t.id" :value="t.id">{{ t.name_es }}</option>
            </select>
          </div>
        </div>
        <div class="row-4">
          <div class="field">
            <label>Marca *</label>
            <input v-model="formData.brand" type="text" placeholder="Scania">
          </div>
          <div class="field">
            <label>Modelo *</label>
            <input v-model="formData.model" type="text" placeholder="R450">
          </div>
          <div class="field">
            <label>Año *</label>
            <input v-model.number="formData.year" type="number" placeholder="2023">
          </div>
          <div class="field" />
        </div>
        <div class="row-4">
          <div class="field">
            <label>Matrícula</label>
            <input v-model="formData.plate" type="text" placeholder="1234-ABC">
          </div>
          <div class="field">
            <label>Precio Venta €</label>
            <input v-model.number="formData.price" type="number" placeholder="0 = Consultar">
          </div>
          <div v-if="showRentalPrice" class="field">
            <label>Precio Alquiler €/mes</label>
            <input v-model.number="formData.rental_price" type="number" placeholder="0 = Consultar">
          </div>
          <div v-else class="field" />
          <div class="field" />
        </div>
        <div class="row-2">
          <div class="field">
            <label>Ubicación ES</label>
            <input v-model="formData.location" type="text" placeholder="Madrid, España">
            <span v-if="formData.location_country" class="location-detected">
              {{ countryFlag(formData.location_country) }} {{ formData.location_country }}
              <template v-if="formData.location_province"> · {{ formData.location_province }}</template>
              <template v-if="formData.location_region"> · {{ formData.location_region }}</template>
            </span>
          </div>
          <div class="field">
            <label>Ubicación EN</label>
            <input v-model="formData.location_en" type="text" placeholder="Madrid, Spain">
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
              <textarea v-model="formData.description_es" rows="3" maxlength="300" placeholder="Descripción en español..." />
              <span class="char-count">{{ (formData.description_es || '').length }}/300</span>
            </div>
            <div class="field">
              <label>Descripción EN</label>
              <textarea v-model="formData.description_en" rows="3" maxlength="300" placeholder="Description in English..." />
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
              <label>{{ f.label_es || f.name }} <span v-if="f.unit" class="hint">({{ f.unit }})</span></label>
              <input
                v-if="f.type === 'caja'"
                type="text"
                :value="getFilterValue(f.id)"
                @input="updateFilterValue(f.id, ($event.target as HTMLInputElement).value)"
              >
              <select
                v-else-if="f.type === 'desplegable' || f.type === 'desplegable_tick'"
                :value="getFilterValue(f.id)"
                @change="updateFilterValue(f.id, ($event.target as HTMLSelectElement).value)"
              >
                <option value="">—</option>
                <option v-for="c in (f.options?.choices || [])" :key="c" :value="c">{{ c }}</option>
              </select>
              <label v-else-if="f.type === 'tick'" class="tick-inline">
                <input
                  type="checkbox"
                  :checked="!!getFilterValue(f.id)"
                  @change="updateFilterValue(f.id, ($event.target as HTMLInputElement).checked)"
                > Sí
              </label>
              <input
                v-else
                type="number"
                :value="getFilterValue(f.id)"
                @input="updateFilterValue(f.id, Number(($event.target as HTMLInputElement).value))"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- === SECTION: Características adicionales === -->
      <div class="section collapsible">
        <button class="section-toggle" @click="sections.characteristics = !sections.characteristics">
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
            <input v-model="c.key" type="text" placeholder="Nombre (ej: Motor)">
            <input v-model="c.value_es" type="text" placeholder="Valor ES">
            <input v-model="c.value_en" type="text" placeholder="Valor EN">
            <button class="btn-x" @click="removeCharacteristic(c.id)">×</button>
          </div>
        </div>
      </div>

      <!-- === SECTION: Documentos === -->
      <div class="section collapsible">
        <button class="section-toggle" @click="sections.documents = !sections.documents">
          <span>Documentos ({{ documents.length }})</span>
          <span>{{ sections.documents ? '−' : '+' }}</span>
        </button>
        <div v-if="sections.documents" class="section-content">
          <label for="doc-upload-input" class="upload-zone-label">
            📄 Subir documentos
            <input
              id="doc-upload-input"
              type="file"
              multiple
              @change="handleDocUpload"
            >
          </label>
          <div v-if="documents.length === 0" class="empty-msg">Sin documentos.</div>
          <div v-for="d in documents" :key="d.id" class="doc-row">
            <span>📄 {{ d.name }}</span>
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
              <input v-model.number="formData.min_price" type="number" placeholder="Precio mínimo aceptable">
            </div>
            <div class="field">
              <label>Coste adquisición €</label>
              <input v-model.number="formData.acquisition_cost" type="number" placeholder="Coste de compra">
            </div>
            <div class="field">
              <label>Fecha adquisición</label>
              <input v-model="formData.acquisition_date" type="date">
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
                  <td><input type="date" :value="r.date" @input="updateMaint(r.id, 'date', ($event.target as HTMLInputElement).value)"></td>
                  <td><input type="text" :value="r.reason" placeholder="Razón" @input="updateMaint(r.id, 'reason', ($event.target as HTMLInputElement).value)"></td>
                  <td><input type="number" :value="r.cost" placeholder="0" @input="updateMaint(r.id, 'cost', Number(($event.target as HTMLInputElement).value))"></td>
                  <td><input type="text" :value="r.invoice_url" placeholder="URL factura" @input="updateMaint(r.id, 'invoice_url' as keyof MaintenanceEntry, ($event.target as HTMLInputElement).value)"></td>
                  <td><button class="btn-x" @click="removeMaint(r.id)">×</button></td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" class="text-right">Total Mant:</td>
                  <td colspan="3"><strong>{{ fmt(totalMaint) }}</strong></td>
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
                  <th />
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in formData.rental_records" :key="r.id">
                  <td><input type="date" :value="r.from_date" @input="updateRental(r.id, 'from_date', ($event.target as HTMLInputElement).value)"></td>
                  <td><input type="date" :value="r.to_date" @input="updateRental(r.id, 'to_date', ($event.target as HTMLInputElement).value)"></td>
                  <td><input type="text" :value="r.notes" placeholder="Razón" @input="updateRental(r.id, 'notes', ($event.target as HTMLInputElement).value)"></td>
                  <td><input type="number" :value="r.amount" placeholder="0" @input="updateRental(r.id, 'amount', Number(($event.target as HTMLInputElement).value))"></td>
                  <td><button class="btn-x" @click="removeRental(r.id)">×</button></td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="text-right">Total Renta:</td>
                  <td colspan="2"><strong class="green">{{ fmt(totalRental) }}</strong></td>
                </tr>
              </tfoot>
            </table>
            <div v-else class="empty-msg">Sin registros de alquiler.</div>
          </div>

          <!-- Cost summary -->
          <div class="cost-summary">
            <div class="cost-row"><span>Coste adquisición</span><span>{{ fmt(formData.acquisition_cost) }}</span></div>
            <div class="cost-row"><span>+ Mantenimiento</span><span>{{ fmt(totalMaint) }}</span></div>
            <div class="cost-row"><span>− Renta</span><span class="green">{{ fmt(totalRental) }}</span></div>
            <div class="cost-row total"><span>COSTE TOTAL</span><span>{{ fmt(totalCost) }}</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pf { max-width: 900px; margin: 0 auto; padding-bottom: 40px; }

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
.pf-left { display: flex; align-items: center; gap: 10px; }
.pf-left h1 { margin: 0; font-size: 1.1rem; font-weight: 600; }
.pf-right { display: flex; gap: 8px; }

.btn-icon {
  width: 32px; height: 32px;
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
.btn-primary { background: #23424A; color: #fff; border: none; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.error-msg {
  background: #fef2f2;
  color: #dc2626;
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 12px;
}

/* Body */
.pf-body { display: flex; flex-direction: column; gap: 12px; }

/* Sections */
.section {
  background: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
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
.collapsible { padding: 0; }
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
.section-toggle:hover { background: #f9fafb; }
.section-content { padding: 0 16px 16px; border-top: 1px solid #f3f4f6; }
.toggle-actions { display: flex; align-items: center; gap: 10px; }

/* Estado */
.estado-row { display: flex; gap: 8px; flex-wrap: wrap; }
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
.estado-opt input { display: none; }
.estado-opt.active { border-color: #23424A; background: #f0f9ff; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot.green { background: #22c55e; }
.dot.gray { background: #9ca3af; }
.dot.blue { background: #3b82f6; }
.dot.red { background: #ef4444; }

/* Radio cards (Online/Offline) */
.radio-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
}
.radio-card input { margin-top: 2px; }
.radio-card.active { border-color: #23424A; background: #f0f9ff; }
.radio-content { display: flex; flex-direction: column; }
.radio-content strong { font-size: 0.9rem; }
.radio-content span { font-size: 0.75rem; color: #6b7280; }
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
.cat-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
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
.cat-check input { margin: 0; }
.cat-check.active { border-color: #23424A; background: #23424A; color: #fff; }
.feat-check {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: #f59e0b;
  cursor: pointer;
  margin-left: auto;
}
.feat-check input { margin: 0; }

/* Rows */
.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.row-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px; }

/* Fields */
.field { display: flex; flex-direction: column; gap: 4px; }
.field label {
  font-size: 0.7rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
}
.field input, .field select, .field textarea {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  font-size: 0.85rem;
}
.field input:focus, .field select:focus, .field textarea:focus {
  outline: none;
  border-color: #23424A;
}
.field-sm { display: flex; flex-direction: column; gap: 3px; }
.field-sm label { font-size: 0.65rem; font-weight: 500; color: #6b7280; text-transform: uppercase; }
.field-sm input, .field-sm select {
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 0.8rem;
}
.hint { font-weight: normal; color: #9ca3af; }
.char-count { font-size: 0.65rem; color: #9ca3af; text-align: right; }

/* Filters grid */
.filters-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding-top: 10px;
}
.tick-inline { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; cursor: pointer; }

/* Images placeholder */
.img-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  background: #f9fafb;
  border: 2px dashed #e5e7eb;
  border-radius: 6px;
  text-align: center;
}
.img-placeholder span { font-size: 1.5rem; opacity: 0.4; }
.img-placeholder p { margin: 6px 0 0; font-size: 0.8rem; color: #9ca3af; }

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

/* Documents & Upload */
.upload-zone-label {
  display: block;
  width: 100%;
  padding: 12px;
  text-align: center;
  background: #f9fafb;
  border: 2px dashed #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 10px;
}
.upload-zone-label:hover { border-color: #23424A; background: #f3f4f6; }
.upload-zone-label input[type="file"] { display: none; }

/* Image grid */
.img-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 12px;
}
.img-item {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid transparent;
}
.img-item.cover { border-color: #23424A; }
.img-item img { width: 100%; height: 100%; object-fit: cover; }
.img-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
  opacity: 0;
  transition: opacity 0.2s;
}
.img-item:hover .img-overlay { opacity: 1; }
.img-actions {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 4px;
}
.img-actions button {
  width: 26px; height: 26px;
  border: none;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
}
.img-actions button.del { background: #fee2e2; color: #dc2626; }
.cover-badge {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: #23424A;
  color: #fff;
  font-size: 0.6rem;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 600;
}
.img-hint {
  margin-top: 8px;
  font-size: 0.75rem;
  color: #6b7280;
  text-align: center;
}

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
  background: #23424A;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
}
.btn-x {
  width: 24px; height: 24px;
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
.financial { border: 1px solid #d1d5db; }
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
.text-right { text-align: right; }

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
.green { color: #16a34a; }

/* Mobile */
@media (max-width: 768px) {
  .row-2, .row-3, .row-4 { grid-template-columns: 1fr; }
  .estado-row { flex-direction: column; }
  .cat-row { flex-direction: column; align-items: flex-start; }
  .feat-check { margin-left: 0; margin-top: 8px; }
  .filters-grid { grid-template-columns: 1fr; }
  .char-row { grid-template-columns: 1fr; }
  .records-table { font-size: 0.7rem; }
  .img-grid { grid-template-columns: repeat(3, 1fr); }
}

.location-detected {
  display: block;
  font-size: 11px;
  color: #10B981;
  margin-top: 2px;
  font-weight: 500;
}
</style>
