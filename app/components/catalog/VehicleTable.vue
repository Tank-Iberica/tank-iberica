<template>
  <div class="table-wrapper">
    <table class="catalog-table">
      <thead>
        <tr>
          <th class="col-image">{{ $t('catalog.image') }}</th>
          <th class="col-category">{{ $t('vehicle.category') }}</th>
          <th class="col-price">{{ $t('catalog.price') }}</th>
          <th class="col-product">{{ $t('catalog.product') }}</th>
          <th class="col-brand">{{ $t('catalog.brand') }}</th>
          <th class="col-model">{{ $t('catalog.model') }}</th>
          <th class="col-year">{{ $t('catalog.year') }}</th>
          <th class="col-location">{{ $t('vehicle.location') }}</th>
          <th class="col-actions">{{ $t('catalog.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="vehicle in vehicles"
          :key="vehicle.id"
          class="table-row"
          @click="navigateTo(vehicle.slug)"
        >
          <td class="col-image">
            <img
              v-if="firstImage(vehicle)"
              :src="firstImage(vehicle)"
              :alt="`${vehicle.brand} ${vehicle.model}`"
              class="table-image"
            >
            <div v-else class="table-image-placeholder">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          </td>
          <td class="col-category">
            <span :class="['table-category', vehicle.category]">
              {{ $t(`catalog.${vehicle.category}`) }}
            </span>
          </td>
          <td class="col-price table-price">
            {{ priceText(vehicle) }}
          </td>
          <td class="col-product">{{ vehicle.brand }} {{ vehicle.model }}</td>
          <td class="col-brand">{{ vehicle.brand }}</td>
          <td class="col-model">{{ vehicle.model }}</td>
          <td class="col-year">{{ vehicle.year ?? '—' }}</td>
          <td class="col-location">{{ vehicleLocationText(vehicle) }}</td>
          <td class="col-actions">
            <NuxtLink :to="`/vehiculo/${vehicle.slug}`" class="action-btn" @click.stop>
              {{ $t('catalog.viewDetails') }}
            </NuxtLink>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { Vehicle } from '~/composables/useVehicles'

defineProps<{
  vehicles: readonly Vehicle[]
}>()

const { t } = useI18n()
const router = useRouter()

function navigateTo(slug: string) {
  router.push(`/vehiculo/${slug}`)
}

function vehicleLocationText(vehicle: Vehicle): string {
  const city = vehicle.location?.split(',')[0]?.trim() || vehicle.location
  const flag = vehicle.location_country ? countryFlag(vehicle.location_country) : ''
  return city ? `${city} ${flag}`.trim() : '—'
}

function firstImage(vehicle: Vehicle): string | undefined {
  if (!vehicle.vehicle_images?.length) return undefined
  const sorted = [...vehicle.vehicle_images].sort((a, b) => a.position - b.position)
  return sorted[0]?.thumbnail_url || sorted[0]?.url || undefined
}

function priceText(vehicle: Vehicle): string {
  if (vehicle.category === 'terceros') return t('catalog.solicitar')
  if (vehicle.price) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(vehicle.price)
  }
  return t('catalog.solicitar')
}
</script>

<style scoped>
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0.5rem;
}

.catalog-table {
  width: 100%;
  min-width: 800px;
  border-collapse: collapse;
  font-size: 12px;
}

.catalog-table thead {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #1A4248) 100%);
  color: var(--color-white);
}

.catalog-table th {
  padding: 0.6rem 0.5rem;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  border: none;
}

.catalog-table th.col-actions {
  text-align: center;
}

.catalog-table td {
  padding: 0.5rem;
  border-bottom: 1px solid var(--border-color-light, #e5e7eb);
  vertical-align: middle;
}

.table-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.table-row:hover {
  background: rgba(35, 66, 74, 0.04);
}

/* Image */
.table-image {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  display: block;
}

.table-image-placeholder {
  width: 80px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 6px;
  color: var(--text-auxiliary);
}

/* Category badge */
.table-category {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--color-white);
  background: linear-gradient(135deg, #0F2A2E 0%, #1A4248 100%);
  white-space: nowrap;
}

/* Price */
.table-price {
  color: #10B981;
  font-weight: 700;
  white-space: nowrap;
}

/* Actions */
.col-actions {
  text-align: center;
}

.action-btn {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.2s;
}

.action-btn:hover {
  background: var(--color-primary-light, #2d5a64);
}

/* Responsive */
@media (min-width: 768px) {
  .table-wrapper {
    padding: 0.5rem 1.5rem;
  }

  .catalog-table {
    font-size: 13px;
  }

  .catalog-table th {
    font-size: 12px;
    padding: 0.75rem 0.6rem;
  }

  .catalog-table td {
    padding: 0.6rem;
  }
}

@media (min-width: 1024px) {
  .table-wrapper {
    padding: 0.5rem 3rem;
  }
}
</style>
