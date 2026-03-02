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
      <button v-if="localFilters.search" class="clear-btn" @click="localFilters.search = ''">
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
  gap: 12px;
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 280px;
}

.search-box .search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  opacity: 0.5;
}

.search-box input {
  width: 100%;
  padding: 8px 36px 8px 36px;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-size: 14px;
  transition: border 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-disabled);
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.clear-btn:hover {
  background: var(--bg-secondary);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-auxiliary);
  white-space: nowrap;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-primary);
  cursor: pointer;
  min-width: 120px;
  transition: border 0.2s;
}

.filter-group select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.segment-control {
  display: flex;
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 2px;
}

.segment-control button {
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: var(--text-auxiliary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.segment-control button.active {
  background: var(--bg-primary);
  color: var(--color-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-text-danger {
  background: none;
  border: none;
  color: var(--color-error);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}

.btn-text-danger:hover {
  background: var(--color-error-bg, #fef2f2);
}
</style>
