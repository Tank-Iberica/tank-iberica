<script setup lang="ts">
import { formatPrice, formatPriceCents } from '~/composables/shared/useListingUtils'

const props = withDefaults(
  defineProps<{
    price: number | null | undefined
    locale?: string
    cents?: boolean
    fallback?: string
    suffix?: string
  }>(),
  { locale: 'es-ES', cents: false, fallback: '-', suffix: '' },
)

const formatted = computed(() => {
  if (props.price == null) return props.fallback
  if (props.cents) return formatPriceCents(props.price, props.locale)
  return formatPrice(props.price, props.locale)
})
</script>

<template>
  <span class="price-display">
    {{ formatted }}
    <span v-if="suffix && price" class="price-suffix">{{ suffix }}</span>
  </span>
</template>

<style scoped>
.price-display {
  font-variant-numeric: tabular-nums;
}

.price-suffix {
  font-size: 0.8em;
  color: #6b7280;
}
</style>
