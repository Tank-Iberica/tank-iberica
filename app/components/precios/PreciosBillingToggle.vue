<script setup lang="ts">
import type { BillingInterval } from '~/composables/usePrecios'

defineProps<{
  interval: BillingInterval
}>()

const emit = defineEmits<{
  (e: 'update', value: BillingInterval): void
}>()
</script>

<template>
  <div class="billing-toggle">
    <button
      class="toggle-btn"
      :class="{ 'toggle-btn--active': interval === 'month' }"
      @click="emit('update', 'month')"
    >
      {{ $t('pricing.monthly') }}
    </button>
    <button
      class="toggle-btn"
      :class="{ 'toggle-btn--active': interval === 'year' }"
      @click="emit('update', 'year')"
    >
      {{ $t('pricing.annual') }}
      <span class="save-badge">{{ $t('pricing.savePercent') }}</span>
    </button>
  </div>
</template>

<style scoped>
.billing-toggle {
  display: flex;
  justify-content: center;
  gap: var(--spacing-1);
  margin-bottom: var(--spacing-8);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-full);
  padding: var(--spacing-1);
  max-width: 320px;
  margin-left: auto;
  margin-right: auto;
}

.toggle-btn {
  flex: 1;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background: transparent;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  min-height: 44px;
  min-width: auto;
}

.toggle-btn--active {
  background: var(--bg-primary);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  box-shadow: var(--shadow-sm);
}

.save-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-success);
  background: rgba(16, 185, 129, 0.1);
  padding: 2px 6px;
  border-radius: var(--border-radius-full);
  white-space: nowrap;
}
</style>
