<script setup lang="ts">
import type { AdminVehicle } from '~/composables/admin/useAdminVehicles'
import { formatPrice } from '~/composables/shared/useListingUtils'

defineProps<{
  vehicles: AdminVehicle[]
}>()

const emit = defineEmits<{
  (e: 'confirm-delete', vehicle: { id: string; brand: string; model: string }): void
}>()

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
</script>

<template>
  <div class="vehicles-table-wrapper">
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
              <NuxtLink
                :to="`/vehiculo/${vehicle.slug}`"
                class="action-btn"
                target="_blank"
                title="Ver en web"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <path d="M15 3h6v6" />
                  <path d="M10 14L21 3" />
                </svg>
              </NuxtLink>
              <button
                class="action-btn danger"
                title="Eliminar"
                @click="
                  emit('confirm-delete', {
                    id: vehicle.id,
                    brand: vehicle.brand,
                    model: vehicle.model,
                  })
                "
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                  />
                </svg>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
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

.col-image {
  width: 80px;
}
.col-vehicle {
  min-width: 200px;
}
.col-category {
  width: 100px;
}
.col-price {
  width: 120px;
}
.col-status {
  width: 120px;
}
.col-actions {
  width: 120px;
}

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
  text-decoration: none;
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
