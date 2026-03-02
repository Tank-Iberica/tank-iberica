<script setup lang="ts">
/**
 * HistoricoFilters — Filter bar for the dealer sales history.
 * Year select, brand select, text search, and clear button.
 */

defineProps<{
  filterYear: number | null
  filterBrand: string | null
  searchQuery: string
  availableYears: number[]
  availableBrands: string[]
}>()

const emit = defineEmits<{
  (e: 'update:filterYear', value: number | null): void
  (e: 'update:filterBrand', value: string | null): void
  (e: 'update:searchQuery', value: string): void
  (e: 'clear'): void
}>()

const { t } = useI18n()

function onYearChange(event: Event): void {
  const raw = (event.target as HTMLSelectElement).value
  emit('update:filterYear', raw ? Number(raw) : null)
}

function onBrandChange(event: Event): void {
  const raw = (event.target as HTMLSelectElement).value
  emit('update:filterBrand', raw || null)
}

function onSearchInput(event: Event): void {
  emit('update:searchQuery', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="filters-bar">
    <div class="filter-group">
      <select class="filter-select" :value="filterYear ?? ''" @change="onYearChange">
        <option value="">{{ t('dashboard.historico.filters.allYears') }}</option>
        <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
      </select>

      <select class="filter-select" :value="filterBrand ?? ''" @change="onBrandChange">
        <option value="">{{ t('dashboard.historico.filters.allBrands') }}</option>
        <option v-for="b in availableBrands" :key="b" :value="b">{{ b }}</option>
      </select>
    </div>

    <div class="filter-group">
      <input
        type="text"
        class="search-input"
        :value="searchQuery"
        :placeholder="t('dashboard.historico.filters.searchPlaceholder')"
        @input="onSearchInput"
      >
      <button class="btn btn-sm" @click="emit('clear')">
        {{ t('dashboard.historico.filters.clear') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-primary);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.filter-select,
.search-input {
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--border-color-light);
  border-radius: 6px;
  font-size: 0.85rem;
  min-width: 140px;
  background: var(--bg-primary);
}

.search-input {
  min-width: 180px;
}

.filter-select:focus,
.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
}

.btn:hover {
  background: var(--bg-secondary);
}

.btn-sm {
  min-height: 36px;
  padding: 6px 12px;
  font-size: 0.8rem;
}

@media (min-width: 768px) {
  .filters-bar {
    flex-direction: row;
  }

  .filter-group {
    width: auto;
  }
}

@media (max-width: 767px) {
  .filters-bar {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }

  .filter-select,
  .search-input {
    flex: 1;
    min-width: 0;
  }
}
</style>
