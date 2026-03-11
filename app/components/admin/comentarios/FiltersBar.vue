<script setup lang="ts">
import type { CommentStatus, StatusConfig } from '~/composables/admin/useAdminComentarios'

defineProps<{
  activeFilter: CommentStatus | null
  searchQuery: string
  statusTabs: StatusConfig[]
}>()

const emit = defineEmits<{
  (e: 'update:activeFilter', value: CommentStatus | null): void
  (e: 'update:searchQuery', value: string): void
}>()

function onSearchInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:searchQuery', target.value)
}
</script>

<template>
  <div class="filters-bar">
    <div class="filter-group status-filter">
      <button
        v-for="tab in statusTabs"
        :key="tab.label"
        class="filter-btn"
        :class="{ active: activeFilter === tab.value }"
        :style="
          activeFilter === tab.value && tab.value !== null
            ? { backgroundColor: tab.color, color: 'white', borderColor: tab.color }
            : {}
        "
        @click="emit('update:activeFilter', tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>
    <input
      :value="searchQuery"
      type="text"
      placeholder="Buscar por contenido o autor..."
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
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-card);
  align-items: center;
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
  padding: var(--spacing-2) 0.875rem;
  border: none;
  background: var(--bg-primary);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-gray-500);
  transition:
    background 0.2s,
    color 0.2s;
  min-height: 2.75rem;
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
  padding: 0.625rem var(--spacing-3);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  font-size: 0.85rem;
  min-height: 2.75rem;
}

.filter-search:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

@media (max-width: 48em) {
  .filters-bar {
    flex-direction: column;
    padding: var(--spacing-3);
  }

  .status-filter {
    overflow-x: auto;
    width: 100%;
    -webkit-overflow-scrolling: touch;
  }

  .filter-btn {
    white-space: nowrap;
    padding: var(--spacing-2) var(--spacing-3);
  }

  .filter-search {
    min-width: 100%;
  }
}
</style>
