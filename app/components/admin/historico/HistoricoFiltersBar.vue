<script setup lang="ts">
import type { AdminSubcategory } from '~/composables/admin/useAdminSubcategories'
import type { AdminType } from '~/composables/admin/useAdminTypes'
import type { HistoricoPageFilters } from '~/composables/admin/useAdminHistoricoPage'
import { localizedName } from '~/composables/useLocalized'

const props = defineProps<{
  filters: HistoricoPageFilters
  availableYears: readonly number[]
  availableBrands: readonly string[]
  categoryOptions: [string, string][]
  subcategories: readonly AdminSubcategory[]
  types: readonly AdminType[]
  locale: string
}>()

defineEmits<{
  (e: 'update:filter', key: keyof HistoricoPageFilters, value: string | number | null): void
  (e: 'clear'): void
}>()
</script>

<template>
  <div class="filters-bar">
    <div class="filter-group">
      <select
        :value="props.filters.year"
        @change="
          $emit(
            'update:filter',
            'year',
            ($event.target as HTMLSelectElement).value
              ? Number(($event.target as HTMLSelectElement).value)
              : null,
          )
        "
      >
        <option :value="null">Todos los años</option>
        <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
      </select>

      <select
        :value="props.filters.sale_category"
        @change="
          $emit(
            'update:filter',
            'sale_category',
            ($event.target as HTMLSelectElement).value || null,
          )
        "
      >
        <option :value="null">Todas las categorías</option>
        <option v-for="[key, label] in categoryOptions" :key="key" :value="key">
          {{ label }}
        </option>
      </select>

      <select
        :value="props.filters.subcategory_id"
        @change="
          $emit(
            'update:filter',
            'subcategory_id',
            ($event.target as HTMLSelectElement).value || null,
          )
        "
      >
        <option :value="null">Todas las subcat.</option>
        <option v-for="s in subcategories" :key="s.id" :value="s.id">
          {{ localizedName(s, locale) }}
        </option>
      </select>

      <select
        :value="props.filters.type_id"
        @change="
          $emit('update:filter', 'type_id', ($event.target as HTMLSelectElement).value || null)
        "
      >
        <option :value="null">Todos los tipos</option>
        <option v-for="t in types" :key="t.id" :value="t.id">
          {{ localizedName(t, locale) }}
        </option>
      </select>

      <select
        :value="props.filters.brand"
        @change="
          $emit('update:filter', 'brand', ($event.target as HTMLSelectElement).value || null)
        "
      >
        <option :value="null">Todas las marcas</option>
        <option v-for="b in availableBrands" :key="b" :value="b">{{ b }}</option>
      </select>
    </div>

    <div class="filter-group">
      <input
        :value="props.filters.search"
        type="text"
        placeholder="Buscar..."
        class="search-input"
        @input="$emit('update:filter', 'search', ($event.target as HTMLInputElement).value)"
      >
      <button class="btn btn-sm" @click="$emit('clear')">{{ $t('common.clear') }}</button>
    </div>
  </div>
</template>

<style scoped>
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  justify-content: space-between;
  margin-bottom: var(--spacing-4);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
}
.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  align-items: center;
}
.filters-bar select,
.search-input {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  font-size: 0.85rem;
  min-width: 8.75rem;
}
.search-input {
  min-width: 11.25rem;
}
.btn {
  padding: var(--spacing-2) var(--spacing-4);
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  cursor: pointer;
}
.btn-sm {
  padding: 0.375rem var(--spacing-3);
  font-size: 0.8rem;
}

@media (max-width: 48em) {
  .filters-bar {
    flex-direction: column;
  }
  .filter-group {
    width: 100%;
  }
  .filters-bar select,
  .search-input {
    flex: 1;
    min-width: 0;
  }
}
</style>
