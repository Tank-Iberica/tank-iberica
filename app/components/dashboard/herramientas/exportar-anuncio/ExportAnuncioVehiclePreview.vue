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
        <img v-if="thumbnail" :src="thumbnail" :alt="`${vehicle.brand} ${vehicle.model}`" >
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
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.preview-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-image {
  width: 100%;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  background: #f1f5f9;
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
  color: #94a3b8;
  font-size: 0.85rem;
}

.preview-info h3 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.preview-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.spec-item {
  font-size: 0.9rem;
  color: #64748b;
}

.spec-price {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-primary, #23424a);
}

@media (min-width: 768px) {
  .preview-layout {
    flex-direction: row;
  }

  .preview-image {
    width: 200px;
    height: 140px;
    flex-shrink: 0;
  }
}
</style>
