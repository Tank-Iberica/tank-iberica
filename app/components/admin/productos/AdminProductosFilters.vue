<script setup lang="ts">
import type { AdminVehicleFilters } from '~/composables/admin/useAdminVehicles'

interface SubcategoryOption {
  id: string
  name_es: string
}

interface TypeOption {
  id: string
  name_es: string
}

type OnlineFilter = 'all' | 'online' | 'offline'

const props = defineProps<{
  filters: AdminVehicleFilters
  onlineFilter: OnlineFilter
  subcategories: SubcategoryOption[]
  filteredTypes: TypeOption[]
  hasActiveFilters: boolean
}>()

const emit = defineEmits<{
  'update:filters': [filters: AdminVehicleFilters]
  'update:onlineFilter': [filter: OnlineFilter]
  clear: []
}>()

const statusOptions = [
  { value: null, label: 'Todos' },
  { value: 'published', label: 'Publicado' },
  { value: 'draft', label: 'Oculto' },
  { value: 'rented', label: 'Alquilado' },
  { value: 'maintenance', label: 'Taller' },
  { value: 'sold', label: 'Vendido' },
]

const categoryOptions = [
  { value: null, label: 'Todas' },
  { value: 'venta', label: 'Venta' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'terceros', label: 'Terceros' },
]

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
      <input v-model="localFilters.search" type="text" placeholder="Buscar marca, modelo..." >
      <button v-if="localFilters.search" class="clear-btn" @click="localFilters.search = ''">
        ×
      </button>
    </div>

    <!-- Online/Offline Filter -->
    <div class="filter-group">
      <label class="filter-label">Tipo:</label>
      <div class="segment-control">
        <button
          v-for="opt in [
            { value: 'all', label: 'Todos' },
            { value: 'online', label: 'Online' },
            { value: 'offline', label: 'Offline' },
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
      <label class="filter-label">Categoría:</label>
      <select v-model="localFilters.category">
        <option v-for="opt in categoryOptions" :key="String(opt.value)" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- Status Filter -->
    <div class="filter-group">
      <label class="filter-label">Estado:</label>
      <select v-model="localFilters.status">
        <option v-for="opt in statusOptions" :key="String(opt.value)" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- Subcategory Filter -->
    <div class="filter-group">
      <label class="filter-label">Subcat.:</label>
      <select v-model="localFilters.subcategory_id">
        <option :value="null">Todas</option>
        <option v-for="sub in subcategories" :key="sub.id" :value="sub.id">
          {{ sub.name_es }}
        </option>
      </select>
    </div>

    <!-- Type Filter -->
    <div class="filter-group">
      <label class="filter-label">Tipo:</label>
      <select v-model="localFilters.type_id">
        <option :value="null">Todos</option>
        <option v-for="t in filteredTypes" :key="t.id" :value="t.id">
          {{ t.name_es }}
        </option>
      </select>
    </div>

    <!-- Clear Button -->
    <button v-if="hasActiveFilters" class="btn-text-danger" @click="emit('clear')">
      ✕ Limpiar
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
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: border 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
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
  color: #94a3b8;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.clear-btn:hover {
  background: #f1f5f9;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  min-width: 120px;
  transition: border 0.2s;
}

.filter-group select:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
}

.segment-control {
  display: flex;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 2px;
}

.segment-control button {
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.segment-control button.active {
  background: white;
  color: var(--color-primary, #23424a);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-text-danger {
  background: none;
  border: none;
  color: #dc2626;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}

.btn-text-danger:hover {
  background: #fef2f2;
}
</style>
