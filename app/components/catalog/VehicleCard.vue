<template>
  <NuxtLink :to="`/vehiculo/${vehicle.slug}`" class="product-card">
    <div class="card-image" @click.prevent.stop="">
      <!-- Images carousel -->
      <template v-if="images.length">
        <NuxtImg
          v-if="images[currentImage]?.url?.includes('cloudinary.com')"
          provider="cloudinary"
          :src="cloudinaryPath(images[currentImage]!)"
          :alt="`${vehicle.brand} ${vehicle.model}`"
          width="400"
          height="225"
          fit="cover"
          loading="lazy"
          format="webp"
          class="card-img"
        />
        <img
          v-else
          :src="images[currentImage]?.url"
          :alt="`${vehicle.brand} ${vehicle.model}`"
          class="card-img"
        >
      </template>
      <div v-else class="card-img-placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>

      <!-- Nav arrows (only if multiple images) -->
      <template v-if="images.length > 1">
        <button class="img-nav img-nav-prev" aria-label="Previous" @click="prevImage">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button class="img-nav img-nav-next" aria-label="Next" @click="nextImage">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </template>

      <!-- Indicator dots -->
      <div v-if="images.length > 1" class="image-indicators">
        <span
          v-for="(_, i) in images"
          :key="i"
          :class="['indicator', { active: i === currentImage }]"
          @click="currentImage = i"
        />
      </div>

      <!-- Price badge (top-right) -->
      <span v-if="vehicle.price" class="badge-price">
        {{ formatPrice(vehicle.price) }}
      </span>

      <!-- Category badge (bottom-left) -->
      <span class="badge-category">
        {{ $t(`catalog.${vehicle.category}`) }}
      </span>

      <!-- Location badge (bottom-right) -->
      <span v-if="vehicle.location" class="badge-location">
        {{ vehicle.location }}
      </span>
    </div>

    <div class="product-info" @click.stop="">
      <NuxtLink :to="`/vehiculo/${vehicle.slug}`" class="product-link">
        <h3 class="product-title">{{ vehicle.brand }} {{ vehicle.model }}</h3>
        <div class="product-meta">
          <span v-if="vehicle.year">{{ vehicle.year }}</span>
          <span v-if="vehicle.location">{{ vehicle.location }}</span>
          <span v-if="vehicle.rental_price" class="rental-tag">
            {{ $t('catalog.from') }} {{ formatPrice(vehicle.rental_price) }}/{{ $t('catalog.month') }}
          </span>
        </div>
        <div v-if="vehicle.category === 'terceros'" class="terceros-disclaimer">
          {{ $t('catalog.tercerosDisclaimer') }}
        </div>
        <span class="view-details-btn">{{ $t('catalog.viewDetails') }}</span>
      </NuxtLink>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Vehicle } from '~/composables/useVehicles'

const props = defineProps<{
  vehicle: Vehicle
}>()

const currentImage = ref(0)

const images = computed(() => {
  if (!props.vehicle.vehicle_images?.length) return []
  return [...props.vehicle.vehicle_images].sort((a, b) => a.position - b.position)
})

function cloudinaryPath(img: { url?: string }): string {
  if (!img.url) return ''
  const match = img.url.match(/\/upload\/(.+)$/)
  return match ? match[1]! : (img.url ?? '')
}

function prevImage() {
  currentImage.value = currentImage.value <= 0 ? images.value.length - 1 : currentImage.value - 1
}

function nextImage() {
  currentImage.value = currentImage.value >= images.value.length - 1 ? 0 : currentImage.value + 1
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price)
}
</script>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  color: inherit;
}

.product-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(15, 42, 46, 0.12);
}

/* Image area */
.card-image {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: var(--bg-secondary);
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.product-card:hover .card-img {
  transform: scale(1.08);
}

.card-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-auxiliary);
}

/* Navigation arrows */
.img-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 2;
}

.product-card:hover .img-nav {
  opacity: 1;
}

.img-nav-prev { left: 0.5rem; }
.img-nav-next { right: 0.5rem; }

/* Indicator dots */
.image-indicators {
  position: absolute;
  bottom: 0.6rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.5);
  padding: 0.4rem 0.9rem;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  z-index: 2;
}

.indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s ease;
}

.indicator.active {
  background: var(--color-white);
  width: 24px;
  border-radius: 4px;
}

/* Badges overlaid on image */
.badge-price {
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: var(--color-white);
  padding: 0.6rem 1rem;
  font-size: 14px;
  font-weight: 700;
  border-bottom-left-radius: 12px;
  z-index: 1;
}

.badge-category {
  position: absolute;
  bottom: 0;
  left: 0;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-white);
  padding: 0.5rem 0.9rem;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  border-top-right-radius: 12px;
  z-index: 1;
}

.badge-location {
  position: absolute;
  bottom: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(10px);
  color: var(--color-white);
  padding: 0.5rem 0.9rem;
  font-size: 12px;
  border-top-left-radius: 12px;
  z-index: 1;
}

/* Product info section */
.product-info {
  padding: 1rem 1.2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.product-link {
  text-decoration: none;
  color: inherit;
}

.product-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: var(--line-height-tight);
}

.product-meta {
  display: flex;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

.product-meta span::after {
  content: '·';
  margin-left: var(--spacing-2);
}

.product-meta span:last-child::after {
  content: '';
}

.rental-tag {
  color: var(--text-secondary);
}

.terceros-disclaimer {
  margin-top: 0.25rem;
  padding: 0.3rem 0.5rem;
  background: #FEF3C7;
  color: #92400E;
  font-size: 10px;
  border-radius: 4px;
  line-height: 1.3;
}

.view-details-btn {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.35rem 0.75rem;
  background: var(--color-primary);
  color: var(--color-white);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  border-radius: var(--border-radius-full);
  text-align: center;
  transition: opacity 0.2s;
}

.view-details-btn:hover {
  opacity: 0.9;
}

/* Base mobile: always show nav arrows */
.img-nav {
  opacity: 1;
  width: 28px;
  height: 28px;
}

@media (min-width: 768px) {
  .img-nav {
    opacity: 0;
    width: 32px;
    height: 32px;
  }

  .product-title {
    font-size: 18px;
  }
}
</style>
