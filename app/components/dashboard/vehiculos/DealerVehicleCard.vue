<script setup lang="ts">
import { formatPrice } from '~/composables/shared/useListingUtils'

export interface DealerVehicle {
  id: string
  brand: string
  model: string
  year: number | null
  price: number | null
  status: string
  views: number
  slug: string | null
  created_at: string | null
  vehicle_images: { url: string; position: number }[]
}

defineProps<{
  vehicle: DealerVehicle
  deleteConfirmId: string | null
}>()

const emit = defineEmits<{
  (e: 'toggle-status' | 'open-sold-modal', vehicle: DealerVehicle): void
  (e: 'set-delete-confirm' | 'delete-vehicle', id: string): void
}>()

const { t } = useI18n()

function getThumbnail(vehicle: DealerVehicle): string | null {
  if (!vehicle.vehicle_images?.length) return null
  return [...vehicle.vehicle_images].sort((a, b) => a.position - b.position)[0]?.url || null
}

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    published: 'status-published',
    draft: 'status-draft',
    paused: 'status-paused',
    sold: 'status-sold',
  }
  return map[status] || 'status-draft'
}
</script>

<template>
  <div class="vehicle-card">
    <div class="card-image">
      <img
        v-if="getThumbnail(vehicle)"
        :src="getThumbnail(vehicle)!"
        :alt="`${vehicle.brand} ${vehicle.model}`"
      >
      <div v-else class="image-placeholder">
        <span>{{ t('dashboard.vehicles.noImage') }}</span>
      </div>
      <span class="status-pill" :class="getStatusClass(vehicle.status)">
        {{ t(`dashboard.vehicleStatus.${vehicle.status}`) }}
      </span>
    </div>
    <div class="card-body">
      <h3>{{ vehicle.brand }} {{ vehicle.model }}</h3>
      <div class="card-meta">
        <span v-if="vehicle.year" class="meta-item">{{ vehicle.year }}</span>
        <span class="meta-price">{{ formatPrice(vehicle.price) }}</span>
      </div>
      <div class="card-stats">
        <span>{{ vehicle.views || 0 }} {{ t('dashboard.views') }}</span>
      </div>
    </div>
    <div class="card-actions">
      <NuxtLink :to="`/dashboard/vehiculos/${vehicle.id}`" class="action-btn">
        {{ t('common.edit') }}
      </NuxtLink>
      <button
        v-if="vehicle.status !== 'sold'"
        class="action-btn"
        @click="emit('toggle-status', vehicle)"
      >
        {{
          vehicle.status === 'published'
            ? t('dashboard.vehicles.pause')
            : t('dashboard.vehicles.activate')
        }}
      </button>
      <button
        v-if="vehicle.status !== 'sold'"
        class="action-btn"
        @click="emit('open-sold-modal', vehicle)"
      >
        {{ t('dashboard.vehicles.markSold') }}
      </button>
      <button
        v-if="deleteConfirmId !== vehicle.id"
        class="action-btn action-delete"
        @click="emit('set-delete-confirm', vehicle.id)"
      >
        {{ t('common.delete') }}
      </button>
      <button
        v-else
        class="action-btn action-delete-confirm"
        @click="emit('delete-vehicle', vehicle.id)"
      >
        {{ t('dashboard.vehicles.confirmDelete') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.vehicle-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-image {
  position: relative;
  height: 180px;
  background: #f1f5f9;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.85rem;
}

.status-pill {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-published {
  background: #dcfce7;
  color: #16a34a;
}

.status-draft {
  background: #f1f5f9;
  color: #64748b;
}

.status-paused {
  background: #fef3c7;
  color: #92400e;
}

.status-sold {
  background: #e2e8f0;
  color: #475569;
}

.card-body {
  padding: 16px;
}

.card-body h3 {
  margin: 0 0 8px 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1e293b;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.meta-item {
  font-size: 0.85rem;
  color: #64748b;
}

.meta-price {
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

.card-stats {
  font-size: 0.8rem;
  color: #94a3b8;
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #f1f5f9;
}

.action-btn {
  min-height: 44px;
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.action-btn:hover {
  background: #f8fafc;
}

.action-delete {
  color: #dc2626;
  border-color: #fecaca;
}

.action-delete:hover {
  background: #fef2f2;
}

.action-delete-confirm {
  color: white;
  background: #dc2626;
  border-color: #dc2626;
}
</style>
