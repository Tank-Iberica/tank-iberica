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
  gap: 8px;
}

.filter-select,
.filter-search {
  width: 100%;
  min-height: 44px;
  padding: 10px 14px;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  background: var(--bg-primary);
}

.filter-select:focus,
.filter-search:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

@media (min-width: 480px) {
  .filters-bar {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .filter-select {
    width: auto;
    min-width: 160px;
  }

  .filter-search {
    flex: 1;
    min-width: 180px;
  }
}
</style>
