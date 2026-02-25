<template>
  <div class="filters-bar">
    <div class="filter-group">
      <select
        :value="filters.year"
        aria-label="Filtrar por año"
        @change="
          $emit('update:filters', {
            ...filters,
            year:
              ($event.target as HTMLSelectElement).value === ''
                ? null
                : Number(($event.target as HTMLSelectElement).value),
          })
        "
      >
        <option :value="''">Todos los a&ntilde;os</option>
        <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
      </select>

      <select
        :value="filters.tipo || ''"
        aria-label="Filtrar por tipo"
        @change="
          $emit('update:filters', {
            ...filters,
            tipo: ($event.target as HTMLSelectElement).value || null,
          })
        "
      >
        <option value="">Todos los tipos</option>
        <option value="ingreso">&uarr; Ingresos</option>
        <option value="gasto">&darr; Gastos</option>
      </select>

      <select
        :value="filters.razon || ''"
        aria-label="Filtrar por razón"
        @change="
          $emit('update:filters', {
            ...filters,
            razon: ($event.target as HTMLSelectElement).value || null,
          })
        "
      >
        <option value="">Todas las razones</option>
        <option v-for="[key, label] in reasonOptions" :key="key" :value="key">{{ label }}</option>
      </select>

      <select
        :value="filters.estado || ''"
        aria-label="Filtrar por estado"
        @change="
          $emit('update:filters', {
            ...filters,
            estado: ($event.target as HTMLSelectElement).value || null,
          })
        "
      >
        <option value="">Todos los estados</option>
        <option v-for="[key, label] in statusOptions" :key="key" :value="key">{{ label }}</option>
      </select>

      <select
        :value="filters.subcategory_id || ''"
        aria-label="Filtrar por subcategoría"
        @change="
          $emit('update:filters', {
            ...filters,
            subcategory_id: ($event.target as HTMLSelectElement).value || null,
          })
        "
      >
        <option value="">Todas las subcat.</option>
        <option v-for="s in subcategories" :key="s.id" :value="s.id">
          {{ localizedName(s, locale) }}
        </option>
      </select>

      <select
        :value="filters.type_id || ''"
        aria-label="Filtrar por tipo de transacción"
        @change="
          $emit('update:filters', {
            ...filters,
            type_id: ($event.target as HTMLSelectElement).value || null,
          })
        "
      >
        <option value="">Todos los tipos</option>
        <option v-for="t in types" :key="t.id" :value="t.id">
          {{ localizedName(t, locale) }}
        </option>
      </select>
    </div>

    <div class="filter-group">
      <input
        :value="filters.search"
        type="text"
        placeholder="Buscar en detalle/notas..."
        class="search-input"
        aria-label="Buscar en detalle o notas"
        @input="
          $emit('update:filters', { ...filters, search: ($event.target as HTMLInputElement).value })
        "
      >
      <button class="btn btn-sm" @click="$emit('clear')">Limpiar</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  BalanceFilters,
  BalanceReason,
  BalanceStatus,
} from '~/composables/admin/useAdminBalance'
import { localizedName } from '~/composables/useLocalized'

defineProps<{
  filters: BalanceFilters & { type_id?: string | null }
  availableYears: readonly number[]
  reasonOptions: [BalanceReason, string][]
  statusOptions: [BalanceStatus, string][]
  subcategories: Array<{ id: string; [key: string]: unknown }>
  types: Array<{ id: string; [key: string]: unknown }>
  locale: string
}>()

defineEmits<{
  'update:filters': [value: BalanceFilters & { type_id?: string | null }]
  clear: []
}>()
</script>

<style scoped>
@import './balance-shared.css';
</style>
