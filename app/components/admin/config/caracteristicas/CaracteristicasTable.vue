<script setup lang="ts">
import type { AdminFilter, FilterType, FilterStatus } from '~/composables/admin/useAdminFilters'

defineProps<{
  filters: AdminFilter[]
  saving: boolean
  getTypeLabel: (type: FilterType) => string
  getStatusClass: (status: FilterStatus) => string
  getStatusLabel: (status: FilterStatus) => string
  getExtraFiltersDisplay: (filter: AdminFilter) => string
  getHidesDisplay: (filter: AdminFilter) => string
}>()

const emit = defineEmits<{
  (e: 'edit' | 'delete', filter: AdminFilter): void
  (e: 'move-up' | 'move-down', id: string): void
}>()
</script>

<template>
  <div class="table-container">
    <table class="admin-table">
      <thead>
        <tr>
          <th style="width: 50px">Orden</th>
          <th>{{ $t('common.name') }}</th>
          <th>Tipo</th>
          <th>Extra</th>
          <th>Ocultar</th>
          <th style="width: 100px">{{ $t('common.status') }}</th>
          <th style="width: 100px">{{ $t('common.actions') }}</th>
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
                @click="emit('move-up', filter.id)"
              >
                &#x25B2;
              </button>
              <button
                class="btn-icon"
                :disabled="index === filters.length - 1 || saving"
                title="Bajar"
                @click="emit('move-down', filter.id)"
              >
                &#x25BC;
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
              <button class="btn-icon btn-edit" title="Editar" @click="emit('edit', filter)">
                &#x270F;&#xFE0F;
              </button>
              <button class="btn-icon btn-delete" title="Eliminar" @click="emit('delete', filter)">
                &#x1F5D1;&#xFE0F;
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!filters.length">
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
  gap: var(--spacing-1);
}

.name-en {
  font-size: 0.8rem;
  color: var(--color-gray-500);
}

.unit-badge {
  display: inline-block;
  background: var(--bg-tertiary);
  padding: 0.125rem 0.375rem;
  border-radius: var(--border-radius-sm);
  font-size: 0.7rem;
  color: var(--color-gray-600);
  width: fit-content;
}

.type-badge {
  display: inline-block;
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--color-info);
  padding: 0.25rem 0.625rem;
  border-radius: var(--border-radius-md);
  font-size: 0.75rem;
  font-weight: 500;
}

.extra-cell,
.hide-cell {
  max-width: 9.375rem;
  font-size: 0.8rem;
  color: var(--color-gray-600);
}

.extra-list {
  color: var(--color-success);
}

.hide-list {
  color: var(--color-error);
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: var(--border-radius-md);
  font-size: 0.75rem;
  font-weight: 500;
}

.status-published {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
}

.status-draft {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
}

.status-archived {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
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

.text-muted {
  color: var(--text-disabled);
  font-size: 0.875rem;
}

@media (max-width: 48em) {
  .table-container {
    overflow-x: auto;
  }

  .admin-table {
    min-width: 43.75rem;
  }
}
</style>
