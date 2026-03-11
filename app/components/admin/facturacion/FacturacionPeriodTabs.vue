<script setup lang="ts">
import type { PeriodOption } from '~/composables/admin/useAdminFacturacion'

defineProps<{
  periods: PeriodOption[]
  selectedPeriod: string
}>()

const emit = defineEmits<{
  select: [value: string]
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
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--bg-primary, var(--color-white));
  border-radius: var(--border-radius-md, 12px);
  box-shadow: var(--shadow-sm, var(--shadow-sm));
}

.period-tab {
  padding: var(--spacing-2) var(--spacing-4);
  border: 1px solid var(--border-color-light, var(--color-gray-200));
  border-radius: var(--border-radius-full, 9999px);
  background: var(--bg-primary, var(--color-white));
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--text-secondary, var(--text-secondary));
  cursor: pointer;
  transition: all var(--transition-fast, 150ms ease);
  min-height: 2.75rem;
}

.period-tab:hover:not(.active) {
  background: var(--color-gray-50, var(--color-gray-50));
  border-color: var(--border-color, var(--color-gray-300));
}

.period-tab.active {
  background: var(--color-primary);
  color: var(--color-white, var(--color-white));
  border-color: var(--color-primary);
}

@media (min-width: 64em) {
  .period-tabs {
    padding: var(--spacing-4) var(--spacing-6);
  }
}
</style>
