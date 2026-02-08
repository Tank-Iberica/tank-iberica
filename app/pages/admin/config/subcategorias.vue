<script setup lang="ts">
import { useAdminSubcategories, type AdminSubcategory, type SubcategoryFormData } from '~/composables/admin/useAdminSubcategories'
import { useAdminFilters } from '~/composables/admin/useAdminFilters'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  subcategories,
  loading,
  saving,
  error,
  fetchSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  toggleStatus,
  moveUp,
  moveDown,
  clearError,
} = useAdminSubcategories()

const { filters: allFilters, fetchFilters } = useAdminFilters()

// Modal state
const showModal = ref(false)
const editingId = ref<string | null>(null)
const formData = ref<SubcategoryFormData>({
  name_es: '',
  name_en: '',
  slug: '',
  applicable_categories: [],
  applicable_filters: [],
  status: 'published',
  sort_order: 0,
})

// Delete confirmation
const deleteModal = ref({
  show: false,
  subcategory: null as AdminSubcategory | null,
  confirmText: '',
})

// Available filters for checkboxes (excluding core filters)
const availableFilters = computed(() => {
  const coreFilters = ['precio', 'marca', 'año', 'ubicacion', 'price', 'brand', 'year', 'location']
  return allFilters.value.filter(f =>
    f.status !== 'archived' &&
    !coreFilters.includes(f.name.toLowerCase()),
  )
})

// Vehicle categories for checkboxes
const vehicleCategories = [
  { id: 'alquiler', label: 'Alquiler' },
  { id: 'venta', label: 'Venta' },
  { id: 'terceros', label: 'Terceros' },
]

// Load data
onMounted(async () => {
  await Promise.all([fetchSubcategories(), fetchFilters()])
})

// Modal functions
function openNewModal() {
  clearError()
  editingId.value = null
  formData.value = {
    name_es: '',
    name_en: '',
    slug: '',
    applicable_categories: ['alquiler', 'venta', 'terceros'], // Default to all categories
    applicable_filters: [],
    status: 'published',
    sort_order: subcategories.value.length,
  }
  showModal.value = true
}

function openEditModal(subcategory: AdminSubcategory) {
  clearError()
  editingId.value = subcategory.id
  formData.value = {
    name_es: subcategory.name_es,
    name_en: subcategory.name_en || '',
    slug: subcategory.slug,
    applicable_categories: subcategory.applicable_categories || [],
    applicable_filters: subcategory.applicable_filters || [],
    status: subcategory.status,
    sort_order: subcategory.sort_order,
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
}

async function saveSubcategory() {
  if (!formData.value.name_es.trim()) {
    alert('El nombre es obligatorio')
    return
  }

  // Auto-generate slug if empty
  if (!formData.value.slug) {
    formData.value.slug = formData.value.name_es
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036F]/g, '')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  let success: boolean | string | null
  if (editingId.value) {
    success = await updateSubcategory(editingId.value, formData.value)
  }
  else {
    success = await createSubcategory(formData.value)
  }

  if (success) {
    closeModal()
    await fetchSubcategories()
  }
  else if (error.value) {
    // Error is already set in the composable and displayed via the error banner
    console.error('Save subcategory failed:', error.value)
  }
}

// Delete functions
function confirmDelete(subcategory: AdminSubcategory) {
  deleteModal.value = { show: true, subcategory: subcategory, confirmText: '' }
}

function closeDeleteModal() {
  deleteModal.value = { show: false, subcategory: null, confirmText: '' }
}

const canDelete = computed(() => deleteModal.value.confirmText.toLowerCase() === 'borrar')

async function executeDelete() {
  if (!deleteModal.value.subcategory || !canDelete.value) return

  const success = await deleteSubcategory(deleteModal.value.subcategory.id)
  if (success) {
    closeDeleteModal()
  }
}

// Helper to get filter names for display
function getFilterNames(filterIds: string[] | undefined): string {
  if (!filterIds?.length) return '-'
  const names = filterIds
    .map((id) => {
      const filter = allFilters.value.find(f => f.id === id)
      return filter?.label_es || filter?.name || null
    })
    .filter(Boolean)
  return names.length ? names.join(', ') : '-'
}

// Helper to get category labels for display
function getCategoryLabels(categoryIds: string[] | undefined): string {
  if (!categoryIds?.length) return '-'
  const labels = categoryIds
    .map((id) => {
      const cat = vehicleCategories.find(c => c.id === id)
      return cat?.label || null
    })
    .filter(Boolean)
  return labels.length ? labels.join(', ') : '-'
}

// Status toggle
async function handleToggleStatus(subcategory: AdminSubcategory) {
  const newStatus = subcategory.status === 'published' ? 'draft' : 'published'
  await toggleStatus(subcategory.id, newStatus)
  await fetchSubcategories()
}

// Reorder functions
async function handleMoveUp(id: string) {
  await moveUp(id)
}

async function handleMoveDown(id: string) {
  await moveDown(id)
}
</script>

<template>
  <div class="admin-subcategorias">
    <!-- Header -->
    <div class="section-header">
      <h2>Subcategorias</h2>
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
      Cargando subcategorias...
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
            <th>Categorias</th>
            <th>Filtros aplicables</th>
            <th style="width: 80px">
              Stock
            </th>
            <th style="width: 100px">
              Estado
            </th>
            <th style="width: 120px">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(subcategory, index) in subcategories" :key="subcategory.id">
            <td class="order-cell">
              <div class="order-buttons">
                <button
                  class="btn-icon"
                  :disabled="index === 0 || saving"
                  title="Subir"
                  @click="handleMoveUp(subcategory.id)"
                >
                  ▲
                </button>
                <button
                  class="btn-icon"
                  :disabled="index === subcategories.length - 1 || saving"
                  title="Bajar"
                  @click="handleMoveDown(subcategory.id)"
                >
                  ▼
                </button>
              </div>
            </td>
            <td>
              <div class="name-cell">
                <strong>{{ subcategory.name_es }}</strong>
                <span v-if="subcategory.name_en" class="name-en">{{ subcategory.name_en }}</span>
              </div>
            </td>
            <td class="categories-cell">
              <span class="categories-list">{{ getCategoryLabels(subcategory.applicable_categories) }}</span>
            </td>
            <td class="filters-cell">
              <span class="filters-list">{{ getFilterNames(subcategory.applicable_filters) }}</span>
            </td>
            <td class="text-center">
              <span class="stock-badge">{{ subcategory.stock_count || 0 }}</span>
            </td>
            <td>
              <button
                class="status-toggle"
                :class="subcategory.status === 'published' ? 'active' : 'inactive'"
                :disabled="saving"
                @click="handleToggleStatus(subcategory)"
              >
                {{ subcategory.status === 'published' ? 'ON' : 'OFF' }}
              </button>
            </td>
            <td>
              <div class="action-buttons">
                <button
                  class="btn-icon btn-edit"
                  title="Editar"
                  @click="openEditModal(subcategory)"
                >
                  ✏️
                </button>
                <button
                  class="btn-icon btn-delete"
                  title="Eliminar"
                  @click="confirmDelete(subcategory)"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!subcategories.length">
            <td colspan="7" class="empty-state">
              No hay subcategorias. Crea la primera.
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
            <h3>{{ editingId ? 'Editar Subcategoria' : 'Nueva Subcategoria' }}</h3>
            <button class="modal-close" @click="closeModal">
              ×
            </button>
          </div>

          <div class="modal-body">
            <!-- Error inside modal -->
            <div v-if="error" class="error-banner modal-error">
              {{ error }}
            </div>

            <!-- Names -->
            <div class="form-row">
              <div class="form-group">
                <label for="name_es">Nombre (ES) *</label>
                <input
                  id="name_es"
                  v-model="formData.name_es"
                  type="text"
                  placeholder="Ej: Semirremolques"
                  required
                >
              </div>
              <div class="form-group">
                <label for="name_en">Nombre (EN)</label>
                <input
                  id="name_en"
                  v-model="formData.name_en"
                  type="text"
                  placeholder="Ej: Semi-trailers"
                >
              </div>
            </div>

            <!-- Categories -->
            <div class="form-group">
              <label>Categorias aplicables</label>
              <p class="form-hint">
                Define en que categorias aparece esta subcategoria.
              </p>
              <div class="categories-checkbox-grid">
                <label v-for="cat in vehicleCategories" :key="cat.id" class="checkbox-label">
                  <input
                    v-model="formData.applicable_categories"
                    type="checkbox"
                    :value="cat.id"
                  >
                  <span>{{ cat.label }}</span>
                </label>
              </div>
            </div>

            <!-- Filters -->
            <div class="form-group">
              <label>Filtros aplicables</label>
              <p class="form-hint">
                Filtros que aplican a nivel de subcategoria. Precio, Marca, Año y Ubicación siempre están activos.
              </p>
              <div class="filters-checkbox-grid">
                <template v-if="availableFilters.length">
                  <label v-for="filter in availableFilters" :key="filter.id" class="checkbox-label">
                    <input
                      v-model="formData.applicable_filters"
                      type="checkbox"
                      :value="filter.id"
                    >
                    <span>{{ filter.label_es || filter.name }}</span>
                  </label>
                </template>
                <p v-else class="text-muted">
                  No hay filtros creados. Crea filtros primero.
                </p>
              </div>
            </div>

            <!-- Status -->
            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="formData.status"
                  type="checkbox"
                  true-value="published"
                  false-value="draft"
                >
                <span>Publicar subcategoria</span>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" @click="closeModal">
              Cancelar
            </button>
            <button class="btn-primary" :disabled="saving" @click="saveSubcategory">
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
              ¿Estás seguro de eliminar la subcategoria
              <strong>{{ deleteModal.subcategory?.name_es }}</strong>?
            </p>
            <p class="text-warning">
              Los tipos vinculados a esta subcategoria perderán esa asociación.
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
.admin-subcategorias {
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

.modal-error {
  margin-bottom: 16px;
  font-size: 0.9rem;
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
  gap: 2px;
}

.name-en {
  font-size: 0.8rem;
  color: #6b7280;
}

.stock-badge {
  background: #f3f4f6;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.875rem;
}

.status-toggle {
  padding: 6px 16px;
  border-radius: 20px;
  border: none;
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.status-toggle.active {
  background: #dcfce7;
  color: #16a34a;
}

.status-toggle.inactive {
  background: #f3f4f6;
  color: #6b7280;
}

.status-toggle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.text-center {
  text-align: center;
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

.categories-cell {
  max-width: 150px;
}

.categories-list {
  font-size: 0.85rem;
  color: #4b5563;
}

.filters-cell {
  max-width: 200px;
}

.filters-list {
  font-size: 0.85rem;
  color: #4b5563;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

.form-group input[type="text"] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary, #23424A);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 4px 0 8px;
}

.categories-checkbox-grid {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
}

.filters-checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
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
