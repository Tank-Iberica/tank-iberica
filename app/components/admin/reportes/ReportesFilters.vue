<script setup lang="ts">
defineProps<{
  activeFilter: string
  filters: { value: string; labelKey: string }[]
}>()

const emit = defineEmits<{
  'update:activeFilter': [value: string]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="filters-bar">
    <div class="filter-group status-filter">
      <button
        v-for="f in filters"
        :key="f.value"
        class="filter-btn"
        :class="{ active: activeFilter === f.value }"
        @click="emit('update:activeFilter', f.value)"
      >
        {{ t(f.labelKey) }}
      </button>
    </div>
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
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
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
  white-space: nowrap;
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
</style>
