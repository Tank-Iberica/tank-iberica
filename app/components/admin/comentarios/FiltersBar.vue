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
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  align-items: center;
}

.filter-group {
  display: flex;
  gap: 0;
}

.status-filter {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.filter-btn {
  padding: 8px 14px;
  border: none;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
  transition:
    background 0.2s,
    color 0.2s;
  min-height: 44px;
}

.filter-btn:not(:last-child) {
  border-right: 1px solid #e5e7eb;
}

.filter-btn.active {
  background: var(--color-primary, #23424a);
  color: white;
}

.filter-btn:hover:not(.active) {
  background: #f3f4f6;
}

.filter-search {
  flex: 1;
  min-width: 200px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.85rem;
  min-height: 44px;
}

.filter-search:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

@media (max-width: 768px) {
  .filters-bar {
    flex-direction: column;
    padding: 12px;
  }

  .status-filter {
    overflow-x: auto;
    width: 100%;
    -webkit-overflow-scrolling: touch;
  }

  .filter-btn {
    white-space: nowrap;
    padding: 8px 12px;
  }

  .filter-search {
    min-width: 100%;
  }
}
</style>
