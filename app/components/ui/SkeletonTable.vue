<script setup lang="ts">
/**
 * Skeleton table — placeholder for admin data tables.
 *
 * Usage:
 *   <UiSkeletonTable />                     — 5 rows, 4 columns
 *   <UiSkeletonTable :rows="8" :cols="6" />
 */

withDefaults(
  defineProps<{
    rows?: number
    cols?: number
  }>(),
  {
    rows: 5,
    cols: 4,
  },
)

const colWidths = ['60%', '45%', '80%', '35%', '55%', '70%', '40%', '65%']
</script>

<template>
  <div class="skeleton-table" aria-hidden="true">
    <!-- Header row -->
    <div class="skeleton-table__row skeleton-table__row--header">
      <div v-for="c in cols" :key="`h-${c}`" class="skeleton-table__cell">
        <UiSkeleton :width="colWidths[(c - 1) % colWidths.length]" height="0.75rem" />
      </div>
    </div>
    <!-- Data rows -->
    <div v-for="r in rows" :key="r" class="skeleton-table__row">
      <div v-for="c in cols" :key="`${r}-${c}`" class="skeleton-table__cell">
        <UiSkeleton :width="colWidths[(r + c) % colWidths.length]" height="0.875rem" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-table {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.skeleton-table__row {
  display: grid;
  grid-template-columns: repeat(v-bind(cols), 1fr);
  gap: var(--spacing-4);
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--border-color-light);
}

.skeleton-table__row:last-child {
  border-bottom: none;
}

.skeleton-table__row--header {
  background: var(--bg-secondary);
  padding: var(--spacing-3) var(--spacing-4);
}

.skeleton-table__cell {
  display: flex;
  align-items: center;
}
</style>
