<template>
  <div class="filters-bar">
    <div class="filter-group">
      <select
        :value="filters.year"
        :aria-label="$t('admin.balance.filterByYear')"
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
        <option :value="''">{{ $t('admin.balance.allYears') }}</option>
        <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
      </select>

      <select
        :value="filters.tipo || ''"
        :aria-label="$t('admin.balance.filterByType')"
        @change="
          $emit('update:filters', {
            ...filters,
            tipo: (($event.target as HTMLSelectElement).value || null) as BalanceType | null,
          })
        "
      >
        <option value="">{{ $t('admin.balance.allTypes') }}</option>
        <option value="ingreso">&uarr; {{ $t('admin.balance.income') }}</option>
        <option value="gasto">&darr; {{ $t('admin.balance.expenses') }}</option>
      </select>

      <select
        :value="filters.razon || ''"
        :aria-label="$t('admin.balance.filterByReason')"
        @change="
          $emit('update:filters', {
            ...filters,
            razon: (($event.target as HTMLSelectElement).value || null) as BalanceReason | null,
          })
        "
      >
        <option value="">{{ $t('admin.balance.allReasons') }}</option>
        <option v-for="[key, label] in reasonOptions" :key="key" :value="key">{{ label }}</option>
      </select>

      <select
        :value="filters.estado || ''"
        :aria-label="$t('admin.balance.filterByStatus')"
        @change="
          $emit('update:filters', {
            ...filters,
            estado: (($event.target as HTMLSelectElement).value || null) as BalanceStatus | null,
          })
        "
      >
        <option value="">{{ $t('admin.balance.allStatuses') }}</option>
        <option v-for="[key, label] in statusOptions" :key="key" :value="key">{{ label }}</option>
      </select>

      <select
        :value="filters.subcategory_id || ''"
        :aria-label="$t('admin.balance.filterBySubcategory')"
        @change="
          $emit('update:filters', {
            ...filters,
            subcategory_id: ($event.target as HTMLSelectElement).value || null,
          })
        "
      >
        <option value="">{{ $t('admin.balance.allSubcategories') }}</option>
        <option v-for="s in subcategories" :key="s.id" :value="s.id">
          {{ localizedName(s, locale) }}
        </option>
      </select>

      <select
        :value="filters.type_id || ''"
        :aria-label="$t('admin.balance.filterByTransactionType')"
        @change="
          $emit('update:filters', {
            ...filters,
            type_id: ($event.target as HTMLSelectElement).value || null,
          })
        "
      >
        <option value="">{{ $t('admin.balance.allTypes') }}</option>
        <option v-for="t in types" :key="t.id" :value="t.id">
          {{ localizedName(t, locale) }}
        </option>
      </select>
    </div>

    <div class="filter-group">
      <input
        :value="filters.search"
        type="text"
        :placeholder="$t('admin.balance.searchPlaceholder')"
        class="search-input"
        :aria-label="$t('admin.balance.searchInDetailNotes')"
        @input="
          $emit('update:filters', { ...filters, search: ($event.target as HTMLInputElement).value })
        "
      >
      <button class="btn btn-sm" @click="$emit('clear')">{{ $t('admin.balance.clear') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  BalanceFilters,
  BalanceReason,
  BalanceStatus,
  BalanceType,
} from '~/composables/admin/useAdminBalance'
import { localizedName } from '~/composables/useLocalized'

interface LocalizableItem {
  id: string
  name?: Record<string, string> | null
  name_es?: string
  name_en?: string | null
  [key: string]: unknown
}

defineProps<{
  filters: BalanceFilters & {
    tipo?: string | null
    razon?: string | null
    estado?: string | null
    type_id?: string | null
  }
  availableYears: readonly number[]
  reasonOptions: [BalanceReason, string][]
  statusOptions: [BalanceStatus, string][]
  subcategories: readonly LocalizableItem[]
  types: readonly LocalizableItem[]
  locale: string
}>()

defineEmits<{
  'update:filters': [
    value: BalanceFilters & {
      tipo?: string | null
      razon?: string | null
      estado?: string | null
      type_id?: string | null
    },
  ]
  clear: []
}>()
</script>

<style scoped>
@import './balance-shared.css';
</style>
