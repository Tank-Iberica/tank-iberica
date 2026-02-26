<script setup lang="ts">
import type { MaintenanceEntry, RentalEntry } from '~/composables/admin/useAdminVehicles'
import { useAdminProductForm } from '~/composables/admin/useAdminProductForm'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
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

  // Re-exports
  localizedName,
  countryFlag,
} = useAdminProductForm()

// Lifecycle — init data fetching
onMounted(async () => {
  await init()
})

// Financial section event handlers that bridge emits to composable
function onUpdateMinPrice(val: number | null) {
  formData.value.min_price = val
}
function onUpdateAcquisitionCost(val: number | null) {
  formData.value.acquisition_cost = val
}
function onUpdateAcquisitionDate(val: string | null) {
  formData.value.acquisition_date = val
}
function onUpdateMaint(id: string, field: keyof MaintenanceEntry, val: string | number) {
  updateMaint(id, field, val)
}
function onUpdateRental(id: string, field: keyof RentalEntry, val: string | number) {
  updateRental(id, field, val)
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
        <button
          class="btn btn-primary"
          :disabled="saving || uploadingImages || !isValid"
          @click="handleSave"
        >
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
        <!-- Owner fields for offline -->
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
      <AdminProductImageSection
        :pending-images="pendingImages"
        :uploading-images="uploadingImages"
        :cloudinary-uploading="cloudinaryUploading"
        :cloudinary-progress="cloudinaryProgress"
        @select="handleImageSelect"
        @remove="removePendingImage"
        @move="movePendingImage"
      />

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
                {{ localizedName(s, locale) }}
              </option>
            </select>
          </div>
          <div class="field">
            <label>Tipo *</label>
            <select v-model="formData.type_id">
              <option :value="null" disabled>Seleccionar...</option>
              <option v-for="tipo in publishedTypes" :key="tipo.id" :value="tipo.id">
                {{ localizedName(tipo, locale) }}
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
              <template v-if="formData.location_region"> · {{ formData.location_region }}</template>
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
          <AdminProductDynamicFilters
            :dynamic-filters="dynamicFilters"
            :get-filter-value="getFilterValue"
            @update-filter="updateFilterValue"
          />
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
        <AdminProductCharacteristics
          v-if="sections.characteristics"
          :characteristics="characteristics"
          @add="addCharacteristic"
          @remove="removeCharacteristic"
        />
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
            <input id="doc-upload-input" type="file" multiple @change="handleDocUpload" >
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
        <AdminProductFinancialSection
          v-if="sections.financial"
          :min-price="formData.min_price"
          :acquisition-cost="formData.acquisition_cost"
          :acquisition-date="formData.acquisition_date"
          :maintenance-records="formData.maintenance_records || []"
          :rental-records="formData.rental_records || []"
          :total-maint="totalMaint"
          :total-rental="totalRental"
          :total-cost="totalCost"
          :fmt="fmt"
          @add-maint="addMaint"
          @remove-maint="removeMaint"
          @update-maint="onUpdateMaint"
          @add-rental="addRental"
          @remove-rental="removeRental"
          @update-rental="onUpdateRental"
          @update:min-price="onUpdateMinPrice"
          @update:acquisition-cost="onUpdateAcquisitionCost"
          @update:acquisition-date="onUpdateAcquisitionDate"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.pf {
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 40px;
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
.char-count {
  font-size: 0.65rem;
  color: #9ca3af;
  text-align: right;
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
.upload-zone-label:hover {
  border-color: #23424a;
  background: #f3f4f6;
}
.upload-zone-label input[type='file'] {
  display: none;
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

.location-detected {
  display: block;
  font-size: 11px;
  color: #10b981;
  margin-top: 2px;
  font-weight: 500;
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
}
</style>
