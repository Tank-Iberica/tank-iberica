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
      <button class="btn btn-sm" @click="$emit('clear')">Limpiar</button>
    </div>
  </div>
</template>

<style scoped>
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.filters-bar select,
.search-input {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.85rem;
  min-width: 140px;
}
.search-input {
  min-width: 180px;
}
.btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}
.btn-sm {
  padding: 6px 12px;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
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
