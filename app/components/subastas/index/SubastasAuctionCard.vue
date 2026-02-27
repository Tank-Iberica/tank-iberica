<template>
  <NuxtLink :to="`/subastas/${auction.id}`" class="auction-card">
    <!-- Card image -->
    <div class="auction-card-image">
      <img v-if="firstImage" :src="firstImage" :alt="vehicleTitle" loading="lazy" >
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
      <span :class="['status-badge', `status-${auction.status}`]">
        {{ statusLabel }}
      </span>
    </div>

    <!-- Card body -->
    <div class="auction-card-body">
      <h2 class="auction-card-title">{{ vehicleTitle }}</h2>

      <div v-if="auction.vehicle?.year || auction.vehicle?.location" class="auction-card-meta">
        <span v-if="auction.vehicle?.year" class="meta-item">{{ auction.vehicle.year }}</span>
        <span v-if="auction.vehicle?.location" class="meta-item">{{
          auction.vehicle.location
        }}</span>
      </div>

      <!-- Price / bid info -->
      <div class="auction-card-price">
        <template v-if="auction.status === 'active' && auction.current_bid_cents > 0">
          <span class="price-label">{{ $t('auction.currentBid') }}</span>
          <span class="price-value">{{ formatCents(auction.current_bid_cents) }}</span>
        </template>
        <template v-else-if="auction.status === 'active'">
          <span class="price-label">{{ $t('auction.startPrice') }}</span>
          <span class="price-value">{{ formatCents(auction.start_price_cents) }}</span>
        </template>
        <template v-else-if="auction.status === 'scheduled'">
          <span class="price-label">{{ $t('auction.startPrice') }}</span>
          <span class="price-value">{{ formatCents(auction.start_price_cents) }}</span>
        </template>
        <template v-else-if="auction.winning_bid_cents">
          <span class="price-label">{{ $t('auction.finalPrice') }}</span>
          <span class="price-value ended">{{ formatCents(auction.winning_bid_cents) }}</span>
        </template>
        <template v-else-if="auction.current_bid_cents > 0">
          <span class="price-label">{{ $t('auction.finalPrice') }}</span>
          <span class="price-value ended">{{ formatCents(auction.current_bid_cents) }}</span>
        </template>
        <template v-else>
          <span class="price-label">{{ $t('auction.startPrice') }}</span>
          <span class="price-value ended">{{ formatCents(auction.start_price_cents) }}</span>
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
          {{ countdown }}
        </span>
        <span class="card-bids"> {{ auction.bid_count || 0 }} {{ $t('auction.bidsCount') }} </span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Auction } from '~/composables/useAuction'
import { formatCents } from '~/composables/useAuction'

defineProps<{
  auction: Auction
  firstImage: string | null
  vehicleTitle: string
  statusLabel: string
  countdown: string
}>()
</script>

<style scoped>
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

/* Breakpoint: 480px (large mobile / landscape) */
@media (min-width: 480px) {
  .auction-card-title {
    font-size: var(--font-size-base);
  }

  .price-value {
    font-size: var(--font-size-lg);
  }
}

/* Breakpoint: 768px (tablet) */
@media (min-width: 768px) {
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

/* Breakpoint: 1024px (desktop) */
@media (min-width: 1024px) {
  .auction-card-title {
    font-size: var(--font-size-lg);
  }

  .price-value {
    font-size: var(--font-size-xl);
  }
}
</style>
