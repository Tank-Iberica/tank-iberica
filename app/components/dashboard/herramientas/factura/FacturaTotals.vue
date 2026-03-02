<script setup lang="ts">
defineProps<{
  subtotal: number
  totalIva: number
  total: number
  formatCurrency: (val: number) => string
}>()

const { t } = useI18n()
</script>

<template>
  <div class="invoice-totals">
    <div class="invoice-totals__row">
      <span>{{ t('dashboard.tools.invoice.baseAmount') }}</span>
      <span>{{ formatCurrency(subtotal) }}</span>
    </div>
    <div class="invoice-totals__row">
      <span>{{ t('dashboard.tools.invoice.totalIVA') }}</span>
      <span>{{ formatCurrency(totalIva) }}</span>
    </div>
    <div class="invoice-totals__row invoice-totals__row--grand">
      <span>{{ t('dashboard.tools.invoice.grandTotal') }}</span>
      <span>{{ formatCurrency(total) }}</span>
    </div>
  </div>
</template>

<style scoped>
.invoice-totals {
  background: var(--bg-secondary);
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  max-width: 360px;
  margin-left: auto;
}

.invoice-totals__row {
  display: flex;
  justify-content: space-between;
  padding: 0.375rem 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.invoice-totals__row--grand {
  border-top: 2px solid var(--primary, var(--color-primary));
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary, var(--color-primary));
}
</style>
