<script setup lang="ts">
import type { Auction, AuctionBid } from '~/composables/useAuction'
import type { AuctionRegistration } from '~/composables/useAuctionRegistration'

const props = defineProps<{
  auction: Auction
  bids: AuctionBid[]
  registrations: AuctionRegistration[]
  formatCents: (cents: number | null) => string
  formatDate: (dateStr: string | null) => string
  getVehicleLabel: () => string
  getVehicleThumbnail: () => string | null
}>()

const { t } = useI18n()

const approvedCount = computed(
  () => props.registrations.filter((r) => r.status === 'approved').length,
)
</script>

<template>
  <section class="section">
    <h2 class="section-title">{{ t('admin.subastas.detail.info') }}</h2>
    <div class="info-grid">
      <!-- Vehicle card -->
      <div class="info-card vehicle-card">
        <div class="vehicle-thumb">
          <img
            v-if="getVehicleThumbnail()"
            :src="getVehicleThumbnail()!"
            :alt="getVehicleLabel()"
          >
          <span v-else class="thumb-placeholder">&#128247;</span>
        </div>
        <div class="vehicle-info">
          <strong>{{ getVehicleLabel() }}</strong>
          <span v-if="auction.vehicle?.location" class="text-muted">{{
            auction.vehicle.location
          }}</span>
          <span v-if="auction.vehicle?.price" class="vehicle-price">
            {{
              new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
              }).format(auction.vehicle.price)
            }}
          </span>
        </div>
      </div>

      <!-- Config -->
      <div class="info-card">
        <h3>{{ t('admin.subastas.detail.config') }}</h3>
        <dl class="info-dl">
          <div class="dl-row">
            <dt>{{ t('admin.subastas.detail.startPrice') }}</dt>
            <dd>{{ formatCents(auction.start_price_cents) }}</dd>
          </div>
          <div class="dl-row">
            <dt>{{ t('admin.subastas.detail.reservePrice') }}</dt>
            <dd>
              {{
                auction.reserve_price_cents
                  ? formatCents(auction.reserve_price_cents)
                  : t('admin.subastas.detail.noReserve')
              }}
            </dd>
          </div>
          <div class="dl-row">
            <dt>{{ t('admin.subastas.detail.currentBid') }}</dt>
            <dd>
              <strong>{{
                auction.current_bid_cents > 0 ? formatCents(auction.current_bid_cents) : '-'
              }}</strong>
            </dd>
          </div>
          <div class="dl-row">
            <dt>{{ t('admin.subastas.detail.bidIncrement') }}</dt>
            <dd>{{ formatCents(auction.bid_increment_cents) }}</dd>
          </div>
          <div class="dl-row">
            <dt>{{ t('admin.subastas.detail.deposit') }}</dt>
            <dd>{{ formatCents(auction.deposit_cents) }}</dd>
          </div>
          <div class="dl-row">
            <dt>{{ t('admin.subastas.detail.buyerPremium') }}</dt>
            <dd>{{ auction.buyer_premium_pct }}%</dd>
          </div>
          <div class="dl-row">
            <dt>{{ t('admin.subastas.detail.antiSnipe') }}</dt>
            <dd>{{ auction.anti_snipe_seconds }}s</dd>
          </div>
        </dl>
      </div>

      <!-- Dates -->
      <div class="info-card">
        <h3>{{ t('admin.subastas.detail.dates') }}</h3>
        <dl class="info-dl">
          <div class="dl-row">
            <dt>{{ t('admin.subastas.detail.startsAt') }}</dt>
            <dd>{{ formatDate(auction.starts_at) }}</dd>
          </div>
          <div class="dl-row">
            <dt>{{ t('admin.subastas.detail.endsAt') }}</dt>
            <dd>{{ formatDate(auction.ends_at) }}</dd>
          </div>
          <div v-if="auction.extended_until" class="dl-row">
            <dt>{{ t('admin.subastas.detail.extendedUntil') }}</dt>
            <dd class="text-warning">{{ formatDate(auction.extended_until) }}</dd>
          </div>
          <div class="dl-row">
            <dt>{{ t('admin.subastas.detail.created') }}</dt>
            <dd class="text-muted">{{ formatDate(auction.created_at) }}</dd>
          </div>
        </dl>
      </div>

      <!-- Stats summary -->
      <div class="info-card stats-card">
        <h3>{{ t('admin.subastas.detail.stats') }}</h3>
        <div class="stats-grid">
          <div class="stat">
            <span class="stat-value">{{ auction.bid_count }}</span>
            <span class="stat-label">{{ t('admin.subastas.detail.totalBids') }}</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ registrations.length }}</span>
            <span class="stat-label">{{ t('admin.subastas.detail.registeredBidders') }}</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ approvedCount }}</span>
            <span class="stat-label">{{ t('admin.subastas.detail.approvedBidders') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Description -->
    <div v-if="auction.description" class="auction-description">
      <h3>{{ t('admin.subastas.detail.description') }}</h3>
      <p>{{ auction.description }}</p>
    </div>

    <!-- Winner info -->
    <div v-if="auction.winner_id" class="winner-card">
      <h3>{{ t('admin.subastas.detail.winner') }}</h3>
      <div class="winner-info">
        <span class="winner-badge">&#127942;</span>
        <div>
          <strong>{{ t('admin.subastas.detail.winnerId') }}: {{ auction.winner_id }}</strong>
          <span
            >{{ t('admin.subastas.detail.winningBid') }}:
            {{ formatCents(auction.winning_bid_cents) }}</span
          >
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 20px 24px;
}

.section-title {
  margin: 0 0 16px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.info-card {
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 10px;
  border: 1px solid var(--color-gray-200);
}

.info-card h3 {
  margin: 0 0 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.vehicle-card {
  display: flex;
  gap: 16px;
  align-items: center;
}

.vehicle-thumb {
  width: 80px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vehicle-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-placeholder {
  font-size: 24px;
  opacity: 0.3;
}

.vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vehicle-info strong {
  font-size: 1rem;
  color: var(--text-primary);
}

.vehicle-price {
  font-weight: 600;
  color: var(--color-primary);
}

.info-dl {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dl-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.dl-row dt {
  color: var(--text-auxiliary);
}

.dl-row dd {
  margin: 0;
  font-weight: 500;
  color: var(--text-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-auxiliary);
  text-align: center;
}

.auction-description {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-gray-200);
}

.auction-description h3 {
  margin: 0 0 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.auction-description p {
  margin: 0;
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.5;
}

.winner-card {
  margin-top: 16px;
  padding: 16px;
  background: var(--color-success-bg, #dcfce7);
  border: 2px solid var(--color-success);
  border-radius: 10px;
}

.winner-card h3 {
  margin: 0 0 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-success);
  text-transform: uppercase;
}

.winner-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.winner-badge {
  font-size: 2rem;
}

.winner-info div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.winner-info strong {
  font-size: 0.9rem;
  color: var(--text-primary);
}

.winner-info span {
  font-size: 0.85rem;
  color: var(--color-success);
  font-weight: 500;
}

.text-muted {
  color: var(--text-auxiliary);
}

.text-warning {
  color: var(--color-warning);
  font-weight: 500;
}

@media (min-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
