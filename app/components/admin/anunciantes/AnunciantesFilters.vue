<script setup lang="ts">
import {
  ADVERTISEMENT_STATUSES,
  type AdvertisementStatus,
} from '~/composables/admin/useAdminAnunciantes'

defineProps<{
  statusFilter: AdvertisementStatus | null
  searchText: string
}>()

const emit = defineEmits<{
  (e: 'update-status', status: AdvertisementStatus | null): void
  (e: 'update-search', search: string): void
}>()

function onSearchInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update-search', target.value)
}
</script>

<template>
  <div class="filters-bar">
    <!-- Status filter -->
    <div class="filter-group status-filter">
      <button
        class="filter-btn"
        :class="{ active: statusFilter === null }"
        @click="emit('update-status', null)"
      >
        Todos
      </button>
      <button
        v-for="st in ADVERTISEMENT_STATUSES"
        :key="st.value"
        class="filter-btn"
        :class="{ active: statusFilter === st.value }"
        :style="statusFilter === st.value ? { backgroundColor: st.color, color: 'white' } : {}"
        @click="emit('update-status', st.value)"
      >
        {{ st.label }}
      </button>
    </div>

    <!-- Search -->
    <input
      type="text"
      :value="searchText"
      placeholder="Buscar por nombre, marca, modelo..."
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
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
  padding: 8px 12px;
  border: none;
  background: white;
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
  background: var(--color-primary, #23424a);
  color: white;
}

.filter-btn:hover:not(.active) {
  background: #f3f4f6;
}

.filter-search {
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
}

.filter-search:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
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
