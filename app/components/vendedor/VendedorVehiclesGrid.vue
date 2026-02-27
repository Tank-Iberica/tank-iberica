<script setup lang="ts">
import type { VendedorVehicle } from '~/composables/useVendedorDetail'

defineProps<{
  vehicles: VendedorVehicle[]
}>()

const { getImageUrl } = useImageUrl()
</script>

<template>
  <section v-if="vehicles.length > 0" class="vehicles-section">
    <h2 class="section-title">{{ $t('seller.vehiclesTitle') }}</h2>

    <div class="vehicles-grid">
      <NuxtLink
        v-for="vehicle in vehicles"
        :key="vehicle.id"
        :to="`/vehiculo/${vehicle.slug}`"
        class="vehicle-card"
      >
        <div class="vehicle-card__image">
          <img
            v-if="vehicle.images_json && vehicle.images_json.length > 0"
            :src="getImageUrl(String(vehicle.images_json[0]), 'thumb')"
            :alt="`${vehicle.brand} ${vehicle.model}`"
            loading="lazy"
          >
          <div v-else class="vehicle-card__placeholder">
            {{ vehicle.brand.charAt(0) }}
          </div>
        </div>
        <div class="vehicle-card__body">
          <h3 class="vehicle-card__title">{{ vehicle.brand }} {{ vehicle.model }}</h3>
          <span v-if="vehicle.price" class="vehicle-card__price">
            {{ vehicle.price.toLocaleString() }} &euro;
          </span>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.vehicles-section {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-4);
}

.vehicles-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
}

.vehicle-card {
  display: block;
  text-decoration: none;
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-fast);
}

.vehicle-card:hover {
  box-shadow: var(--shadow-md);
}

.vehicle-card__image {
  width: 100%;
  height: 120px;
  background: var(--bg-secondary);
  overflow: hidden;
}

.vehicle-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vehicle-card__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-auxiliary);
  background: var(--bg-tertiary);
}

.vehicle-card__body {
  padding: var(--spacing-3);
}

.vehicle-card__title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: var(--spacing-1);
}

.vehicle-card__price {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

/* ---- Tablet (768px) ---- */
@media (min-width: 768px) {
  .vehicles-section {
    padding: 0 var(--spacing-8);
  }

  .section-title {
    font-size: var(--font-size-xl);
  }

  .vehicles-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .vehicle-card__image {
    height: 140px;
  }

  .vehicle-card__title {
    font-size: var(--font-size-sm);
  }
}

/* ---- Desktop (1024px) ---- */
@media (min-width: 1024px) {
  .vehicles-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-4);
  }

  .vehicle-card__image {
    height: 160px;
  }
}
</style>
