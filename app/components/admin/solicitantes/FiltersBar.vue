<script setup lang="ts">
import { DEMAND_STATUSES, type DemandStatus } from '~/composables/admin/useAdminSolicitantes'

defineProps<{
  currentStatus: DemandStatus | null
  searchQuery: string
}>()

const emit = defineEmits<{
  (e: 'update:status', value: DemandStatus | null): void
  (e: 'update:search', value: string): void
}>()

function onSearchInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:search', target.value)
}
</script>

<template>
  <div class="filters-bar">
    <!-- Status filter -->
    <div class="filter-group status-filter">
      <button
        class="filter-btn"
        :class="{ active: currentStatus === null }"
        @click="emit('update:status', null)"
      >
        Todos
      </button>
      <button
        v-for="st in DEMAND_STATUSES"
        :key="st.value"
        class="filter-btn"
        :class="{ active: currentStatus === st.value }"
        :style="currentStatus === st.value ? { backgroundColor: st.color, color: 'white' } : {}"
        @click="emit('update:status', st.value)"
      >
        {{ st.label }}
      </button>
    </div>

    <!-- Search -->
    <input
      :value="searchQuery"
      type="text"
      placeholder="Buscar por nombre, marca, tipo..."
      class="filter-search"
      @input="onSearchInput"
    >
  </div>
</template>

<style scoped>
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: var(--bg-primary);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  gap: 0;
}

.status-filter {
  border: 1px solid var(--border-color-light);
  border-radius: 6px;
  overflow: hidden;
}

.filter-btn {
  padding: 8px 12px;
  border: none;
  background: var(--bg-primary);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s;
}

.filter-btn:not(:last-child) {
  border-right: 1px solid #e5e7eb;
}

.filter-btn.active {
  background: var(--color-primary);
  color: white;
}

.filter-btn:hover:not(.active) {
  background: var(--bg-secondary);
}

.filter-search {
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
  border: 1px solid var(--border-color-light);
  border-radius: 6px;
  font-size: 0.875rem;
}

.filter-search:focus {
  outline: none;
  border-color: var(--color-primary);
}

@media (max-width: 768px) {
  .filters-bar {
    flex-direction: column;
  }

  .status-filter {
    overflow-x: auto;
    width: 100%;
  }

  .filter-btn {
    white-space: nowrap;
  }
}
</style>
