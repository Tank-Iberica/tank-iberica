<script setup lang="ts">
import type { AdminFilter } from '~/composables/admin/useAdminFilters'

interface Props {
  open: boolean
  dynamicFilters: AdminFilter[]
  getFilterValue: (id: string) => string | number | boolean | undefined
}

defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update-filter': [filterId: string, value: string | number | boolean]
}>()
</script>

<template>
  <div v-if="dynamicFilters.length" class="section collapsible">
    <button class="section-toggle" @click="emit('update:open', !open)">
      <span>Filtros ({{ dynamicFilters.length }})</span>
      <span>{{ open ? '&minus;' : '+' }}</span>
    </button>
    <div v-if="open" class="section-content">
      <AdminProductDynamicFilters
        :dynamic-filters="dynamicFilters"
        :get-filter-value="getFilterValue"
        @update-filter="
          (id: string, val: string | number | boolean) => emit('update-filter', id, val)
        "
      />
    </div>
  </div>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-xs);
}
.collapsible {
  padding: 0;
}
.section-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-4);
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-gray-700);
  text-transform: uppercase;
}
.section-toggle:hover {
  background: var(--color-gray-50);
}
.section-content {
  padding: 0 var(--spacing-4) var(--spacing-4);
  border-top: 1px solid var(--color-gray-100);
}
</style>
