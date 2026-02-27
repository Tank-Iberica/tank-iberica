<template>
  <div class="vehicle-header">
    <!-- Title + Price row -->
    <div class="vehicle-title-price-row">
      <h1 class="vehicle-title">
        {{ productName }}
        <span v-if="featured" class="vehicle-badge">{{ $t('catalog.featured') }}</span>
      </h1>
      <div class="vehicle-price">{{ priceText }}</div>
    </div>

    <!-- Rental price (below, smaller) -->
    <p v-if="rentalPrice && category !== 'terceros'" class="vehicle-rental">
      {{ $t('catalog.from') }} {{ formattedRentalPrice }}{{ $t('vehicle.perMonth') }}
    </p>

    <!-- Fair price indicator -->
    <VehicleFairPriceBadge
      v-if="price && vehicleId"
      :vehicle-id="vehicleId"
      :current-price="price"
    />

    <!-- Meta row: category badge + location badge -->
    <div class="vehicle-meta-row">
      <span :class="['vehicle-category-badge', category]">
        {{ $t(`catalog.${category}`) }}
      </span>
      <span v-if="vehicleLocation" class="vehicle-location">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="#C41E3A"
          stroke="#C41E3A"
          stroke-width="2"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" fill="white" />
        </svg>
        {{ vehicleLocation }}
        <img
          v-if="vehicleFlagCode"
          :src="`https://flagcdn.com/w20/${vehicleFlagCode}.png`"
          :alt="locationCountry || ''"
          class="location-flag"
        >
      </span>
    </div>

    <!-- AI Badge (AI Act compliance) -->
    <UiAiBadge v-if="isAiGenerated" type="generated" />

    <!-- Share buttons -->
    <UiShareButtons :url="`https://tracciona.com/vehiculo/${slug}`" :title="productName" />
  </div>
</template>

<script setup lang="ts">
import { formatPrice } from '~/composables/shared/useListingUtils'

const props = defineProps<{
  vehicleId: string
  slug: string
  productName: string
  priceText: string
  featured: boolean
  rentalPrice: number | null
  price: number | null
  category: string
  vehicleLocation: string | null
  vehicleFlagCode: string | null
  locationCountry: string | null
  isAiGenerated: boolean
}>()

const formattedRentalPrice = computed(() =>
  props.rentalPrice ? formatPrice(props.rentalPrice) : '',
)
</script>

<style scoped>
.vehicle-title-price-row {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-3);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-2);
}

.vehicle-title {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: #0f2a2e;
  flex: 1;
  min-width: 0;
}

.vehicle-badge {
  display: inline-block;
  background: var(--color-gold);
  color: var(--color-white);
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  vertical-align: middle;
  margin-left: 0.5rem;
}

.vehicle-price {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  white-space: nowrap;
  flex-shrink: 0;
}

.vehicle-rental {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-3);
}

.vehicle-meta-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: var(--spacing-4);
}

.vehicle-category-badge {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #0f2a2e 0%, #1a4248 100%);
  color: var(--color-white);
  padding: 0.4rem 0.8rem;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 10px;
  white-space: nowrap;
}

.vehicle-location {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(0, 0, 0, 0.75);
  color: var(--color-white);
  padding: 0.4rem 0.8rem;
  font-size: 11px;
  font-weight: 600;
  border-radius: 10px;
  white-space: nowrap;
}

.location-flag {
  width: 18px;
  height: 14px;
  border-radius: 9999px;
  object-fit: cover;
  flex-shrink: 0;
}

@media (min-width: 480px) {
  .vehicle-title {
    font-size: var(--font-size-2xl);
  }
}

@media (min-width: 768px) {
  .vehicle-title {
    font-size: var(--font-size-2xl);
  }

  .vehicle-title-price-row {
    flex-wrap: nowrap;
  }
}
</style>
