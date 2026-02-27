<script setup lang="ts">
import type { ReportStatus, FilterOption } from '~/composables/admin/useAdminReportes'

defineProps<{
  activeFilter: ReportStatus | 'all'
  filters: FilterOption[]
}>()

const emit = defineEmits<{
  'update:activeFilter': [value: ReportStatus | 'all']
}>()

const { t } = useI18n()
</script>

<template>
  <div class="filters-bar">
    <div class="filter-group status-filter">
      <button
        v-for="f in filters"
        :key="f.value"
        class="filter-btn"
        :class="{ active: activeFilter === f.value }"
        @click="emit('update:activeFilter', f.value)"
      >
        {{ t(f.labelKey) }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  align-items: center;
}

.filter-group {
  display: flex;
  gap: 0;
}

.status-filter {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.filter-btn {
  padding: 8px 14px;
  border: none;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
  transition:
    background 0.2s,
    color 0.2s;
  min-height: 44px;
  white-space: nowrap;
}

.filter-btn:not(:last-child) {
  border-right: 1px solid #e5e7eb;
}

.filter-btn.active {
  background: var(--color-primary, #23424a);
  color: white;
}

.filter-btn:hover:not(.active) {
  background: #f3f4f6;
}
</style>
