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
    <div
      v-if="show"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      @click.self="emit('close')"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h3>
            {{ editingId ? $t('admin.configTipos.editType') : $t('admin.configTipos.newType') }}
          </h3>
          <button class="modal-close" @click="emit('close')">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Names -->
          <div class="form-row">
            <div class="form-group">
              <label for="name_es">{{ $t('admin.configTipos.nameEs') }}</label>
              <input
                id="name_es"
                type="text"
                :placeholder="$t('admin.configTipos.nameEsPlaceholder')"
                required
                :value="formData.name_es"
                @input="onTextInput('name_es', $event)"
              >
            </div>
            <div class="form-group">
              <label for="name_en">{{ $t('admin.configTipos.nameEn') }}</label>
              <input
                id="name_en"
                type="text"
                :placeholder="$t('admin.configTipos.nameEnPlaceholder')"
                :value="formData.name_en || ''"
                @input="onTextInput('name_en', $event)"
              >
            </div>
          </div>

          <!-- Subcategories -->
          <div class="form-group">
            <label>{{ $t('admin.configTipos.subcategoriesLabel') }}</label>
            <p class="form-hint">{{ $t('admin.configTipos.subcategoriesHint') }}</p>
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
                {{ $t('admin.configTipos.noSubcategories') }}
              </p>
            </div>
          </div>

          <!-- Filters -->
          <div class="form-group">
            <label>{{ $t('admin.configTipos.filtersLabel') }}</label>
            <p class="form-hint">{{ $t('admin.configTipos.filtersHint') }}</p>
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
              <p v-else class="text-muted">{{ $t('admin.configTipos.noFilters') }}</p>
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
              <span>{{ $t('admin.configTipos.publishType') }}</span>
            </label>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">{{ $t('common.cancel') }}</button>
          <button class="btn-primary" :disabled="saving" @click="emit('save')">
            {{ saving ? $t('common.saving') : $t('common.save') }}
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
  padding: var(--spacing-5);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  width: 100%;
  max-width: 34.375rem;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-5) var(--spacing-6);
  border-bottom: 1px solid var(--color-gray-200);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  cursor: pointer;
  color: var(--color-gray-500);
  line-height: 1;
}

.modal-close:hover {
  color: var(--color-gray-700);
}

.modal-body {
  padding: var(--spacing-6);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

.form-group {
  margin-bottom: var(--spacing-4);
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.375rem;
  color: var(--color-gray-700);
}

.form-group input[type='text'] {
  width: 100%;
  padding: 0.625rem var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.form-hint {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  margin: var(--spacing-1) 0 var(--spacing-2);
}

.filters-checkbox-grid,
.subcategories-checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--spacing-2);
  max-height: 12.5rem;
  overflow-y: auto;
  padding: var(--spacing-3);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  background: var(--color-gray-50);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  font-size: 0.9rem;
}

.checkbox-label input {
  width: 1rem;
  height: 1rem;
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
  padding: 0.625rem var(--spacing-5);
  border-radius: var(--border-radius);
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
  color: var(--color-gray-700);
  border: none;
  padding: 0.625rem var(--spacing-5);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary:hover {
  background: var(--color-gray-300);
}

@media (max-width: 48em) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .modal-content {
    margin: 0.625rem;
    max-height: calc(100vh - 20px);
  }
}
</style>
