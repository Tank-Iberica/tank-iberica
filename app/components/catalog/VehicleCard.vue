<template>
  <NuxtLink :to="`/vehiculo/${vehicle.slug}`" prefetch :class="['product-card', highlightClass]">
    <div class="card-image">
      <!-- Images carousel -->
      <template v-if="images.length">
        <NuxtImg
          v-if="images[currentImage]?.url?.includes('cloudinary.com')"
          provider="cloudinary"
          :src="cloudinaryPath(images[currentImage]!)"
          :alt="buildProductName(vehicle, locale, true)"
          width="400"
          height="300"
          fit="cover"
          :loading="priority ? 'eager' : 'lazy'"
          :fetchpriority="priority ? 'high' : 'auto'"
          format="webp"
          sizes="(max-width: 29.94em) calc(100vw - 32px), (max-width: 48em) calc(50vw - 24px), (max-width: 64em) calc(33vw - 24px), 25vw"
          placeholder
          class="card-img"
        />
        <img
          v-else
          :src="images[currentImage]?.url"
          :alt="buildProductName(vehicle, locale, true)"
          width="400"
          height="300"
          :loading="priority ? 'eager' : 'lazy'"
          :fetchpriority="priority ? 'high' : 'auto'"
          decoding="async"
          class="card-img"
        >
      </template>
      <div v-else class="card-img-placeholder">
        <svg
          width="48"
          height="48"
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

      <!-- Nav arrows (only if multiple images) -->
      <template v-if="images.length > 1">
        <button class="img-nav img-nav-prev" aria-label="Previous" @click.prevent.stop="prevImage">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button class="img-nav img-nav-next" aria-label="Next" @click.prevent.stop="nextImage">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
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
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          />
        </svg>
      </button>

      <!-- Price badge (top-right, green) -->
      <span class="badge-price">
        {{ priceText }}
      </span>

      <!-- Top-rated badge (#54) -->
      <span v-if="dealerTier === 'top'" class="badge-top-rated">
        {{ $t('catalog.topRatedBadge') }}
      </span>

      <!-- Category badge (bottom-left) -->
      <span class="badge-category">
        {{ $t(`catalog.${vehicle.category}`) }}
      </span>

      <!-- Location badge (bottom-right) with pin icon + flag -->
      <span v-if="vehicle.location" class="badge-location">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="var(--color-danger)"
          stroke="var(--color-danger)"
          stroke-width="2"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" fill="white" />
        </svg>
        <span>{{ locationLabel }}</span>
        <img
          v-if="locationFlagCode"
          :src="`https://flagcdn.com/w20/${locationFlagCode}.png`"
          :alt="locationFlagCode"
          class="location-flag"
        >
      </span>
    </div>

    <div class="product-info">
      <!-- Terceros banner (yellow-pastel with gold left border) -->
      <div v-if="vehicle.category === 'terceros'" class="terceros-banner">
        {{ $t('catalog.tercerosDisclaimer') }}
      </div>
      <div class="title-badge-row">
        <h3 class="product-title">{{ buildProductName(vehicle, locale, true) }}</h3>
        <SharedDealerTrustBadge v-if="dealerTier" :tier="dealerTier" />
      </div>
      <div v-if="hasSpecs" class="product-specs">
        <div v-if="vehicle.year" class="spec-item">
          <span class="spec-label">{{ $t('vehicle.year') }}</span>
          <span class="spec-value">{{ vehicle.year }}</span>
        </div>
        <div v-if="vehicle.rental_price" class="spec-item">
          <span class="spec-label">{{ $t('vehicle.rentalPrice') }}</span>
          <span class="spec-value"
            >{{ formatPrice(vehicle.rental_price) }}/{{ $t('catalog.month') }}</span
          >
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Vehicle } from '~/composables/useVehicles'
import { formatPrice } from '~/composables/shared/useListingUtils'
import type { TrustBadgeTier } from '~/composables/useDealerTrustScore'

const props = defineProps<{
  vehicle: Vehicle
  /** True for above-fold cards: disables lazy loading and sets fetchpriority=high */
  priority?: boolean
  /** Trust badge tier for the dealer; null = no badge shown */
  dealerTier?: TrustBadgeTier
}>()

const { t, locale } = useI18n()
const { toggle, isFavorite } = useFavorites()
const { location: userLocation } = useUserLocation()
const user = useSupabaseUser()
const openAuthModal = inject<(() => void) | undefined>('openAuthModal', undefined)
const currentImage = ref(0)

const isFav = computed(() => isFavorite(props.vehicle.id))

const locationLabel = computed(() => {
  const loc =
    locale.value === 'en' && props.vehicle.location_en
      ? props.vehicle.location_en
      : props.vehicle.location
  if (!loc) return ''

  const vehicleCountry = props.vehicle.location_country
  const userCountry = userLocation.value.country
  const bothInSpain = userCountry === 'ES' && vehicleCountry === 'ES'

  if (bothInSpain) {
    return loc.replace(/,?\s*(España|Spain)\s*$/i, '').trim()
  }
  return loc
})

const locationFlagCode = computed(() => {
  const vehicleCountry = props.vehicle.location_country
  if (!vehicleCountry) return null
  const userCountry = userLocation.value.country
  if (userCountry === 'ES' && vehicleCountry === 'ES') return null
  return vehicleCountry.toLowerCase()
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
  return props.vehicle.year || props.vehicle.rental_price
})

// #219: Title sizing handled by CSS (text-overflow: ellipsis) instead of JS reflow loop

const highlightClass = computed(() => {
  const s = props.vehicle.highlight_style
  return s ? `highlight-${s}` : null
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
</script>

<style scoped>
/* ============================================
   PRODUCT CARD — Base = mobile (360px)
   Matches legacy: 16px radius, shadow, hover lift
   ============================================ */
.product-card {
  /* CSS virtual rendering: skip paint/layout for off-screen cards (#91)
     contain-intrinsic-size reserves approximate height so scroll stays stable */
  content-visibility: auto;
  contain-intrinsic-size: 0 320px;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid transparent;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

@media (hover: hover) {
  .product-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 40px rgba(15, 42, 46, 0.12);
    border-color: var(--color-primary-light);
  }
}

/* Image area — 4:3 aspect ratio matching legacy */
.card-image {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    var(--bg-secondary) 0%,
    var(--border-color, var(--color-gray-200)) 100%
  );
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

@media (hover: hover) {
  .product-card:hover .card-img {
    transform: scale(1.08);
  }
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
  width: 2rem;
  height: 2rem;
  min-height: 2rem;
  min-width: 2rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 1;
  transition: all 0.3s ease;
  z-index: 3;
  cursor: pointer;
  font-weight: bold;
}

@media (hover: hover) {
  .img-nav:hover {
    transform: translateY(-50%) scale(1.15);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
}

.img-nav-prev {
  left: 0.5rem;
}
.img-nav-next {
  right: 0.5rem;
}

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
  border-radius: var(--border-radius-xl);
  backdrop-filter: blur(10px);
  z-index: 2;
}

.indicator {
  width: 0.4375rem;
  height: 0.4375rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator.active {
  background: var(--color-white);
  width: 1.5rem;
  border-radius: var(--border-radius-sm);
}

/* Badges overlaid on image */
.badge-price {
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, var(--color-success) 0%, var(--color-success-dark) 100%);
  color: var(--color-white);
  padding: 0.6rem 1rem;
  font-size: var(--font-size-base);
  font-weight: 700;
  border-bottom-left-radius: var(--border-radius-md);
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Top-rated badge — gold star on image (#54) */
.badge-top-rated {
  position: absolute;
  top: 0;
  left: 2.75rem;
  background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%);
  color: var(--color-white);
  padding: 0.35rem 0.7rem;
  font-size: var(--font-size-2xs, 0.6875rem);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.031rem;
  border-bottom-right-radius: var(--border-radius-sm);
  border-bottom-left-radius: var(--border-radius-sm);
  z-index: 2;
  box-shadow: 0 2px 6px rgba(212, 175, 55, 0.4);
}

.badge-category {
  position: absolute;
  bottom: 0;
  left: 0;
  background: linear-gradient(
    135deg,
    var(--color-primary) 0%,
    var(--color-primary-dark, #1a4248) 100%
  );
  color: var(--color-white);
  padding: 0.5rem 0.9rem;
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.031rem;
  border-top-right-radius: var(--border-radius-md);
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
  font-size: var(--font-size-xs);
  font-weight: 600;
  border-top-left-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  z-index: 1;
}

.location-flag {
  width: 1.125rem;
  height: 0.875rem;
  object-fit: cover;
  border-radius: var(--border-radius-full);
  display: inline-block;
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
  background: #fffef0;
  border-left: 3px solid var(--color-yellow-400);
  padding: 0.3rem 0.5rem;
  font-size: var(--font-size-xs);
  line-height: 1.3;
  color: #5a5a3d;
  border-radius: var(--border-radius-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title-badge-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.product-title {
  font-weight: 700;
  color: var(--color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  line-height: 1.35;
  font-size: clamp(0.75rem, 2.5vw, 1.25rem);
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
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.019rem;
  font-weight: 500;
  line-height: 1.4;
}

.spec-value {
  font-weight: 700;
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  line-height: 1.4;
}

/* Favorite button — top-left on image */
.fav-btn {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  width: 2rem;
  height: 2rem;
  min-height: 2rem;
  min-width: 2rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(0, 0, 0, 0.15) !important;
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

@media (hover: hover) {
  .fav-btn:hover svg {
    fill: var(--color-gold, var(--color-warning));
    stroke: var(--color-gold, var(--color-warning));
  }
}

.fav-btn.active svg {
  fill: var(--color-gold, var(--color-warning));
  stroke: var(--color-gold, var(--color-warning));
}

/* ============================================
   RESPONSIVE: ≥30em
   ============================================ */
@media (min-width: 30em) {
  .terceros-banner {
    font-size: var(--font-size-xs);
    padding: 0.4rem 0.6rem;
  }
}

/* ============================================
   RESPONSIVE: ≥48em (tablet/desktop)
   ============================================ */
@media (min-width: 48em) {
  /* Nav arrows: larger at tablet+ */
  .img-nav {
    width: 2.375rem;
    height: 2.375rem;
    min-width: 2.375rem;
    min-height: 2.375rem;
  }
}

/* On pointer devices: hide arrows until card hover */
@media (hover: hover) and (min-width: 48em) {
  .img-nav {
    opacity: 0;
  }

  .product-card:hover .img-nav {
    opacity: 1;
  }
}

@media (min-width: 48em) {
  /* titleStyle computed handles font-size dynamically */

  .terceros-banner {
    font-size: var(--font-size-xs);
  }

  .spec-label {
    font-size: var(--font-size-xs);
  }

  .spec-value {
    font-size: var(--font-size-base);
  }
}

/* ============================================
   HIGHLIGHT STYLES — paid visual boost
   ============================================ */

/* Gold — amber border + warm shadow */
.product-card.highlight-gold {
  border-color: #d4af37;
  box-shadow:
    0 4px 20px rgba(212, 175, 55, 0.25),
    0 0 0 2px rgba(212, 175, 55, 0.15);
}

@media (hover: hover) {
  .product-card.highlight-gold:hover {
    border-color: #d4af37;
    box-shadow:
      0 20px 40px rgba(212, 175, 55, 0.35),
      0 0 0 2px #d4af37;
  }
}

/* Premium — teal/primary gradient border */
.product-card.highlight-premium {
  border-color: var(--color-primary);
  box-shadow:
    0 4px 20px rgba(35, 66, 74, 0.2),
    0 0 0 2px rgba(35, 66, 74, 0.12);
}

@media (hover: hover) {
  .product-card.highlight-premium:hover {
    border-color: var(--color-primary);
    box-shadow:
      0 20px 40px rgba(35, 66, 74, 0.3),
      0 0 0 2px var(--color-primary);
  }
}

/* Spotlight — white border + bright glow */
.product-card.highlight-spotlight {
  border-color: rgba(255, 255, 255, 0.9);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.15),
    0 0 0 3px rgba(255, 255, 255, 0.6),
    0 0 20px rgba(255, 255, 255, 0.3);
}

@media (hover: hover) {
  .product-card.highlight-spotlight:hover {
    border-color: #ffffff;
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.2),
      0 0 0 3px #ffffff,
      0 0 30px rgba(255, 255, 255, 0.5);
  }
}

/* Urgent — red border with subtle pulse */
.product-card.highlight-urgent {
  border-color: var(--color-danger, #dc2626);
  box-shadow:
    0 4px 20px rgba(220, 38, 38, 0.2),
    0 0 0 2px rgba(220, 38, 38, 0.15);
  animation: pulse-urgent 2.5s ease-in-out infinite;
}

@keyframes pulse-urgent {
  0%,
  100% {
    box-shadow:
      0 4px 20px rgba(220, 38, 38, 0.2),
      0 0 0 2px rgba(220, 38, 38, 0.15);
  }
  50% {
    box-shadow:
      0 4px 20px rgba(220, 38, 38, 0.35),
      0 0 0 2px rgba(220, 38, 38, 0.4);
  }
}

@media (hover: hover) {
  .product-card.highlight-urgent:hover {
    border-color: var(--color-danger, #dc2626);
    animation: none;
    box-shadow:
      0 20px 40px rgba(220, 38, 38, 0.3),
      0 0 0 2px var(--color-danger, #dc2626);
  }
}
</style>
