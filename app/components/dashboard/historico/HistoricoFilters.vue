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
  gap: 0.75rem;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.filter-select,
.search-input {
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  font-size: 0.85rem;
  min-width: 8.75rem;
  background: var(--bg-primary);
}

.search-input {
  min-width: 11.25rem;
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
  min-height: 2.75rem;
  padding: 0.625rem 1rem;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background 0.15s;
}

.btn:hover {
  background: var(--bg-secondary);
}

.btn-sm {
  min-height: 2.25rem;
  padding: 0.375rem 0.75rem;
  font-size: var(--font-size-sm);
}

@media (min-width: 48em) {
  .filters-bar {
    flex-direction: row;
  }

  .filter-group {
    width: auto;
  }
}

@media (max-width: 47.9375em) {
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
