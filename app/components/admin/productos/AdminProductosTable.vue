<script setup lang="ts">
import type { AdminVehicle } from '~/composables/admin/useAdminVehicles'

type SortField = 'brand' | 'model' | 'year' | 'price' | 'status' | 'created_at'

interface ActiveFilterColumn {
  key: string
  filterName: string
  label: string
  unit?: string
}

defineProps<{
  vehicles: AdminVehicle[]
  selectedIds: Set<string>
  sortField: SortField
  sortOrder: 'asc' | 'desc'
  isGroupActive: (groupId: string) => boolean
  activeFilterColumns: ActiveFilterColumn[]
  favCounts: Record<string, number>
  hasActiveFilters: boolean
  driveLoading: boolean
  getSubcategoryForVehicle: (typeId: string | null) => string
  getSubcategoryName: (id: string | null) => string
  formatPrice: (price: number | null | undefined) => string
  getFilterValue: (vehicle: AdminVehicle, filterName: string) => string
  getStatusClass: (status: string) => string
  getCategoryClass: (category: string) => string
  getThumbnail: (vehicle: AdminVehicle) => string | null
}>()

const emit = defineEmits<{
  'update:selectAll': [value: boolean]
  'toggle-selection': [id: string]
  'toggle-sort': [field: SortField]
  'status-change': [vehicle: AdminVehicle, newStatus: string]
  delete: [vehicle: AdminVehicle]
  'export-ficha': [vehicle: AdminVehicle]
  transaction: [vehicle: AdminVehicle, type: 'rent' | 'sell']
  'open-drive-folder': [vehicle: AdminVehicle]
  'clear-filters': []
}>()

const selectAll = computed({
  get: () => props.vehicles.length > 0 && props.vehicles.every((v) => props.selectedIds.has(v.id)),
  set: (val: boolean) => emit('update:selectAll', val),
})

function getSortIcon(field: string): string {
  if (props.sortField !== field) return '⇅'
  return props.sortOrder === 'asc' ? '↑' : '↓'
}

function isSortActive(field: string): boolean {
  return props.sortField === field
}
</script>

<template>
  <div class="table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th class="col-checkbox">
            <input v-model="selectAll" type="checkbox" title="Seleccionar todos" >
          </th>
          <th class="col-img">Img</th>
          <th class="col-type">Tipo</th>
          <th class="sortable" @click="emit('toggle-sort', 'brand')">
            Marca
            <span class="sort-icon" :class="{ active: isSortActive('brand') }">{{
              getSortIcon('brand')
            }}</span>
          </th>
          <th class="sortable" @click="emit('toggle-sort', 'model')">
            Modelo
            <span class="sort-icon" :class="{ active: isSortActive('model') }">{{
              getSortIcon('model')
            }}</span>
          </th>
          <th>Subcat.</th>
          <th>Tipo</th>
          <th class="sortable col-num" @click="emit('toggle-sort', 'year')">
            Año
            <span class="sort-icon" :class="{ active: isSortActive('year') }">{{
              getSortIcon('year')
            }}</span>
          </th>
          <th class="sortable col-num" @click="emit('toggle-sort', 'price')">
            Precio
            <span class="sort-icon" :class="{ active: isSortActive('price') }">{{
              getSortIcon('price')
            }}</span>
          </th>
          <!-- Optional columns -->
          <th v-if="isGroupActive('docs')">Matrícula</th>
          <th v-if="isGroupActive('docs')">Ubicación</th>
          <th v-if="isGroupActive('tecnico')">Descripción</th>
          <th v-if="isGroupActive('cuentas')" class="col-num">P. Mín.</th>
          <th v-if="isGroupActive('cuentas')" class="col-num">Coste</th>
          <th v-if="isGroupActive('alquiler')" class="col-num">P. Alq.</th>
          <!-- Dynamic filter columns -->
          <th
            v-for="fc in activeFilterColumns"
            v-show="isGroupActive('filtros')"
            :key="fc.key"
            class="col-filter"
          >
            {{ fc.label }}<span v-if="fc.unit" class="filter-unit">({{ fc.unit }})</span>
          </th>
          <th class="col-num col-favs">Favs</th>
          <th>Cat.</th>
          <th class="sortable" @click="emit('toggle-sort', 'status')">
            Estado
            <span class="sort-icon" :class="{ active: isSortActive('status') }">{{
              getSortIcon('status')
            }}</span>
          </th>
          <th class="col-actions">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="v in vehicles" :key="v.id" :class="{ selected: selectedIds.has(v.id) }">
          <td class="col-checkbox">
            <input
              type="checkbox"
              :checked="selectedIds.has(v.id)"
              @change="emit('toggle-selection', v.id)"
            >
          </td>
          <td class="col-img">
            <div class="thumb">
              <img v-if="getThumbnail(v)" :src="getThumbnail(v)!" :alt="v.brand" >
              <span v-else class="thumb-empty">📷</span>
            </div>
          </td>
          <td class="col-type">
            <span class="type-pill" :class="v.is_online ? 'online' : 'offline'">
              {{ v.is_online ? 'ON' : 'OFF' }}
            </span>
          </td>
          <td>
            <NuxtLink :to="`/admin/productos/${v.id}`" class="vehicle-link">
              <strong>{{ v.brand }}</strong>
            </NuxtLink>
            <span v-if="!v.is_online && v.owner_name" class="owner-tag">👤 {{ v.owner_name }}</span>
          </td>
          <td class="text-muted">
            {{ v.model }}
          </td>
          <td class="text-small">
            {{ getSubcategoryForVehicle(v.type_id) }}
          </td>
          <td class="text-small">
            {{ getSubcategoryName(v.type_id) }}
          </td>
          <td class="col-num">
            {{ v.year || '-' }}
          </td>
          <td class="col-num">
            <strong>{{ formatPrice(v.price) }}</strong>
          </td>
          <!-- Optional columns -->
          <td v-if="isGroupActive('docs')">
            {{ v.plate || '-' }}
          </td>
          <td v-if="isGroupActive('docs')" class="text-small">
            {{ v.location || '-' }}
          </td>
          <td v-if="isGroupActive('tecnico')" class="col-desc">
            <span class="truncate">{{ v.description_es || '-' }}</span>
          </td>
          <td v-if="isGroupActive('cuentas')" class="col-num text-muted">
            {{ formatPrice(v.min_price) }}
          </td>
          <td v-if="isGroupActive('cuentas')" class="col-num text-muted">
            {{ formatPrice(v.acquisition_cost) }}
          </td>
          <td v-if="isGroupActive('alquiler')" class="col-num">
            {{ formatPrice(v.rental_price) }}
          </td>
          <!-- Dynamic filter columns -->
          <td
            v-for="fc in activeFilterColumns"
            v-show="isGroupActive('filtros')"
            :key="fc.key"
            class="text-small col-filter"
          >
            {{ getFilterValue(v, fc.filterName) }}
          </td>
          <td class="col-num col-favs">
            <span v-if="favCounts[v.id]" class="fav-count">&#9829; {{ favCounts[v.id] }}</span>
            <span v-else class="text-muted">-</span>
          </td>
          <td>
            <span class="cat-pill" :class="getCategoryClass(v.category)">{{ v.category }}</span>
          </td>
          <td>
            <select
              :value="v.status"
              class="status-select"
              :class="getStatusClass(v.status)"
              @change="emit('status-change', v, ($event.target as HTMLSelectElement).value)"
            >
              <option value="published">Publicado</option>
              <option value="draft">Oculto</option>
              <option value="rented">Alquilado</option>
              <option value="maintenance">Taller</option>
              <option value="sold">Vendido</option>
            </select>
          </td>
          <td class="col-actions">
            <div class="row-actions">
              <NuxtLink :to="`/admin/productos/${v.id}`" class="action-btn" title="Editar">
                ✏️
              </NuxtLink>
              <button
                class="action-btn"
                title="Abrir en Drive"
                :disabled="driveLoading"
                @click="emit('open-drive-folder', v)"
              >
                📁
              </button>
              <button class="action-btn" title="Exportar ficha" @click="emit('export-ficha', v)">
                📄
              </button>
              <button
                class="action-btn"
                :title="v.category === 'alquiler' ? 'Alquilar' : 'Vender'"
                @click="emit('transaction', v, v.category === 'alquiler' ? 'rent' : 'sell')"
              >
                💰
              </button>
              <button class="action-btn delete" title="Eliminar" @click="emit('delete', v)">
                🗑️
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="vehicles.length === 0">
          <td
            :colspan="
              12 +
              (isGroupActive('docs') ? 2 : 0) +
              (isGroupActive('tecnico') ? 1 : 0) +
              (isGroupActive('cuentas') ? 2 : 0) +
              (isGroupActive('alquiler') ? 1 : 0) +
              (isGroupActive('filtros') ? activeFilterColumns.length : 0)
            "
            class="empty-cell"
          >
            <div class="empty-state">
              <span class="empty-icon">📦</span>
              <p>No hay productos que coincidan con los filtros</p>
              <button v-if="hasActiveFilters" class="btn-secondary" @click="emit('clear-filters')">
                Limpiar filtros
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table thead {
  background: #f8fafc;
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

.data-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.data-table th.sortable:hover {
  background: #f1f5f9;
}

.sort-icon {
  opacity: 0.3;
  margin-left: 4px;
  font-size: 12px;
}

.sort-icon.active {
  opacity: 1;
  color: var(--color-primary, #23424a);
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

.data-table tbody tr.selected {
  background: #eff6ff;
}

.col-checkbox {
  width: 40px;
  text-align: center;
}

.col-img {
  width: 56px;
}

.col-type {
  width: 60px;
}

.col-num {
  text-align: right;
}

.col-actions {
  width: 150px;
}

.col-favs {
  width: 70px;
}

.col-desc {
  max-width: 200px;
}

.col-filter {
  font-size: 13px;
}

.filter-unit {
  font-size: 11px;
  color: #94a3b8;
  margin-left: 2px;
}

.text-muted {
  color: #94a3b8;
}

.text-small {
  font-size: 13px;
}

.truncate {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.thumb {
  width: 48px;
  height: 36px;
  border-radius: 4px;
  overflow: hidden;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-empty {
  font-size: 18px;
  opacity: 0.3;
}

.type-pill {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.type-pill.online {
  background: #d1fae5;
  color: #065f46;
}

.type-pill.offline {
  background: #fee2e2;
  color: #991b1b;
}

.vehicle-link {
  color: var(--color-primary, #23424a);
  text-decoration: none;
  transition: color 0.2s;
}

.vehicle-link:hover {
  color: #1a3238;
  text-decoration: underline;
}

.owner-tag {
  display: block;
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.cat-pill {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.cat-venta {
  background: #dbeafe;
  color: #1e40af;
}

.cat-alquiler {
  background: #fef3c7;
  color: #92400e;
}

.cat-terceros {
  background: #e9d5ff;
  color: #6b21a8;
}

.status-select {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: white;
  cursor: pointer;
  font-weight: 500;
}

.status-published {
  color: #16a34a;
  border-color: #86efac;
}

.status-draft {
  color: #64748b;
  border-color: #cbd5e1;
}

.status-rented {
  color: #ca8a04;
  border-color: #fde047;
}

.status-maintenance {
  color: #dc2626;
  border-color: #fca5a5;
}

.status-sold {
  color: #7c3aed;
  border-color: #c4b5fd;
}

.fav-count {
  color: #dc2626;
  font-weight: 500;
}

.row-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.action-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
  text-decoration: none;
}

.action-btn:hover:not(:disabled) {
  background: #f1f5f9;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn.delete:hover {
  background: #fef2f2;
}

.empty-cell {
  text-align: center;
  padding: 48px 24px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.3;
}

.empty-state p {
  margin: 0;
  color: #64748b;
  font-size: 16px;
}

.btn-secondary {
  background: white;
  border: 1px solid #e2e8f0;
  color: #475569;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}
</style>
