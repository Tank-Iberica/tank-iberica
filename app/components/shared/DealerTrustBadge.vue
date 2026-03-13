<script setup lang="ts">
/**
 * DealerTrustBadge — Displays a trust badge based on the dealer's health score.
 *
 * - Score >= 80: "Top Dealer" (blue star badge)
 * - Score >= 60: "Verificado" (green check badge)
 * - Score <  60: nothing rendered
 *
 * Used in vehicle detail page seller section and dealer profile.
 */
const props = defineProps<{
  score: number
  /** Show compact pill variant (no text, just icon) */
  compact?: boolean
}>()

const { t } = useI18n()

type BadgeLevel = 'top' | 'verified' | null

const level = computed<BadgeLevel>(() => {
  if (props.score >= 80) return 'top'
  if (props.score >= 60) return 'verified'
  return null
})

const label = computed(() => {
  if (level.value === 'top') return t('dealer.badge.topDealer')
  if (level.value === 'verified') return t('dealer.badge.verified')
  return ''
})

const tooltip = computed(() => {
  if (level.value === 'top') return t('dealer.badge.topDealerTooltip')
  if (level.value === 'verified') return t('dealer.badge.verifiedTooltip')
  return ''
})
</script>

<template>
  <span
    v-if="level"
    class="trust-badge"
    :class="[`trust-badge--${level}`, { 'trust-badge--compact': compact }]"
    :title="tooltip"
    role="img"
    :aria-label="label"
  >
    <span class="trust-badge__icon" aria-hidden="true">{{ level === 'top' ? '⭐' : '✓' }}</span>
    <span v-if="!compact" class="trust-badge__label">{{ label }}</span>
  </span>
</template>

<style scoped>
.trust-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.1875rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  cursor: default;
  user-select: none;
}

.trust-badge--top {
  background: #dbeafe;
  color: #1d4ed8;
  border: 1px solid #93c5fd;
}

.trust-badge--verified {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.trust-badge--compact {
  padding: 0.1875rem 0.3125rem;
}

.trust-badge__icon {
  font-size: 0.75rem;
}
</style>
