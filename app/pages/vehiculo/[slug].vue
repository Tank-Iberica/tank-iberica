<template>
  <div class="vehicle-page">
    <!-- Loading -->
    <VehicleDetailLoading v-if="loading" />

    <!-- Not found -->
    <VehicleDetailNotFound v-else-if="!vehicle" />

    <!-- Vehicle detail -->
    <template v-else>
      <UiBreadcrumbNav :items="breadcrumbItems" />

      <article class="vehicle-content">
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
          <VehicleDetailActions
            :vehicle-id="vehicle.id"
            :dealer-id="vehicleDetail?.dealer_id || ''"
            :seller-user-id="sellerUserId"
            :email-subject="emailSubject"
            :email-body="emailBody"
            :share-text="shareText"
            :is-fav="isFav"
            :in-comparison="inComparison"
            @pdf="handlePdf"
            @favorite="handleFavorite"
            @share="handleShare"
            @report="showReport = true"
            @compare="handleCompare"
            @contact-click="trackContactClick"
            @start-chat="showChatModal = true"
          />

          <VehicleDetailHeader
            :vehicle-id="vehicle.id"
            :slug="vehicle.slug"
            :product-name="buildProductName(vehicle, locale, true)"
            :price-text="priceText"
            :featured="vehicle.featured"
            :rental-price="vehicle.rental_price"
            :price="vehicle.price"
            :category="vehicle.category"
            :vehicle-location="vehicleLocation"
            :vehicle-flag-code="vehicleFlagCode"
            :location-country="vehicle.location_country"
            :is-ai-generated="!!(vehicle as unknown as Record<string, unknown>).ai_generated"
          />

          <VehicleDetailSeller
            :seller-info="sellerInfo"
            :dealer-id="vehicleDetail?.dealer_id || null"
            :dealer-slug="vehicleDetail?.dealer_slug || null"
            :is-terceros="vehicle.category === 'terceros'"
          />

          <VehicleDetailSpecs
            v-if="hasSpecs"
            :attributes-json="vehicle.attributes_json"
            :locale="locale"
          />

          <VehicleDetailDescription
            :description="description"
            :vehicle-id="vehicle.id"
            :locale="locale"
            :is-ai-generated="!!(vehicle as unknown as Record<string, unknown>).ai_generated"
          />
        </div>
      </article>

      <!-- Related vehicles (internal linking) -->
      <VehicleRelatedVehicles :vehicle="vehicle" />

      <!-- Category navigation links (crawlability) -->
      <VehicleCategoryLinks
        :current-brand="vehicle.brand"
        :current-category-id="vehicle.category_id"
      />

      <!-- Report Modal (DSA compliance) -->
      <ModalsReportModal
        :visible="showReport"
        entity-type="vehicle"
        :entity-id="vehicle.id"
        @close="showReport = false"
      />

      <!-- Contact seller chat modal -->
      <VehicleContactSellerModal
        v-if="sellerUserId"
        :visible="showChatModal"
        :vehicle-id="vehicle.id"
        :vehicle-title="buildProductName(vehicle, locale, true)"
        :seller-user-id="sellerUserId"
        @close="showChatModal = false"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useVehicleDetail } from '~/composables/useVehicleDetail'
import { useAnalyticsTracking } from '~/composables/useAnalyticsTracking'

const route = useRoute()
const { locale, t } = useI18n()
const slug = computed(() => route.params.slug as string)

const {
  vehicle,
  vehicleDetail,
  loading,
  description,
  sellerInfo,
  sellerUserId,
  showReport,
  hasSpecs,
  vehicleLocation,
  vehicleFlagCode,
  priceText,
  isFav,
  inComparison,
  breadcrumbItems,
  shareText,
  emailSubject,
  emailBody,
  handleFavorite,
  handleShare,
  handlePdf,
  handleOpenDemand,
  handleCompare,
  trackFichaView,
  trackContactClick,
} = await useVehicleDetail(slug)

const showChatModal = ref(false)

// Duration tracking
const { trackVehicleDuration } = useAnalyticsTracking()
const pageStartedAt = ref(0)

// Track ficha view + record start time on client-side mount
onMounted(() => {
  pageStartedAt.value = Date.now()
  if (vehicle.value) {
    trackFichaView(vehicle.value.id, vehicleDetail.value?.dealer_id || '')
  }
})

// Track duration when leaving the page
onBeforeUnmount(() => {
  if (vehicle.value && pageStartedAt.value > 0) {
    trackVehicleDuration(vehicle.value.id, pageStartedAt.value)
  }
})

// SEO meta tags -- runs during SSR so crawlers and social previews see them
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
    ogType: 'product' as 'website',
    ogUrl: canonicalUrl,
    ogLocale: 'es_ES',
    ogLocaleAlternate: ['en_GB'],
    ogSiteName: 'Tracciona',
    twitterCard: 'summary_large_image',
    twitterTitle: seoTitle,
    twitterDescription: seoDesc,
    twitterImage: seoImage,
  })

  useHead({
    link: [
      { rel: 'canonical', href: canonicalUrl },
      { rel: 'alternate', hreflang: 'es', href: canonicalUrl },
      {
        rel: 'alternate',
        hreflang: 'en',
        href: `https://tracciona.com/en/vehiculo/${vehicle.value.slug}`,
      },
      { rel: 'alternate', hreflang: 'x-default', href: canonicalUrl },
    ],
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
.vehicle-page {
  max-width: 1024px;
  margin: 0 auto;
  padding: var(--spacing-4);
  padding-bottom: var(--spacing-16);
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
   DESKTOP (>=1024px) -- side-by-side layout
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
}
</style>
