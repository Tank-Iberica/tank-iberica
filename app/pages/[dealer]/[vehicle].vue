<template>
  <div class="dealer-vehicle-page">
    <!-- Dealer banner: branded header with logo + link back to dealer portal -->
    <NuxtLink :to="`/${dealerSlug}`" class="dealer-banner" :style="bannerStyle">
      <img v-if="dealer?.logo_url" :src="dealer.logo_url" :alt="companyName" class="dealer-logo" >
      <div class="dealer-banner-text">
        <span class="dealer-name">{{ companyName }}</span>
        <span class="dealer-back">{{ $t('dashboard.portal.viewAllVehicles') }}</span>
      </div>
    </NuxtLink>

    <!-- Vehicle content: same components as /vehiculo/[slug] -->
    <div class="vehicle-page" :style="cssVars">
      <VehicleDetailLoading v-if="loading" />

      <VehicleDetailNotFound v-else-if="!vehicle" />

      <template v-else>
        <UiBreadcrumbNav :items="breadcrumbItems" />

        <article class="vehicle-content">
          <div class="vehicle-gallery-wrapper">
            <VehicleImageGallery
              :images="vehicle.vehicle_images"
              :alt="buildProductName(vehicle, locale, true)"
            />
            <button class="vehicle-sticky-notification" @click="handleOpenDemand">
              {{ $t('vehicle.cantFind') }}
            </button>
          </div>

          <div class="vehicle-info">
            <VehicleDetailActions
              :vehicle-id="vehicle.id"
              :dealer-id="vehicleDetail?.dealer_id || ''"
              :seller-user-id="null"
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

        <VehicleRelatedVehicles :vehicle="vehicle" />

        <VehicleCategoryLinks
          :current-brand="vehicle.brand"
          :current-category-id="vehicle.category_id"
        />

        <ModalsReportModal
          :visible="showReport"
          entity-type="vehicle"
          :entity-id="vehicle.id"
          @close="showReport = false"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVehicleDetail } from '~/composables/useVehicleDetail'

definePageMeta({ layout: 'default' })

const route = useRoute()
const { locale } = useI18n()
const supabase = useSupabaseClient()

const dealerSlug = computed(() => route.params.dealer as string)
const vehicleSlug = computed(() => route.params.vehicle as string)

// 1. Fetch dealer by slug (SSR). Only active dealers.
const { data: dealer } = await useAsyncData(`dealer-portal-${dealerSlug.value}`, async () => {
  const { data } = await supabase
    .from('dealers')
    .select('id, slug, company_name, logo_url, theme, status')
    .eq('slug', dealerSlug.value)
    .eq('status', 'active')
    .single()
  return data
})

if (!dealer.value) {
  throw createError({ statusCode: 404, statusMessage: 'Dealer not found' })
}

// 2. Fetch vehicle detail with unique cache key to avoid collision with /vehiculo/[slug]
const {
  vehicle,
  vehicleDetail,
  loading,
  description,
  sellerInfo,
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
} = await useVehicleDetail(vehicleSlug, {
  cacheKey: `vehicle-dp-${dealerSlug.value}-${vehicleSlug.value}`,
})

// 3. Validate vehicle belongs to this dealer
if (vehicle.value && vehicleDetail.value?.dealer_id !== dealer.value.id) {
  throw createError({ statusCode: 404, statusMessage: 'Vehicle not found for this dealer' })
}

// Track ficha view on mount
onMounted(() => {
  if (vehicle.value) {
    trackFichaView(vehicle.value.id, vehicleDetail.value?.dealer_id || '')
  }
})

// 4. Dealer branding helpers
const companyName = computed(() => {
  const name = dealer.value?.company_name
  if (!name) return ''
  if (typeof name === 'string') return name
  const obj = name as Record<string, string>
  return obj[locale.value] || obj.es || obj.en || ''
})

const dealerTheme = computed(() => {
  const theme = dealer.value?.theme as Record<string, string> | null
  return {
    primary: theme?.primary || theme?.theme_primary || '#23424A',
    accent: theme?.accent || theme?.theme_accent || '#f59e0b',
  }
})

const bannerStyle = computed(() => ({ backgroundColor: dealerTheme.value.primary }))

const cssVars = computed(() => ({
  '--color-primary': dealerTheme.value.primary,
  '--color-accent': dealerTheme.value.accent,
}))

// 5. SEO: noindex on dealer context + canonical pointing to marketplace URL
if (vehicle.value) {
  const canonicalUrl = `https://tracciona.com/vehiculo/${vehicle.value.slug}`
  useHead({
    meta: [{ name: 'robots', content: 'noindex, follow' }],
    link: [{ rel: 'canonical', href: canonicalUrl }],
  })
}
</script>

<style scoped>
/* Dealer banner */
.dealer-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  text-decoration: none;
  transition: filter 0.15s ease;
  min-height: 56px;
}

.dealer-banner:hover {
  filter: brightness(0.92);
}

.dealer-logo {
  height: 36px;
  width: auto;
  max-width: 120px;
  object-fit: contain;
  flex-shrink: 0;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.15);
  padding: 2px 4px;
}

.dealer-banner-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dealer-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  line-height: 1.2;
}

.dealer-back {
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.2;
}

/* Vehicle page (identical structure to /vehiculo/[slug]) */
.vehicle-page {
  max-width: 1024px;
  margin: 0 auto;
  padding: var(--spacing-4);
  padding-bottom: var(--spacing-16);
}

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

.vehicle-info {
  margin-top: var(--spacing-4);
}

/* ============================================
   DESKTOP (>=1024px)
   ============================================ */
@media (min-width: 1024px) {
  .vehicle-page {
    max-width: 1400px;
    height: calc(100vh - 60px - 56px); /* subtract banner height */
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

  .vehicle-info {
    margin-top: 0;
    overflow-y: auto;
    padding-right: var(--spacing-2);
  }
}
</style>
