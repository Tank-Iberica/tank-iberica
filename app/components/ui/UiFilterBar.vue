<template>
  <div class="filter-bar" role="toolbar" :aria-label="ariaLabel || 'Filters'">
    <div class="filter-bar-items">
      <slot />
    </div>
    <button
      v-if="showReset && hasActiveFilters"
      class="filter-bar-reset"
      type="button"
      @click="$emit('reset')"
    >
      {{ resetLabel || $t('common.resetFilters', 'Limpiar filtros') }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  ariaLabel?: string
  showReset?: boolean
  hasActiveFilters?: boolean
  resetLabel?: string
}>()

defineEmits<{
  reset: []
}>()
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: var(--spacing-3) 0;
}

.filter-bar-items {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex: 1;
}

.filter-bar-reset {
  font-size: var(--font-size-xs);
  color: var(--color-error);
  font-weight: 500;
  padding: var(--spacing-1) var(--spacing-3);
  min-height: 2rem;
  min-width: auto;
  border-radius: var(--border-radius);
  transition: background var(--transition-fast);
}

.filter-bar-reset:hover {
  background: var(--bg-secondary);
}
</style>
