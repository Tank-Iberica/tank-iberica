<script setup lang="ts">
import { formatPrice } from '~/composables/shared/useListingUtils'
import type { DealerVehicleForExport } from '~/composables/dashboard/useDashboardExportarAnuncio'

defineProps<{
  vehicle: DealerVehicleForExport
  thumbnail: string | null
}>()

const { t } = useI18n()
</script>

<template>
  <section class="card preview-card">
    <div class="preview-layout">
      <div class="preview-image">
        <img v-if="thumbnail" :src="thumbnail" :alt="`${vehicle.brand} ${vehicle.model}`" />
        <div v-else class="image-placeholder">
          <span>{{ t('dashboard.vehicles.noImage') }}</span>
        </div>
      </div>
      <div class="preview-info">
        <h3>{{ vehicle.brand }} {{ vehicle.model }}</h3>
        <div class="preview-specs">
          <span v-if="vehicle.year" class="spec-item">
            {{ vehicle.year }}
          </span>
          <span v-if="vehicle.price" class="spec-price">
            {{ formatPrice(vehicle.price) }}
          </span>
          <span v-if="vehicle.location" class="spec-item">
            {{ vehicle.location }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
  padding: 1.25rem;
}

.preview-layout {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-image {
  width: 100%;
  height: 11.25rem;
  border-radius: var(--border-radius);
  overflow: hidden;
  background: var(--bg-secondary);
}

.preview-image img {
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
  color: var(--text-disabled);
  font-size: 0.85rem;
}

.preview-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.preview-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.spec-item {
  font-size: 0.9rem;
  color: var(--text-auxiliary);
}

.spec-price {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-primary);
}

@media (min-width: 48em) {
  .preview-layout {
    flex-direction: row;
  }

  .preview-image {
    width: 12.5rem;
    height: 8.75rem;
    flex-shrink: 0;
  }
}
</style>
