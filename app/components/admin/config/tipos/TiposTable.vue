<script setup lang="ts">
import type { AdminType } from '~/composables/admin/useAdminTiposPage'

defineProps<{
  types: AdminType[]
  saving: boolean
  getSubcategoryNames: (typeId: string) => string
  getFilterNames: (filterIds: string[] | undefined) => string
}>()

const emit = defineEmits<{
  (e: 'toggleStatus' | 'edit' | 'delete', type: AdminType): void
  (e: 'moveUp' | 'moveDown', id: string): void
}>()
</script>

<template>
  <div class="table-container">
    <table class="admin-table">
      <thead>
        <tr>
          <th style="width: 50px">Orden</th>
          <th>{{ $t('common.name') }}</th>
          <th>Subcategorias</th>
          <th>Filtros aplicables</th>
          <th style="width: 5rem">Stock</th>
          <th style="width: 100px">{{ $t('common.status') }}</th>
          <th style="width: 7.5rem">{{ $t('common.actions') }}</th>
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
                @click="emit('moveUp', type.id)"
              >
                &#9650;
              </button>
              <button
                class="btn-icon"
                :disabled="index === types.length - 1 || saving"
                title="Bajar"
                @click="emit('moveDown', type.id)"
              >
                &#9660;
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
              @click="emit('toggleStatus', type)"
            >
              {{ type.status === 'published' ? 'ON' : 'OFF' }}
            </button>
          </td>
          <td>
            <div class="action-buttons">
              <button class="btn-icon btn-edit" title="Editar" @click="emit('edit', type)">
                &#9998;&#65039;
              </button>
              <button class="btn-icon btn-delete" title="Eliminar" @click="emit('delete', type)">
                &#128465;&#65039;
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!types.length">
          <td colspan="7" class="empty-state">{{ $t('common.noResults') }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-container {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th,
.admin-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--bg-tertiary);
}

.admin-table th {
  background: var(--color-gray-50);
  font-weight: 600;
  color: var(--color-gray-700);
  font-size: 0.875rem;
}

.admin-table tr:hover {
  background: var(--color-gray-50);
}

.order-cell {
  text-align: center;
}

.order-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.btn-icon {
  background: none;
  border: 1px solid var(--border-color-light);
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: 0.625rem;
  transition: all 0.2s;
}

.btn-icon:hover:not(:disabled) {
  background: var(--bg-secondary);
}

.btn-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-edit:hover {
  background: var(--color-info-bg, var(--color-info-bg));
}

.btn-delete:hover {
  background: var(--color-error-bg, var(--color-error-bg));
}

.name-cell {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.name-en {
  font-size: 0.8rem;
  color: var(--color-gray-500);
}

.stock-badge {
  background: var(--bg-secondary);
  padding: 0.25rem 0.75rem;
  border-radius: var(--border-radius-md);
  font-weight: 600;
  font-size: 0.875rem;
}

.status-toggle {
  padding: 0.375rem 1rem;
  border-radius: 1.25rem;
  border: none;
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.status-toggle.active {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
}

.status-toggle.inactive {
  background: var(--bg-secondary);
  color: var(--color-gray-500);
}

.status-toggle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-buttons {
  display: flex;
  gap: var(--spacing-2);
}

.empty-state {
  text-align: center;
  padding: 2.5rem;
  color: var(--color-gray-500);
}

.text-center {
  text-align: center;
}

.filters-cell,
.subcategories-cell {
  max-width: 11.25rem;
}

.filters-list,
.subcategories-list {
  font-size: 0.85rem;
  color: var(--color-gray-600);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 48em) {
  .table-container {
    overflow-x: auto;
  }

  .admin-table {
    min-width: 46.875rem;
  }
}
</style>
