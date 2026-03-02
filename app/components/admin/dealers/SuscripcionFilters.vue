<script setup lang="ts">
/**
 * SuscripcionFilters — Plan/status filter buttons + search input
 * Extracted from pages/admin/dealers/suscripciones.vue
 */

import type { PlanType, StatusType } from '~/composables/admin/useAdminDealerSuscripciones'

const { t } = useI18n()

defineProps<{
  filterPlan: PlanType | null
  filterStatus: StatusType | null
  searchQuery: string
  plans: Array<{ value: PlanType; label: string; color: string }>
  statuses: Array<{ value: StatusType; label: string; color: string }>
}>()

const emit = defineEmits<{
  'update:filterPlan': [value: PlanType | null]
  'update:filterStatus': [value: StatusType | null]
  'update:searchQuery': [value: string]
}>()
</script>

<template>
  <div class="filters-bar">
    <!-- Plan filter -->
    <div class="filter-group plan-filter">
      <button
        class="filter-btn"
        :class="{ active: filterPlan === null }"
        @click="emit('update:filterPlan', null)"
      >
        {{ t('admin.dealerSubscriptions.filterAll') }}
      </button>
      <button
        v-for="p in plans"
        :key="p.value"
        class="filter-btn"
        :class="{ active: filterPlan === p.value }"
        :style="filterPlan === p.value ? { backgroundColor: p.color, color: 'white' } : {}"
        @click="emit('update:filterPlan', p.value)"
      >
        {{ p.label }}
      </button>
    </div>

    <!-- Status filter -->
    <div class="filter-group status-filter">
      <button
        class="filter-btn"
        :class="{ active: filterStatus === null }"
        @click="emit('update:filterStatus', null)"
      >
        {{ t('admin.dealerSubscriptions.filterAll') }}
      </button>
      <button
        v-for="s in statuses"
        :key="s.value"
        class="filter-btn"
        :class="{ active: filterStatus === s.value }"
        :style="filterStatus === s.value ? { backgroundColor: s.color, color: 'white' } : {}"
        @click="emit('update:filterStatus', s.value)"
      >
        {{ s.label }}
      </button>
    </div>

    <!-- Search -->
    <input
      :value="searchQuery"
      type="text"
      :placeholder="t('admin.dealerSubscriptions.search')"
      class="filter-search"
      @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
    >
  </div>
</template>

<style scoped>
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3, 12px);
  margin-bottom: var(--spacing-5, 20px);
  padding: var(--spacing-4, 16px);
  background: var(--bg-primary, white);
  border-radius: var(--border-radius, 8px);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.1));
}

.filter-group {
  display: flex;
  gap: 0;
}

.plan-filter,
.status-filter {
  border: 1px solid var(--border-color-light, #e5e7eb);
  border-radius: var(--border-radius-sm, 6px);
  overflow: hidden;
}

.filter-btn {
  padding: 8px 12px;
  border: none;
  background: var(--bg-primary, white);
  cursor: pointer;
  font-size: var(--font-size-xs, 0.8rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-gray-500, #6b7280);
  transition: all var(--transition-fast, 150ms ease);
  min-height: 44px;
  min-width: 44px;
}

.filter-btn:not(:last-child) {
  border-right: 1px solid var(--border-color-light, #e5e7eb);
}

.filter-btn.active {
  background: var(--color-primary);
  color: var(--color-white, white);
}

.filter-btn:hover:not(.active) {
  background: var(--color-gray-100, #f3f4f6);
}

.filter-search {
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
  border: 1px solid var(--border-color-light, #e5e7eb);
  border-radius: var(--border-radius-sm, 6px);
  font-size: var(--font-size-sm, 0.875rem);
}

.filter-search:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

@media (max-width: 768px) {
  .filters-bar {
    flex-direction: column;
  }

  .plan-filter,
  .status-filter {
    overflow-x: auto;
    width: 100%;
  }

  .filter-btn {
    white-space: nowrap;
  }

  .filter-search {
    min-width: 0;
    width: 100%;
  }
}
</style>
