<template>
  <div class="admin-vehicles">
    <div class="page-header">
      <h1 class="page-title">Vehículos</h1>
      <NuxtLink to="/admin/vehiculos/new" class="btn-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Nuevo vehículo
      </NuxtLink>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-group">
        <label class="filter-label">Estado</label>
        <select v-model="filters.status" class="filter-select">
          <option :value="null">Todos</option>
          <option value="draft">Borrador</option>
          <option value="published">Publicado</option>
          <option value="rented">Alquilado</option>
          <option value="workshop">En taller</option>
          <option value="sold">Vendido</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Categoría</label>
        <select v-model="filters.category" class="filter-select">
          <option :value="null">Todas</option>
          <option value="venta">Venta</option>
          <option value="alquiler">Alquiler</option>
          <option value="terceros">Terceros</option>
        </select>
      </div>

      <div class="filter-group search-group">
        <label class="filter-label">Buscar</label>
        <input
          v-model="filters.search"
          type="text"
          class="filter-input"
          placeholder="Marca o modelo..."
          @input="debouncedSearch"
        >
      </div>
    </div>

    <!-- Results count -->
    <div class="results-info">
      <span>{{ total }} vehículos</span>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <span>Cargando vehículos...</span>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary" @click="loadVehicles">Reintentar</button>
    </div>

    <!-- Empty state -->
    <div v-else-if="vehicles.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h5l3 3v9a2 2 0 01-2 2h-6" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
      <p>No hay vehículos que coincidan con los filtros</p>
      <NuxtLink to="/admin/vehiculos/new" class="btn-primary">Crear vehículo</NuxtLink>
    </div>

    <!-- Vehicles table -->
    <div v-else class="vehicles-table-wrapper">
      <table class="vehicles-table">
        <thead>
          <tr>
            <th class="col-image">Imagen</th>
            <th class="col-vehicle">Vehículo</th>
            <th class="col-category">Categoría</th>
            <th class="col-price">Precio</th>
            <th class="col-status">Estado</th>
            <th class="col-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="vehicle in vehicles" :key="vehicle.id">
            <td class="col-image">
              <div class="vehicle-thumbnail">
                <img
                  v-if="vehicle.vehicle_images?.[0]"
                  :src="vehicle.vehicle_images[0].thumbnail_url || vehicle.vehicle_images[0].url"
                  :alt="vehicle.brand + ' ' + vehicle.model"
                >
                <div v-else class="no-image">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              </div>
            </td>
            <td class="col-vehicle">
              <div class="vehicle-info">
                <span class="vehicle-name">{{ vehicle.brand }} {{ vehicle.model }}</span>
                <span class="vehicle-year">{{ vehicle.year || '-' }}</span>
              </div>
            </td>
            <td class="col-category">
              <span class="category-badge" :class="vehicle.category">
                {{ categoryLabels[vehicle.category] }}
              </span>
            </td>
            <td class="col-price">
              <span v-if="vehicle.price">{{ formatPrice(vehicle.price) }}</span>
              <span v-else class="text-muted">-</span>
            </td>
            <td class="col-status">
              <span class="status-badge" :class="vehicle.status">
                {{ statusLabels[vehicle.status] || vehicle.status }}
              </span>
            </td>
            <td class="col-actions">
              <div class="actions-group">
                <NuxtLink :to="`/admin/vehiculos/${vehicle.id}`" class="action-btn" title="Editar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </NuxtLink>
                <NuxtLink :to="`/vehiculo/${vehicle.slug}`" class="action-btn" target="_blank" title="Ver en web">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <path d="M15 3h6v6" />
                    <path d="M10 14L21 3" />
                  </svg>
                </NuxtLink>
                <button class="action-btn danger" title="Eliminar" @click="confirmDelete(vehicle)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete confirmation modal -->
    <Teleport to="body">
      <div v-if="deleteModal.show" class="modal-backdrop" @click.self="deleteModal.show = false">
        <div class="modal-content">
          <h3 class="modal-title">Eliminar vehículo</h3>
          <p class="modal-text">
            ¿Estás seguro de que quieres eliminar <strong>{{ deleteModal.vehicle?.brand }} {{ deleteModal.vehicle?.model }}</strong>?
            Esta acción no se puede deshacer.
          </p>
          <div class="modal-actions">
            <button class="btn-secondary" @click="deleteModal.show = false">Cancelar</button>
            <button class="btn-danger" :disabled="saving" @click="handleDelete">
              {{ saving ? 'Eliminando...' : 'Eliminar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useAdminVehicles } from '~/composables/admin/useAdminVehicles'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { vehicles, loading, saving, error, total, fetchVehicles, deleteVehicle } = useAdminVehicles()

const filters = ref({
  status: null as string | null,
  category: null as string | null,
  search: '',
})

const deleteModal = ref<{
  show: boolean
  vehicle: { id: string; brand: string; model: string } | null
}>({
  show: false,
  vehicle: null,
})

const categoryLabels: Record<string, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
  terceros: 'Terceros',
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  rented: 'Alquilado',
  workshop: 'En taller',
  sold: 'Vendido',
}

// Load vehicles on mount and filter change
async function loadVehicles() {
  await fetchVehicles({
    status: filters.value.status,
    category: filters.value.category,
    search: filters.value.search || undefined,
  })
}

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout>
function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadVehicles()
  }, 300)
}

// Watch filters (except search which uses debounce)
watch([() => filters.value.status, () => filters.value.category], () => {
  loadVehicles()
})

// Delete handlers
function confirmDelete(vehicle: { id: string; brand: string; model: string }) {
  deleteModal.value = { show: true, vehicle }
}

async function handleDelete() {
  if (!deleteModal.value.vehicle) return

  const success = await deleteVehicle(deleteModal.value.vehicle.id)
  if (success) {
    deleteModal.value = { show: false, vehicle: null }
  }
}

// Format price
function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price)
}

// Initial load
onMounted(() => {
  loadVehicles()
})
</script>

<style scoped>
.admin-vehicles {
  max-width: 1400px;
  margin: 0 auto;
}

/* Page header */
.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--border-radius);
  text-decoration: none;
  min-height: 44px;
  transition: background var(--transition-fast);
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary svg {
  width: 18px;
  height: 18px;
}

/* Filters */
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-4);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  min-width: 150px;
}

.search-group {
  flex: 1;
  min-width: 200px;
}

.filter-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filter-select,
.filter-input {
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  min-height: 40px;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Results info */
.results-info {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  margin-bottom: var(--spacing-4);
}

/* States */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-12);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  text-align: center;
  gap: var(--spacing-4);
}

.loading-state .spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state svg {
  width: 64px;
  height: 64px;
  color: var(--text-auxiliary);
}

.error-state {
  color: var(--color-error);
}

.btn-secondary {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  min-height: 40px;
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
}

/* Table */
.vehicles-table-wrapper {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  overflow-x: auto;
}

.vehicles-table {
  width: 100%;
  border-collapse: collapse;
}

.vehicles-table th,
.vehicles-table td {
  padding: var(--spacing-3) var(--spacing-4);
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.vehicles-table th {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--bg-secondary);
  white-space: nowrap;
}

.vehicles-table tr:last-child td {
  border-bottom: none;
}

.vehicles-table tr:hover {
  background: var(--bg-secondary);
}

/* Column widths */
.col-image { width: 80px; }
.col-vehicle { min-width: 200px; }
.col-category { width: 100px; }
.col-price { width: 120px; }
.col-status { width: 120px; }
.col-actions { width: 120px; }

/* Vehicle thumbnail */
.vehicle-thumbnail {
  width: 60px;
  height: 45px;
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  background: var(--bg-secondary);
}

.vehicle-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-auxiliary);
}

.no-image svg {
  width: 24px;
  height: 24px;
}

/* Vehicle info */
.vehicle-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.vehicle-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.vehicle-year {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

/* Badges */
.category-badge,
.status-badge {
  display: inline-flex;
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--border-radius-sm);
  white-space: nowrap;
}

.category-badge.venta {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}

.category-badge.alquiler {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-info);
}

.category-badge.terceros {
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warning);
}

.status-badge.draft {
  background: rgba(107, 114, 128, 0.1);
  color: var(--text-auxiliary);
}

.status-badge.published {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}

.status-badge.rented {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-info);
}

.status-badge.workshop {
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warning);
}

.status-badge.sold {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
}

.text-muted {
  color: var(--text-auxiliary);
}

/* Actions */
.actions-group {
  display: flex;
  gap: var(--spacing-2);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--bg-secondary);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
  border-color: var(--color-error);
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4);
  z-index: var(--z-modal);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  max-width: 400px;
  width: 100%;
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-4);
}

.modal-text {
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-6);
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: flex-end;
}

.btn-danger {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-error);
  color: var(--color-white);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  min-height: 40px;
  transition: background var(--transition-fast);
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile responsive */
@media (max-width: 767px) {
  .col-category,
  .col-status {
    display: none;
  }

  .vehicles-table th,
  .vehicles-table td {
    padding: var(--spacing-2) var(--spacing-3);
  }

  .vehicle-thumbnail {
    width: 50px;
    height: 38px;
  }
}
</style>
