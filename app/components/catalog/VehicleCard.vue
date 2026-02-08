<template>
  <NuxtLink :to="`/vehiculo/${vehicle.slug}`" class="product-card">
    <div class="card-image">
      <!-- Images carousel -->
      <template v-if="images.length">
        <NuxtImg
          v-if="images[currentImage]?.url?.includes('cloudinary.com')"
          provider="cloudinary"
          :src="cloudinaryPath(images[currentImage]!)"
          :alt="`${vehicle.brand} ${vehicle.model}`"
          width="400"
          height="300"
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
        <button class="img-nav img-nav-prev" aria-label="Previous" @click.prevent.stop="prevImage">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button class="img-nav img-nav-next" aria-label="Next" @click.prevent.stop="nextImage">
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
          @click.prevent.stop="currentImage = i"
        />
      </div>

      <!-- Favorite toggle (top-left) -->
      <button
        :class="['fav-btn', { active: isFav }]"
        :title="$t('catalog.favorites')"
        @click.prevent.stop="onToggleFav"
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </button>

      <!-- Price badge (top-right, green) -->
      <span class="badge-price">
        {{ priceText }}
      </span>

      <!-- Category badge (bottom-left) -->
      <span class="badge-category">
        {{ $t(`catalog.${vehicle.category}`) }}
      </span>

      <!-- Location badge (bottom-right) with pin icon + flag -->
      <span v-if="vehicle.location" class="badge-location">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#C41E3A" stroke="#C41E3A" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" fill="white" />
        </svg>
        <span>{{ locationText }}</span>
      </span>
    </div>

    <div class="product-info">
      <!-- Terceros banner (yellow-pastel with gold left border) -->
      <div v-if="vehicle.category === 'terceros'" class="terceros-banner">
        {{ $t('catalog.tercerosDisclaimer') }}
      </div>
      <h3 class="product-title">{{ vehicle.brand }} {{ vehicle.model }}</h3>
      <div v-if="hasSpecs" class="product-specs">
        <div v-if="vehicle.year" class="spec-item">
          <span class="spec-label">{{ $t('vehicle.year') }}</span>
          <span class="spec-value">{{ vehicle.year }}</span>
        </div>
        <div v-if="vehicle.location" class="spec-item">
          <span class="spec-label">{{ $t('vehicle.location') }}</span>
          <span class="spec-value">{{ vehicle.location }}</span>
        </div>
        <div v-if="vehicle.rental_price" class="spec-item">
          <span class="spec-label">{{ $t('vehicle.rentalPrice') }}</span>
          <span class="spec-value">{{ formatPrice(vehicle.rental_price) }}/{{ $t('catalog.month') }}</span>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Vehicle } from '~/composables/useVehicles'

const props = defineProps<{
  vehicle: Vehicle
}>()

const { t } = useI18n()
const { toggle, isFavorite } = useFavorites()
const user = useSupabaseUser()
const openAuthModal = inject<(() => void) | undefined>('openAuthModal', undefined)
const currentImage = ref(0)

const isFav = computed(() => isFavorite(props.vehicle.id))

const locationText = computed(() => {
  const city = props.vehicle.location?.split(',')[0]?.trim() || props.vehicle.location
  const flag = props.vehicle.location_country ? countryFlag(props.vehicle.location_country) : ''
  return `${city} ${flag}`.trim()
})

function onToggleFav() {
  if (!user.value) {
    openAuthModal?.()
    return
  }
  toggle(props.vehicle.id)
}

const images = computed(() => {
  if (!props.vehicle.vehicle_images?.length) return []
  return [...props.vehicle.vehicle_images].sort((a, b) => a.position - b.position)
})

const hasSpecs = computed(() => {
  return props.vehicle.year || props.vehicle.location || props.vehicle.rental_price
})

const priceText = computed(() => {
  if (props.vehicle.category === 'terceros') {
    return t('catalog.solicitar')
  }
  if (props.vehicle.price) {
    return formatPrice(props.vehicle.price)
  }
  return t('catalog.solicitar')
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
/* ============================================
   PRODUCT CARD — Base = mobile (360px)
   Matches legacy: 16px radius, shadow, hover lift
   ============================================ */
.product-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid transparent;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(15, 42, 46, 0.12);
  border-color: var(--color-primary-light);
}

/* Image area — 4:3 aspect ratio matching legacy */
.card-image {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--border-color, #E5E7EB) 100%);
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
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

/* Navigation arrows — visible on mobile, hover-only on desktop */
.img-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  min-height: 32px;
  min-width: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary, #23424A);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 1;
  transition: all 0.3s ease;
  z-index: 3;
  cursor: pointer;
  font-weight: bold;
}

.img-nav:hover {
  transform: translateY(-50%) scale(1.15);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
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
  transition: all 0.3s ease;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.badge-category {
  position: absolute;
  bottom: 0;
  left: 0;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #1A4248) 100%);
  color: var(--color-white);
  padding: 0.5rem 0.9rem;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  font-weight: 600;
  border-top-left-radius: 12px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  z-index: 1;
}

/* Product info section */
.product-info {
  padding: 1.2rem 1.3rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

/* Terceros banner — yellow-pastel with gold left border */
.terceros-banner {
  background: #FFFEF0;
  border-left: 3px solid #F5D547;
  padding: 0.3rem 0.5rem;
  font-size: 9px;
  line-height: 1.3;
  color: #5A5A3D;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  line-height: 1.35;
}

/* Specs grid — 3 columns matching legacy */
.product-specs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.7rem;
}

.spec-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.spec-label {
  font-size: 10px;
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-weight: 500;
  line-height: 1.4;
}

.spec-value {
  font-weight: 700;
  color: var(--color-primary);
  font-size: 12px;
  line-height: 1.4;
}

/* Favorite button — top-left on image */
.fav-btn {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  width: 32px;
  height: 32px;
  min-height: 32px;
  min-width: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 3;
  transition: all 0.2s ease;
  padding: 0;
}

.fav-btn svg {
  fill: none;
  stroke: var(--color-primary);
  stroke-width: 2;
  transition: all 0.2s ease;
}

.fav-btn:hover svg {
  fill: var(--color-gold, #F59E0B);
  stroke: var(--color-gold, #F59E0B);
}

.fav-btn.active svg {
  fill: var(--color-gold, #F59E0B);
  stroke: var(--color-gold, #F59E0B);
}

/* ============================================
   RESPONSIVE: ≥480px
   ============================================ */
@media (min-width: 480px) {
  .terceros-banner {
    font-size: 10px;
    padding: 0.4rem 0.6rem;
  }
}

/* ============================================
   RESPONSIVE: ≥768px (tablet/desktop)
   ============================================ */
@media (min-width: 768px) {
  /* Nav arrows: hidden until hover, larger */
  .img-nav {
    opacity: 0;
    width: 38px;
    height: 38px;
    min-width: 38px;
    min-height: 38px;
  }

  .product-card:hover .img-nav {
    opacity: 1;
  }

  .product-title {
    font-size: 18px;
  }

  .terceros-banner {
    font-size: 11px;
  }

  .spec-label {
    font-size: 12px;
  }

  .spec-value {
    font-size: 14px;
  }
}
</style>
