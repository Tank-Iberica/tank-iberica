<script setup lang="ts">
/**
 * PriceRelativeBadge — Shows a badge indicating price vs market average.
 *
 * - deviation < -10%: "Buen precio" (green)
 * - deviation > +10%: "Precio alto" (orange)
 * - otherwise: hidden (not displayed)
 *
 * Used in vehicle detail page header to highlight pricing.
 */
const props = defineProps<{
  /** Price deviation % vs market avg (positive = above market) */
  deviationPercent: number
  /** Whether there are enough market comparables (>=3) */
  hasData: boolean
}>()

const { t } = useI18n()

type Level = 'good' | 'high' | null

const level = computed<Level>(() => {
  if (!props.hasData) return null
  if (props.deviationPercent < -10) return 'good'
  if (props.deviationPercent > 10) return 'high'
  return null
})

const label = computed(() => {
  if (level.value === 'good') return t('vehicle.priceBadge.goodPrice')
  if (level.value === 'high') return t('vehicle.priceBadge.highPrice')
  return ''
})

const tooltip = computed(() => {
  const abs = Math.abs(Math.round(props.deviationPercent))
  if (level.value === 'good') return t('vehicle.priceBadge.goodPriceTip', { pct: abs })
  if (level.value === 'high') return t('vehicle.priceBadge.highPriceTip', { pct: abs })
  return ''
})
</script>

<template>
  <span
    v-if="level"
    class="price-badge"
    :class="`price-badge--${level}`"
    :title="tooltip"
    role="img"
    :aria-label="label"
  >
    <span class="price-badge__icon" aria-hidden="true">{{ level === 'good' ? '✓' : '↑' }}</span>
    {{ label }}
  </span>
</template>

<style scoped>
.price-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.1875rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: default;
  user-select: none;
}

.price-badge--good {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.price-badge--high {
  background: #fff7ed;
  color: #9a3412;
  border: 1px solid #fed7aa;
}

.price-badge__icon {
  font-size: 0.875rem;
}
</style>
