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
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-5);
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-card);
}

.filter-group {
  display: flex;
  gap: 0;
}

.status-filter {
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.filter-btn {
  padding: var(--spacing-2) var(--spacing-3);
  border: none;
  background: var(--bg-primary);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-gray-500);
  transition: all 0.2s;
}

.filter-btn:not(:last-child) {
  border-right: 1px solid var(--color-gray-200);
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
  min-width: 12.5rem;
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
}

.filter-search:focus {
  outline: none;
  border-color: var(--color-primary);
}

@media (max-width: 48em) {
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
