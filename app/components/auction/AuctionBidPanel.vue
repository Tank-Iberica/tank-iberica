<template>
  <div class="bid-panel" :class="`status-${auction.status}`">
    <!-- Header -->
    <div class="bid-panel-header">
      <span class="bid-panel-icon">&#x1F528;</span>
      <span class="bid-panel-title">{{ statusTitle }}</span>
    </div>

    <!-- Scheduled state -->
    <div v-if="auction.status === 'scheduled'" class="bid-countdown-block">
      <span class="countdown-label">{{ $t('auction.startsIn') }}</span>
      <span class="countdown-value">{{ countdown }}</span>
    </div>

    <!-- Active state -->
    <template v-if="auction.status === 'active'">
      <!-- Current bid -->
      <div class="bid-current">
        <span class="bid-current-label">{{ $t('auction.currentBid') }}</span>
        <span class="bid-current-amount">{{
          formatCents(auction.current_bid_cents || auction.start_price_cents)
        }}</span>
      </div>

      <div class="bid-stats">
        <div class="bid-stat">
          <span class="stat-value">{{ auction.bid_count || 0 }}</span>
          <span class="stat-label">{{ $t('auction.totalBids') }}</span>
        </div>
        <div class="bid-stat">
          <span class="stat-value">{{ uniqueBidders }}</span>
          <span class="stat-label">{{ $t('auction.bidders') }}</span>
        </div>
      </div>

      <!-- Countdown -->
      <div class="bid-countdown-block" :class="{ urgent: isUrgent }">
        <span class="countdown-label">{{ $t('auction.timeRemaining') }}</span>
        <span class="countdown-value">{{ countdown }}</span>
        <span v-if="isAntiSnipeActive" class="anti-snipe-badge">
          {{ $t('auction.antiSnipeActive') }}
        </span>
      </div>

      <!-- Bid actions (if can bid) -->
      <div v-if="canBid" class="bid-actions">
        <span class="bid-min-label"
          >{{ $t('auction.yourMinBid') }}: {{ formatCents(minimumBid) }}</span
        >
        <div class="bid-buttons">
          <button class="btn btn-primary bid-btn" @click="$emit('placeBid', minimumBid)">
            {{ formatCents(minimumBid) }}
          </button>
          <button class="btn btn-outline bid-btn" @click="$emit('placeBid', minimumBid + 50000)">
            +500&euro;
          </button>
          <button class="btn btn-outline bid-btn" @click="$emit('placeBid', minimumBid + 100000)">
            +1.000&euro;
          </button>
        </div>
        <div class="bid-custom">
          <input
            v-model.number="customAmount"
            type="number"
            :min="minimumBid / 100"
            :placeholder="$t('auction.customAmount')"
            class="bid-input"
          >
          <button
            class="btn btn-primary bid-btn-custom"
            :disabled="!customAmount || customAmount * 100 < minimumBid"
            @click="$emit('placeBid', customAmount! * 100)"
          >
            {{ $t('auction.bid') }}
          </button>
        </div>
      </div>

      <!-- Register prompt (if not registered) -->
      <div v-else-if="!isRegistered" class="bid-register">
        <p>{{ $t('auction.registerToBid') }}</p>
        <button class="btn btn-primary bid-register-btn" @click="$emit('requestRegistration')">
          {{ $t('auction.registerButton') }}
        </button>
      </div>

      <!-- Waiting approval -->
      <div v-else class="bid-waiting">
        <p>{{ $t('auction.waitingApproval') }}</p>
      </div>

      <!-- Buyer's premium notice -->
      <div class="bid-premium-notice">
        {{ $t('auction.premiumNotice', { pct: auction.buyer_premium_pct }) }}
      </div>
    </template>

    <!-- Ended state -->
    <template v-if="['ended', 'adjudicated', 'no_sale'].includes(auction.status)">
      <div class="bid-result">
        <span v-if="auction.status === 'no_sale'" class="result-label no-sale">
          {{ $t('auction.noSale') }}
        </span>
        <template v-else>
          <span class="result-label">{{ $t('auction.finalPrice') }}</span>
          <span class="result-amount">{{
            formatCents(auction.winning_bid_cents || auction.current_bid_cents)
          }}</span>
          <span class="result-premium">
            + {{ auction.buyer_premium_pct }}% =
            {{
              formatCents(
                Math.round(
                  (auction.winning_bid_cents || auction.current_bid_cents) *
                    (1 + auction.buyer_premium_pct / 100),
                ),
              )
            }}
          </span>
        </template>
      </div>
    </template>

    <!-- Bid history -->
    <div v-if="bids.length > 0" class="bid-history">
      <span class="history-title">{{ $t('auction.bidHistory') }}</span>
      <div
        v-for="bid in displayedBids"
        :key="bid.id"
        class="bid-history-row"
        :class="{ own: isOwnBid(bid) }"
      >
        <span class="history-amount">{{ formatCents(Number(bid.amount_cents)) }}</span>
        <span class="history-user">{{
          isOwnBid(bid) ? $t('auction.you') : anonymizeUser(bid.user_id)
        }}</span>
        <span class="history-time">{{ relativeTime(bid.created_at) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Auction, AuctionBid } from '~/composables/useAuction'

const props = defineProps<{
  auction: Auction
  bids: AuctionBid[]
  canBid: boolean
  isRegistered: boolean
}>()

defineEmits<{
  placeBid: [amountCents: number]
  requestRegistration: []
}>()

const { t } = useI18n()
const user = useSupabaseUser()

const customAmount = ref<number | null>(null)

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

const effectiveEnd = computed(() => {
  return new Date(props.auction.extended_until || props.auction.ends_at).getTime()
})

const effectiveStart = computed(() => {
  return new Date(props.auction.starts_at).getTime()
})

const countdown = computed(() => {
  const target = props.auction.status === 'scheduled' ? effectiveStart.value : effectiveEnd.value
  const diff = Math.max(0, target - now.value)
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const isUrgent = computed(() => {
  return effectiveEnd.value - now.value < 120000 && props.auction.status === 'active'
})

const isAntiSnipeActive = computed(() => {
  return (
    props.auction.extended_until !== null &&
    new Date(props.auction.extended_until).getTime() > new Date(props.auction.ends_at).getTime()
  )
})

const statusTitle = computed(() => {
  switch (props.auction.status) {
    case 'scheduled':
      return t('auction.scheduled')
    case 'active':
      return t('auction.live')
    case 'ended':
      return t('auction.ended')
    case 'adjudicated':
      return t('auction.adjudicated')
    case 'no_sale':
      return t('auction.noSaleTitle')
    case 'cancelled':
      return t('auction.cancelled')
    default:
      return ''
  }
})

const minimumBid = computed(() => {
  if (props.auction.current_bid_cents > 0) {
    return props.auction.current_bid_cents + props.auction.bid_increment_cents
  }
  return props.auction.start_price_cents
})

const uniqueBidders = computed(() => {
  return new Set(props.bids.map((b) => b.user_id)).size
})

const displayedBids = computed(() => props.bids.slice(0, 10))

function isOwnBid(bid: AuctionBid): boolean {
  return user.value?.id === bid.user_id
}

function anonymizeUser(userId: string): string {
  return userId.substring(0, 4) + '****'
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function relativeTime(dateStr: string): string {
  const diff = now.value - new Date(dateStr).getTime()
  if (diff < 60000) return t('auction.justNow')
  if (diff < 3600000) return t('auction.minutesAgo', { n: Math.floor(diff / 60000) })
  if (diff < 86400000) return t('auction.hoursAgo', { n: Math.floor(diff / 3600000) })
  return t('auction.daysAgo', { n: Math.floor(diff / 86400000) })
}
</script>

<style scoped>
/* =============================================
   AuctionBidPanel — Mobile-first (360px base)
   ============================================= */

.bid-panel {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  box-shadow: var(--shadow);
}

/* Status-based top accent border */
.bid-panel.status-scheduled {
  border-top: 3px solid var(--color-info);
}

.bid-panel.status-active {
  border-top: 3px solid var(--color-success);
}

.bid-panel.status-ended,
.bid-panel.status-adjudicated,
.bid-panel.status-no_sale {
  border-top: 3px solid var(--color-gray-400);
}

.bid-panel.status-cancelled {
  border-top: 3px solid var(--color-error);
}

/* ---- Header ---- */
.bid-panel-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.bid-panel-icon {
  font-size: var(--font-size-xl);
  line-height: 1;
}

.bid-panel-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.status-scheduled .bid-panel-title {
  color: var(--color-info);
}

.status-active .bid-panel-title {
  color: var(--color-success);
}

.status-ended .bid-panel-title,
.status-adjudicated .bid-panel-title,
.status-no_sale .bid-panel-title {
  color: var(--text-auxiliary);
}

/* ---- Current bid display ---- */
.bid-current {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-4) 0;
}

.bid-current-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.bid-current-amount {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  line-height: var(--line-height-tight);
}

/* ---- Bid stats row ---- */
.bid-stats {
  display: flex;
  justify-content: center;
  gap: var(--spacing-8);
}

.bid-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
}

.stat-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ---- Countdown block ---- */
.bid-countdown-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
}

.countdown-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.countdown-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
}

/* Urgent state: < 2 min remaining */
.bid-countdown-block.urgent {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.bid-countdown-block.urgent .countdown-value {
  color: var(--color-error);
  animation: pulse-urgent 1s ease-in-out infinite;
}

.bid-countdown-block.urgent .countdown-label {
  color: var(--color-error);
}

@keyframes pulse-urgent {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* Anti-snipe badge */
.anti-snipe-badge {
  display: inline-block;
  margin-top: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-3);
  background: var(--color-warning);
  color: #ffffff;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--border-radius-full);
  animation: pulse-snipe 2s ease-in-out infinite;
}

@keyframes pulse-snipe {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.03);
  }
}

/* ---- Bid actions ---- */
.bid-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.bid-min-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
  text-align: center;
}

.bid-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.bid-btn {
  width: 100%;
  min-height: 48px;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-fast);
  cursor: pointer;
  text-align: center;
}

.btn-primary.bid-btn {
  background: var(--color-primary);
  color: var(--color-white);
  border: 2px solid var(--color-primary);
}

.btn-primary.bid-btn:hover {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.btn-primary.bid-btn:active {
  transform: scale(0.98);
}

.btn-outline.bid-btn {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

.btn-outline.bid-btn:hover {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn-outline.bid-btn:active {
  transform: scale(0.98);
}

/* Custom bid input row */
.bid-custom {
  display: flex;
  gap: var(--spacing-2);
  align-items: stretch;
}

.bid-input {
  flex: 1;
  min-height: 48px;
  padding: var(--spacing-2) var(--spacing-3);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background: var(--bg-primary);
  transition: border-color var(--transition-fast);
  /* Remove number spinners */
  -moz-appearance: textfield;
}

.bid-input::-webkit-inner-spin-button,
.bid-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.bid-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.bid-btn-custom {
  min-height: 48px;
  min-width: 80px;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  background: var(--color-primary);
  color: var(--color-white);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  border: 2px solid var(--color-primary);
  transition: all var(--transition-fast);
  cursor: pointer;
}

.bid-btn-custom:hover:not(:disabled) {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.bid-btn-custom:active:not(:disabled) {
  transform: scale(0.98);
}

.bid-btn-custom:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---- Register prompt ---- */
.bid-register {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  text-align: center;
}

.bid-register p {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.bid-register-btn {
  width: 100%;
  min-height: 48px;
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-fast);
  cursor: pointer;
}

.bid-register-btn:hover {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.bid-register-btn:active {
  transform: scale(0.98);
}

/* ---- Waiting approval ---- */
.bid-waiting {
  padding: var(--spacing-4);
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--border-radius);
  text-align: center;
}

.bid-waiting p {
  font-size: var(--font-size-sm);
  color: var(--color-warning);
  font-weight: var(--font-weight-medium);
}

/* ---- Buyer's premium notice ---- */
.bid-premium-notice {
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  text-align: center;
  line-height: var(--line-height-normal);
}

/* ---- Bid result (ended) ---- */
.bid-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-6) var(--spacing-4);
}

.result-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.result-label.no-sale {
  font-size: var(--font-size-lg);
  color: var(--color-error);
  font-weight: var(--font-weight-bold);
}

.result-amount {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
}

.result-premium {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  font-weight: var(--font-weight-medium);
}

/* ---- Bid history ---- */
.bid-history {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  border-top: 1px solid var(--border-color-light);
  padding-top: var(--spacing-4);
}

.history-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.bid-history-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  transition: background var(--transition-fast);
}

.bid-history-row:nth-child(even) {
  background: var(--color-gray-50);
}

.bid-history-row.own {
  background: rgba(35, 66, 74, 0.06);
  border-left: 3px solid var(--color-primary);
}

.history-amount {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  min-width: 80px;
}

.history-user {
  color: var(--text-auxiliary);
  flex: 1;
  font-variant-numeric: tabular-nums;
}

.history-time {
  color: var(--text-auxiliary);
  font-size: var(--font-size-xs);
  white-space: nowrap;
}

/* =============================================
   Breakpoint: 480px (large mobile / landscape)
   ============================================= */
@media (min-width: 480px) {
  .bid-panel {
    padding: var(--spacing-5);
  }

  .bid-current-amount {
    font-size: var(--font-size-4xl);
  }

  .bid-buttons {
    flex-direction: row;
    gap: var(--spacing-2);
  }

  .bid-btn {
    flex: 1;
  }

  .bid-register-btn {
    width: auto;
    padding: var(--spacing-3) var(--spacing-8);
  }

  .history-amount {
    min-width: 100px;
  }
}

/* =============================================
   Breakpoint: 768px (tablet / sidebar layout)
   ============================================= */
@media (min-width: 768px) {
  .bid-panel {
    padding: var(--spacing-6);
    gap: var(--spacing-5);
    max-width: 400px;
  }

  .bid-panel-title {
    font-size: var(--font-size-xl);
  }

  .bid-stats {
    gap: var(--spacing-12);
  }

  .countdown-value {
    font-size: var(--font-size-3xl);
  }

  .bid-buttons {
    flex-direction: row;
  }

  .bid-btn {
    min-height: 48px;
  }

  .bid-history-row {
    padding: var(--spacing-2) var(--spacing-4);
  }
}
</style>
