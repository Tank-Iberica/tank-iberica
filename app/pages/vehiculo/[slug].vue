<template>
  <div class="vehicle-page">
    <!-- Loading -->
    <div v-if="loading" class="vehicle-loading">
      <div class="skeleton-gallery" />
      <div class="skeleton-info">
        <div class="skeleton-line wide" />
        <div class="skeleton-line medium" />
        <div class="skeleton-line short" />
      </div>
    </div>

    <!-- Not found -->
    <div v-else-if="!vehicle" class="vehicle-not-found">
      <p>{{ $t('vehicle.notFound') }}</p>
      <NuxtLink to="/" class="back-link">
        {{ $t('vehicle.backToCatalog') }}
      </NuxtLink>
    </div>

    <!-- Vehicle detail -->
    <template v-else>
      <!-- Back button -->
      <div class="vehicle-back">
        <NuxtLink to="/" class="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {{ $t('vehicle.backToCatalog') }}
        </NuxtLink>
      </div>

      <!-- Gallery -->
      <VehicleImageGallery
        :images="vehicle.vehicle_images"
        :alt="`${vehicle.brand} ${vehicle.model}`"
      />

      <!-- Info section -->
      <div class="vehicle-info">
        <div class="vehicle-header">
          <h1 class="vehicle-title">{{ vehicle.brand }} {{ vehicle.model }}</h1>
          <span v-if="vehicle.featured" class="vehicle-badge">
            {{ $t('catalog.featured') }}
          </span>
        </div>

        <!-- Price -->
        <div class="vehicle-price-section">
          <p v-if="vehicle.price" class="vehicle-price">
            {{ formatPrice(vehicle.price) }}
          </p>
          <p v-if="vehicle.rental_price" class="vehicle-rental">
            {{ $t('catalog.from') }} {{ formatPrice(vehicle.rental_price) }}/{{ $t('catalog.month') }}
          </p>
        </div>

        <!-- Meta -->
        <div class="vehicle-meta">
          <div v-if="vehicle.year" class="meta-item">
            <span class="meta-label">{{ $t('vehicle.year') }}</span>
            <span class="meta-value">{{ vehicle.year }}</span>
          </div>
          <div v-if="vehicle.location" class="meta-item">
            <span class="meta-label">{{ $t('vehicle.location') }}</span>
            <span class="meta-value">{{ vehicle.location }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">{{ $t('vehicle.category') }}</span>
            <span class="meta-value">{{ $t(`catalog.${vehicle.category}`) }}</span>
          </div>
          <div v-if="vehicle.subcategories" class="meta-item">
            <span class="meta-label">{{ $t('vehicle.subcategory') }}</span>
            <span class="meta-value">
              {{ locale === 'en' && vehicle.subcategories.name_en ? vehicle.subcategories.name_en : vehicle.subcategories.name_es }}
            </span>
          </div>
        </div>

        <!-- Description -->
        <div v-if="description" class="vehicle-description">
          <h2>{{ $t('vehicle.description') }}</h2>
          <p>{{ description }}</p>
        </div>

        <!-- Specifications from filters_json -->
        <div v-if="hasSpecs" class="vehicle-specs">
          <h2>{{ $t('vehicle.specifications') }}</h2>
          <dl class="specs-list">
            <template v-for="(value, key) in vehicle.filters_json" :key="key">
              <dt>{{ key }}</dt>
              <dd>{{ value }}</dd>
            </template>
          </dl>
        </div>

        <!-- Contact options -->
        <div class="vehicle-contact">
          <h2>{{ $t('vehicle.contact') }}</h2>
          <div class="contact-buttons">
            <a href="tel:+34900000000" class="contact-btn contact-call">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              {{ $t('vehicle.call') }}
            </a>
            <a
              :href="`https://wa.me/34900000000?text=${encodeURIComponent(shareText)}`"
              target="_blank"
              rel="noopener"
              class="contact-btn contact-whatsapp"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 01-5.39-1.586l-.386-.232-2.646.887.887-2.646-.232-.386A9.94 9.94 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
              </svg>
              {{ $t('vehicle.whatsapp') }}
            </a>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Vehicle } from '~/composables/useVehicles'

const route = useRoute()
const { locale, t } = useI18n()
const { fetchBySlug } = useVehicles()

const vehicle = ref<Vehicle | null>(null)
const loading = ref(true)

const description = computed(() => {
  if (!vehicle.value) return null
  if (locale.value === 'en' && vehicle.value.description_en) return vehicle.value.description_en
  return vehicle.value.description_es
})

const hasSpecs = computed(() => {
  if (!vehicle.value?.filters_json) return false
  return Object.keys(vehicle.value.filters_json).length > 0
})

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price)
}

const shareText = computed(() => {
  if (!vehicle.value) return ''
  return `${vehicle.value.brand} ${vehicle.value.model} - Tank Iberica`
})

onMounted(async () => {
  const slug = route.params.slug as string
  vehicle.value = await fetchBySlug(slug)
  loading.value = false

  if (vehicle.value) {
    const title = `${vehicle.value.brand} ${vehicle.value.model} - Tank Iberica`
    const desc = description.value || t('site.description')
    const image = vehicle.value.vehicle_images?.[0]?.url || ''

    useSeoMeta({
      title,
      description: desc,
      ogTitle: title,
      ogDescription: desc,
      ogImage: image,
      ogType: 'website',
    })
  }
})
</script>

<style scoped>
.vehicle-page {
  max-width: 1024px;
  margin: 0 auto;
  padding: var(--spacing-4);
  padding-bottom: var(--spacing-16);
}

/* Back */
.vehicle-back {
  margin-bottom: var(--spacing-4);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  min-height: 44px;
}

/* Loading skeleton */
.vehicle-loading {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.skeleton-gallery {
  aspect-ratio: 4 / 3;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.skeleton-line {
  height: 20px;
  border-radius: var(--border-radius-sm);
  background: var(--bg-secondary);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-line.wide { width: 70%; }
.skeleton-line.medium { width: 45%; }
.skeleton-line.short { width: 25%; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Not found */
.vehicle-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: var(--spacing-4);
  color: var(--text-auxiliary);
  font-size: var(--font-size-lg);
}

/* Info */
.vehicle-info {
  margin-top: var(--spacing-6);
}

.vehicle-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-3);
}

.vehicle-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.vehicle-badge {
  background: var(--color-gold);
  color: var(--color-white);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--border-radius-sm);
  text-transform: uppercase;
}

/* Price */
.vehicle-price-section {
  margin-bottom: var(--spacing-4);
}

.vehicle-price {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.vehicle-rental {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin-top: var(--spacing-1);
}

/* Meta grid */
.vehicle-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-6);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.meta-label {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  text-transform: uppercase;
  font-weight: var(--font-weight-medium);
}

.meta-value {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
}

/* Description */
.vehicle-description {
  margin-bottom: var(--spacing-6);
}

.vehicle-description h2 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-3);
}

.vehicle-description p {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  white-space: pre-line;
}

/* Specs */
.vehicle-specs {
  margin-bottom: var(--spacing-6);
}

.vehicle-specs h2 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-3);
}

.specs-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2) var(--spacing-4);
}

.specs-list dt {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

.specs-list dd {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
  text-align: right;
}

/* Contact */
.vehicle-contact {
  padding-top: var(--spacing-6);
  border-top: 1px solid var(--border-color-light);
}

.vehicle-contact h2 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-3);
}

.contact-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.contact-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  min-height: 48px;
  text-decoration: none;
  transition: opacity var(--transition-fast);
}

.contact-btn:hover {
  opacity: 0.9;
}

.contact-call {
  background: var(--color-primary);
  color: var(--color-white);
}

.contact-whatsapp {
  background: #25D366;
  color: var(--color-white);
}

/* Desktop layout */
@media (min-width: 768px) {
  .vehicle-title {
    font-size: var(--font-size-3xl);
  }

  .contact-buttons {
    flex-direction: row;
  }

  .contact-btn {
    flex: 1;
  }
}

@media (min-width: 1024px) {
  .vehicle-page {
    padding: var(--spacing-6);
  }
}
</style>
