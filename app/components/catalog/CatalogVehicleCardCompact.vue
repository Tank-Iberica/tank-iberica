<template>
  <NuxtLink :to="`/vehiculo/${vehicle.slug}`" prefetch class="compact-card">
    <!-- Image: left ~38% -->
    <div class="compact-image">
      <NuxtImg
        v-if="firstImage?.url?.includes('cloudinary.com')"
        provider="cloudinary"
        :src="cloudinaryPath(firstImage)"
        :alt="buildProductName(vehicle, locale, true)"
        width="160"
        height="100"
        fit="cover"
        :loading="priority ? 'eager' : 'lazy'"
        :fetchpriority="priority ? 'high' : 'auto'"
        format="webp"
        sizes="(max-width: 48em) 38vw, 160px"
        class="compact-img"
      />
      <img
        v-else-if="firstImage?.url"
        :src="firstImage.url"
        :alt="buildProductName(vehicle, locale, true)"
        width="160"
        height="100"
        :loading="priority ? 'eager' : 'lazy'"
        decoding="async"
        class="compact-img"
      >
      <div v-else class="compact-placeholder">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>
    </div>

    <!-- Info: right ~62% -->
    <div class="compact-info">
      <p class="compact-title">{{ buildProductName(vehicle, locale, true) }}</p>
      <div class="compact-meta">
        <span v-if="vehicle.year" class="compact-year">{{ vehicle.year }}</span>
        <span v-if="displayPrice" class="compact-price">{{ displayPrice }}</span>
      </div>
      <p v-if="locationLabel" class="compact-location">{{ locationLabel }}</p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Vehicle } from '~/composables/useVehicles'
import { formatPrice } from '~/composables/shared/useListingUtils'

const props = defineProps<{
  vehicle: Vehicle
  priority?: boolean
}>()

const { locale } = useI18n()
const { location: userLocation } = useUserLocation()

const firstImage = computed(() => {
  if (!props.vehicle.vehicle_images?.length) return null
  return [...props.vehicle.vehicle_images].sort((a, b) => a.position - b.position)[0] ?? null
})

function cloudinaryPath(img: { url?: string }): string {
  if (!img.url) return ''
  const match = img.url.match(/\/upload\/(.+)$/)
  return match ? match[1]! : (img.url ?? '')
}

const displayPrice = computed(() => {
  if (props.vehicle.price) return formatPrice(props.vehicle.price)
  if (props.vehicle.rental_price) return `${formatPrice(props.vehicle.rental_price)}/mes`
  return null
})

const locationLabel = computed(() => {
  const loc =
    locale.value === 'en' && props.vehicle.location_en
      ? props.vehicle.location_en
      : props.vehicle.location
  if (!loc) return ''
  const vehicleCountry = props.vehicle.location_country
  const userCountry = userLocation.value.country
  if (userCountry === 'ES' && vehicleCountry === 'ES') {
    return loc.replace(/,?\s*(España|Spain)\s*$/i, '').trim()
  }
  return loc
})
</script>

<style scoped>
/* ============================================
   COMPACT CARD — horizontal layout, mobile-first
   Target: ~76px tall, 100% width, no carousel
   ============================================ */
.compact-card {
  display: flex;
  flex-direction: row;
  height: 5rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.compact-card:hover,
.compact-card:focus-visible {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(35, 66, 74, 0.15);
}

/* Image: fixed 38% width */
.compact-image {
  flex: 0 0 38%;
  width: 38%;
  background: var(--bg-secondary);
  overflow: hidden;
  position: relative;
}

.compact-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.compact-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-disabled);
}

/* Info: remaining 62% */
.compact-info {
  flex: 1;
  min-width: 0;
  padding: 0.375rem 0.625rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.125rem;
  overflow: hidden;
}

.compact-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.compact-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: nowrap;
  overflow: hidden;
}

.compact-year {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.compact-price {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.compact-location {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

/* Tablet: slightly taller card */
@media (min-width: 48em) {
  .compact-card {
    height: 5.5rem;
  }

  .compact-title {
    font-size: var(--font-size-base);
  }

  .compact-year,
  .compact-price,
  .compact-location {
    font-size: var(--font-size-sm);
  }
}
</style>
