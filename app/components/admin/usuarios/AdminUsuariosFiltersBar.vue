<script setup lang="ts">
import { USER_ROLES, type UserRole } from '~/composables/admin/useAdminUsuariosPage'

defineProps<{
  role: UserRole | null | undefined
  search: string | undefined
}>()

const emit = defineEmits<{
  (e: 'filter-role', value: UserRole | null): void
  (e: 'filter-search', value: string): void
}>()

function onSearchInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('filter-search', target.value)
}
</script>

<template>
  <div class="filters-bar">
    <div class="filter-group status-filter">
      <button
        class="filter-btn"
        :class="{ active: role === null || role === undefined }"
        @click="emit('filter-role', null)"
      >
        Todos
      </button>
      <button
        v-for="r in USER_ROLES"
        :key="r.value"
        class="filter-btn"
        :class="{ active: role === r.value }"
        :style="role === r.value ? { backgroundColor: r.color, color: 'white' } : {}"
        @click="emit('filter-role', r.value)"
      >
        {{ r.label }}
      </button>
    </div>
    <input
      :value="search"
      type="text"
      placeholder="Buscar por nombre, email, pseudónimo..."
      class="filter-search"
      @input="onSearchInput"
    />
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
