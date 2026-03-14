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
            :vehicle-slug="vehicle.slug"
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

          <!-- Early-access unlock banner -->
          <VehicleUnlockBanner
            v-if="earlyAccessVisibleFrom"
            :vehicle-id="vehicle.id"
            :visible-from="earlyAccessVisibleFrom!"
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

          <!-- Buyer trust alerts (#33) -->
          <DealerTrustAlert
            :dealer-verified="vehicleDealerData?.verified ?? null"
            :dealer-trust-score="vehicleDealerData?.trust_score ?? null"
            :dealer-created-at="vehicleDealerData?.created_at ?? null"
            :image-count="vehicle.vehicle_images?.length ?? 0"
            :price="vehicle.price"
          />

          <!-- #45 Price relative to market badge -->
          <div
            v-if="priceMarketLabel && priceMarketDeviation !== null"
            class="price-market-badge"
            :class="`price-market-badge--${priceMarketLabel}`"
          >
            <template v-if="priceMarketLabel === 'below'">
              {{ $t('vehicle.priceBelowMarket', { pct: Math.abs(priceMarketDeviation!) }) }}
            </template>
            <template v-else-if="priceMarketLabel === 'above'">
              {{ $t('vehicle.priceAboveMarket', { pct: priceMarketDeviation }) }}
            </template>
            <template v-else>
              {{ $t('vehicle.priceAtMarket') }}
            </template>
          </div>

          <VehicleDetailSeller
            id="main-form"
            :seller-info="sellerInfo"
            :dealer-id="vehicleDetail?.dealer_id || null"
            :dealer-slug="vehicleDetail?.dealer_slug || null"
            :is-terceros="vehicle.category === 'terceros'"
            :dealer-tier="dealerTrustTier"
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

          <VehiclePriceHistoryChart :vehicle-id="vehicle.id" />

          <VehicleVideo
            v-if="vehicle.video_url"
            :video-url="vehicle.video_url!"
          />

          <VehicleTransportCalculator
            :vehicle="{
              id: vehicle.id,
              location: vehicle.location,
              location_province: vehicle.location_province,
            }"
            :vehicle-price="vehicle.price ?? null"
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
import {
  buildVehicleSchema,
  buildBreadcrumbSchema,
  useJsonLd,
} from '~/composables/useStructuredData'
import { usePriceRelativeToMarket } from '~/composables/usePriceRelativeToMarket'
import { useScrollDepth } from '~/composables/useScrollDepth'
import { useUserLocation } from '~/composables/useUserLocation'

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
  dealerTrustTier,
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

// #44 — Scroll depth tracking (registers scroll listener on mount)
if (vehicle.value) {
  useScrollDepth(vehicle.value.id)
}

// #45 — Price relative to market badge
const priceMarket = usePriceRelativeToMarket()

// Computed helpers for price market badge in template
const priceMarketLabel = computed<'below' | 'above' | 'at' | null>(() => {
  const c = priceMarket.comparison.value
  if (!c?.hasData) return null
  if (c.deviationPercent < -5) return 'below'
  if (c.deviationPercent > 5) return 'above'
  return 'at'
})

const priceMarketDeviation = computed<number | null>(() => {
  const c = priceMarket.comparison.value
  if (!c?.hasData) return null
  return Math.round(Math.abs(c.deviationPercent))
})

// Computed to extract dealer join data (not on Vehicle type but may come from DB join)
const vehicleDealerData = computed<Record<string, unknown> | null>(() => {
  const v = vehicle.value as unknown as Record<string, unknown> | null
  if (!v?.dealers) return null
  return v.dealers as Record<string, unknown>
})

onMounted(() => {
  if (vehicle.value?.brand && vehicle.value?.model && vehicle.value?.price) {
    priceMarket.fetchComparison({
      brand: vehicle.value.brand,
      model: vehicle.value.model,
      year: vehicle.value.year ?? 0,
      price: vehicle.value.price,
    })
  }
})

// Early-access: show unlock banner if visible_from is in the future and not is_protected
const earlyAccessVisibleFrom = computed<string | null>(() => {
  const v = vehicle.value as unknown as Record<string, unknown>
  if (v?.is_protected) return null // protected vehicles are visible to everyone — no unlock needed
  const vf = v?.visible_from as string | null | undefined
  if (!vf) return null
  return new Date(vf) > new Date() ? vf : null
})

// Duration + funnel tracking
const { trackVehicleDuration, trackFunnelViewVehicle, trackBuyerGeo, trackVehicleComparison } =
  useAnalyticsTracking()
const pageStartedAt = ref(0)

// #38 — Buyer geo tracking (once per session)
const { location: buyerLocation, detect: detectLocation } = useUserLocation()
const GEO_TRACKED_KEY = 'analytics_geo_tracked'

// Track ficha view + funnel step + record start time on client-side mount
onMounted(() => {
  pageStartedAt.value = Date.now()
  if (vehicle.value) {
    trackFichaView(vehicle.value.id, vehicleDetail.value?.dealer_id || '')
    trackFunnelViewVehicle(vehicle.value.id, 'detail_page')
  }

  // #38 — Fire buyer_geo event once per session
  try {
    const alreadyTracked = sessionStorage.getItem(GEO_TRACKED_KEY)
    if (!alreadyTracked) {
      sessionStorage.setItem(GEO_TRACKED_KEY, '1')
      // Detect location then emit event (fire-and-forget)
      void detectLocation().then(() => {
        trackBuyerGeo(buyerLocation.value)
      })
    }
  } catch {
    // sessionStorage unavailable (private mode) — skip silently
  }

  // #40 — Track comparison: fire when user views 2+ similar vehicles in session.
  // "Similar" = same category. Stored as JSON in sessionStorage.
  if (vehicle.value) {
    const currentId = vehicle.value.id
    const currentCategory = vehicle.value.category ?? null
    try {
      const SESSION_VIEWS_KEY = 'analytics_session_views'
      type SessionView = { id: string; category: string | null }
      const raw = sessionStorage.getItem(SESSION_VIEWS_KEY)
      const sessionViews: SessionView[] = raw ? (JSON.parse(raw) as SessionView[]) : []

      if (currentCategory) {
        const similarIds = sessionViews
          .filter((v) => v.category === currentCategory && v.id !== currentId)
          .map((v) => v.id)

        if (similarIds.length > 0) {
          trackVehicleComparison([...similarIds, currentId])
        }
      }

      // Append current view (deduplicated by id)
      if (!sessionViews.some((v) => v.id === currentId)) {
        sessionViews.push({ id: currentId, category: currentCategory })
        sessionStorage.setItem(SESSION_VIEWS_KEY, JSON.stringify(sessionViews))
      }
    } catch {
      // sessionStorage unavailable — skip silently
    }
  }
})

// #39 — Track duration when leaving the page.
// Two exit paths: in-app navigation (onBeforeUnmount) + tab close/external nav (visibilitychange).
// Guard flag prevents double-tracking if both fire.
let _durationTracked = false

function _fireDurationOnce() {
  if (_durationTracked || !vehicle.value || pageStartedAt.value <= 0) return
  _durationTracked = true
  trackVehicleDuration(vehicle.value.id, pageStartedAt.value)
}

function _onVisibilityHidden() {
  if (document.visibilityState === 'hidden') _fireDurationOnce()
}

onMounted(() => {
  document.addEventListener('visibilitychange', _onVisibilityHidden)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', _onVisibilityHidden)
  _fireDurationOnce()
})

// SEO meta tags -- runs during SSR so crawlers and social previews see them
if (vehicle.value) {
  const seoTitle = `${buildProductName(vehicle.value, locale.value, true)} - ${t('site.title')}`
  const seoDesc = description.value || t('site.description')
  const seoImage = vehicle.value.vehicle_images?.[0]?.url || ''
  const siteUrl = useSiteUrl()
  const canonicalUrl = `${siteUrl}/vehiculo/${vehicle.value.slug}`
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
    ogSiteName: t('site.title'),
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
        href: `${siteUrl}/en/vehiculo/${vehicle.value.slug}`,
      },
      { rel: 'alternate', hreflang: 'x-default', href: canonicalUrl },
      ...(seoImage ? [{ rel: 'preload', as: 'image', href: seoImage, fetchpriority: 'high' }] : []),
    ],
  })

  const attrs = (vehicle.value.attributes_json || {}) as Record<string, unknown>

  useJsonLd([
    buildVehicleSchema({
      brand: vehicle.value.brand,
      model: vehicle.value.model,
      year: vehicle.value.year,
      price: vehicle.value.price,
      slug: vehicle.value.slug,
      description: seoDesc,
      image: seoImage,
      km: (attrs.km as number | null) ?? null,
      fuelType: (attrs.combustible as string | null) ?? null,
      location: vehicle.value.location,
      locationCountry: vehicle.value.location_country,
      locationRegion: vehicle.value.location_region,
      sellerName: t('site.title'),
    }),
    buildBreadcrumbSchema([
      { name: t('site.title'), url: siteUrl },
      { name: productName, url: canonicalUrl },
    ]),
  ])
}
</script>

<style scoped>
.vehicle-page {
  max-width: 64rem;
  margin: 0 auto;
  padding: var(--spacing-4);
  padding-bottom: var(--spacing-16);
}

/* Sticky notification */
.vehicle-sticky-notification {
  display: block;
  width: 100%;
  margin-top: var(--spacing-3);
  background: linear-gradient(135deg, #f39c12 0%, var(--color-orange-500) 100%);
  color: var(--color-white);
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: var(--font-size-sm);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 2.75rem;
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

/* #45 Price market badge */
.price-market-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-2);
}

.price-market-badge--below {
  background: var(--color-success-light, #d4edda);
  color: var(--color-success, #155724);
}

.price-market-badge--above {
  background: var(--color-warning-light, #fff3cd);
  color: var(--color-warning-dark, #856404);
}

.price-market-badge--at {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

/* ============================================
   DESKTOP (>=1024px) -- side-by-side layout
   ============================================ */
@media (min-width: 64em) {
  .vehicle-page {
    max-width: 87.5rem;
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
