<script setup lang="ts">
defineProps<{
  activeTab: string
}>()

defineEmits<{
  'update:activeTab': [value: string]
}>()

const tabs = [
  { value: 'all', label: 'Todos' },
  { value: 'qualifying', label: 'Calificacion' },
  { value: 'active', label: 'En curso' },
  { value: 'closed', label: 'Cerrados' },
]
</script>

<template>
  <div class="status-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      class="tab-btn"
      :class="{ active: activeTab === tab.value }"
      @click="$emit('update:activeTab', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.status-tabs {
  display: flex;
  gap: var(--spacing-2);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-btn {
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border-color);
  white-space: nowrap;
  min-height: 2.75rem;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  background: var(--bg-secondary);
}

.tab-btn.active {
  background: var(--color-primary);
  color: var(--text-on-dark-primary);
  border-color: var(--color-primary);
}
</style>
