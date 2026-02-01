<template>
  <NuxtLink :to="`/vehiculo/${vehicle.slug}`" class="vehicle-card">
    <div class="card-image">
      <NuxtImg
        v-if="mainImage"
        provider="cloudinary"
        :src="mainImage"
        :alt="`${vehicle.brand} ${vehicle.model}`"
        width="400"
        height="300"
        fit="cover"
        loading="lazy"
        format="webp"
        class="card-img"
      />
      <div v-else class="card-img-placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>
      <span v-if="vehicle.featured" class="card-badge">
        {{ $t('catalog.featured') }}
      </span>
    </div>
    <div class="card-body">
      <h3 class="card-title">{{ vehicle.brand }} {{ vehicle.model }}</h3>
      <div class="card-meta">
        <span v-if="vehicle.year" class="card-year">{{ vehicle.year }}</span>
        <span v-if="vehicle.location" class="card-location">{{ vehicle.location }}</span>
      </div>
      <div class="card-price">
        <template v-if="vehicle.price">
          {{ formatPrice(vehicle.price) }}
        </template>
        <template v-if="vehicle.rental_price">
          <span class="card-rental">
            {{ $t('catalog.from') }} {{ formatPrice(vehicle.rental_price) }}/{{ $t('catalog.month') }}
          </span>
        </template>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Vehicle } from '~/composables/useVehicles'

const props = defineProps<{
  vehicle: Vehicle
}>()

const mainImage = computed(() => {
  if (!props.vehicle.vehicle_images?.length) return null
  const sorted = [...props.vehicle.vehicle_images].sort((a, b) => a.position - b.position)
  const img = sorted[0]
  // Extract cloudinary path from full URL or use cloudinary_public_id
  if (img.url?.includes('cloudinary.com')) {
    const match = img.url.match(/\/upload\/(.+)$/)
    if (match) return match[1]
  }
  return img.url
})

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price)
}
</script>

<style scoped>
.vehicle-card {
  display: block;
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  border: 1px solid var(--border-color-light);
  transition: box-shadow var(--transition-fast);
  text-decoration: none;
  color: inherit;
}

.vehicle-card:hover {
  box-shadow: var(--shadow-md);
}

.card-image {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--bg-secondary);
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-auxiliary);
}

.card-badge {
  position: absolute;
  top: var(--spacing-2);
  left: var(--spacing-2);
  background: var(--color-gold);
  color: var(--color-white);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--border-radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-body {
  padding: var(--spacing-3);
}

.card-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-1);
  line-height: var(--line-height-tight);
}

.card-meta {
  display: flex;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  margin-bottom: var(--spacing-2);
}

.card-meta span::after {
  content: '·';
  margin-left: var(--spacing-2);
}

.card-meta span:last-child::after {
  content: '';
}

.card-price {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.card-rental {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
  color: var(--text-secondary);
  margin-top: var(--spacing-1);
}
</style>
