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
  padding: 20px 24px;
  background: linear-gradient(135deg, #f0f9ff, #eff6ff);
  border: 2px solid #bfdbfe;
  border-radius: 12px;
}

.total-label {
  font-size: 1rem;
  font-weight: 600;
  color: #1e40af;
}

.total-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}
</style>
