<script setup lang="ts">
import type {
  TiposFormData,
  AdminFilter,
  AdminSubcategory,
} from '~/composables/admin/useAdminTiposPage'

defineProps<{
  show: boolean
  editingId: string | null
  formData: TiposFormData
  saving: boolean
  availableFilters: AdminFilter[]
  availableSubcategories: AdminSubcategory[]
}>()

const emit = defineEmits<{
  (e: 'close' | 'save'): void
  (e: 'updateField', field: keyof TiposFormData, value: string | number): void
  (e: 'toggleArrayItem', field: 'subcategory_ids' | 'applicable_filters', itemId: string): void
}>()

function onTextInput(field: keyof TiposFormData, event: Event) {
  const target = event.target as HTMLInputElement
  emit('updateField', field, target.value)
}

function onStatusToggle(currentStatus: string) {
  emit('updateField', 'status', currentStatus === 'published' ? 'draft' : 'published')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingId ? 'Editar Tipo' : 'Nuevo Tipo' }}</h3>
          <button class="modal-close" @click="emit('close')">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Names -->
          <div class="form-row">
            <div class="form-group">
              <label for="name_es">Nombre (ES) *</label>
              <input
                id="name_es"
                type="text"
                placeholder="Ej: Cisternas"
                required
                :value="formData.name_es"
                @input="onTextInput('name_es', $event)"
              >
            </div>
            <div class="form-group">
              <label for="name_en">Nombre (EN)</label>
              <input
                id="name_en"
                type="text"
                placeholder="Ej: Tankers"
                :value="formData.name_en || ''"
                @input="onTextInput('name_en', $event)"
              >
            </div>
          </div>

          <!-- Subcategories -->
          <div class="form-group">
            <label>Subcategorias</label>
            <p class="form-hint">Selecciona a que subcategorias pertenece este tipo.</p>
            <div class="subcategories-checkbox-grid">
              <template v-if="availableSubcategories.length">
                <label
                  v-for="subcat in availableSubcategories"
                  :key="subcat.id"
                  class="checkbox-label"
                >
                  <input
                    type="checkbox"
                    :checked="formData.subcategory_ids.includes(subcat.id)"
                    @change="emit('toggleArrayItem', 'subcategory_ids', subcat.id)"
                  >
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
            <p class="form-hint">Precio, Marca, Ano y Ubicacion siempre estan activos.</p>
            <div class="filters-checkbox-grid">
              <template v-if="availableFilters.length">
                <label v-for="filter in availableFilters" :key="filter.id" class="checkbox-label">
                  <input
                    type="checkbox"
                    :checked="formData.applicable_filters.includes(filter.id)"
                    @change="emit('toggleArrayItem', 'applicable_filters', filter.id)"
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
                type="checkbox"
                :checked="formData.status === 'published'"
                @change="onStatusToggle(formData.status)"
              >
              <span>Publicar tipo</span>
            </label>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">Cancelar</button>
          <button class="btn-primary" :disabled="saving" @click="emit('save')">
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
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
  background: var(--bg-primary);
  border-radius: 12px;
  width: 100%;
  max-width: 550px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
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
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.95rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 4px 0 8px;
}

.filters-checkbox-grid,
.subcategories-checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 12px;
  border: 1px solid var(--border-color-light);
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

.text-muted {
  color: var(--text-disabled);
  font-size: 0.875rem;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-tertiary);
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

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .modal-content {
    margin: 10px;
    max-height: calc(100vh - 20px);
  }
}
</style>
