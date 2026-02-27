<script setup lang="ts">
import type { DateRange } from '~/composables/admin/useAdminPagos'

const DATE_RANGES: DateRange[] = ['this_month', 'last_month', 'last_3_months', 'all_time']

defineProps<{
  dateRange: DateRange
}>()

const emit = defineEmits<{
  (e: 'change', range: DateRange): void
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
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 2px;
}

.date-range-row::-webkit-scrollbar {
  display: none;
}

.date-btn {
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  transition: all 0.15s;
  min-height: 44px;
  white-space: nowrap;
  flex-shrink: 0;
}

.date-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.date-btn.active {
  background: var(--color-primary, #23424a);
  color: white;
  border-color: var(--color-primary, #23424a);
}
</style>
