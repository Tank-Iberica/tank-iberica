<script setup lang="ts">
import type { AdminFilter } from '~/composables/admin/useAdminFilters'

interface Props {
  open: boolean
  filters: AdminFilter[]
  attributesJson: Record<string, unknown>
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'update-filter', id: string, value: string | number | boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function getFilterValue(id: string): string | number | boolean | undefined {
  return props.attributesJson[id] as string | number | boolean | undefined
}
</script>

<template>
  <div v-if="filters.length" class="section collapsible">
    <button class="section-toggle" @click="emit('update:open', !open)">
      <span>Filtros ({{ filters.length }})</span>
      <span>{{ open ? '−' : '+' }}</span>
    </button>
    <div v-if="open" class="section-content">
      <div class="filters-grid">
        <div v-for="f in filters" :key="f.id" class="field-sm">
          <label>
            {{ f.label_es || f.name }}
            <span v-if="f.unit" class="hint">({{ f.unit }})</span>
          </label>
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
.filters-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.625rem;
  padding-top: 0.625rem;
}
.field-sm {
  display: flex;
  flex-direction: column;
  gap: 0.1875rem;
}
.field-sm label {
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--color-gray-500);
  text-transform: uppercase;
}
.field-sm input,
.field-sm select {
  padding: 0.375rem var(--spacing-2);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-sm);
  font-size: 0.8rem;
}
.hint {
  font-weight: normal;
  color: var(--text-disabled);
}
.tick-inline {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: 0.8rem;
  cursor: pointer;
}

@media (max-width: 48em) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
