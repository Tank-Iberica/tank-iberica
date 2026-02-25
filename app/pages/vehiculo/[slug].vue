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
      <UiBreadcrumbNav :items="breadcrumbItems" />

      <div class="vehicle-content">
        <!-- Gallery + Sticky notification -->
        <div class="vehicle-gallery-wrapper">
          <VehicleImageGallery
            :images="vehicle.vehicle_images"
            :alt="buildProductName(vehicle, locale, true)"
          />
          <button class="vehicle-sticky-notification" @click="handleOpenDemand">
            {{ $t('vehicle.cantFind') }}
          </button>
        </div>

        <!-- Info section -->
        <div class="vehicle-info">
          <!-- Actions row -->
          <div class="vehicle-actions-row">
            <button class="vehicle-pdf-btn" :title="$t('vehicle.downloadPdf')" @click="handlePdf">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>{{ $t('vehicle.downloadPdf') }}</span>
            </button>

            <div class="vehicle-contact-btns">
              <a
                :href="`mailto:info@tracciona.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`"
                class="contact-btn contact-email"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>{{ $t('vehicle.email') }}</span>
              </a>
              <a :href="`tel:${$t('nav.phoneNumber')}`" class="contact-btn contact-call">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
                  />
                </svg>
                <span>{{ $t('vehicle.call') }}</span>
              </a>
              <a
                :href="`https://wa.me/${$t('nav.whatsappNumber')}?text=${encodeURIComponent(shareText)}`"
                target="_blank"
                rel="noopener"
                class="contact-btn contact-whatsapp"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
                  />
                  <path
                    d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 01-5.39-1.586l-.386-.232-2.646.887.887-2.646-.232-.386A9.94 9.94 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"
                  />
                </svg>
                <span>{{ $t('vehicle.whatsapp') }}</span>
              </a>
            </div>

            <div class="vehicle-icon-btns">
              <button
                :class="['vehicle-icon-btn', 'favorite-btn', { active: isFav }]"
                :title="$t('vehicle.favorite')"
                @click="handleFavorite"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  :fill="isFav ? 'currentColor' : 'none'"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polygon
                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                  />
                </svg>
              </button>
              <button
                class="vehicle-icon-btn share-btn"
                :title="$t('vehicle.share')"
                @click="handleShare"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                  <polyline points="7 9 12 4 17 9" />
                  <line x1="12" y1="4" x2="12" y2="16" />
                </svg>
              </button>
              <button
                class="vehicle-icon-btn report-btn"
                :title="$t('report.title')"
                @click="showReport = true"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              </button>
              <button
                :class="['vehicle-icon-btn', 'compare-btn', { active: inComparison }]"
                :title="$t('comparator.addToCompare')"
                @click="handleCompare"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Title + Price row -->
          <div class="vehicle-title-price-row">
            <h1 class="vehicle-title">
              {{ buildProductName(vehicle, locale, true) }}
              <span v-if="vehicle.featured" class="vehicle-badge">{{
                $t('catalog.featured')
              }}</span>
            </h1>
            <div class="vehicle-price">{{ priceText }}</div>
          </div>

          <!-- Rental price (below, smaller) -->
          <p v-if="vehicle.rental_price && vehicle.category !== 'terceros'" class="vehicle-rental">
            {{ $t('catalog.from') }} {{ formatPrice(vehicle.rental_price)
            }}{{ $t('vehicle.perMonth') }}
          </p>

          <!-- Fair price indicator -->
          <VehicleFairPriceBadge
            v-if="vehicle.price && vehicle.id"
            :vehicle-id="vehicle.id"
            :current-price="vehicle.price"
          />

          <!-- Meta row: category badge + location badge -->
          <div class="vehicle-meta-row">
            <span :class="['vehicle-category-badge', vehicle.category]">
              {{ $t(`catalog.${vehicle.category}`) }}
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
                :alt="vehicle.location_country || ''"
                class="location-flag"
              >
            </span>
          </div>

          <!-- AI Badge (AI Act compliance) -->
          <UiAiBadge v-if="vehicle.ai_generated" type="generated" />

          <!-- Seller Info (DSA compliance) -->
          <div v-if="sellerInfo" class="vehicle-seller-info">
            <h3>{{ $t('vehicle.sellerInfo') }}</h3>
            <div class="seller-details">
              <span v-if="sellerInfo.company_name" class="seller-item">
                <strong>{{ sellerInfo.company_name }}</strong>
              </span>
              <span v-if="sellerInfo.location" class="seller-item">{{ sellerInfo.location }}</span>
              <span v-if="sellerInfo.cif" class="seller-item"
                >{{ $t('vehicle.sellerCif') }}: {{ sellerInfo.cif }}</span
              >
            </div>
          </div>

          <!-- Seller profile link -->
          <NuxtLink
            v-if="sellerInfo && vehicle.dealer_id"
            :to="`/vendedor/${vehicle.dealer_slug || vehicle.dealer_id}`"
            class="seller-profile-link"
          >
            {{ $t('vehicle.viewSellerProfile') }}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </NuxtLink>

          <!-- Disclaimer for terceros -->
          <div v-if="vehicle.category === 'terceros'" class="vehicle-disclaimer">
            {{ $t('vehicle.disclaimer') }}
          </div>

          <!-- Characteristics grid -->
          <div v-if="hasSpecs" class="vehicle-characteristics">
            <h2>{{ $t('vehicle.characteristics') }}</h2>
            <div class="vehicle-char-grid">
              <div
                v-for="(value, key) in vehicle.attributes_json"
                :key="key"
                class="vehicle-char-item"
              >
                <span class="vehicle-char-label">{{ resolveFilterLabel(String(key)) }}</span>
                <span class="vehicle-char-value">{{ resolveFilterValue(value) }}</span>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div v-if="description" class="vehicle-description">
            <h2>{{ $t('vehicle.description') }}</h2>
            <p>{{ description }}</p>
          </div>
          <!-- Price History -->
          <div v-if="vehicle.id" class="vehicle-price-history">
            <h2>{{ $t('priceHistory.title') }}</h2>
            <VehiclePriceHistoryChart :vehicle-id="vehicle.id" />
          </div>
        </div>
      </div>
      <!-- Report Modal (DSA compliance) -->
      <ModalsReportModal
        v-if="vehicle"
        :visible="showReport"
        entity-type="vehicle"
        :entity-id="vehicle.id"
        @close="showReport = false"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { generateVehiclePdf } from '~/utils/generatePdf'
import { fetchTranslation } from '~/composables/useLocalized'
import { useToast } from '~/composables/useToast'
import { useVehicleComparator } from '~/composables/useVehicleComparator'

const route = useRoute()
const { locale, t } = useI18n()
const { fetchBySlug } = useVehicles()
const { toggle, isFavorite } = useFavorites()
const { location: userLocation } = useUserLocation()
const openDemandModal = inject<() => void>('openDemandModal', () => {})
const supabase = useSupabaseClient()
const toast = useToast()

const { isInComparison, addToComparison, removeFromComparison } = useVehicleComparator()
const inComparison = computed(() => (vehicle.value ? isInComparison(vehicle.value.id) : false))

const showReport = ref(false)

// SSR-compatible data fetching — runs on server AND client
const { data: vehicle, status } = await useAsyncData(`vehicle-${route.params.slug}`, () =>
  fetchBySlug(route.params.slug as string),
)

const loading = computed(() => status.value === 'pending')

// Column-based description for es/en (primary languages)
function getColumnDescription(): string | null {
  if (!vehicle.value) return null
  if (locale.value === 'en' && vehicle.value.description_en) return vehicle.value.description_en
  return vehicle.value.description_es
}

// Description ref — initialized with column data for SSR compatibility
const description = ref<string | null>(getColumnDescription())

// Watch locale changes to fetch translations for non-primary locales
watch(
  [locale, () => vehicle.value?.id],
  async ([newLocale, vehicleId]) => {
    if (!vehicle.value) {
      description.value = null
      return
    }
    // Primary languages: read directly from columns
    if (newLocale === 'es' || newLocale === 'en') {
      description.value = getColumnDescription()
      return
    }
    // Other locales: try content_translations, fall back to columns
    const translated = await fetchTranslation(
      'vehicle',
      String(vehicleId),
      'description',
      newLocale,
    )
    description.value = translated || getColumnDescription()
  },
  { immediate: true },
)

const hasSpecs = computed(() => {
  if (!vehicle.value?.attributes_json) return false
  return Object.keys(vehicle.value.attributes_json).length > 0
})

const vehicleLocation = computed(() => {
  if (!vehicle.value) return null
  const loc =
    locale.value === 'en' && vehicle.value.location_en
      ? vehicle.value.location_en
      : vehicle.value.location
  if (!loc) return null

  const vehicleCountry = vehicle.value.location_country
  const bothInSpain = userLocation.value.country === 'ES' && vehicleCountry === 'ES'

  if (bothInSpain) {
    return loc.replace(/,?\s*(España|Spain)\s*$/i, '').trim()
  }
  return loc
})

const vehicleFlagCode = computed(() => {
  if (!vehicle.value) return null
  const vehicleCountry = vehicle.value.location_country
  if (!vehicleCountry) return null
  if (userLocation.value.country === 'ES' && vehicleCountry === 'ES') return null
  return vehicleCountry.toLowerCase()
})

// Price logic (matching legacy behavior)
const priceText = computed(() => {
  if (!vehicle.value) return ''
  const v = vehicle.value
  if (v.category === 'terceros') return t('vehicle.consultar')
  if (v.price) return formatPrice(v.price)
  return t('vehicle.consultar')
})

const isFav = computed(() => (vehicle.value ? isFavorite(vehicle.value.id) : false))

// DSA: Seller info (fetched from dealers table)
interface SellerInfo {
  company_name: string | null
  location: string | null
  cif: string | null
}
const sellerInfo = ref<SellerInfo | null>(null)

async function loadSellerInfo() {
  if (!vehicle.value?.dealer_id) return
  const { data } = await supabase
    .from('dealers')
    .select('company_name, location, cif')
    .eq('id', vehicle.value.dealer_id)
    .single()
  if (data) {
    sellerInfo.value = data as SellerInfo
  }
}

if (import.meta.client && vehicle.value?.dealer_id) {
  loadSellerInfo()
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price)
}

function resolveFilterLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1)
}

function resolveFilterValue(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, string>
    return locale.value === 'en' && obj.en ? obj.en : obj.es || String(value)
  }
  return String(value)
}

const breadcrumbItems = computed(() => {
  if (!vehicle.value) return []
  return [
    { label: t('nav.home'), to: '/' },
    { label: buildProductName(vehicle.value, locale.value, true) },
  ]
})

const shareText = computed(() => {
  if (!vehicle.value) return ''
  const v = vehicle.value
  const parts = [buildProductName(v, locale.value, true)]
  if (v.price) parts.push(`- ${formatPrice(v.price)}`)
  if (import.meta.client) parts.push(`- ${window.location.href}`)
  parts.push('- Tracciona')
  return parts.join(' ')
})

const emailSubject = computed(() => {
  if (!vehicle.value) return ''
  return `${buildProductName(vehicle.value, locale.value, true)} - Tracciona`
})

const emailBody = computed(() => {
  if (!vehicle.value) return ''
  const v = vehicle.value
  const parts = [t('vehicle.emailInterest')]
  parts.push(buildProductName(v, locale.value, true))
  if (v.year) parts.push(`${t('vehicle.year')}: ${v.year}`)
  if (v.price) parts.push(`${t('vehicle.price')}: ${formatPrice(v.price)}`)
  if (import.meta.client) parts.push(`URL: ${window.location.href}`)
  return parts.join('\n')
})

function handleFavorite() {
  if (!vehicle.value) return
  toggle(vehicle.value.id)
}

async function handleShare() {
  if (!vehicle.value || !import.meta.client) return
  const title = buildProductName(vehicle.value, locale.value, true)
  const text = description.value || ''
  const url = window.location.href

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
    } catch {
      /* user cancelled */
    }
  } else {
    await navigator.clipboard.writeText(url)
    toast.success('toast.shareCopied')
  }
}

async function handlePdf() {
  if (!vehicle.value) return
  await generateVehiclePdf({
    vehicle: vehicle.value,
    locale: locale.value,
    productName: buildProductName(vehicle.value, locale.value, true),
    priceText: priceText.value,
  })
}

function handleOpenDemand() {
  openDemandModal()
}

function handleCompare() {
  if (!vehicle.value) return
  if (inComparison.value) {
    removeFromComparison(vehicle.value.id)
  } else {
    addToComparison(vehicle.value.id)
  }
}

// SEO meta tags — runs during SSR so crawlers and social previews see them
if (vehicle.value) {
  const seoTitle = `${buildProductName(vehicle.value, locale.value, true)} - Tracciona`
  const seoDesc = description.value || t('site.description')
  const seoImage = vehicle.value.vehicle_images?.[0]?.url || ''
  const canonicalUrl = `https://tracciona.com/vehiculo/${vehicle.value.slug}`
  const productName = buildProductName(vehicle.value, locale.value, true)

  useSeoMeta({
    title: seoTitle,
    description: seoDesc,
    ogTitle: seoTitle,
    ogDescription: seoDesc,
    ogImage: seoImage,
    ogType: 'product',
    ogUrl: canonicalUrl,
    ogSiteName: 'Tracciona',
    twitterCard: 'summary_large_image',
    twitterTitle: seoTitle,
    twitterDescription: seoDesc,
    twitterImage: seoImage,
  })

  useHead({
    link: [{ rel: 'canonical', href: canonicalUrl }],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': ['Vehicle', 'Product'],
          name: productName,
          description: seoDesc,
          image: seoImage,
          brand: { '@type': 'Brand', name: vehicle.value.brand },
          model: vehicle.value.model,
          vehicleModelDate: vehicle.value.year?.toString(),
          numberOfAxles:
            (vehicle.value.attributes_json as Record<string, unknown>)?.ejes || undefined,
          fuelType:
            (vehicle.value.attributes_json as Record<string, unknown>)?.combustible || undefined,
          sku: vehicle.value.slug,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'EUR',
            price: vehicle.value.price || undefined,
            availability: 'https://schema.org/InStock',
            url: canonicalUrl,
            seller: { '@type': 'Organization', name: 'Tracciona' },
            itemCondition: 'https://schema.org/UsedCondition',
          },
          url: canonicalUrl,
          availableAtOrFrom: vehicle.value.location
            ? {
                '@type': 'Place',
                name: vehicle.value.location,
                address: {
                  '@type': 'PostalAddress',
                  addressCountry: vehicle.value.location_country || 'ES',
                  addressRegion: vehicle.value.location_region || undefined,
                },
              }
            : undefined,
        }),
      },
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Tracciona', item: 'https://tracciona.com' },
            { '@type': 'ListItem', position: 2, name: productName, item: canonicalUrl },
          ],
        }),
      },
    ],
  })
}
</script>

<style scoped>
/* ============================================
   BASE = MOBILE (360px) — stacked layout
   ============================================ */
.vehicle-page {
  max-width: 1024px;
  margin: 0 auto;
  padding: var(--spacing-4);
  padding-bottom: var(--spacing-16);
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

.skeleton-line.wide {
  width: 70%;
}
.skeleton-line.medium {
  width: 45%;
}
.skeleton-line.short {
  width: 25%;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
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

/* Sticky notification */
.vehicle-sticky-notification {
  display: block;
  width: 100%;
  margin-top: var(--spacing-3);
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: var(--color-white);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: var(--font-size-sm);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
}

.vehicle-sticky-notification:hover {
  filter: brightness(0.95);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
}

/* Info */
.vehicle-info {
  margin-top: var(--spacing-4);
}

/* ============================================
   ACTIONS ROW
   ============================================ */
.vehicle-actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: var(--spacing-4);
}

.vehicle-pdf-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--border-color-dark) !important;
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
  transition: all 0.2s ease;
}

.vehicle-pdf-btn:hover {
  border-color: var(--color-primary) !important;
  color: var(--color-primary);
}

.vehicle-contact-btns {
  display: flex;
  gap: 0.4rem;
  flex: 1;
  min-width: 0;
}

.contact-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  flex: 1;
  padding: 0.5rem 0.6rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: var(--font-size-xs);
  min-height: 44px;
  text-decoration: none;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.contact-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.contact-email {
  background: var(--color-primary);
  color: var(--color-white);
}

.contact-call {
  background: #334155;
  color: var(--color-white);
}

.contact-whatsapp {
  background: #25d366;
  color: var(--color-white);
}

.vehicle-icon-btns {
  display: flex;
  gap: 0.4rem;
}

.vehicle-icon-btn {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 50%;
  border: 2px solid var(--border-color-dark) !important;
  background: var(--bg-primary);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.vehicle-icon-btn:hover {
  border-color: var(--color-primary) !important;
  color: var(--color-primary);
  transform: scale(1.05);
}

.favorite-btn.active {
  border-color: #f39c12;
  background: rgba(243, 156, 18, 0.1);
  color: #f39c12;
}

.share-btn:hover {
  border-color: var(--color-primary);
  background: rgba(35, 66, 74, 0.05);
}

.report-btn:hover {
  border-color: #ef4444 !important;
  color: #ef4444;
}

/* Seller Info (DSA) */
.vehicle-seller-info {
  background: var(--bg-secondary, #f8fafc);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: var(--spacing-4);
  border-left: 3px solid var(--color-primary, #23424a);
}

.vehicle-seller-info h3 {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-auxiliary, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 8px 0;
}

.seller-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.seller-item {
  font-size: 0.875rem;
  color: var(--text-secondary, #475569);
}

/* Mobile base: contact btns on a separate row */
.vehicle-actions-row {
  flex-wrap: wrap;
}

.vehicle-pdf-btn {
  order: 1;
  flex-shrink: 0;
}

.vehicle-pdf-btn span {
  display: none;
}

.vehicle-icon-btns {
  order: 2;
  margin-left: auto;
}

.vehicle-contact-btns {
  order: 3;
  flex-basis: 100%;
}

.contact-btn {
  padding: 0.5rem 0.4rem;
  font-size: 0.875rem;
  gap: 0.25rem;
}

@media (min-width: 480px) {
  .vehicle-actions-row {
    flex-wrap: nowrap;
  }

  .vehicle-pdf-btn {
    order: unset;
    flex-shrink: unset;
  }

  .vehicle-pdf-btn span {
    display: inline;
  }

  .vehicle-icon-btns {
    order: unset;
    margin-left: 0;
  }

  .vehicle-contact-btns {
    order: unset;
    flex-basis: auto;
  }

  .contact-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    gap: 0.4rem;
  }
}

/* ============================================
   TITLE + PRICE ROW
   ============================================ */
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

/* ============================================
   META ROW: badges
   ============================================ */
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

/* ============================================
   DISCLAIMER (terceros)
   ============================================ */
.vehicle-disclaimer {
  background: rgba(231, 76, 60, 0.1);
  color: #c0392b;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: var(--font-size-sm);
  border-left: 4px solid #c0392b;
  margin-bottom: var(--spacing-4);
}

/* ============================================
   CHARACTERISTICS GRID
   ============================================ */
.vehicle-characteristics {
  margin-bottom: var(--spacing-6);
}

.vehicle-characteristics h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.vehicle-char-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.vehicle-char-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: #f3f4f6;
  border-radius: 8px;
}

.vehicle-char-label {
  font-size: 0.7rem;
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.vehicle-char-value {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  font-weight: 700;
}

/* ============================================
   DESCRIPTION
   ============================================ */
.vehicle-description {
  margin-bottom: var(--spacing-6);
}

.vehicle-description h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.vehicle-description p {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  white-space: pre-line;
}

/* ============================================
   TABLET (>=480px)
   ============================================ */
@media (min-width: 480px) {
  .vehicle-char-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .vehicle-title {
    font-size: var(--font-size-2xl);
  }
}

/* ============================================
   TABLET (>=768px)
   ============================================ */
@media (min-width: 768px) {
  .vehicle-title {
    font-size: var(--font-size-2xl);
  }

  .vehicle-title-price-row {
    flex-wrap: nowrap;
  }

  .contact-btn {
    font-size: var(--font-size-sm);
    padding: 0.5rem 0.75rem;
  }
}

/* ============================================
   DESKTOP (>=1024px) — side-by-side, single screen
   ============================================ */
@media (min-width: 1024px) {
  .vehicle-page {
    max-width: 1400px;
    height: calc(100vh - 60px);
    display: flex;
    flex-direction: column;
    padding: var(--spacing-4) var(--spacing-6);
    padding-bottom: var(--spacing-4);
    overflow: hidden;
  }

  .vehicle-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-6);
    flex: 1;
    min-height: 0;
  }

  .vehicle-gallery-wrapper {
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .vehicle-gallery-wrapper :deep(.gallery) {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .vehicle-gallery-wrapper :deep(.gallery-main) {
    aspect-ratio: unset;
    flex: 1;
    min-height: 0;
  }

  .vehicle-gallery-wrapper :deep(.gallery-thumbs) {
    flex-shrink: 0;
  }

  .vehicle-sticky-notification {
    flex-shrink: 0;
  }

  /* Info scrolls internally */
  .vehicle-info {
    margin-top: 0;
    overflow-y: auto;
    padding-right: var(--spacing-2);
  }

  .vehicle-char-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  /* Compact spacing */
  .vehicle-characteristics {
    margin-bottom: var(--spacing-4);
  }

  .vehicle-description {
    margin-bottom: var(--spacing-4);
  }
}

/* Compare button */
.compare-btn.active {
  border-color: var(--color-primary) !important;
  background: rgba(35, 66, 74, 0.1);
  color: var(--color-primary);
}

/* Price history section */
.vehicle-price-history {
  margin-bottom: var(--spacing-6);
}

.vehicle-price-history h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Seller profile link */
.seller-profile-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-decoration: none;
  margin-top: var(--spacing-2);
  min-height: 44px;
  transition: color var(--transition-fast);
}

.seller-profile-link:hover {
  color: var(--color-primary-dark);
}
</style>
