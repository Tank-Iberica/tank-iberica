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
          <th>Nombre</th>
          <th>Tipo</th>
          <th>Extra</th>
          <th>Ocultar</th>
          <th style="width: 100px">Estado</th>
          <th style="width: 100px">Acciones</th>
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
          <td colspan="7" class="empty-state">No hay caracteristicas. Crea la primera.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
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

@media (max-width: 768px) {
  .table-container {
    overflow-x: auto;
  }

  .admin-table {
    min-width: 700px;
  }
}
</style>
