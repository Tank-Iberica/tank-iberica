<template>
  <div class="vehicle-form-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <NuxtLink to="/admin/vehiculos" class="back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </NuxtLink>
        <h1 class="page-title">{{ isNew ? 'Nuevo vehículo' : 'Editar vehículo' }}</h1>
      </div>
      <div class="header-actions">
        <button
          v-if="!isNew"
          class="btn-secondary btn-rent"
          @click="openTransactionModal('alquiler')"
        >
          Alquilar
        </button>
        <button v-if="!isNew" class="btn-secondary btn-sell" @click="openTransactionModal('venta')">
          Vender
        </button>
        <button class="btn-primary" :disabled="saving" @click="handleSave">
          {{ saving ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>Cargando vehículo...</span>
    </div>

    <!-- Form -->
    <form v-else class="vehicle-form" @submit.prevent="handleSave">
      <!-- Status selector (traffic light style) -->
      <section class="form-section status-section">
        <h2 class="section-title">Estado</h2>
        <div class="status-selector">
          <button
            v-for="status in statusOptions"
            :key="status.value"
            type="button"
            class="status-option"
            :class="{ active: form.status === status.value, [status.value]: true }"
            @click="form.status = status.value"
          >
            <span class="status-dot" />
            <span class="status-label">{{ status.label }}</span>
          </button>
        </div>
        <label class="featured-toggle">
          <input v-model="form.featured" type="checkbox" >
          <span>Destacado</span>
        </label>
      </section>

      <!-- Images -->
      <section class="form-section">
        <h2 class="section-title">Imágenes</h2>
        <div class="images-grid">
          <div
            v-for="(image, index) in formImages"
            :key="image.id"
            class="image-item"
            draggable="true"
            @dragstart="handleDragStart(index)"
            @dragover.prevent
            @drop="handleDrop(index)"
          >
            <img :src="image.thumbnail_url || image.url" :alt="`Imagen ${index + 1}`" >
            <button type="button" class="image-delete" @click="removeImage(index)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <span class="image-position">{{ index + 1 }}</span>
          </div>
          <label v-if="formImages.length < 10" class="image-upload">
            <input type="file" accept="image/*" multiple @change="handleImageUpload" >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Añadir imagen</span>
          </label>
        </div>
        <p class="field-hint">Máximo 10 imágenes. Arrastra para reordenar.</p>
      </section>

      <!-- Category & Subcategory -->
      <section class="form-section">
        <h2 class="section-title">Categoría</h2>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Categoría *</label>
            <div class="category-buttons">
              <button
                v-for="cat in categoryOptions"
                :key="cat.value"
                type="button"
                class="category-btn"
                :class="{ active: form.category === cat.value }"
                @click="form.category = cat.value"
              >
                {{ cat.label }}
              </button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Subcategoría</label>
            <select v-model="selectedSubcategoryId" class="form-select">
              <option :value="null">Seleccionar...</option>
              <option v-for="sub in subcategories" :key="sub.id" :value="sub.id">
                {{ sub.name_es }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tipo *</label>
            <select v-model="form.type_id" class="form-select" required>
              <option value="">Seleccionar...</option>
              <option v-for="t in types" :key="t.id" :value="t.id">
                {{ t.name_es }}
              </option>
            </select>
          </div>
        </div>
      </section>

      <!-- Basic info -->
      <section class="form-section">
        <h2 class="section-title">Información básica</h2>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Marca *</label>
            <input v-model="form.brand" type="text" class="form-input" required >
          </div>
          <div class="form-group">
            <label class="form-label">Modelo *</label>
            <input v-model="form.model" type="text" class="form-input" required >
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Año</label>
            <input
              v-model.number="form.year"
              type="number"
              class="form-input"
              min="1900"
              max="2100"
            >
          </div>
          <div class="form-group">
            <label class="form-label">Matrícula</label>
            <input v-model="form.plate" type="text" class="form-input" >
          </div>
        </div>
      </section>

      <!-- Prices -->
      <section class="form-section">
        <h2 class="section-title">Precios</h2>
        <div class="form-row">
          <div v-if="form.category !== 'alquiler'" class="form-group">
            <label class="form-label">Precio venta (€)</label>
            <input
              v-model.number="form.price"
              type="number"
              class="form-input"
              min="0"
              step="100"
            >
          </div>
          <div v-if="form.category !== 'venta'" class="form-group">
            <label class="form-label">Precio alquiler (€/mes)</label>
            <input
              v-model.number="form.rental_price"
              type="number"
              class="form-input"
              min="0"
              step="50"
            >
          </div>
        </div>
      </section>

      <!-- Location -->
      <section class="form-section">
        <h2 class="section-title">Ubicación</h2>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">País</label>
            <select v-model="form.location_country" class="form-select">
              <option value="">Seleccionar...</option>
              <option value="ES">España</option>
              <option value="PT">Portugal</option>
              <option value="FR">Francia</option>
              <option value="DE">Alemania</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Región</label>
            <input
              v-model="form.location_region"
              type="text"
              class="form-input"
              placeholder="Ej: Andalucía"
            >
          </div>
          <div class="form-group">
            <label class="form-label">Provincia</label>
            <input
              v-model="form.location_province"
              type="text"
              class="form-input"
              placeholder="Ej: Sevilla"
            >
          </div>
        </div>
        <div class="form-row">
          <div class="form-group full-width">
            <label class="form-label">Ubicación detallada</label>
            <input
              v-model="form.location"
              type="text"
              class="form-input"
              placeholder="Ej: Polígono Industrial..."
            >
          </div>
        </div>
      </section>

      <!-- Description -->
      <section class="form-section">
        <h2 class="section-title">Descripción</h2>
        <div class="form-row">
          <div class="form-group full-width">
            <label class="form-label">Descripción (ES)</label>
            <textarea
              v-model="form.description_es"
              class="form-textarea"
              rows="4"
              maxlength="300"
              placeholder="Descripción en español..."
            />
            <span class="char-count">{{ form.description_es?.length || 0 }}/300</span>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group full-width">
            <label class="form-label">Descripción (EN)</label>
            <textarea
              v-model="form.description_en"
              class="form-textarea"
              rows="4"
              maxlength="300"
              placeholder="Description in English..."
            />
            <span class="char-count">{{ form.description_en?.length || 0 }}/300</span>
          </div>
        </div>
      </section>

      <!-- Dynamic filters (based on type) -->
      <section v-if="activeFilters.length > 0" class="form-section">
        <h2 class="section-title">Especificaciones</h2>
        <div class="filters-grid">
          <div v-for="filter in activeFilters" :key="filter.id" class="form-group">
            <label class="form-label">{{ filter.label_es }}</label>
            <!-- Caja (text input) -->
            <input
              v-if="filter.type === 'caja'"
              v-model="form.attributes_json[filter.name]"
              type="text"
              class="form-input"
            >
            <!-- Desplegable (select) -->
            <select
              v-else-if="filter.type === 'desplegable'"
              v-model="form.attributes_json[filter.name]"
              class="form-select"
            >
              <option value="">Seleccionar...</option>
              <option v-for="opt in filter.options" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <!-- Tick (checkbox) -->
            <label v-else-if="filter.type === 'tick'" class="checkbox-label">
              <input v-model="form.attributes_json[filter.name]" type="checkbox" >
              <span>Sí</span>
            </label>
            <!-- Slider (number) -->
            <input
              v-else-if="filter.type === 'slider'"
              v-model.number="form.attributes_json[filter.name]"
              type="number"
              class="form-input"
              :min="getSliderMin(filter.options)"
              :max="getSliderMax(filter.options)"
            >
            <!-- Default: text -->
            <input
              v-else
              v-model="form.attributes_json[filter.name]"
              type="text"
              class="form-input"
            >
          </div>
        </div>
      </section>

      <!-- Financial (admin only) -->
      <section class="form-section">
        <h2 class="section-title">Contabilidad</h2>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Coste adquisición (€)</label>
            <input
              v-model.number="form.acquisition_cost"
              type="number"
              class="form-input"
              min="0"
              step="100"
            >
          </div>
          <div class="form-group">
            <label class="form-label">Precio mínimo (€)</label>
            <input
              v-model.number="form.minimum_price"
              type="number"
              class="form-input"
              min="0"
              step="100"
            >
          </div>
        </div>
      </section>

      <!-- Error display -->
      <div v-if="error" class="form-error">
        {{ error }}
      </div>
    </form>

    <!-- Transaction modal (Venta / Alquiler) -->
    <Teleport to="body">
      <div
        v-if="showTransactionModal"
        class="modal-backdrop"
        @click.self="showTransactionModal = false"
      >
        <div class="modal-content transaction-modal">
          <!-- Tabs -->
          <div class="tx-tabs">
            <button class="tx-tab" :class="{ active: txTab === 'venta' }" @click="txTab = 'venta'">
              Vender
            </button>
            <button
              class="tx-tab"
              :class="{ active: txTab === 'alquiler' }"
              @click="txTab = 'alquiler'"
            >
              Alquilar
            </button>
          </div>

          <!-- Sale form -->
          <div v-if="txTab === 'venta'" class="tx-body">
            <div class="form-group">
              <label class="form-label">Precio de venta (€) *</label>
              <input
                v-model.number="sellForm.sale_price"
                type="number"
                class="form-input"
                min="0"
                required
              >
            </div>
            <div class="form-group">
              <label class="form-label">Categoría de venta *</label>
              <select v-model="sellForm.sale_category" class="form-select" required>
                <option value="">Seleccionar...</option>
                <option value="venta_directa">Venta directa</option>
                <option value="terceros">Terceros</option>
                <option value="exportacion">Exportación</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Nombre comprador</label>
              <input v-model="sellForm.buyer_name" type="text" class="form-input" >
            </div>
            <div class="form-group">
              <label class="form-label">Contacto comprador</label>
              <input v-model="sellForm.buyer_contact" type="text" class="form-input" >
            </div>
            <!-- Auto-balance info -->
            <div v-if="sellForm.sale_price > 0" class="tx-preview">
              <span class="tx-preview-label">Se creará automáticamente:</span>
              <span class="tx-preview-item ingreso">
                + {{ formatCurrency(sellForm.sale_price) }} ingreso en Balance
              </span>
              <span v-if="form.acquisition_cost" class="tx-preview-item">
                Beneficio: {{ calcBeneficio(sellForm.sale_price, form.acquisition_cost) }}
              </span>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="showTransactionModal = false">
                Cancelar
              </button>
              <button
                type="button"
                class="btn-primary btn-sell"
                :disabled="!sellForm.sale_price || !sellForm.sale_category || saving"
                @click="handleSell"
              >
                {{ saving ? 'Procesando...' : 'Confirmar venta' }}
              </button>
            </div>
          </div>

          <!-- Rental form -->
          <div v-if="txTab === 'alquiler'" class="tx-body">
            <div class="form-group">
              <label class="form-label">Precio alquiler (€/mes) *</label>
              <input
                v-model.number="rentalForm.monthly_price"
                type="number"
                class="form-input"
                min="0"
                required
              >
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Fecha inicio *</label>
                <input v-model="rentalForm.start_date" type="date" class="form-input" required >
              </div>
              <div class="form-group">
                <label class="form-label">Fecha fin</label>
                <input v-model="rentalForm.end_date" type="date" class="form-input" >
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Nombre arrendatario</label>
              <input v-model="rentalForm.renter_name" type="text" class="form-input" >
            </div>
            <div class="form-group">
              <label class="form-label">Contacto arrendatario</label>
              <input v-model="rentalForm.renter_contact" type="text" class="form-input" >
            </div>
            <div class="form-group">
              <label class="form-label">Notas</label>
              <textarea
                v-model="rentalForm.notes"
                class="form-textarea"
                rows="2"
                placeholder="Condiciones, fianza..."
              />
            </div>
            <!-- Auto-balance info -->
            <div v-if="rentalForm.monthly_price > 0" class="tx-preview">
              <span class="tx-preview-label">Se creará automáticamente:</span>
              <span class="tx-preview-item ingreso">
                + {{ formatCurrency(rentalForm.monthly_price) }}/mes ingreso recurrente en Balance
              </span>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="showTransactionModal = false">
                Cancelar
              </button>
              <button
                type="button"
                class="btn-primary btn-rent-action"
                :disabled="!rentalForm.monthly_price || !rentalForm.start_date || saving"
                @click="handleRent"
              >
                {{ saving ? 'Procesando...' : 'Confirmar alquiler' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { VehicleFormData } from '~/composables/admin/useAdminVehicles'
import { useAdminVehicles } from '~/composables/admin/useAdminVehicles'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()

const {
  loading,
  saving: composableSaving,
  error: composableError,
  fetchById,
  createVehicle,
  updateVehicle,
  archiveVehicle,
  // Image functions will be used when implementing image upload UI
  // addImage,
  // deleteImage,
  // reorderImages,
} = useAdminVehicles()

// Local saving/error for rental operations that don't use the composable
const localSaving = ref(false)
const localError = ref<string | null>(null)

const saving = computed(() => composableSaving.value || localSaving.value)
const error = computed(() => composableError.value || localError.value)

const isNew = computed(() => route.params.id === 'new')
const vehicleId = computed(() => (isNew.value ? null : String(route.params.id)))

// Form data
const form = ref<
  VehicleFormData & {
    plate?: string
    acquisition_cost?: number | null
    minimum_price?: number | null
  }
>({
  brand: '',
  model: '',
  year: null,
  price: null,
  rental_price: null,
  category: 'venta',
  type_id: null,
  location: null,
  location_country: null,
  location_province: null,
  location_region: null,
  description_es: null,
  description_en: null,
  attributes_json: {},
  status: 'draft',
  featured: false,
  plate: '',
  acquisition_cost: null,
  minimum_price: null,
})

// Images (local state)
const formImages = ref<Array<{ id: string; url: string; thumbnail_url?: string | null }>>([])
const draggedIndex = ref<number | null>(null)

// Transaction modal (sell / rent)
const showTransactionModal = ref(false)
const txTab = ref<'venta' | 'alquiler'>('venta')

const sellForm = ref({
  sale_price: 0,
  sale_category: '',
  buyer_name: '',
  buyer_contact: '',
})

const rentalForm = ref({
  monthly_price: 0,
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
  renter_name: '',
  renter_contact: '',
  notes: '',
})

function openTransactionModal(tab: 'venta' | 'alquiler') {
  txTab.value = tab
  // Pre-fill rental price from vehicle if available
  if (tab === 'alquiler' && form.value.rental_price) {
    rentalForm.value.monthly_price = form.value.rental_price
  }
  // Pre-fill sale price from vehicle if available
  if (tab === 'venta' && form.value.price) {
    sellForm.value.sale_price = form.value.price
  }
  showTransactionModal.value = true
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val)
}

function calcBeneficio(salePrice: number, cost: number | null | undefined): string {
  if (!cost || cost === 0) return '—'
  const pct = Math.round(((salePrice - cost) / cost) * 100)
  return `${pct > 0 ? '+' : ''}${pct}%`
}

// Options
const statusOptions = [
  { value: 'draft', label: 'Borrador' },
  { value: 'published', label: 'Publicado' },
  { value: 'rented', label: 'Alquilado' },
  { value: 'workshop', label: 'En taller' },
]

const categoryOptions: Array<{ value: 'venta' | 'alquiler' | 'terceros'; label: string }> = [
  { value: 'venta', label: 'Venta' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'terceros', label: 'Terceros' },
]

// Subcategories (load from DB)
const subcategories = ref<Array<{ id: string; name_es: string; slug: string }>>([])
const selectedSubcategoryId = ref<string | null>(null)

// Types (load from DB)
const types = ref<Array<{ id: string; name_es: string; slug: string }>>([])

// Filter definitions (load from DB based on type)
const filterDefinitions = ref<
  Array<{
    id: string
    name: string
    type: string
    label_es: string
    options?: string[] | { min?: number; max?: number }
    type_id: string | null
  }>
>([])

const activeFilters = computed(() => {
  if (!form.value.type_id) return []
  return filterDefinitions.value.filter(
    (f) => f.type_id === form.value.type_id || f.type_id === null,
  )
})

// Helper functions for slider filter options
type FilterOptions = string[] | { min?: number; max?: number } | undefined

function getSliderMin(options: FilterOptions): number | undefined {
  if (options && typeof options === 'object' && !Array.isArray(options)) {
    return options.min
  }
  return undefined
}

function getSliderMax(options: FilterOptions): number | undefined {
  if (options && typeof options === 'object' && !Array.isArray(options)) {
    return options.max
  }
  return undefined
}

// Load subcategories
async function loadSubcategories() {
  const { data } = await supabase
    .from('subcategories')
    .select('id, name_es, slug')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  subcategories.value = data || []
}

// Load types
async function loadTypes() {
  const { data } = await supabase
    .from('subcategories')
    .select('id, name_es, slug')
    .order('sort_order', { ascending: true })

  types.value = data || []
}

// Load filter definitions
async function loadAttributes() {
  const { data } = await supabase
    .from('attributes')
    .select('*')
    .eq('status', 'active')
    .order('sort_order', { ascending: true })

  filterDefinitions.value = data || []
}

// Load vehicle if editing
async function loadVehicle() {
  if (!vehicleId.value) return

  const vehicle = await fetchById(vehicleId.value)
  if (!vehicle) {
    router.push('/admin/vehiculos')
    return
  }

  // Populate form
  form.value = {
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    price: vehicle.price,
    rental_price: vehicle.rental_price,
    category: vehicle.category,
    type_id: vehicle.type_id,
    location: vehicle.location,
    location_country: vehicle.location_country,
    location_province: vehicle.location_province,
    location_region: vehicle.location_region,
    description_es: vehicle.description_es,
    description_en: vehicle.description_en,
    attributes_json: vehicle.attributes_json || {},
    status: vehicle.status,
    featured: vehicle.featured,
    acquisition_cost: vehicle.acquisition_cost,
    minimum_price: vehicle.minimum_price,
  }

  // Populate images
  formImages.value = (vehicle.vehicle_images || []).map(
    (img: { id: string; url: string; thumbnail_url?: string | null }) => ({
      id: img.id,
      url: img.url,
      thumbnail_url: img.thumbnail_url,
    }),
  )
}

// Save handler
async function handleSave() {
  if (!form.value.brand || !form.value.model) {
    return
  }

  if (isNew.value) {
    const newId = await createVehicle(form.value)
    if (newId) {
      router.push(`/admin/vehiculos/${newId}`)
    }
  } else if (vehicleId.value) {
    const success = await updateVehicle(vehicleId.value, form.value)
    if (success) {
      // TODO(2026-02): Show success toast once useToast composable is available
    }
  }
}

// Sell handler — archives vehicle + creates balance entry
async function handleSell() {
  if (!vehicleId.value) return

  const success = await archiveVehicle(vehicleId.value, {
    sale_price: sellForm.value.sale_price,
    sale_category: sellForm.value.sale_category,
    buyer_name: sellForm.value.buyer_name,
    buyer_contact: sellForm.value.buyer_contact,
  })

  if (success) {
    // Auto-create balance entry for the sale
    const detalle = `${form.value.brand} ${form.value.model}${form.value.year ? ` (${form.value.year})` : ''}`
    await supabase.from('balance').insert({
      tipo: 'ingreso',
      fecha: new Date().toISOString().split('T')[0],
      razon: sellForm.value.sale_category === 'exportacion' ? 'exportacion' : 'venta',
      detalle: `Venta: ${detalle}`,
      importe: sellForm.value.sale_price,
      estado: 'pendiente',
      coste_asociado: form.value.acquisition_cost || null,
      vehicle_id: vehicleId.value,
      type_id: form.value.type_id || null,
    } as never)

    showTransactionModal.value = false
    router.push('/admin/vehiculos')
  }
}

// Rent handler — updates vehicle status + creates balance entry + rental record
async function handleRent() {
  if (!vehicleId.value) return
  localSaving.value = true
  localError.value = null

  try {
    // Update vehicle status to rented
    const { error: updateErr } = await supabase
      .from('vehicles')
      .update({
        status: 'rented',
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', vehicleId.value)

    if (updateErr) throw updateErr

    // Add rental record to vehicle's rental_records
    const newRentalRecord = {
      id: crypto.randomUUID(),
      from_date: rentalForm.value.start_date,
      to_date: rentalForm.value.end_date || null,
      amount: rentalForm.value.monthly_price,
      notes:
        [
          rentalForm.value.renter_name ? `Arrendatario: ${rentalForm.value.renter_name}` : '',
          rentalForm.value.renter_contact ? `Contacto: ${rentalForm.value.renter_contact}` : '',
          rentalForm.value.notes || '',
        ]
          .filter(Boolean)
          .join(' | ') || null,
    }

    const existingRecords = form.value.maintenance_records ? [] : [] // rental_records
    await supabase
      .from('vehicles')
      .update({
        rental_records: [...existingRecords, newRentalRecord],
      } as never)
      .eq('id', vehicleId.value)

    // Auto-create balance entry for the rental
    const detalle = `${form.value.brand} ${form.value.model}${form.value.year ? ` (${form.value.year})` : ''}`
    await supabase.from('balance').insert({
      tipo: 'ingreso',
      fecha: rentalForm.value.start_date,
      razon: 'alquiler',
      detalle: `Alquiler: ${detalle}${rentalForm.value.renter_name ? ` → ${rentalForm.value.renter_name}` : ''}`,
      importe: rentalForm.value.monthly_price,
      estado: 'pendiente',
      vehicle_id: vehicleId.value,
      type_id: form.value.type_id || null,
      notas: rentalForm.value.end_date
        ? `Período: ${rentalForm.value.start_date} a ${rentalForm.value.end_date}`
        : `Inicio: ${rentalForm.value.start_date} (sin fecha fin)`,
    } as never)

    // Insert historico entry
    await supabase.from('historico').insert({
      original_vehicle_id: vehicleId.value,
      brand: form.value.brand,
      model: form.value.model,
      year: form.value.year,
      type_id: form.value.type_id,
      original_price: form.value.rental_price,
      sale_price: rentalForm.value.monthly_price,
      sale_date: rentalForm.value.start_date,
      sale_category: 'alquiler',
      buyer_name: rentalForm.value.renter_name,
      buyer_contact: rentalForm.value.renter_contact,
    } as never)

    showTransactionModal.value = false
    // Reload to show updated status
    await loadVehicle()
    form.value.status = 'rented'
  } catch (err: unknown) {
    const supabaseError = err as { message?: string }
    localError.value = supabaseError?.message || 'Error processing rental'
  } finally {
    localSaving.value = false
  }
}

// Image handlers
async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files) return

  // TODO(2026-02): Implement Cloudinary upload via useCloudinaryUpload composable
  // For now, just show placeholder
  for (const file of input.files) {
    if (formImages.value.length >= 10) break

    const url = URL.createObjectURL(file)
    formImages.value.push({
      id: `temp-${Date.now()}-${Math.random()}`,
      url,
      thumbnail_url: url,
    })
  }

  input.value = ''
}

function removeImage(index: number) {
  formImages.value.splice(index, 1)
}

function handleDragStart(index: number) {
  draggedIndex.value = index
}

function handleDrop(targetIndex: number) {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) return

  const item = formImages.value[draggedIndex.value]
  if (!item) return

  formImages.value.splice(draggedIndex.value, 1)
  formImages.value.splice(targetIndex, 0, item)
  draggedIndex.value = null
}

// Initialize
onMounted(async () => {
  await Promise.all([loadSubcategories(), loadTypes(), loadAttributes()])

  if (!isNew.value) {
    await loadVehicle()
  }
})
</script>

<style scoped>
.vehicle-form-page {
  max-width: 1000px;
  margin: 0 auto;
}

/* Header */
.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.back-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.back-btn svg {
  width: 20px;
  height: 20px;
}

.page-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: var(--spacing-3);
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--border-radius);
  min-height: 44px;
  transition: all var(--transition-fast);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-12);
  gap: var(--spacing-4);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Form */
.vehicle-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.form-section {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-4);
  padding-bottom: var(--spacing-3);
  border-bottom: 1px solid var(--border-color);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-4);
}

.form-row:last-child {
  margin-bottom: 0;
}

@media (min-width: 768px) {
  .form-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-row:has(.full-width) {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.form-input,
.form-select,
.form-textarea {
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  min-height: 44px;
  transition: border-color var(--transition-fast);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.char-count {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  text-align: right;
}

.field-hint {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  margin-top: var(--spacing-2);
}

/* Status section */
.status-section .section-title {
  border-bottom: none;
  padding-bottom: 0;
}

.status-selector {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

.status-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--bg-secondary);
  border: 2px solid transparent;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 44px;
}

.status-option:hover {
  background: var(--bg-tertiary);
}

.status-option.active {
  border-color: currentColor;
  color: var(--text-primary);
}

.status-option.draft {
  color: var(--text-auxiliary);
}
.status-option.published {
  color: var(--color-success);
}
.status-option.rented {
  color: var(--color-info);
}
.status-option.workshop {
  color: var(--color-warning);
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
}

.featured-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;
}

.featured-toggle input {
  width: 18px;
  height: 18px;
}

/* Category buttons */
.category-buttons {
  display: flex;
  gap: var(--spacing-2);
}

.category-btn {
  flex: 1;
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border: 2px solid transparent;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  min-height: 44px;
}

.category-btn:hover {
  background: var(--bg-tertiary);
}

.category-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

/* Images grid */
.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--spacing-3);
}

.image-item {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: var(--border-radius);
  overflow: hidden;
  cursor: grab;
}

.image-item:active {
  cursor: grabbing;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-delete {
  position: absolute;
  top: var(--spacing-1);
  right: var(--spacing-1);
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: var(--border-radius-sm);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.image-item:hover .image-delete {
  opacity: 1;
}

.image-delete svg {
  width: 14px;
  height: 14px;
}

.image-position {
  position: absolute;
  bottom: var(--spacing-1);
  left: var(--spacing-1);
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: var(--border-radius-sm);
  color: white;
  font-size: var(--font-size-xs);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  aspect-ratio: 4/3;
  background: var(--bg-secondary);
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  color: var(--text-auxiliary);
  font-size: var(--font-size-xs);
  gap: var(--spacing-1);
  transition: all var(--transition-fast);
}

.image-upload:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.image-upload input {
  display: none;
}

.image-upload svg {
  width: 24px;
  height: 24px;
}

/* Filters grid */
.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-4);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;
  min-height: 44px;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
}

/* Error */
.form-error {
  padding: var(--spacing-4);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--color-error);
  border-radius: var(--border-radius);
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4);
  z-index: var(--z-modal);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  max-width: 400px;
  width: 100%;
}

.transaction-modal {
  max-width: 480px;
}

.transaction-modal .form-group {
  margin-bottom: var(--spacing-4);
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-4);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: flex-end;
  margin-top: var(--spacing-6);
}

/* Transaction modal tabs */
.tx-tabs {
  display: flex;
  border-bottom: 2px solid var(--border-color, #e5e7eb);
}

.tx-tab {
  flex: 1;
  padding: var(--spacing-3) var(--spacing-4);
  background: none;
  border: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-auxiliary, #9ca3af);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  min-height: 44px;
  transition: all 0.15s;
}

.tx-tab:hover {
  color: var(--text-primary);
  background: var(--bg-secondary, #f9fafb);
}

.tx-tab.active {
  color: var(--color-primary, #23424a);
  border-bottom-color: var(--color-primary, #23424a);
}

.tx-body {
  padding: var(--spacing-6);
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

/* Transaction preview */
.tx-preview {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--border-radius, 6px);
  margin-bottom: var(--spacing-4);
  font-size: var(--font-size-sm, 0.875rem);
}

.tx-preview-label {
  font-weight: var(--font-weight-medium, 500);
  color: var(--text-secondary, #6b7280);
  font-size: 0.75rem;
  text-transform: uppercase;
}

.tx-preview-item {
  color: var(--text-primary, #111);
}

.tx-preview-item.ingreso {
  color: #16a34a;
  font-weight: 600;
}

/* Button variants */
.btn-sell {
  background: var(--color-primary, #23424a) !important;
}

.btn-rent {
  border-color: #2563eb !important;
  color: #2563eb !important;
}

.btn-rent:hover {
  background: #eff6ff !important;
}

.btn-rent-action {
  background: #2563eb !important;
}

.btn-rent-action:hover:not(:disabled) {
  background: #1d4ed8 !important;
}
</style>
