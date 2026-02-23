<script setup lang="ts">
import { useAdminTypes, type AdminType, type TypeFormData } from '~/composables/admin/useAdminTypes'
import { useAdminFilters } from '~/composables/admin/useAdminFilters'
import { useAdminSubcategories } from '~/composables/admin/useAdminSubcategories'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { t } = useI18n()
const toast = useToast()
const supabase = useSupabaseClient()

const {
  types,
  loading,
  saving,
  error,
  fetchTypes,
  createType,
  updateType,
  deleteType,
  toggleStatus,
  moveUp,
  moveDown,
} = useAdminTypes()

const { filters: allFilters, fetchFilters } = useAdminFilters()
const { subcategories: allSubcategories, fetchSubcategories } = useAdminSubcategories()

// Modal state
const showModal = ref(false)
const editingId = ref<string | null>(null)
const formData = ref<TypeFormData & { subcategory_ids: string[] }>({
  name_es: '',
  name_en: '',
  slug: '',
  applicable_categories: [], // Not used in legacy, but kept for DB compatibility
  applicable_filters: [],
  status: 'published',
  sort_order: 0,
  subcategory_ids: [], // Linked subcategories via junction table
})

// Store loaded subcategory links per type for display
const typeSubcategoryLinks = ref<Map<string, string[]>>(new Map())

// Delete confirmation
const deleteModal = ref({
  show: false,
  type: null as AdminType | null,
  confirmText: '',
})

// Available filters for checkboxes (excluding core filters)
const availableFilters = computed(() => {
  const coreFilters = ['precio', 'marca', 'año', 'ubicacion', 'price', 'brand', 'year', 'location']
  return allFilters.value.filter(
    (f) => f.status !== 'archived' && !coreFilters.includes(f.name.toLowerCase()),
  )
})

// Available subcategories for checkboxes
const availableSubcategories = computed(() => {
  return allSubcategories.value.filter((s) => s.status !== 'archived')
})

// Load data
onMounted(async () => {
  await Promise.all([fetchTypes(), fetchFilters(), fetchSubcategories()])
  await loadAllTypeSubcategoryLinks()
})

// Load all type-subcategory links for display in table
async function loadAllTypeSubcategoryLinks() {
  try {
    const { data } = await supabase
      .from('subcategory_categories')
      .select('subcategory_id, category_id')

    const links = new Map<string, string[]>()
    if (data) {
      for (const link of data as { subcategory_id: string; category_id: string }[]) {
        if (!links.has(link.subcategory_id)) {
          links.set(link.subcategory_id, [])
        }
        links.get(link.subcategory_id)!.push(link.category_id)
      }
    }
    typeSubcategoryLinks.value = links
  } catch {
    // Silently fail - links will just show as empty
  }
}

// Get subcategory names for a type
function getSubcategoryNames(typeId: string): string {
  const subcatIds = typeSubcategoryLinks.value.get(typeId)
  if (!subcatIds?.length) return '-'
  const names = subcatIds
    .map((id) => {
      const subcat = allSubcategories.value.find((s) => s.id === id)
      return subcat?.name_es || null
    })
    .filter(Boolean)
  return names.length ? names.join(', ') : '-'
}

// Modal functions
function openNewModal() {
  editingId.value = null
  formData.value = {
    name_es: '',
    name_en: '',
    slug: '',
    applicable_categories: [],
    applicable_filters: [],
    status: 'published',
    sort_order: types.value.length,
    subcategory_ids: [],
  }
  showModal.value = true
}

async function openEditModal(type: AdminType) {
  editingId.value = type.id

  // Load current subcategory links for this type
  let subcatIds: string[] = []
  try {
    const { data } = await supabase
      .from('subcategory_categories')
      .select('category_id')
      .eq('subcategory_id', type.id)

    if (data) {
      subcatIds = (data as { category_id: string }[]).map((d) => d.category_id)
    }
  } catch {
    // Use empty array on error
  }

  formData.value = {
    name_es: type.name_es,
    name_en: type.name_en || '',
    slug: type.slug,
    applicable_categories: type.applicable_categories || [],
    applicable_filters: type.applicable_filters || [],
    status: type.status,
    sort_order: type.sort_order,
    subcategory_ids: subcatIds,
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
}

async function saveType() {
  if (!formData.value.name_es.trim()) {
    toast.warning(t('toast.nameRequired'))
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

  // Extract subcategory_ids before saving (not part of type table)
  const subcategoryIds = formData.value.subcategory_ids
  const typeData: TypeFormData = {
    name_es: formData.value.name_es,
    name_en: formData.value.name_en,
    slug: formData.value.slug,
    applicable_categories: formData.value.applicable_categories,
    applicable_filters: formData.value.applicable_filters,
    status: formData.value.status,
    sort_order: formData.value.sort_order,
  }

  let success: boolean | string | null
  let typeId: string | null = null

  if (editingId.value) {
    success = await updateType(editingId.value, typeData)
    typeId = editingId.value
  } else {
    // createType returns the new ID on success
    typeId = await createType(typeData)
    success = !!typeId
  }

  if (success && typeId) {
    // Update subcategory links in junction table
    await updateTypeSubcategoryLinks(typeId, subcategoryIds)

    closeModal()
    await fetchTypes()
    await loadAllTypeSubcategoryLinks()
  }
}

// Update type-subcategory junction table
async function updateTypeSubcategoryLinks(typeId: string, subcategoryIds: string[]) {
  try {
    // Delete existing links for this type
    await supabase.from('subcategory_categories').delete().eq('subcategory_id', typeId)

    // Insert new links
    if (subcategoryIds.length > 0) {
      const links = subcategoryIds.map((subcatId) => ({
        subcategory_id: typeId,
        category_id: subcatId,
      }))

      await supabase.from('subcategory_categories').insert(links as never)
    }
  } catch (err) {
    if (import.meta.dev) console.error('Error updating subcategory links:', err)
  }
}

// Delete functions
function confirmDelete(type: AdminType) {
  deleteModal.value = { show: true, type: type, confirmText: '' }
}

function closeDeleteModal() {
  deleteModal.value = { show: false, type: null, confirmText: '' }
}

const canDelete = computed(() => deleteModal.value.confirmText.toLowerCase() === 'borrar')

async function executeDelete() {
  if (!deleteModal.value.type || !canDelete.value) return

  const success = await deleteType(deleteModal.value.type.id)
  if (success) {
    closeDeleteModal()
  }
}

// Helper to get filter names for display
function getFilterNames(filterIds: string[] | undefined): string {
  if (!filterIds?.length) return '-'
  const names = filterIds
    .map((id) => {
      const filter = allFilters.value.find((f) => f.id === id)
      return filter?.label_es || filter?.name || null
    })
    .filter(Boolean)
  return names.length ? names.join(', ') : '-'
}

// Status toggle
async function handleToggleStatus(type: AdminType) {
  const newStatus = type.status === 'published' ? 'draft' : 'published'
  await toggleStatus(type.id, newStatus)
  await fetchTypes()
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
  <div class="admin-tipos">
    <!-- Header -->
    <div class="section-header">
      <h2>Tipos</h2>
      <button class="btn-primary" @click="openNewModal">+ Nuevo</button>
    </div>

    <!-- Error message -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">Cargando tipos...</div>

    <!-- Table -->
    <div v-else class="table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width: 50px">Orden</th>
            <th>Nombre</th>
            <th>Subcategorias</th>
            <th>Filtros aplicables</th>
            <th style="width: 80px">Stock</th>
            <th style="width: 100px">Estado</th>
            <th style="width: 120px">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(type, index) in types" :key="type.id">
            <td class="order-cell">
              <div class="order-buttons">
                <button
                  class="btn-icon"
                  :disabled="index === 0 || saving"
                  title="Subir"
                  @click="handleMoveUp(type.id)"
                >
                  ▲
                </button>
                <button
                  class="btn-icon"
                  :disabled="index === types.length - 1 || saving"
                  title="Bajar"
                  @click="handleMoveDown(type.id)"
                >
                  ▼
                </button>
              </div>
            </td>
            <td>
              <div class="name-cell">
                <strong>{{ type.name_es }}</strong>
                <span v-if="type.name_en" class="name-en">{{ type.name_en }}</span>
              </div>
            </td>
            <td class="subcategories-cell">
              <span class="subcategories-list">{{ getSubcategoryNames(type.id) }}</span>
            </td>
            <td class="filters-cell">
              <span class="filters-list">{{ getFilterNames(type.applicable_filters) }}</span>
            </td>
            <td class="text-center">
              <span class="stock-badge">{{ type.stock_count || 0 }}</span>
            </td>
            <td>
              <button
                class="status-toggle"
                :class="type.status === 'published' ? 'active' : 'inactive'"
                :disabled="saving"
                @click="handleToggleStatus(type)"
              >
                {{ type.status === 'published' ? 'ON' : 'OFF' }}
              </button>
            </td>
            <td>
              <div class="action-buttons">
                <button class="btn-icon btn-edit" title="Editar" @click="openEditModal(type)">
                  ✏️
                </button>
                <button class="btn-icon btn-delete" title="Eliminar" @click="confirmDelete(type)">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!types.length">
            <td colspan="7" class="empty-state">No hay tipos. Crea el primero.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit/Create Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ editingId ? 'Editar Tipo' : 'Nuevo Tipo' }}</h3>
            <button class="modal-close" @click="closeModal">×</button>
          </div>

          <div class="modal-body">
            <!-- Names -->
            <div class="form-row">
              <div class="form-group">
                <label for="name_es">Nombre (ES) *</label>
                <input
                  id="name_es"
                  v-model="formData.name_es"
                  type="text"
                  placeholder="Ej: Cisternas"
                  required
                >
              </div>
              <div class="form-group">
                <label for="name_en">Nombre (EN)</label>
                <input
                  id="name_en"
                  v-model="formData.name_en"
                  type="text"
                  placeholder="Ej: Tankers"
                >
              </div>
            </div>

            <!-- Subcategories -->
            <div class="form-group">
              <label>Subcategorias</label>
              <p class="form-hint">Selecciona a qué subcategorias pertenece este tipo.</p>
              <div class="subcategories-checkbox-grid">
                <template v-if="availableSubcategories.length">
                  <label
                    v-for="subcat in availableSubcategories"
                    :key="subcat.id"
                    class="checkbox-label"
                  >
                    <input v-model="formData.subcategory_ids" type="checkbox" :value="subcat.id" >
                    <span>{{ subcat.name_es }}</span>
                  </label>
                </template>
                <p v-else class="text-muted">
                  No hay subcategorias creadas. Crea subcategorias primero.
                </p>
              </div>
            </div>

            <!-- Filters -->
            <div class="form-group">
              <label>Filtros aplicables</label>
              <p class="form-hint">Precio, Marca, Año y Ubicación siempre están activos.</p>
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
                <p v-else class="text-muted">No hay filtros creados. Crea filtros primero.</p>
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
                <span>Publicar tipo</span>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" @click="closeModal">Cancelar</button>
            <button class="btn-primary" :disabled="saving" @click="saveType">
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
            <button class="modal-close" @click="closeDeleteModal">×</button>
          </div>
          <div class="modal-body">
            <p>
              ¿Estás seguro de eliminar el tipo
              <strong>{{ deleteModal.type?.name_es }}</strong
              >?
            </p>
            <p class="text-warning">Los vehículos de este tipo quedarán sin clasificar.</p>
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
.admin-tipos {
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
  color: var(--color-text);
}

.btn-primary {
  background: var(--color-primary, #23424a);
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

.filters-cell,
.subcategories-cell {
  max-width: 180px;
}

.filters-list,
.subcategories-list {
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

.form-group input[type='text'] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 4px 0 8px;
}

.checkbox-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.filters-checkbox-grid,
.subcategories-checkbox-grid {
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
    min-width: 750px;
  }

  .modal-content {
    margin: 10px;
    max-height: calc(100vh - 20px);
  }
}
</style>
