<template>
  <div
    v-if="fairPriceCents && fairPriceCents > 0"
    class="fair-price-badge"
    :class="badgeClass"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
    @touchstart.passive="showTooltip = !showTooltip"
  >
    <span class="badge-icon" aria-hidden="true">{{ badgeIcon }}</span>
    <span class="badge-label">{{ $t(badgeLabelKey) }}</span>
    <span class="badge-trend" :aria-label="trendLabel">{{ trendArrow }}</span>

    <!-- Tooltip -->
    <Transition name="tooltip-fade">
      <div v-if="showTooltip" class="badge-tooltip">
        <p class="tooltip-text">
          {{ $t('fairPrice.tooltipExplanation') }}
        </p>
        <p class="tooltip-fair-price">
          {{ $t('fairPrice.estimatedFairPrice') }}:
          <strong>{{ formattedFairPrice }}</strong>
        </p>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { usePriceHistory } from '~/composables/usePriceHistory'

const props = defineProps<{
  vehicleId: string
  currentPrice: number
}>()

const { t } = useI18n()
const { fairPriceCents, priceTrend } = usePriceHistory(props.vehicleId)

const showTooltip = ref(false)

const currentPriceCents = computed(() => props.currentPrice * 100)

const priceRatio = computed(() => {
  if (!fairPriceCents.value || fairPriceCents.value === 0) return 0
  return (currentPriceCents.value - fairPriceCents.value) / fairPriceCents.value
})

type BadgeType = 'fair' | 'below' | 'above'

const badgeType = computed<BadgeType>(() => {
  const ratio = priceRatio.value
  if (ratio < -0.1) return 'below'
  if (ratio > 0.1) return 'above'
  return 'fair'
})

const badgeClass = computed(() => `badge--${badgeType.value}`)

const badgeIcon = computed(() => {
  switch (badgeType.value) {
    case 'fair':
      return '\u2713'
    case 'below':
      return '\u2193'
    case 'above':
      return '\u2191'
    default:
      return ''
  }
})

const badgeLabelKey = computed(() => {
  switch (badgeType.value) {
    case 'fair':
      return 'fairPrice.fairPrice'
    case 'below':
      return 'fairPrice.belowMarket'
    case 'above':
      return 'fairPrice.aboveMarket'
    default:
      return ''
  }
})

const trendArrow = computed(() => {
  switch (priceTrend.value) {
    case 'rising':
      return '\u2197'
    case 'falling':
      return '\u2198'
    case 'stable':
      return '\u2192'
    default:
      return '\u2192'
  }
})

const trendLabel = computed(() => {
  switch (priceTrend.value) {
    case 'rising':
      return t('fairPrice.trendRising')
    case 'falling':
      return t('fairPrice.trendFalling')
    case 'stable':
      return t('fairPrice.trendStable')
    default:
      return ''
  }
})

const formattedFairPrice = computed(() => {
  if (!fairPriceCents.value) return '-'
  const euros = fairPriceCents.value / 100
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(euros)
})
</script>

<style scoped>
.fair-price-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: default;
  position: relative;
  min-height: 32px;
  user-select: none;
}

/* Fair price (green) */
.badge--fair {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

/* Below market (blue - great deal) */
.badge--below {
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

/* Above market (orange) */
.badge--above {
  background: rgba(245, 158, 11, 0.12);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.badge-icon {
  font-size: var(--font-size-base);
  line-height: 1;
}

.badge-label {
  white-space: nowrap;
}

.badge-trend {
  font-size: var(--font-size-xs);
  opacity: 0.8;
}

/* Tooltip */
.badge-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-dark);
  color: var(--text-on-dark-primary);
  padding: var(--spacing-3);
  border-radius: var(--border-radius);
  width: 240px;
  z-index: var(--z-tooltip);
  box-shadow: var(--shadow-lg);
  pointer-events: none;
}

.badge-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: var(--bg-dark);
}

.tooltip-text {
  font-size: var(--font-size-xs);
  color: var(--text-on-dark-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0 0 var(--spacing-2) 0;
}

.tooltip-fair-price {
  font-size: var(--font-size-sm);
  color: var(--text-on-dark-primary);
  margin: 0;
}

.tooltip-fair-price strong {
  color: var(--text-on-dark-accent);
}

/* Tooltip transition */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition:
    opacity var(--transition-fast),
    transform var(--transition-fast);
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
</style>
