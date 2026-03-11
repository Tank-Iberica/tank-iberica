<script setup lang="ts">
/**
 * ObservatorioFilters — Filter bar for the competition observatory.
 * Platform select, status select, and text search.
 */
import type { CompetitorStatus, Platform } from '~/composables/dashboard/useDashboardObservatorio'
import { STATUS_OPTIONS } from '~/composables/dashboard/useDashboardObservatorio'

defineProps<{
  filterPlatform: string
  filterStatus: CompetitorStatus | ''
  searchQuery: string
  selectablePlatforms: Platform[]
}>()

const emit = defineEmits<{
  (e: 'update:filterPlatform' | 'update:searchQuery', value: string): void
  (e: 'update:filterStatus', value: CompetitorStatus | ''): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="filters-bar">
    <select
      class="filter-select"
      :value="filterPlatform"
      :aria-label="t('dashboard.observatory.filterPlatform')"
      @change="emit('update:filterPlatform', ($event.target as HTMLSelectElement).value)"
    >
      <option value="">{{ t('dashboard.observatory.allPlatforms') }}</option>
      <option v-for="p in selectablePlatforms" :key="p.id" :value="p.id">
        {{ p.name }}
      </option>
    </select>

    <select
      class="filter-select"
      :value="filterStatus"
      :aria-label="t('dashboard.observatory.filterStatus')"
      @change="
        emit(
          'update:filterStatus',
          ($event.target as HTMLSelectElement).value as CompetitorStatus | '',
        )
      "
    >
      <option value="">{{ t('dashboard.observatory.allStatuses') }}</option>
      <option v-for="s in STATUS_OPTIONS" :key="s" :value="s">
        {{ t(`dashboard.observatory.status.${s}`) }}
      </option>
    </select>

    <input
      type="search"
      class="filter-search"
      :value="searchQuery"
      :placeholder="t('dashboard.observatory.searchPlaceholder')"
      @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
    >
  </div>
</template>

<style scoped>
.filters-bar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-select,
.filter-search {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  font-family: inherit;
  background: var(--bg-primary);
}

.filter-select:focus,
.filter-search:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

@media (min-width: 30em) {
  .filters-bar {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .filter-select {
    width: auto;
    min-width: 10rem;
  }

  .filter-search {
    flex: 1;
    min-width: 11.25rem;
  }
}
</style>
