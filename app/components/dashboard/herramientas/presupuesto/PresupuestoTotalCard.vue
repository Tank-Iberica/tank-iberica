<script setup lang="ts">
import { formatPrice } from '~/composables/shared/useListingUtils'

defineProps<{
  totalAmount: number
}>()

const { t } = useI18n()
</script>

<template>
  <div class="total-card">
    <span class="total-label">{{ t('dashboard.quote.totalAmount') }}</span>
    <span class="total-value">{{ formatPrice(totalAmount) }}</span>
  </div>
</template>

<style scoped>
.total-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, var(--color-sky-50), var(--color-blue-50));
  border: 0.125rem solid var(--color-info-border);
  border-radius: var(--border-radius-md);
}

.total-label {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--badge-info-bg);
}

.total-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-primary);
}
</style>
