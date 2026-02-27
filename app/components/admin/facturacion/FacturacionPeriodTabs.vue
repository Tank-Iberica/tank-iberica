<script setup lang="ts">
import type { PeriodOption } from '~/composables/admin/useAdminFacturacion'

defineProps<{
  periods: PeriodOption[]
  selectedPeriod: string
}>()

const emit = defineEmits<{
  (e: 'select', value: string): void
}>()
</script>

<template>
  <div class="period-tabs">
    <button
      v-for="p in periods"
      :key="p.value"
      class="period-tab"
      :class="{ active: selectedPeriod === p.value }"
      @click="emit('select', p.value)"
    >
      {{ p.label() }}
    </button>
  </div>
</template>

<style scoped>
.period-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2, 8px);
  padding: var(--spacing-3, 12px) var(--spacing-4, 16px);
  background: var(--bg-primary, #fff);
  border-radius: var(--border-radius-md, 12px);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
}

.period-tab {
  padding: var(--spacing-2, 8px) var(--spacing-4, 16px);
  border: 1px solid var(--border-color-light, #e5e7eb);
  border-radius: var(--border-radius-full, 9999px);
  background: var(--bg-primary, #fff);
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--text-secondary, #4a5a5a);
  cursor: pointer;
  transition: all var(--transition-fast, 150ms ease);
  min-height: 44px;
}

.period-tab:hover:not(.active) {
  background: var(--color-gray-50, #f9fafb);
  border-color: var(--border-color, #d1d5db);
}

.period-tab.active {
  background: var(--color-primary, #23424a);
  color: var(--color-white, #fff);
  border-color: var(--color-primary, #23424a);
}

@media (min-width: 1024px) {
  .period-tabs {
    padding: var(--spacing-4, 16px) var(--spacing-6, 24px);
  }
}
</style>
