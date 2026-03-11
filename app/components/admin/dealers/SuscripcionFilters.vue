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
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-5);
  padding: var(--spacing-4);
  background: var(--bg-primary, white);
  border-radius: var(--border-radius, 8px);
  box-shadow: var(--shadow-sm, var(--shadow-card));
}

.filter-group {
  display: flex;
  gap: 0;
}

.plan-filter,
.status-filter {
  border: 1px solid var(--border-color-light, var(--color-gray-200));
  border-radius: var(--border-radius-sm, 6px);
  overflow: hidden;
}

.filter-btn {
  padding: 0.5rem 0.75rem;
  border: none;
  background: var(--bg-primary, white);
  cursor: pointer;
  font-size: var(--font-size-xs, 0.8rem);
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-gray-500, var(--color-gray-500));
  transition: all var(--transition-fast, 150ms ease);
  min-height: 2.75rem;
  min-width: 2.75rem;
}

.filter-btn:not(:last-child) {
  border-right: 1px solid var(--border-color-light, var(--color-gray-200));
}

.filter-btn.active {
  background: var(--color-primary);
  color: var(--color-white, white);
}

.filter-btn:hover:not(.active) {
  background: var(--color-gray-100, var(--color-gray-100));
}

.filter-search {
  flex: 1;
  min-width: 12.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color-light, var(--color-gray-200));
  border-radius: var(--border-radius-sm, 6px);
  font-size: var(--font-size-sm, 0.875rem);
}

.filter-search:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

@media (max-width: 48em) {
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
