<script setup lang="ts">
import type { AdminVehicleFilters } from '~/composables/admin/useAdminVehicles'
import { localizedName } from '~/composables/useLocalized'

const { t, locale } = useI18n()

interface SubcategoryOption {
  id: string
  name?: Record<string, string> | null
  name_es: string
}

interface TypeOption {
  id: string
  name?: Record<string, string> | null
  name_es: string
}

type OnlineFilter = 'all' | 'online' | 'offline'

const props = defineProps<{
  filters: AdminVehicleFilters
  onlineFilter: OnlineFilter
  subcategories: readonly SubcategoryOption[]
  filteredTypes: readonly TypeOption[]
  hasActiveFilters: boolean
}>()

const emit = defineEmits<{
  'update:filters': [filters: AdminVehicleFilters]
  'update:onlineFilter': [filter: OnlineFilter]
  clear: []
}>()

const statusOptions = computed(() => [
  { value: null, label: t('admin.productos.all') },
  { value: 'published', label: t('admin.productos.published') },
  { value: 'draft', label: t('admin.productos.hidden') },
  { value: 'rented', label: t('admin.productos.rented') },
  { value: 'maintenance', label: t('admin.productos.maintenance') },
  { value: 'sold', label: t('admin.productos.sold') },
])

const categoryOptions = computed(() => [
  { value: null, label: t('admin.productos.allCategories') },
  { value: 'venta', label: t('admin.productos.sale') },
  { value: 'alquiler', label: t('admin.productos.rental') },
  { value: 'terceros', label: t('admin.productos.thirdParty') },
])

const localFilters = computed({
  get: () => props.filters,
  set: (val) => emit('update:filters', val),
})

const localOnlineFilter = computed({
  get: () => props.onlineFilter,
  set: (val) => emit('update:onlineFilter', val),
})
</script>

<template>
  <div class="filters-section">
    <!-- Search -->
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input
        v-model="localFilters.search"
        type="text"
        :placeholder="t('admin.productos.searchPlaceholder')"
      >
      <button v-if="localFilters.search" class="clear-btn" :aria-label="$t('common.clear')" @click="localFilters.search = ''">
        ×
      </button>
    </div>

    <!-- Online/Offline Filter -->
    <div class="filter-group">
      <label class="filter-label">{{ t('admin.productos.typeLabel') }}</label>
      <div class="segment-control">
        <button
          v-for="opt in [
            { value: 'all', label: t('admin.productos.all') },
            { value: 'online', label: t('admin.productos.online') },
            { value: 'offline', label: t('admin.productos.offline') },
          ]"
          :key="opt.value"
          :class="{ active: localOnlineFilter === opt.value }"
          @click="localOnlineFilter = opt.value as OnlineFilter"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Category Filter -->
    <div class="filter-group">
      <label class="filter-label">{{ t('admin.productos.categoryLabel') }}</label>
      <select v-model="localFilters.category">
        <option v-for="opt in categoryOptions" :key="String(opt.value)" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- Status Filter -->
    <div class="filter-group">
      <label class="filter-label">{{ t('admin.productos.statusLabel') }}</label>
      <select v-model="localFilters.status">
        <option v-for="opt in statusOptions" :key="String(opt.value)" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- Subcategory Filter -->
    <div class="filter-group">
      <label class="filter-label">{{ t('admin.productos.subcategoryLabel') }}</label>
      <select v-model="localFilters.subcategory_id">
        <option :value="null">{{ t('admin.productos.allCategories') }}</option>
        <option v-for="sub in subcategories" :key="sub.id" :value="sub.id">
          {{ localizedName(sub, locale) }}
        </option>
      </select>
    </div>

    <!-- Type Filter -->
    <div class="filter-group">
      <label class="filter-label">{{ t('admin.productos.typeLabel') }}</label>
      <select v-model="localFilters.type_id">
        <option :value="null">{{ t('admin.productos.all') }}</option>
        <option v-for="tp in filteredTypes" :key="tp.id" :value="tp.id">
          {{ localizedName(tp, locale) }}
        </option>
      </select>
    </div>

    <!-- Clear Button -->
    <button v-if="hasActiveFilters" class="btn-text-danger" @click="emit('clear')">
      ✕ {{ t('admin.productos.clear') }}
    </button>
  </div>
</template>

<style scoped>
.filters-section {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-3);
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 17.5rem;
}

.search-box .search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--font-size-sm);
  opacity: 0.5;
}

.search-box input {
  width: 100%;
  padding: 0.5rem 2.25rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  transition: border 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.clear-btn {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  cursor: pointer;
  color: var(--text-disabled);
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-sm);
}

.clear-btn:hover {
  background: var(--bg-secondary);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.filter-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-auxiliary);
  white-space: nowrap;
}

.filter-group select {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  background: var(--bg-primary);
  cursor: pointer;
  min-width: 7.5rem;
  transition: border 0.2s;
}

.filter-group select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.segment-control {
  display: flex;
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: 0.125rem;
}

.segment-control button {
  padding: 0.375rem var(--spacing-3);
  border: none;
  background: transparent;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--border-radius);
  transition: all 0.2s;
}

.segment-control button.active {
  background: var(--bg-primary);
  color: var(--color-primary);
  box-shadow: var(--shadow-card);
}

.btn-text-danger {
  background: none;
  border: none;
  color: var(--color-error);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius);
  transition: background 0.2s;
}

.btn-text-danger:hover {
  background: var(--color-error-bg, var(--color-error-bg));
}
</style>
