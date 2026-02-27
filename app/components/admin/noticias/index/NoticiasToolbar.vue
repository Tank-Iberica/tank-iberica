<script setup lang="ts">
import type { AdminNewsFilters } from '~/composables/admin/useAdminNews'
import type { StatusOption, CategoryOption } from '~/composables/admin/useAdminNoticiasIndex'

defineProps<{
  filters: AdminNewsFilters
  statusOptions: StatusOption[]
  categoryOptions: CategoryOption[]
  hasActiveFilters: boolean
}>()

const emit = defineEmits<{
  (e: 'update:search', value: string): void
  (e: 'update:category' | 'update:status', value: string | null): void
  (e: 'clear-filters'): void
}>()

function onSearchInput(event: Event) {
  const input = event.target as HTMLInputElement
  emit('update:search', input.value)
}

function onCategoryChange(event: Event) {
  const select = event.target as HTMLSelectElement
  const value = select.value === '' ? null : select.value
  emit('update:category', value)
}

function onStatusChange(event: Event) {
  const select = event.target as HTMLSelectElement
  const value = select.value === '' ? null : select.value
  emit('update:status', value)
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-row">
      <div class="search-box">
        <svg
          class="search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          :value="filters.search"
          type="text"
          placeholder="Buscar por titulo..."
          class="search-input"
          @input="onSearchInput"
        >
      </div>

      <div class="filter-group">
        <select :value="filters.category ?? ''" class="filter-select" @change="onCategoryChange">
          <option v-for="opt in categoryOptions" :key="String(opt.value)" :value="opt.value ?? ''">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <select :value="filters.status ?? ''" class="filter-select" @change="onStatusChange">
          <option v-for="opt in statusOptions" :key="String(opt.value)" :value="opt.value ?? ''">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <button v-if="hasActiveFilters" class="btn btn-sm" @click="$emit('clear-filters')">
        Limpiar
      </button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.toolbar-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #e2e8f0;
  background: white;
  color: #374151;
  transition: all 0.15s;
}

.btn:hover {
  background: #f8fafc;
}
.btn-sm {
  padding: 4px 12px;
  font-size: 0.8rem;
}

@media (max-width: 767px) {
  .toolbar-row {
    flex-direction: column;
  }

  .search-box {
    min-width: auto;
    width: 100%;
  }

  .filter-group {
    width: 100%;
  }

  .filter-select {
    width: 100%;
  }
}
</style>
