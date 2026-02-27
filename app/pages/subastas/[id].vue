<template>
  <div class="auction-detail-page">
    <div class="auction-detail-container">
      <!-- Back link -->
      <NuxtLink to="/subastas" class="back-link">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        {{ $t('auction.backToList') }}
      </NuxtLink>

      <!-- Loading -->
      <SubastasDetailSkeleton v-if="loading && !auction" />

      <!-- Error -->
      <SubastasDetailError v-else-if="error && !auction" :error-message="error" />

      <!-- Auction content -->
      <template v-else-if="auction">
        <div class="auction-layout">
          <!-- Left column: vehicle info -->
          <div class="auction-main">
            <SubastasDetailImageGallery
              :images="vehicleImages"
              :current-image="primaryImage"
              :selected-index="selectedImageIdx"
              :vehicle-title="vehicleTitle"
              :status="auction.status"
              :status-label="getStatusLabel(auction.status)"
              @select-image="selectImage"
            />

            <SubastasDetailVehicleInfo
              :title="vehicleTitle"
              :year="auction.vehicle?.year ?? null"
              :location="auction.vehicle?.location ?? null"
              :price="auction.vehicle?.price ?? null"
              :formatted-price="formatPrice(auction.vehicle?.price)"
            />

            <SubastasDetailInfo
              :description="auction.description"
              :start-price="formatCents(auction.start_price_cents)"
              :bid-increment="formatCents(auction.bid_increment_cents)"
              :buyer-premium-pct="auction.buyer_premium_pct"
              :deposit="formatCents(auction.deposit_cents)"
              :start-date="formatDate(auction.starts_at)"
              :end-date="formatDate(auction.ends_at)"
            />

            <SubastasDetailDisclaimers />
          </div>

          <!-- Right column: bid panel (sticky on desktop) -->
          <div class="auction-sidebar">
            <AuctionBidPanel
              :auction="auction"
              :bids="mutableBids"
              :can-bid="canBid"
              :is-registered="isRegistered"
              @place-bid="handlePlaceBid"
              @request-registration="handleRequestRegistration"
            />
          </div>
        </div>
      </template>

      <!-- Registration modal -->
      <SubastasRegistrationModal
        :visible="showRegForm"
        :id-document-url="regFormIdDocumentUrl"
        :transport-license-url="regFormTransportLicenseUrl"
        @close="closeRegForm"
        @submit="handleSubmitRegistration"
        @upload-id-doc="handleIdDocUpload"
        @upload-transport-license="handleTransportLicenseUpload"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuctionDetail } from '~/composables/useAuctionDetail'

definePageMeta({ layout: 'default' })

const route = useRoute()
const auctionId = computed(() => route.params.id as string)

const {
  auction,
  mutableBids,
  loading,
  error,
  showRegForm,
  regFormIdDocumentUrl,
  regFormTransportLicenseUrl,
  selectedImageIdx,
  isRegistered,
  canBid,
  vehicleImages,
  primaryImage,
  vehicleTitle,
  currentPath,
  seoTitle,
  seoDescription,
  eventJsonLd,
  handlePlaceBid,
  handleRequestRegistration,
  closeRegForm,
  handleIdDocUpload,
  handleTransportLicenseUpload,
  handleSubmitRegistration,
  selectImage,
  getStatusLabel,
  formatDate,
  formatCents,
  formatPrice,
  init,
} = useAuctionDetail(auctionId)

onMounted(() => {
  init()
})

// SEO with Event structured data
usePageSeo({
  title: seoTitle.value,
  description: seoDescription.value,
  path: currentPath.value,
  image: primaryImage.value || undefined,
  jsonLd: eventJsonLd.value || undefined,
})
</script>

<style scoped>
.auction-detail-page {
  min-height: 60vh;
  padding: var(--spacing-4) 0 var(--spacing-12);
}

.auction-detail-container {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

/* ---- Back link ---- */
.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) 0;
  margin-bottom: var(--spacing-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  text-decoration: none;
  min-height: 44px;
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--color-primary);
}

/* ---- Layout ---- */
.auction-layout {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.auction-main {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.auction-sidebar {
  width: 100%;
}

@media (min-width: 768px) {
  .auction-detail-container {
    padding: 0 var(--spacing-6);
  }

  .auction-layout {
    flex-direction: row;
    align-items: flex-start;
    gap: var(--spacing-6);
  }

  .auction-main {
    flex: 1;
    min-width: 0;
  }

  .auction-sidebar {
    position: sticky;
    top: calc(var(--header-height) + var(--spacing-4));
    width: 360px;
    flex-shrink: 0;
  }
}

@media (min-width: 1024px) {
  .auction-detail-container {
    padding: 0 var(--spacing-8);
  }

  .auction-layout {
    gap: var(--spacing-8);
  }

  .auction-sidebar {
    width: 400px;
  }
}

@media (min-width: 1280px) {
  .auction-sidebar {
    width: 420px;
  }
}
</style>
