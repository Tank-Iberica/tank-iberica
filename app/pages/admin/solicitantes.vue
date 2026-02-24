<script setup lang="ts">
import {
  useAdminDemands,
  DEMAND_STATUSES,
  type AdminDemand,
  type DemandStatus,
  type DemandFilters,
} from '~/composables/admin/useAdminDemands'
import { localizedName } from '~/composables/useLocalized'

const { locale } = useI18n()

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  demands,
  loading,
  saving,
  error,
  total,
  fetchDemands,
  updateStatus,
  updateNotes,
  deleteDemand,
} = useAdminDemands()

// Filters
const filters = ref<DemandFilters>({
  status: null,
  search: '',
})

// Delete confirmation
const deleteModal = ref({
  show: false,
  demand: null as AdminDemand | null,
  confirmText: '',
})

// Detail modal
const detailModal = ref({
  show: false,
  demand: null as AdminDemand | null,
  notes: '',
})

// Computed
const canDelete = computed(() => deleteModal.value.confirmText.toLowerCase() === 'borrar')

// Load data
onMounted(async () => {
  await fetchDemands()
})

// Watch filters
watch(
  filters,
  () => {
    fetchDemands(filters.value)
  },
  { deep: true },
)

// Status helpers
function getStatusConfig(status: DemandStatus) {
  return DEMAND_STATUSES.find((s) => s.value === status) || DEMAND_STATUSES[0]
}

// Quick status update
async function handleStatusChange(demand: AdminDemand, newStatus: DemandStatus) {
  await updateStatus(demand.id, newStatus)
}

// Open detail modal
function openDetail(demand: AdminDemand) {
  detailModal.value = {
    show: true,
    demand,
    notes: demand.admin_notes || '',
  }
}

function closeDetail() {
  detailModal.value = { show: false, demand: null, notes: '' }
}

async function saveNotes() {
  if (!detailModal.value.demand) return
  const success = await updateNotes(detailModal.value.demand.id, detailModal.value.notes)
  if (success) {
    closeDetail()
    await fetchDemands(filters.value)
  }
}

// Delete functions
function confirmDelete(demand: AdminDemand) {
  deleteModal.value = { show: true, demand, confirmText: '' }
}

function closeDeleteModal() {
  deleteModal.value = { show: false, demand: null, confirmText: '' }
}

async function executeDelete() {
  if (!deleteModal.value.demand || !canDelete.value) return
  const success = await deleteDemand(deleteModal.value.demand.id)
  if (success) {
    closeDeleteModal()
  }
}

// Get vehicle type label with fallback
function getTypeLabel(demand: AdminDemand): string {
  if (demand.subcategory || demand.type) {
    const parts: string[] = []
    const subcatLabel = localizedName(demand.subcategory, locale.value)
    const typeLabel = localizedName(demand.type, locale.value)
    if (subcatLabel) parts.push(subcatLabel)
    if (typeLabel) parts.push(typeLabel)
    return parts.join(' > ')
  }
  return demand.vehicle_type || '-'
}

// Format helpers
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatPrice(price: number | null): string {
  if (!price) return '-'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(price)
}

function formatPriceRange(min: number | null, max: number | null): string {
  if (!min && !max) return '-'
  if (min && max) return `${formatPrice(min)} - ${formatPrice(max)}`
  if (min) return `Desde ${formatPrice(min)}`
  return `Hasta ${formatPrice(max)}`
}

function formatYearRange(min: number | null, max: number | null): string {
  if (!min && !max) return '-'
  if (min && max) return `${min} - ${max}`
  if (min) return `Desde ${min}`
  return `Hasta ${max}`
}
</script>

<template>
  <div class="admin-solicitantes">
    <!-- Header -->
    <div class="section-header">
      <h2>Solicitantes</h2>
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
          v-for="st in DEMAND_STATUSES"
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
        placeholder="Buscar por nombre, marca, tipo..."
        class="filter-search"
      >
    </div>

    <!-- Error -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">Cargando solicitantes...</div>

    <!-- Table -->
    <div v-else class="table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width: 100px">Estado</th>
            <th>Contacto</th>
            <th>Busca</th>
            <th style="width: 110px">Rango Precio</th>
            <th style="width: 90px">Rango Año</th>
            <th style="width: 100px">Fecha</th>
            <th style="width: 130px">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in demands" :key="d.id" :class="{ 'row-pending': d.status === 'pending' }">
            <td>
              <select
                :value="d.status"
                class="status-select"
                :style="{
                  borderColor: getStatusConfig(d.status).color,
                  color: getStatusConfig(d.status).color,
                }"
                @change="
                  handleStatusChange(d, ($event.target as HTMLSelectElement).value as DemandStatus)
                "
              >
                <option v-for="st in DEMAND_STATUSES" :key="st.value" :value="st.value">
                  {{ st.label }}
                </option>
              </select>
            </td>
            <td>
              <div class="contact-info">
                <strong>{{ d.contact_name }}</strong>
                <span v-if="d.contact_phone" class="contact-detail">{{ d.contact_phone }}</span>
                <span v-if="d.contact_email" class="contact-detail">{{ d.contact_email }}</span>
              </div>
            </td>
            <td>
              <div class="vehicle-info">
                <span class="vehicle-type-label">{{ getTypeLabel(d) }}</span>
                <span v-if="d.brand_preference" class="vehicle-brand">{{
                  d.brand_preference
                }}</span>
              </div>
            </td>
            <td class="text-right">
              {{ formatPriceRange(d.price_min, d.price_max) }}
            </td>
            <td class="text-center">
              {{ formatYearRange(d.year_min, d.year_max) }}
            </td>
            <td>
              {{ formatDate(d.created_at) }}
            </td>
            <td>
              <div class="action-buttons">
                <button class="btn-icon btn-view" title="Ver detalles" @click="openDetail(d)">
                  👁️
                </button>
                <button class="btn-icon btn-delete" title="Eliminar" @click="confirmDelete(d)">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!demands.length">
            <td colspan="7" class="empty-state">
              No hay solicitantes que coincidan con los filtros.
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
            <h3>Detalles del Solicitante</h3>
            <button class="modal-close" @click="closeDetail">×</button>
          </div>
          <div class="modal-body">
            <div v-if="detailModal.demand" class="detail-grid">
              <!-- Contact Info -->
              <div class="detail-section">
                <h4>Contacto</h4>
                <p><strong>Nombre:</strong> {{ detailModal.demand.contact_name }}</p>
                <p v-if="detailModal.demand.contact_phone">
                  <strong>Teléfono:</strong> {{ detailModal.demand.contact_phone }}
                </p>
                <p v-if="detailModal.demand.contact_email">
                  <strong>Email:</strong> {{ detailModal.demand.contact_email }}
                </p>
                <p v-if="detailModal.demand.location">
                  <strong>Ubicación:</strong> {{ detailModal.demand.location }}
                </p>
                <p v-if="detailModal.demand.contact_preference">
                  <strong>Preferencia:</strong> {{ detailModal.demand.contact_preference }}
                </p>
              </div>

              <!-- Classification -->
              <div class="detail-section">
                <h4>Clasificación</h4>
                <p v-if="detailModal.demand.subcategory || detailModal.demand.type">
                  <strong>Tipo:</strong> {{ getTypeLabel(detailModal.demand) }}
                </p>
                <p v-else-if="detailModal.demand.vehicle_type">
                  <strong>Tipo:</strong> {{ detailModal.demand.vehicle_type }}
                </p>
                <p v-if="detailModal.demand.brand_preference">
                  <strong>Marca preferida:</strong> {{ detailModal.demand.brand_preference }}
                </p>
                <p>
                  <strong>Rango año:</strong>
                  {{ formatYearRange(detailModal.demand.year_min, detailModal.demand.year_max) }}
                </p>
                <p>
                  <strong>Rango precio:</strong>
                  {{ formatPriceRange(detailModal.demand.price_min, detailModal.demand.price_max) }}
                </p>
              </div>

              <!-- Characteristics (attributes_json) -->
              <div
                v-if="
                  detailModal.demand.attributes_json &&
                  Object.keys(detailModal.demand.attributes_json).length
                "
                class="detail-section full-width"
              >
                <h4>Características</h4>
                <div class="characteristics-grid">
                  <div
                    v-for="(value, key) in detailModal.demand.attributes_json"
                    :key="key"
                    class="characteristic-item"
                  >
                    <span class="char-label">{{ key }}</span>
                    <span class="char-value">{{ value }}</span>
                  </div>
                </div>
              </div>

              <!-- Specs (legacy) -->
              <div
                v-if="detailModal.demand.specs && Object.keys(detailModal.demand.specs).length"
                class="detail-section full-width"
              >
                <h4>Especificaciones adicionales</h4>
                <div class="characteristics-grid">
                  <div
                    v-for="(value, key) in detailModal.demand.specs"
                    :key="key"
                    class="characteristic-item"
                  >
                    <span class="char-label">{{ key }}</span>
                    <span class="char-value">{{ value }}</span>
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div v-if="detailModal.demand.description" class="detail-section full-width">
                <h4>Descripción</h4>
                <p class="description-text">{{ detailModal.demand.description }}</p>
              </div>

              <!-- Admin Notes -->
              <div class="detail-section full-width">
                <h4>Notas del Admin</h4>
                <textarea
                  v-model="detailModal.notes"
                  rows="3"
                  placeholder="Añade notas internas sobre este solicitante..."
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
              ¿Estás seguro de eliminar el solicitante
              <strong>{{ deleteModal.demand?.contact_name }}</strong
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
.admin-solicitantes {
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
  min-width: 850px;
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

.vehicle-type-label {
  font-weight: 500;
  font-size: 0.9rem;
}

.vehicle-brand {
  font-size: 0.8rem;
  color: #6b7280;
  font-style: italic;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
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

  .characteristics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
