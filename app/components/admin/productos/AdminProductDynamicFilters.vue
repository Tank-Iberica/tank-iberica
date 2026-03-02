<script setup lang="ts">
import type { AdminFilter } from '~/composables/admin/useAdminFilters'

defineProps<{
  dynamicFilters: AdminFilter[]
  getFilterValue: (id: string) => string | number | boolean | undefined
}>()

const emit = defineEmits<{
  'update-filter': [filterId: string, value: string | number | boolean]
}>()
</script>

<template>
  <div class="filters-grid">
    <div v-for="f in dynamicFilters" :key="f.id" class="field-sm">
      <label
        >{{ f.label_es || f.name }} <span v-if="f.unit" class="hint">({{ f.unit }})</span></label
      >
      <input
        v-if="f.type === 'caja'"
        type="text"
        :value="getFilterValue(f.id)"
        @input="emit('update-filter', f.id, ($event.target as HTMLInputElement).value)"
      >
      <template v-else-if="f.type === 'desplegable' || f.type === 'desplegable_tick'">
        <select
          v-if="((f.options?.choices as string[]) || []).length"
          :value="getFilterValue(f.id)"
          @change="emit('update-filter', f.id, ($event.target as HTMLSelectElement).value)"
        >
          <option value="">—</option>
          <option v-for="c in (f.options?.choices as string[]) || []" :key="c" :value="c">
            {{ c }}
          </option>
        </select>
        <input
          v-else
          type="text"
          :value="getFilterValue(f.id)"
          placeholder="Valor libre"
          @input="emit('update-filter', f.id, ($event.target as HTMLInputElement).value)"
        >
      </template>
      <label v-else-if="f.type === 'tick'" class="tick-inline">
        <input
          type="checkbox"
          :checked="!!getFilterValue(f.id)"
          @change="emit('update-filter', f.id, ($event.target as HTMLInputElement).checked)"
        >
        Sí
      </label>
      <input
        v-else
        type="number"
        :value="getFilterValue(f.id)"
        @input="emit('update-filter', f.id, Number(($event.target as HTMLInputElement).value))"
      >
    </div>
  </div>
</template>

<style scoped>
/* Filters grid */
.filters-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding-top: 10px;
}
.field-sm {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.field-sm label {
  font-size: 0.65rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
}
.field-sm input,
.field-sm select {
  padding: 6px 8px;
  border: 1px solid var(--border-color-light);
  border-radius: 4px;
  font-size: 0.8rem;
}
.hint {
  font-weight: normal;
  color: var(--text-disabled);
}
.tick-inline {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  cursor: pointer;
}

@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
