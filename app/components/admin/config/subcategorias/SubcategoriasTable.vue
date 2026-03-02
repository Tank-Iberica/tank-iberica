<script setup lang="ts">
import type { AdminSubcategory } from '~/composables/admin/useAdminSubcategoriasPage'

defineProps<{
  subcategories: AdminSubcategory[]
  saving: boolean
  getCategoryLabels: (categoryIds: string[] | undefined) => string
  getFilterNames: (filterIds: string[] | undefined) => string
}>()

const emit = defineEmits<{
  (e: 'toggleStatus' | 'edit' | 'delete', subcategory: AdminSubcategory): void
  (e: 'moveUp' | 'moveDown', id: string): void
}>()
</script>

<template>
  <div class="table-container">
    <table class="admin-table">
      <thead>
        <tr>
          <th style="width: 50px">Orden</th>
          <th>Nombre</th>
          <th>Categorias</th>
          <th>Filtros aplicables</th>
          <th style="width: 80px">Stock</th>
          <th style="width: 100px">Estado</th>
          <th style="width: 120px">Acciones</th>
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
                @click="emit('moveUp', subcategory.id)"
              >
                &#x25B2;
              </button>
              <button
                class="btn-icon"
                :disabled="index === subcategories.length - 1 || saving"
                title="Bajar"
                @click="emit('moveDown', subcategory.id)"
              >
                &#x25BC;
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
            <span class="categories-list">{{
              getCategoryLabels(subcategory.applicable_categories)
            }}</span>
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
              @click="emit('toggleStatus', subcategory)"
            >
              {{ subcategory.status === 'published' ? 'ON' : 'OFF' }}
            </button>
          </td>
          <td>
            <div class="action-buttons">
              <button class="btn-icon btn-edit" title="Editar" @click="emit('edit', subcategory)">
                &#x270E;&#xFE0F;
              </button>
              <button
                class="btn-icon btn-delete"
                title="Eliminar"
                @click="emit('delete', subcategory)"
              >
                &#x1F5D1;&#xFE0F;
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!subcategories.length">
          <td colspan="7" class="empty-state">No hay subcategorias. Crea la primera.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-container {
  background: var(--bg-primary);
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
  border: 1px solid var(--border-color-light);
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
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
  background: var(--color-info-bg, #dbeafe);
}

.btn-delete:hover {
  background: var(--color-error-bg, #fef2f2);
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
  background: var(--bg-secondary);
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
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success);
}

.status-toggle.inactive {
  background: var(--bg-secondary);
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

@media (max-width: 768px) {
  .table-container {
    overflow-x: auto;
  }

  .admin-table {
    min-width: 700px;
  }
}
</style>
