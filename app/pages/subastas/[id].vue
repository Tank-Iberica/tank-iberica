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
      <div v-if="loading && !auction" class="auction-detail-loading">
        <div class="skeleton-hero" />
        <div class="skeleton-info">
          <div class="skeleton-line wide" />
          <div class="skeleton-line medium" />
          <div class="skeleton-line narrow" />
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error && !auction" class="auction-detail-error">
        <p>{{ error }}</p>
        <NuxtLink to="/subastas" class="btn-back">
          {{ $t('auction.backToList') }}
        </NuxtLink>
      </div>

      <!-- Auction content -->
      <template v-else-if="auction">
        <div class="auction-layout">
          <!-- Left column: vehicle info -->
          <div class="auction-main">
            <!-- Vehicle image -->
            <div class="vehicle-image-section">
              <div class="vehicle-image-wrapper">
                <img
                  v-if="primaryImage"
                  :src="primaryImage"
                  :alt="vehicleTitle"
                  class="vehicle-image"
                >
                <div v-else class="vehicle-image-placeholder">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                </div>
                <span :class="['detail-status-badge', `status-${auction.status}`]">
                  {{ getStatusLabel(auction.status) }}
                </span>
              </div>

              <!-- Image thumbnails -->
              <div v-if="vehicleImages.length > 1" class="image-thumbnails">
                <button
                  v-for="(img, idx) in vehicleImages"
                  :key="img.url"
                  :class="['thumb-btn', { active: selectedImageIdx === idx }]"
                  @click="selectedImageIdx = idx"
                >
                  <img :src="img.url" :alt="`${vehicleTitle} - ${idx + 1}`" loading="lazy" >
                </button>
              </div>
            </div>

            <!-- Vehicle info -->
            <div class="vehicle-info-section">
              <h1 class="vehicle-title">{{ vehicleTitle }}</h1>

              <div class="vehicle-meta">
                <span v-if="auction.vehicle?.year" class="vehicle-meta-item">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  {{ auction.vehicle.year }}
                </span>
                <span v-if="auction.vehicle?.location" class="vehicle-meta-item">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {{ auction.vehicle.location }}
                </span>
                <span v-if="auction.vehicle?.price" class="vehicle-meta-item">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  {{ $t('auction.refPrice') }}: {{ formatPrice(auction.vehicle.price) }}
                </span>
              </div>
            </div>

            <!-- Auction details section -->
            <div class="auction-details-section">
              <h2 class="section-heading">{{ $t('auction.detailsTitle') }}</h2>

              <!-- Description -->
              <p v-if="auction.description" class="auction-description">
                {{ auction.description }}
              </p>

              <!-- Key data grid -->
              <div class="details-grid">
                <div class="detail-item">
                  <span class="detail-label">{{ $t('auction.startPrice') }}</span>
                  <span class="detail-value">{{ formatCents(auction.start_price_cents) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">{{ $t('auction.bidIncrement') }}</span>
                  <span class="detail-value">{{ formatCents(auction.bid_increment_cents) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">{{ $t('auction.buyerPremium') }}</span>
                  <span class="detail-value">{{ auction.buyer_premium_pct }}%</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">{{ $t('auction.depositRequired') }}</span>
                  <span class="detail-value">{{ formatCents(auction.deposit_cents) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">{{ $t('auction.startDate') }}</span>
                  <span class="detail-value">{{ formatDate(auction.starts_at) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">{{ $t('auction.endDate') }}</span>
                  <span class="detail-value">{{ formatDate(auction.ends_at) }}</span>
                </div>
              </div>
            </div>

            <!-- Disclaimers section -->
            <div class="disclaimers-section">
              <h2 class="section-heading">{{ $t('auction.disclaimersTitle') }}</h2>
              <ul class="disclaimers-list">
                <li>{{ $t('auction.disclaimerAsIs') }}</li>
                <li>{{ $t('auction.disclaimerPremium') }}</li>
                <li>{{ $t('auction.disclaimerBinding') }}</li>
                <li>{{ $t('auction.disclaimerDeposit') }}</li>
                <li>{{ $t('auction.disclaimerInspection') }}</li>
              </ul>
            </div>
          </div>

          <!-- Right column: bid panel (sticky on desktop) -->
          <div class="auction-sidebar">
            <AuctionBidPanel
              v-if="auction"
              :auction="auction"
              :bids="bids"
              :can-bid="canBid"
              :is-registered="isRegistered"
              @place-bid="handlePlaceBid"
              @request-registration="handleRequestRegistration"
            />
          </div>
        </div>
      </template>

      <!-- Registration modal -->
      <Teleport to="body">
        <div v-if="showRegForm" class="reg-modal-backdrop" @click.self="showRegForm = false">
          <div class="reg-modal" role="dialog" :aria-label="$t('auction.registrationTitle')">
            <div class="reg-modal-header">
              <h2 class="reg-modal-title">{{ $t('auction.registrationTitle') }}</h2>
              <button
                class="reg-modal-close"
                :aria-label="$t('auction.close')"
                @click="showRegForm = false"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form class="reg-form" @submit.prevent="handleSubmitRegistration">
              <!-- ID type -->
              <div class="form-group">
                <label for="reg-id-type" class="form-label">{{ $t('auction.idType') }}</label>
                <select id="reg-id-type" v-model="regForm.id_type" class="form-select">
                  <option value="dni">DNI</option>
                  <option value="nie">NIE</option>
                  <option value="cif">CIF</option>
                  <option value="passport">{{ $t('auction.passport') }}</option>
                </select>
              </div>

              <!-- ID number -->
              <div class="form-group">
                <label for="reg-id-number" class="form-label">{{ $t('auction.idNumber') }}</label>
                <input
                  id="reg-id-number"
                  v-model="regForm.id_number"
                  type="text"
                  class="form-input"
                  :placeholder="$t('auction.idNumberPlaceholder')"
                  required
                >
              </div>

              <!-- ID document upload -->
              <div class="form-group">
                <label for="reg-id-doc" class="form-label">{{ $t('auction.idDocument') }}</label>
                <div class="file-upload-wrapper">
                  <input
                    id="reg-id-doc"
                    type="file"
                    accept="image/*,.pdf"
                    class="file-input"
                    @change="handleIdDocUpload"
                  >
                  <div class="file-upload-label">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span v-if="regForm.id_document_url">{{ $t('auction.documentUploaded') }}</span>
                    <span v-else>{{ $t('auction.uploadDocument') }}</span>
                  </div>
                </div>
              </div>

              <!-- Company name (shown only for CIF) -->
              <div v-if="regForm.id_type === 'cif'" class="form-group">
                <label for="reg-company" class="form-label">{{ $t('auction.companyName') }}</label>
                <input
                  id="reg-company"
                  v-model="regForm.company_name"
                  type="text"
                  class="form-input"
                  :placeholder="$t('auction.companyNamePlaceholder')"
                >
              </div>

              <!-- Transport license (optional) -->
              <div class="form-group">
                <label for="reg-transport-license" class="form-label">
                  {{ $t('auction.transportLicense') }}
                  <span class="form-optional">{{ $t('auction.optional') }}</span>
                </label>
                <div class="file-upload-wrapper">
                  <input
                    id="reg-transport-license"
                    type="file"
                    accept="image/*,.pdf"
                    class="file-input"
                    @change="handleTransportLicenseUpload"
                  >
                  <div class="file-upload-label">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span v-if="regForm.transport_license_url">{{
                      $t('auction.documentUploaded')
                    }}</span>
                    <span v-else>{{ $t('auction.uploadDocument') }}</span>
                  </div>
                </div>
              </div>

              <!-- Submit -->
              <button type="submit" class="btn-submit-reg" :disabled="!regForm.id_number.trim()">
                {{ $t('auction.submitRegistration') }}
              </button>

              <p class="reg-form-disclaimer">
                {{ $t('auction.registrationDisclaimer') }}
              </p>
            </form>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuction, type AuctionStatus } from '~/composables/useAuction'
import {
  useAuctionRegistration,
  type RegistrationFormData,
  type IdType,
} from '~/composables/useAuctionRegistration'
import { useCloudinaryUpload } from '~/composables/admin/useCloudinaryUpload'
import { formatPrice } from '~/composables/shared/useListingUtils'

definePageMeta({ layout: 'default' })

const route = useRoute()
const { t, locale } = useI18n()
const toast = useToast()
const auctionId = computed(() => route.params.id as string)

const {
  auction,
  bids,
  loading,
  error,
  fetchAuctionById,
  placeBid,
  subscribeToAuction,
  formatCents,
} = useAuction()

const { isRegistered, canBid, fetchRegistration, submitRegistration, initiateDeposit } =
  useAuctionRegistration(auctionId.value)

const { upload: uploadToCloudinary } = useCloudinaryUpload()

// Registration form
const showRegForm = ref(false)
const regForm = ref<RegistrationFormData>({
  id_type: 'dni' as IdType,
  id_number: '',
  id_document_url: null,
  company_name: null,
  transport_license_url: null,
})

// Image selection
const selectedImageIdx = ref(0)

const vehicleImages = computed(() => {
  const images = auction.value?.vehicle?.vehicle_images
  if (!images || images.length === 0) return []
  return [...images].sort((a, b) => a.position - b.position)
})

const primaryImage = computed(() => {
  return vehicleImages.value[selectedImageIdx.value]?.url ?? null
})

const vehicleTitle = computed(() => {
  if (auction.value?.title) return auction.value.title
  if (auction.value?.vehicle) return `${auction.value.vehicle.brand} ${auction.value.vehicle.model}`
  return t('auction.untitledAuction')
})

onMounted(async () => {
  await fetchAuctionById(auctionId.value)
  await fetchRegistration()
  if (auction.value) {
    subscribeToAuction(auctionId.value)
  }
})

async function handlePlaceBid(amountCents: number) {
  const ok = await placeBid(auctionId.value, amountCents)
  if (!ok) toast.error(error.value || t('toast.errorGeneric'))
}

function handleRequestRegistration() {
  showRegForm.value = true
}

async function handleIdDocUpload(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  const result = await uploadToCloudinary(input.files[0]!, {
    publicId: `auction-reg/${auctionId.value}/${Date.now()}`,
    tags: ['auction', 'registration'],
  })
  if (result) regForm.value.id_document_url = result.secure_url
}

async function handleTransportLicenseUpload(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  const result = await uploadToCloudinary(input.files[0]!, {
    publicId: `auction-reg/${auctionId.value}/transport-${Date.now()}`,
    tags: ['auction', 'registration', 'transport-license'],
  })
  if (result) regForm.value.transport_license_url = result.secure_url
}

async function handleSubmitRegistration() {
  if (!regForm.value.id_number.trim()) return
  const ok = await submitRegistration(regForm.value)
  if (ok) {
    showRegForm.value = false
    // Optionally initiate deposit
    const clientSecret = await initiateDeposit()
    if (clientSecret) {
      // In a real implementation, we'd open Stripe Elements here
      toast.success(t('toast.depositInitiated'))
    }
  }
}

function getStatusLabel(status: AuctionStatus): string {
  const map: Record<AuctionStatus, string> = {
    draft: t('auction.draft'),
    scheduled: t('auction.scheduled'),
    active: t('auction.live'),
    ended: t('auction.ended'),
    adjudicated: t('auction.adjudicated'),
    cancelled: t('auction.cancelled'),
    no_sale: t('auction.noSaleTitle'),
  }
  return map[status] || status
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// SEO with Event structured data
const currentPath = computed(() => route.fullPath)

const auctionTitle = computed(() => {
  if (!auction.value) return t('auction.pageTitle')
  return (
    auction.value.title ||
    `${auction.value.vehicle?.brand || ''} ${auction.value.vehicle?.model || ''}`.trim()
  )
})

const seoTitle = computed(() => {
  if (!auction.value) return t('auction.seoTitle')
  return t('auction.seoDetailTitle', { title: auctionTitle.value })
})

const seoDescription = computed(() => {
  if (!auction.value) return t('auction.seoDescription')
  return t('auction.seoDetailDescription', {
    title: auctionTitle.value,
    startDate: formatDate(auction.value.starts_at),
    price: formatCents(auction.value.start_price_cents),
  })
})

// Generate Event JSON-LD for the auction
const eventJsonLd = computed(() => {
  if (!auction.value) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${t('auction.pageTitle')}: ${auctionTitle.value}`,
    description: auction.value.description || seoDescription.value,
    startDate: auction.value.starts_at,
    endDate: auction.value.extended_until || auction.value.ends_at,
    eventStatus:
      auction.value.status === 'active'
        ? 'https://schema.org/EventScheduled'
        : auction.value.status === 'ended'
          ? 'https://schema.org/EventCompleted'
          : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url: `https://tracciona.com/subastas/${auction.value.id}`,
    },
    organizer: {
      '@type': 'Organization',
      name: 'Tracciona',
      url: 'https://tracciona.com',
    },
    offers: {
      '@type': 'Offer',
      price: (auction.value.start_price_cents / 100).toString(),
      priceCurrency: 'EUR',
      availability:
        auction.value.status === 'active'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  }
})

usePageSeo({
  title: seoTitle.value,
  description: seoDescription.value,
  path: currentPath.value,
  image: primaryImage.value || undefined,
  jsonLd: eventJsonLd.value || undefined,
})
</script>

<style scoped>
/* =============================================
   Auction Detail Page — Mobile-first (360px)
   ============================================= */

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

/* ---- Loading ---- */
.auction-detail-loading {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.skeleton-hero {
  width: 100%;
  aspect-ratio: 16 / 10;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.skeleton-line {
  height: 16px;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-line.wide {
  width: 80%;
}
.skeleton-line.medium {
  width: 55%;
}
.skeleton-line.narrow {
  width: 35%;
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* ---- Error ---- */
.auction-detail-error {
  text-align: center;
  padding: var(--spacing-12) 0;
  color: var(--color-error);
}

.auction-detail-error p {
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-4);
}

.btn-back {
  display: inline-block;
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  text-decoration: none;
  min-height: 44px;
  line-height: 44px;
  transition: background var(--transition-fast);
}

.btn-back:hover {
  background: var(--color-primary-dark);
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

/* ---- Vehicle image section ---- */
.vehicle-image-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.vehicle-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.vehicle-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vehicle-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-disabled);
}

.detail-status-badge {
  position: absolute;
  top: var(--spacing-3);
  left: var(--spacing-3);
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.detail-status-badge.status-active {
  background: var(--color-success);
  color: var(--color-white);
}

.detail-status-badge.status-scheduled {
  background: var(--color-info);
  color: var(--color-white);
}

.detail-status-badge.status-ended {
  background: var(--color-gray-500);
  color: var(--color-white);
}

.detail-status-badge.status-adjudicated {
  background: var(--color-gold);
  color: var(--color-white);
}

.detail-status-badge.status-no_sale {
  background: var(--color-error);
  color: var(--color-white);
}

.detail-status-badge.status-cancelled {
  background: var(--color-gray-400);
  color: var(--color-white);
}

/* Thumbnails */
.image-thumbnails {
  display: flex;
  gap: var(--spacing-2);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: var(--spacing-1);
}

.thumb-btn {
  flex-shrink: 0;
  width: 64px;
  height: 48px;
  min-width: 64px;
  min-height: 48px;
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  border: 2px solid transparent;
  padding: 0;
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    opacity var(--transition-fast);
  opacity: 0.7;
}

.thumb-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-btn.active,
.thumb-btn:hover {
  border-color: var(--color-primary);
  opacity: 1;
}

/* ---- Vehicle info ---- */
.vehicle-info-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.vehicle-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
}

.vehicle-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-4);
}

.vehicle-meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.vehicle-meta-item svg {
  flex-shrink: 0;
  color: var(--text-auxiliary);
}

/* ---- Auction details section ---- */
.auction-details-section {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
}

.section-heading {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-4);
}

.auction-description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-4);
  white-space: pre-line;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-3);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
}

.detail-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.detail-value {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
}

/* ---- Disclaimers ---- */
.disclaimers-section {
  background: var(--color-gray-50);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
}

.disclaimers-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.disclaimers-list li {
  position: relative;
  padding-left: var(--spacing-5);
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  line-height: var(--line-height-relaxed);
}

.disclaimers-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  width: 6px;
  height: 6px;
  border-radius: var(--border-radius-full);
  background: var(--color-warning);
}

/* ---- Sidebar (bid panel) ---- */
.auction-sidebar {
  width: 100%;
}

/* ---- Registration modal ---- */
.reg-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--z-modal-backdrop);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
}

.reg-modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: var(--spacing-6) var(--spacing-4) var(--spacing-8);
  z-index: var(--z-modal);
  animation: modal-slide-up 0.3s ease;
}

@keyframes modal-slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.reg-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-6);
}

.reg-modal-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.reg-modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--border-radius-full);
  color: var(--text-auxiliary);
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
}

.reg-modal-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

/* ---- Registration form ---- */
.reg-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.form-optional {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  font-weight: var(--font-weight-normal);
}

.form-input {
  width: 100%;
  min-height: 48px;
  padding: var(--spacing-3) var(--spacing-4);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background: var(--bg-primary);
  transition: border-color var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-select {
  width: 100%;
  min-height: 48px;
  padding: var(--spacing-3) var(--spacing-4);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background: var(--bg-primary);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 40px;
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* File upload */
.file-upload-wrapper {
  position: relative;
}

.file-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
  min-height: 48px;
}

.file-upload-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  min-height: 48px;
  padding: var(--spacing-3) var(--spacing-4);
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-secondary);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast);
}

.file-upload-wrapper:hover .file-upload-label {
  border-color: var(--color-primary);
  background: rgba(35, 66, 74, 0.04);
}

/* Submit button */
.btn-submit-reg {
  width: 100%;
  min-height: 52px;
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast);
  margin-top: var(--spacing-2);
}

.btn-submit-reg:hover:not(:disabled) {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.btn-submit-reg:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-submit-reg:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reg-form-disclaimer {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  line-height: var(--line-height-relaxed);
  text-align: center;
}

/* =============================================
   Breakpoint: 480px (large mobile / landscape)
   ============================================= */
@media (min-width: 480px) {
  .vehicle-title {
    font-size: var(--font-size-2xl);
  }

  .details-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .thumb-btn {
    width: 80px;
    height: 56px;
    min-width: 80px;
    min-height: 56px;
  }
}

/* =============================================
   Breakpoint: 768px (tablet — 2-column layout)
   ============================================= */
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

  .vehicle-title {
    font-size: var(--font-size-2xl);
  }

  .auction-details-section {
    padding: var(--spacing-6);
  }

  .disclaimers-section {
    padding: var(--spacing-6);
  }

  .details-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Modal becomes centered on tablet+ */
  .reg-modal-backdrop {
    align-items: center;
    padding: var(--spacing-4);
  }

  .reg-modal {
    border-radius: var(--border-radius-lg);
    max-width: 520px;
    padding: var(--spacing-8) var(--spacing-6);
    animation: modal-fade-in 0.3s ease;
  }

  @keyframes modal-fade-in {
    from {
      transform: scale(0.95);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
}

/* =============================================
   Breakpoint: 1024px (desktop)
   ============================================= */
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

  .vehicle-title {
    font-size: var(--font-size-3xl);
  }

  .details-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .disclaimers-list li {
    font-size: var(--font-size-sm);
  }
}

/* =============================================
   Breakpoint: 1280px (large desktop)
   ============================================= */
@media (min-width: 1280px) {
  .auction-sidebar {
    width: 420px;
  }
}
</style>
