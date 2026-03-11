<script setup lang="ts">
import type { DateRange } from '~/composables/admin/useAdminPagos'

const DATE_RANGES: DateRange[] = ['this_month', 'last_month', 'last_3_months', 'all_time']

defineProps<{
  dateRange: DateRange
}>()

const emit = defineEmits<{
  change: [range: DateRange]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="date-range-row">
    <button
      v-for="range in DATE_RANGES"
      :key="range"
      class="date-btn"
      :class="{ active: dateRange === range }"
      @click="emit('change', range)"
    >
      {{ t(`admin.pagos.range.${range}`) }}
    </button>
  </div>
</template>

<style scoped>
.date-range-row {
  display: flex;
  gap: var(--spacing-2);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 0.125rem;
}

.date-range-row::-webkit-scrollbar {
  display: none;
}

.date-btn {
  padding: var(--spacing-2) 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-auxiliary);
  transition: all 0.15s;
  min-height: 2.75rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.date-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--color-gray-300);
}

.date-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}
</style>
