<script setup lang="ts">
import { formatPrice } from '~/composables/shared/useListingUtils'
import {
  useAdminAdvertisements,
  ADVERTISEMENT_STATUSES,
  type AdminAdvertisement,
  type AdvertisementStatus,
  type AdvertisementFilters,
} from '~/composables/admin/useAdminAdvertisements'
import { localizedName } from '~/composables/useLocalized'

const { locale } = useI18n()

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  advertisements,
  loading,
  saving,
  error,
  total,
  fetchAdvertisements,
  updateStatus,
  updateNotes,
  deleteAdvertisement,
} = useAdminAdvertisements()

// Filters
const filters = ref<AdvertisementFilters>({
  status: null,
  search: '',
})

// Delete confirmation
const deleteModal = ref({
  show: false,
  advertisement: null as AdminAdvertisement | null,
  confirmText: '',
})

// Detail modal
const detailModal = ref({
  show: false,
  advertisement: null as AdminAdvertisement | null,
  notes: '',
})

// Computed
const canDelete = computed(() => deleteModal.value.confirmText.toLowerCase() === 'borrar')

// Load data
onMounted(async () => {
  await fetchAdvertisements()
})

// Watch filters
watch(
  filters,
  () => {
    fetchAdvertisements(filters.value)
  },
  { deep: true },
)

// Status helpers
function getStatusConfig(status: AdvertisementStatus) {
  return ADVERTISEMENT_STATUSES.find((s) => s.value === status) || ADVERTISEMENT_STATUSES[0]
}

// Quick status update
async function handleStatusChange(ad: AdminAdvertisement, newStatus: AdvertisementStatus) {
  await updateStatus(ad.id, newStatus)
}

// Open detail modal
function openDetail(ad: AdminAdvertisement) {
  detailModal.value = {
    show: true,
    advertisement: ad,
    notes: ad.admin_notes || '',
  }
}

function closeDetail() {
  detailModal.value = { show: false, advertisement: null, notes: '' }
}

async function saveNotes() {
  if (!detailModal.value.advertisement) return
  const success = await updateNotes(detailModal.value.advertisement.id, detailModal.value.notes)
  if (success) {
    closeDetail()
    await fetchAdvertisements(filters.value)
  }
}

// Delete functions
function confirmDelete(ad: AdminAdvertisement) {
  deleteModal.value = { show: true, advertisement: ad, confirmText: '' }
}

function closeDeleteModal() {
  deleteModal.value = { show: false, advertisement: null, confirmText: '' }
}

async function executeDelete() {
  if (!deleteModal.value.advertisement || !canDelete.value) return
  const success = await deleteAdvertisement(deleteModal.value.advertisement.id)
  if (success) {
    closeDeleteModal()
  }
}

// Format helpers
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="admin-anunciantes">
    <!-- Header -->
    <div class="section-header">
      <h2>Anunciantes</h2>
      <span class="total-badge">{{ total }} registros</span>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <!-- Status filter -->
      <div class="filter-group status-filter">
        <button
          class="filter-btn"
          :class="{ active: filters.status === null }"
          @click="filters.status = null"
        >
          Todos
        </button>
        <button
          v-for="st in ADVERTISEMENT_STATUSES"
          :key="st.value"
          class="filter-btn"
          :class="{ active: filters.status === st.value }"
          :style="filters.status === st.value ? { backgroundColor: st.color, color: 'white' } : {}"
          @click="filters.status = st.value"
        >
          {{ st.label }}
        </button>
      </div>

      <!-- Search -->
      <input
        v-model="filters.search"
        type="text"
        placeholder="Buscar por nombre, marca, modelo..."
        class="filter-search"
      >
    </div>

    <!-- Error -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">Cargando anunciantes...</div>

    <!-- Table -->
    <div v-else class="table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width: 100px">Estado</th>
            <th>Contacto</th>
            <th>Vehículo</th>
            <th style="width: 100px">Precio</th>
            <th style="width: 100px">Fecha</th>
            <th style="width: 130px">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="ad in advertisements"
            :key="ad.id"
            :class="{ 'row-pending': ad.status === 'pending' }"
          >
            <td>
              <select
                :value="ad.status"
                class="status-select"
                :style="{
                  borderColor: getStatusConfig(ad.status).color,
                  color: getStatusConfig(ad.status).color,
                }"
                @change="
                  handleStatusChange(
                    ad,
                    ($event.target as HTMLSelectElement).value as AdvertisementStatus,
                  )
                "
              >
                <option v-for="st in ADVERTISEMENT_STATUSES" :key="st.value" :value="st.value">
                  {{ st.label }}
                </option>
              </select>
            </td>
            <td>
              <div class="contact-info">
                <strong>{{ ad.contact_name }}</strong>
                <span v-if="ad.contact_phone" class="contact-detail"
                  >📞 {{ ad.contact_phone }}</span
                >
                <span v-if="ad.contact_email" class="contact-detail"
                  >📧 {{ ad.contact_email }}</span
                >
              </div>
            </td>
            <td>
              <div class="vehicle-info">
                <span v-if="ad.brand || ad.model" class="vehicle-name">
                  {{ ad.brand || '' }} {{ ad.model || '' }}
                </span>
                <span v-else class="no-data">Sin especificar</span>
                <span v-if="ad.year" class="vehicle-year">{{ ad.year }}</span>
                <span v-if="ad.subcategory || ad.type" class="vehicle-type">
                  {{ localizedName(ad.subcategory, locale) || ''
                  }}{{ ad.subcategory && ad.type ? ' > ' : ''
                  }}{{ localizedName(ad.type, locale) || '' }}
                </span>
                <span v-else-if="ad.vehicle_type" class="vehicle-type">{{ ad.vehicle_type }}</span>
              </div>
            </td>
            <td class="text-right">
              {{ formatPrice(ad.price) }}
            </td>
            <td>
              {{ formatDate(ad.created_at) }}
            </td>
            <td>
              <div class="action-buttons">
                <button class="btn-icon btn-view" title="Ver detalles" @click="openDetail(ad)">
                  👁️
                </button>
                <button class="btn-icon btn-delete" title="Eliminar" @click="confirmDelete(ad)">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!advertisements.length">
            <td colspan="6" class="empty-state">
              No hay anunciantes que coincidan con los filtros.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <div v-if="detailModal.show" class="modal-overlay" @click.self="closeDetail">
        <div class="modal-content modal-medium">
          <div class="modal-header">
            <h3>Detalles del Anunciante</h3>
            <button class="modal-close" @click="closeDetail">×</button>
          </div>
          <div class="modal-body">
            <div v-if="detailModal.advertisement" class="detail-grid">
              <!-- Contact Info -->
              <div class="detail-section">
                <h4>Contacto</h4>
                <p><strong>Nombre:</strong> {{ detailModal.advertisement.contact_name }}</p>
                <p v-if="detailModal.advertisement.contact_phone">
                  <strong>Teléfono:</strong> {{ detailModal.advertisement.contact_phone }}
                </p>
                <p v-if="detailModal.advertisement.contact_email">
                  <strong>Email:</strong> {{ detailModal.advertisement.contact_email }}
                </p>
                <p v-if="detailModal.advertisement.location">
                  <strong>Ubicación:</strong> {{ detailModal.advertisement.location }}
                </p>
              </div>

              <!-- Vehicle Info -->
              <div class="detail-section">
                <h4>Vehículo</h4>
                <p v-if="detailModal.advertisement.subcategory || detailModal.advertisement.type">
                  <strong>Clasificación:</strong>
                  {{ localizedName(detailModal.advertisement.subcategory, locale) || ''
                  }}{{
                    detailModal.advertisement.subcategory && detailModal.advertisement.type
                      ? ' > '
                      : ''
                  }}{{ localizedName(detailModal.advertisement.type, locale) || '' }}
                </p>
                <p v-else-if="detailModal.advertisement.vehicle_type">
                  <strong>Tipo:</strong> {{ detailModal.advertisement.vehicle_type }}
                </p>
                <p v-if="detailModal.advertisement.brand">
                  <strong>Marca:</strong> {{ detailModal.advertisement.brand }}
                </p>
                <p v-if="detailModal.advertisement.model">
                  <strong>Modelo:</strong> {{ detailModal.advertisement.model }}
                </p>
                <p v-if="detailModal.advertisement.year">
                  <strong>Año:</strong> {{ detailModal.advertisement.year }}
                </p>
                <p v-if="detailModal.advertisement.kilometers">
                  <strong>Kilómetros:</strong>
                  {{ detailModal.advertisement.kilometers.toLocaleString('es-ES') }} km
                </p>
                <p v-if="detailModal.advertisement.price">
                  <strong>Precio:</strong> {{ formatPrice(detailModal.advertisement.price) }}
                </p>
                <p v-if="detailModal.advertisement.contact_preference">
                  <strong>Preferencia contacto:</strong>
                  {{ detailModal.advertisement.contact_preference }}
                </p>
              </div>

              <!-- Characteristics (attributes_json) -->
              <div
                v-if="
                  detailModal.advertisement.attributes_json &&
                  Object.keys(detailModal.advertisement.attributes_json).length
                "
                class="detail-section full-width"
              >
                <h4>Características</h4>
                <div class="characteristics-grid">
                  <div
                    v-for="(value, key) in detailModal.advertisement.attributes_json"
                    :key="key"
                    class="characteristic-item"
                  >
                    <span class="char-label">{{ key }}</span>
                    <span class="char-value">{{ value }}</span>
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div v-if="detailModal.advertisement.description" class="detail-section full-width">
                <h4>Descripción</h4>
                <p class="description-text">{{ detailModal.advertisement.description }}</p>
              </div>

              <!-- Photos -->
              <div
                v-if="detailModal.advertisement.photos?.length"
                class="detail-section full-width"
              >
                <h4>Fotos ({{ detailModal.advertisement.photos.length }})</h4>
                <div class="photos-grid">
                  <img
                    v-for="(photo, index) in detailModal.advertisement.photos"
                    :key="index"
                    :src="photo"
                    :alt="
                      `${detailModal.advertisement.brand || ''} ${detailModal.advertisement.model || ''} - Foto ${index + 1}`.trim()
                    "
                  >
                </div>
              </div>

              <!-- Admin Notes -->
              <div class="detail-section full-width">
                <h4>Notas del Admin</h4>
                <textarea
                  v-model="detailModal.notes"
                  rows="3"
                  placeholder="Añade notas internas sobre este anunciante..."
                />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeDetail">Cerrar</button>
            <button class="btn-primary" :disabled="saving" @click="saveNotes">
              {{ saving ? 'Guardando...' : 'Guardar Notas' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="deleteModal.show" class="modal-overlay" @click.self="closeDeleteModal">
        <div class="modal-content modal-small">
          <div class="modal-header">
            <h3>Confirmar eliminación</h3>
            <button class="modal-close" @click="closeDeleteModal">×</button>
          </div>
          <div class="modal-body">
            <p>
              ¿Estás seguro de eliminar el anunciante
              <strong>{{ deleteModal.advertisement?.contact_name }}</strong
              >?
            </p>
            <div class="form-group delete-confirm-group">
              <label for="delete-confirm">Escribe <strong>Borrar</strong> para confirmar:</label>
              <input
                id="delete-confirm"
                v-model="deleteModal.confirmText"
                type="text"
                placeholder="Borrar"
                autocomplete="off"
              >
              <p v-if="deleteModal.confirmText && !canDelete" class="text-error">
                Escribe "Borrar" exactamente para continuar
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeDeleteModal">Cancelar</button>
            <button class="btn-danger" :disabled="!canDelete" @click="executeDelete">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.admin-anunciantes {
  padding: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.total-badge {
  background: #f3f4f6;
  color: #6b7280;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
}

/* Filters */
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  gap: 0;
}

.status-filter {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.filter-btn {
  padding: 8px 12px;
  border: none;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s;
}

.filter-btn:not(:last-child) {
  border-right: 1px solid #e5e7eb;
}

.filter-btn.active {
  background: var(--color-primary, #23424a);
  color: white;
}

.filter-btn:hover:not(.active) {
  background: #f3f4f6;
}

.filter-search {
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
}

.filter-search:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
}

/* Error */
.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

/* Table */
.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.admin-table th,
.admin-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.admin-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.admin-table tr:hover {
  background: #f9fafb;
}

.admin-table tr.row-pending {
  background: #fef2f2;
}

.admin-table tr.row-pending:hover {
  background: #fee2e2;
}

.status-select {
  padding: 6px 8px;
  border-radius: 6px;
  border: 2px solid;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  background: white;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.contact-info strong {
  font-size: 0.95rem;
}

.contact-detail {
  font-size: 0.8rem;
  color: #6b7280;
}

.vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vehicle-name {
  font-weight: 500;
}

.vehicle-year {
  font-size: 0.85rem;
  color: #6b7280;
}

.vehicle-type {
  font-size: 0.75rem;
  color: #9ca3af;
  font-style: italic;
}

.no-data {
  color: #9ca3af;
  font-style: italic;
}

.text-right {
  text-align: right;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: 1px solid #e5e7eb;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #f3f4f6;
}

.btn-view:hover {
  background: #dbeafe;
}

.btn-delete:hover {
  background: #fee2e2;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-small {
  max-width: 400px;
}

.modal-medium {
  max-width: 600px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: white;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  position: sticky;
  bottom: 0;
}

/* Detail grid */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.detail-section {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
}

.detail-section.full-width {
  grid-column: 1 / -1;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-section p {
  margin: 0 0 8px 0;
  font-size: 0.95rem;
}

.detail-section p:last-child {
  margin-bottom: 0;
}

.description-text {
  white-space: pre-wrap;
  line-height: 1.5;
}

.characteristics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.characteristic-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  font-size: 0.9rem;
}

.char-label {
  color: #6b7280;
  text-transform: capitalize;
}

.char-value {
  font-weight: 500;
  color: #111827;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.photos-grid img {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  border-radius: 6px;
}

.detail-section textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  resize: vertical;
  min-height: 80px;
}

.detail-section textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* Buttons */
.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark, #1a3238);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Delete confirmation */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 6px;
  color: #374151;
}

.delete-confirm-group {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.delete-confirm-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
}

.delete-confirm-group input:focus {
  outline: none;
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.text-error {
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: 4px;
}

/* Mobile */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .filters-bar {
    flex-direction: column;
  }

  .status-filter {
    overflow-x: auto;
    width: 100%;
  }

  .filter-btn {
    white-space: nowrap;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .photos-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
