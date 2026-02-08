<script setup lang="ts">
import {
  useAdminFilters,
  type AdminFilter,
  type FilterFormData,
  type FilterType,
  type FilterStatus,
  FILTER_TYPES,
  FILTER_STATUSES,
} from '~/composables/admin/useAdminFilters'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  filters,
  loading,
  saving,
  error,
  fetchFilters,
  createFilter,
  updateFilter,
  deleteFilter,
  moveUp,
  moveDown,
  getAvailableFilters,
} = useAdminFilters()

// Modal state
const showModal = ref(false)
const editingId = ref<string | null>(null)
const formData = ref<FilterFormData>({
  name: '',
  type: 'caja',
  label_es: '',
  label_en: '',
  unit: '',
  default_value: '',
  extra_filters: [],
  hides: [],
  status: 'published',
  is_extra: false,
  is_hidden: false,
})

// Delete confirmation
const deleteModal = ref({
  show: false,
  filter: null as AdminFilter | null,
  confirmText: '',
})

function closeDeleteModal() {
  deleteModal.value = { show: false, filter: null, confirmText: '' }
}

const canDelete = computed(() => deleteModal.value.confirmText.toLowerCase() === 'borrar')

// Available filters for tick's extra/hide selection
const availableFiltersForSelection = computed(() =>
  getAvailableFilters(editingId.value || undefined),
)

// Load data
onMounted(async () => {
  await fetchFilters()
})

// Modal functions
function openNewModal() {
  editingId.value = null
  formData.value = {
    name: '',
    type: 'caja',
    label_es: '',
    label_en: '',
    unit: '',
    default_value: '',
    extra_filters: [],
    hides: [],
    status: 'published',
    is_extra: false,
    is_hidden: false,
  }
  showModal.value = true
}

function openEditModal(filter: AdminFilter) {
  editingId.value = filter.id
  formData.value = {
    name: filter.name,
    type: filter.type,
    label_es: filter.label_es || '',
    label_en: filter.label_en || '',
    unit: filter.unit || '',
    default_value: String(filter.options?.default_value || ''),
    extra_filters: filter.options?.extra_filters || [],
    hides: filter.options?.hides || [],
    status: filter.status,
    is_extra: filter.is_extra,
    is_hidden: filter.is_hidden,
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
}

async function saveFilter() {
  if (!formData.value.name.trim()) {
    alert('El nombre es obligatorio')
    return
  }
  if (!formData.value.type) {
    alert('El tipo es obligatorio')
    return
  }

  // Auto-set label_es if empty
  if (!formData.value.label_es) {
    formData.value.label_es = formData.value.name
  }

  let success: boolean | string | null
  if (editingId.value) {
    success = await updateFilter(editingId.value, formData.value)
  }
  else {
    success = await createFilter(formData.value)
  }

  if (success) {
    closeModal()
    await fetchFilters()
  }
}

// Delete functions
function confirmDelete(filter: AdminFilter) {
  deleteModal.value = { show: true, filter, confirmText: '' }
}

async function executeDelete() {
  if (!deleteModal.value.filter || !canDelete.value) return

  const success = await deleteFilter(deleteModal.value.filter.id)
  if (success) {
    closeDeleteModal()
  }
}

// Reorder functions
async function handleMoveUp(id: string) {
  await moveUp(id)
}

async function handleMoveDown(id: string) {
  await moveDown(id)
}

// Helpers
function getTypeLabel(type: FilterType): string {
  return FILTER_TYPES.find(t => t.value === type)?.label || type
}

function getStatusClass(status: FilterStatus): string {
  switch (status) {
    case 'published': return 'status-published'
    case 'draft': return 'status-draft'
    case 'archived': return 'status-archived'
    default: return ''
  }
}

function getStatusLabel(status: FilterStatus): string {
  return FILTER_STATUSES.find(s => s.value === status)?.label || status
}

function getExtraFiltersDisplay(filter: AdminFilter): string {
  const extras = filter.options?.extra_filters || []
  if (!extras.length) return '-'
  return extras.map((id) => {
    const f = filters.value.find(x => x.id === id || x.name === id)
    return f?.label_es || f?.name || id
  }).join(', ')
}

function getHidesDisplay(filter: AdminFilter): string {
  const hides = filter.options?.hides || []
  if (!hides.length) return '-'
  return hides.map((id) => {
    const f = filters.value.find(x => x.id === id || x.name === id)
    return f?.label_es || f?.name || id
  }).join(', ')
}

// Show extra/hide fields only for tick type
const showTickOptions = computed(() => formData.value.type === 'tick')
</script>

<template>
  <div class="admin-caracteristicas">
    <!-- Header -->
    <div class="section-header">
      <h2>Características</h2>
      <button class="btn-primary" @click="openNewModal">
        + Nueva
      </button>
    </div>

    <!-- Error message -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      Cargando características...
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width: 50px">
              Orden
            </th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Extra</th>
            <th>Ocultar</th>
            <th style="width: 100px">
              Estado
            </th>
            <th style="width: 100px">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(filter, index) in filters" :key="filter.id">
            <td class="order-cell">
              <div class="order-buttons">
                <button
                  class="btn-icon"
                  :disabled="index === 0 || saving"
                  title="Subir"
                  @click="handleMoveUp(filter.id)"
                >
                  ▲
                </button>
                <button
                  class="btn-icon"
                  :disabled="index === filters.length - 1 || saving"
                  title="Bajar"
                  @click="handleMoveDown(filter.id)"
                >
                  ▼
                </button>
              </div>
            </td>
            <td>
              <div class="name-cell">
                <strong>{{ filter.label_es || filter.name }}</strong>
                <span v-if="filter.label_en" class="name-en">{{ filter.label_en }}</span>
                <span v-if="filter.unit" class="unit-badge">{{ filter.unit }}</span>
              </div>
            </td>
            <td>
              <span class="type-badge">{{ getTypeLabel(filter.type) }}</span>
            </td>
            <td class="extra-cell">
              <span v-if="filter.type === 'tick'" class="extra-list">
                {{ getExtraFiltersDisplay(filter) }}
              </span>
              <span v-else class="text-muted">-</span>
            </td>
            <td class="hide-cell">
              <span v-if="filter.type === 'tick'" class="hide-list">
                {{ getHidesDisplay(filter) }}
              </span>
              <span v-else class="text-muted">-</span>
            </td>
            <td>
              <span class="status-badge" :class="getStatusClass(filter.status)">
                {{ getStatusLabel(filter.status) }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button
                  class="btn-icon btn-edit"
                  title="Editar"
                  @click="openEditModal(filter)"
                >
                  ✏️
                </button>
                <button
                  class="btn-icon btn-delete"
                  title="Eliminar"
                  @click="confirmDelete(filter)"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!filters.length">
            <td colspan="7" class="empty-state">
              No hay características. Crea la primera.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit/Create Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ editingId ? 'Editar Característica' : 'Nueva Característica' }}</h3>
            <button class="modal-close" @click="closeModal">
              ×
            </button>
          </div>

          <div class="modal-body">
            <!-- Names -->
            <div class="form-row">
              <div class="form-group">
                <label for="name">Nombre (ES) *</label>
                <input
                  id="name"
                  v-model="formData.name"
                  type="text"
                  placeholder="Ej: Volumen"
                  required
                >
              </div>
              <div class="form-group">
                <label for="label_en">Nombre (EN)</label>
                <input
                  id="label_en"
                  v-model="formData.label_en"
                  type="text"
                  placeholder="Ej: Volume"
                >
              </div>
            </div>

            <!-- Type and Unit -->
            <div class="form-row">
              <div class="form-group">
                <label for="type">Tipo *</label>
                <select id="type" v-model="formData.type" required>
                  <option value="" disabled>
                    Seleccionar
                  </option>
                  <option v-for="t in FILTER_TYPES" :key="t.value" :value="t.value">
                    {{ t.label }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label for="unit">Unidad de medida</label>
                <input
                  id="unit"
                  v-model="formData.unit"
                  type="text"
                  placeholder="Ej: Km, Kg, L, CV..."
                >
              </div>
            </div>

            <!-- Extra filters (only for tick type) -->
            <div v-if="showTickOptions" class="form-group tick-options">
              <label>Extra características (aparecen cuando este tick está activo)</label>
              <div class="checkbox-grid extra-grid">
                <template v-if="availableFiltersForSelection.length">
                  <label v-for="f in availableFiltersForSelection" :key="f.id" class="checkbox-label">
                    <input
                      v-model="formData.extra_filters"
                      type="checkbox"
                      :value="f.id"
                    >
                    <span>{{ f.label_es || f.name }}</span>
                  </label>
                </template>
                <p v-else class="text-muted">
                  No hay otras características disponibles.
                </p>
              </div>
            </div>

            <!-- Hide filters (only for tick type) -->
            <div v-if="showTickOptions" class="form-group tick-options">
              <label>Ocultar características (se ocultan cuando este tick está activo)</label>
              <div class="checkbox-grid hide-grid">
                <template v-if="availableFiltersForSelection.length">
                  <label v-for="f in availableFiltersForSelection" :key="f.id" class="checkbox-label">
                    <input
                      v-model="formData.hides"
                      type="checkbox"
                      :value="f.id"
                    >
                    <span>{{ f.label_es || f.name }}</span>
                  </label>
                </template>
                <p v-else class="text-muted">
                  No hay otras características disponibles.
                </p>
              </div>
            </div>

            <!-- Default value -->
            <div class="form-group">
              <label for="default_value">Valor por defecto</label>
              <input
                id="default_value"
                v-model="formData.default_value"
                type="text"
                placeholder="Opcional"
              >
            </div>

            <!-- Status -->
            <div class="form-group">
              <label for="status">Estado</label>
              <select id="status" v-model="formData.status">
                <option v-for="s in FILTER_STATUSES" :key="s.value" :value="s.value">
                  {{ s.label }} - {{ s.description }}
                </option>
              </select>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" @click="closeModal">
              Cancelar
            </button>
            <button class="btn-primary" :disabled="saving" @click="saveFilter">
              {{ saving ? 'Guardando...' : 'Guardar' }}
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
            <button class="modal-close" @click="closeDeleteModal">
              ×
            </button>
          </div>
          <div class="modal-body">
            <p>
              ¿Estás seguro de eliminar la característica
              <strong>{{ deleteModal.filter?.label_es || deleteModal.filter?.name }}</strong>?
            </p>
            <p class="text-warning">
              Esta característica se eliminará de todos los tipos y vehículos.
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
            <button class="btn-secondary" @click="closeDeleteModal">
              Cancelar
            </button>
            <button class="btn-danger" :disabled="saving || !canDelete" @click="executeDelete">
              {{ saving ? 'Eliminando...' : 'Eliminar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.admin-caracteristicas {
  padding: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-text);
}

.btn-primary {
  background: var(--color-primary, #23424A);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark, #1a3238);
}

.btn-primary:disabled {
  opacity: 0.6;
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

.btn-secondary:hover {
  background: #d1d5db;
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

.btn-danger:hover {
  background: #b91c1c;
}

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

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
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

.order-cell {
  text-align: center;
}

.order-buttons {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.btn-icon {
  background: none;
  border: 1px solid #e5e7eb;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  transition: all 0.2s;
}

.btn-icon:hover:not(:disabled) {
  background: #f3f4f6;
}

.btn-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-edit:hover {
  background: #dbeafe;
}

.btn-delete:hover {
  background: #fee2e2;
}

.name-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name-en {
  font-size: 0.8rem;
  color: #6b7280;
}

.unit-badge {
  display: inline-block;
  background: #e5e7eb;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  color: #4b5563;
  width: fit-content;
}

.type-badge {
  display: inline-block;
  background: #dbeafe;
  color: #1d4ed8;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.extra-cell,
.hide-cell {
  max-width: 150px;
  font-size: 0.8rem;
  color: #4b5563;
}

.extra-list {
  color: #16a34a;
}

.hide-list {
  color: #dc2626;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-published {
  background: #dcfce7;
  color: #16a34a;
}

.status-draft {
  background: #fef3c7;
  color: #92400e;
}

.status-archived {
  background: #fee2e2;
  color: #dc2626;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.text-muted {
  color: #9ca3af;
  font-size: 0.875rem;
}

.text-warning {
  color: #d97706;
  font-size: 0.875rem;
  margin-top: 8px;
}

.text-error {
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: 4px;
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

/* Modal styles */
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
  max-width: 550px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-small {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
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
  line-height: 1;
}

.modal-close:hover {
  color: #374151;
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
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 6px;
  color: #374151;
}

.form-group input[type="text"],
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary, #23424A);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.tick-options {
  margin-top: 8px;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
  max-height: 150px;
  overflow-y: auto;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.extra-grid {
  background: #f0fff4;
}

.hide-grid {
  background: #fff5f5;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.85rem;
}

.checkbox-label input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .table-container {
    overflow-x: auto;
  }

  .admin-table {
    min-width: 700px;
  }

  .modal-content {
    margin: 10px;
    max-height: calc(100vh - 20px);
  }
}
</style>
