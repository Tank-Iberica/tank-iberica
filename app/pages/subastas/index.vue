<template>
  <div class="auctions-page">
    <div class="auctions-container">
      <h1 class="auctions-title">{{ $t('auction.pageTitle') }}</h1>

      <!-- Tab buttons -->
      <div class="auctions-tabs">
        <button :class="['tab-btn', { active: activeTab === 'live' }]" @click="activeTab = 'live'">
          {{ $t('auction.tabLive') }}
          <span v-if="!loading" class="tab-badge">{{ auctions.length }}</span>
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'scheduled' }]"
          @click="activeTab = 'scheduled'"
        >
          {{ $t('auction.tabScheduled') }}
          <span v-if="!loading" class="tab-badge">{{ auctions.length }}</span>
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'ended' }]"
          @click="activeTab = 'ended'"
        >
          {{ $t('auction.tabEnded') }}
          <span v-if="!loading" class="tab-badge">{{ auctions.length }}</span>
        </button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="auctions-loading">
        <div v-for="i in 6" :key="i" class="skeleton-card">
          <div class="skeleton-img" />
          <div class="skeleton-body">
            <div class="skeleton-line wide" />
            <div class="skeleton-line medium" />
            <div class="skeleton-line narrow" />
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="auctions-error">
        <p>{{ error }}</p>
        <button class="btn-retry" @click="loadTab">
          {{ $t('auction.retry') }}
        </button>
      </div>

      <!-- Empty state -->
      <div v-else-if="auctions.length === 0" class="auctions-empty">
        <div class="empty-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="M12 8v4l3 3" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <p class="empty-title">{{ emptyMessage }}</p>
        <p class="empty-subtitle">{{ $t('auction.emptySubtitle') }}</p>
      </div>

      <!-- Auction grid -->
      <div v-else class="auctions-grid">
        <NuxtLink
          v-for="item in auctions"
          :key="item.id"
          :to="`/subastas/${item.id}`"
          class="auction-card"
        >
          <!-- Card image -->
          <div class="auction-card-image">
            <img
              v-if="getFirstImage(item)"
              :src="getFirstImage(item)"
              :alt="getVehicleTitle(item)"
              loading="lazy"
            >
            <div v-else class="auction-card-placeholder">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
            <span :class="['status-badge', `status-${item.status}`]">
              {{ getStatusLabel(item.status) }}
            </span>
          </div>

          <!-- Card body -->
          <div class="auction-card-body">
            <h2 class="auction-card-title">{{ getVehicleTitle(item) }}</h2>

            <div v-if="item.vehicle?.year || item.vehicle?.location" class="auction-card-meta">
              <span v-if="item.vehicle?.year" class="meta-item">{{ item.vehicle.year }}</span>
              <span v-if="item.vehicle?.location" class="meta-item">{{
                item.vehicle.location
              }}</span>
            </div>

            <!-- Price / bid info -->
            <div class="auction-card-price">
              <template v-if="item.status === 'active' && item.current_bid_cents > 0">
                <span class="price-label">{{ $t('auction.currentBid') }}</span>
                <span class="price-value">{{ formatCents(item.current_bid_cents) }}</span>
              </template>
              <template v-else-if="item.status === 'active'">
                <span class="price-label">{{ $t('auction.startPrice') }}</span>
                <span class="price-value">{{ formatCents(item.start_price_cents) }}</span>
              </template>
              <template v-else-if="item.status === 'scheduled'">
                <span class="price-label">{{ $t('auction.startPrice') }}</span>
                <span class="price-value">{{ formatCents(item.start_price_cents) }}</span>
              </template>
              <template v-else-if="item.winning_bid_cents">
                <span class="price-label">{{ $t('auction.finalPrice') }}</span>
                <span class="price-value ended">{{ formatCents(item.winning_bid_cents) }}</span>
              </template>
              <template v-else-if="item.current_bid_cents > 0">
                <span class="price-label">{{ $t('auction.finalPrice') }}</span>
                <span class="price-value ended">{{ formatCents(item.current_bid_cents) }}</span>
              </template>
              <template v-else>
                <span class="price-label">{{ $t('auction.startPrice') }}</span>
                <span class="price-value ended">{{ formatCents(item.start_price_cents) }}</span>
              </template>
            </div>

            <!-- Footer: countdown + bids -->
            <div class="auction-card-footer">
              <span class="card-countdown">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                {{ getCardCountdown(item) }}
              </span>
              <span class="card-bids">
                {{ item.bid_count || 0 }} {{ $t('auction.bidsCount') }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuction, type AuctionStatus, type Auction } from '~/composables/useAuction'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const { auctions, loading, error, fetchAuctions, formatCents } = useAuction()

const activeTab = ref<'live' | 'scheduled' | 'ended'>('live')

const statusMap: Record<string, AuctionStatus[]> = {
  live: ['active'],
  scheduled: ['scheduled'],
  ended: ['ended', 'adjudicated', 'no_sale'],
}

async function loadTab() {
  await fetchAuctions({ status: statusMap[activeTab.value] })
}

watch(activeTab, loadTab)
onMounted(loadTab)

// Countdown timer
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// Helpers

function getFirstImage(item: Auction): string | null {
  const images = item.vehicle?.vehicle_images
  if (!images || images.length === 0) return null
  const sorted = [...images].sort((a, b) => a.position - b.position)
  return sorted[0]?.url ?? null
}

function getVehicleTitle(item: Auction): string {
  if (item.title) return item.title
  if (item.vehicle) return `${item.vehicle.brand} ${item.vehicle.model}`
  return t('auction.untitledAuction')
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

function getCardCountdown(item: Auction): string {
  let target: number

  if (item.status === 'scheduled') {
    target = new Date(item.starts_at).getTime()
  } else if (item.status === 'active') {
    target = new Date(item.extended_until || item.ends_at).getTime()
  } else {
    // Ended states
    return t('auction.ended')
  }

  const diff = Math.max(0, target - now.value)
  if (diff === 0 && item.status === 'active') return t('auction.ending')

  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, '0')}h`
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const emptyMessage = computed(() => {
  const map: Record<string, string> = {
    live: t('auction.emptyLive'),
    scheduled: t('auction.emptyScheduled'),
    ended: t('auction.emptyEnded'),
  }
  return map[activeTab.value]
})

// SEO with structured data
const route = useRoute()
const currentPath = computed(() => route.fullPath)

// Generate ItemList JSON-LD for active auctions
const itemListJsonLd = computed(() => {
  if (!auctions.value || auctions.value.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('auction.seoTitle'),
    description: t('auction.seoDescription'),
    numberOfItems: auctions.value.length,
    itemListElement: auctions.value.map((auction, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: auction.title || `${auction.vehicle?.brand} ${auction.vehicle?.model}`,
        url: `https://tracciona.com/subastas/${auction.id}`,
        offers: {
          '@type': 'Offer',
          price:
            auction.current_bid_cents > 0
              ? (auction.current_bid_cents / 100).toString()
              : (auction.start_price_cents / 100).toString(),
          priceCurrency: 'EUR',
          availability:
            auction.status === 'active'
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
        },
      },
    })),
  }
})

usePageSeo({
  title: t('auction.seoTitle'),
  description: t('auction.seoDescription'),
  path: currentPath.value,
  jsonLd: itemListJsonLd.value || undefined,
})
</script>

<style scoped>
/* =============================================
   Auctions Listing Page — Mobile-first (360px)
   ============================================= */

.auctions-page {
  min-height: 60vh;
  padding: var(--spacing-6) 0 var(--spacing-12);
}

.auctions-container {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

.auctions-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-4);
}

/* ---- Tabs ---- */
.auctions-tabs {
  display: flex;
  gap: var(--spacing-2);
  overflow-x: auto;
  padding-bottom: var(--spacing-2);
  margin-bottom: var(--spacing-6);
  -webkit-overflow-scrolling: touch;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-full);
  background: var(--bg-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  white-space: nowrap;
  min-height: 44px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tab-btn.active {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 var(--spacing-1);
  border-radius: var(--border-radius-full);
  background: rgba(0, 0, 0, 0.1);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: 1;
}

.tab-btn.active .tab-badge {
  background: rgba(255, 255, 255, 0.25);
  color: var(--color-white);
}

/* ---- Loading skeleton ---- */
.auctions-loading {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-4);
}

.skeleton-card {
  border-radius: var(--border-radius-md);
  overflow: hidden;
  background: var(--bg-primary);
  box-shadow: var(--shadow-sm);
}

.skeleton-img {
  aspect-ratio: 4 / 3;
  background: var(--bg-secondary);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-body {
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.skeleton-line {
  height: 14px;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-line.wide {
  width: 85%;
}
.skeleton-line.medium {
  width: 60%;
}
.skeleton-line.narrow {
  width: 40%;
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
.auctions-error {
  text-align: center;
  padding: var(--spacing-12) 0;
  color: var(--color-error);
}

.auctions-error p {
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-4);
}

.btn-retry {
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  min-height: 44px;
  transition: background var(--transition-fast);
}

.btn-retry:hover {
  background: var(--color-primary-dark);
}

/* ---- Empty state ---- */
.auctions-empty {
  text-align: center;
  padding: var(--spacing-16) var(--spacing-4);
}

.empty-icon {
  color: var(--text-disabled);
  margin-bottom: var(--spacing-4);
}

.empty-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.empty-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

/* ---- Auction grid ---- */
.auctions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-4);
}

/* ---- Auction card ---- */
.auction-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  text-decoration: none;
  color: inherit;
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
}

.auction-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.auction-card:active {
  transform: scale(0.98);
}

/* Card image */
.auction-card-image {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--bg-secondary);
  overflow: hidden;
}

.auction-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.auction-card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-disabled);
}

/* Status badge */
.status-badge {
  position: absolute;
  top: var(--spacing-2);
  left: var(--spacing-2);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--border-radius-sm);
  font-size: 0.65rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1;
}

.status-badge.status-active {
  background: var(--color-success);
  color: var(--color-white);
}

.status-badge.status-scheduled {
  background: var(--color-info);
  color: var(--color-white);
}

.status-badge.status-ended {
  background: var(--color-gray-500);
  color: var(--color-white);
}

.status-badge.status-adjudicated {
  background: var(--color-gold);
  color: var(--color-white);
}

.status-badge.status-no_sale {
  background: var(--color-error);
  color: var(--color-white);
}

.status-badge.status-cancelled {
  background: var(--color-gray-400);
  color: var(--color-white);
}

/* Card body */
.auction-card-body {
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  flex: 1;
}

.auction-card-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.auction-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.meta-item {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

.meta-item + .meta-item::before {
  content: '\00b7';
  margin-right: var(--spacing-2);
}

/* Price section */
.auction-card-price {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.price-label {
  font-size: 0.65rem;
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: var(--font-weight-medium);
}

.price-value {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  line-height: var(--line-height-tight);
}

.price-value.ended {
  color: var(--text-secondary);
}

/* Card footer */
.auction-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--border-color-light);
}

.card-countdown {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.card-countdown svg {
  flex-shrink: 0;
}

.card-bids {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  font-weight: var(--font-weight-medium);
}

/* =============================================
   Breakpoint: 480px (large mobile / landscape)
   ============================================= */
@media (min-width: 480px) {
  .auctions-title {
    font-size: var(--font-size-3xl);
  }

  .auction-card-title {
    font-size: var(--font-size-base);
  }

  .price-value {
    font-size: var(--font-size-lg);
  }
}

/* =============================================
   Breakpoint: 768px (tablet)
   ============================================= */
@media (min-width: 768px) {
  .auctions-container {
    padding: 0 var(--spacing-6);
  }

  .auctions-grid,
  .auctions-loading {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-5);
  }

  .auction-card-body {
    padding: var(--spacing-4);
  }

  .auction-card-title {
    font-size: var(--font-size-base);
  }

  .status-badge {
    font-size: var(--font-size-xs);
    padding: var(--spacing-1) var(--spacing-3);
  }
}

/* =============================================
   Breakpoint: 1024px (desktop)
   ============================================= */
@media (min-width: 1024px) {
  .auctions-container {
    padding: 0 var(--spacing-8);
  }

  .auctions-grid,
  .auctions-loading {
    gap: var(--spacing-6);
  }

  .auction-card-title {
    font-size: var(--font-size-lg);
  }

  .price-value {
    font-size: var(--font-size-xl);
  }
}

/* =============================================
   Breakpoint: 1280px (large desktop)
   ============================================= */
@media (min-width: 1280px) {
  .auctions-grid,
  .auctions-loading {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
