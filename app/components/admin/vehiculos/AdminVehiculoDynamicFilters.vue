<script setup lang="ts">
import type { FilterDefinition, FilterOptionValue } from '~/composables/admin/useAdminVehicleDetail'

const props = defineProps<{
  filters: FilterDefinition[]
  attributesJson: Record<string, unknown>
}>()

const emit = defineEmits<{
  (e: 'update:attributesJson', value: Record<string, unknown>): void
}>()

function getSliderMin(options: FilterOptionValue): number | undefined {
  if (options && typeof options === 'object' && !Array.isArray(options)) {
    return options.min
  }
  return undefined
}

function getSliderMax(options: FilterOptionValue): number | undefined {
  if (options && typeof options === 'object' && !Array.isArray(options)) {
    return options.max
  }
  return undefined
}

function updateAttribute(fieldName: string, value: unknown) {
  emit('update:attributesJson', { ...props.attributesJson, [fieldName]: value })
}

function getOptionsArray(filter: FilterDefinition): string[] {
  if (Array.isArray(filter.options)) return filter.options
  return []
}
</script>

<template>
  <section v-if="filters.length > 0" class="form-section">
    <h2 class="section-title">Especificaciones</h2>
    <div class="filters-grid">
      <div v-for="filter in filters" :key="filter.id" class="form-group">
        <label class="form-label">{{ filter.label_es }}</label>
        <!-- Caja (text input) -->
        <input
          v-if="filter.type === 'caja'"
          :value="attributesJson[filter.name]"
          type="text"
          class="form-input"
          @input="updateAttribute(filter.name, ($event.target as HTMLInputElement).value)"
        >
        <!-- Desplegable (select) -->
        <select
          v-else-if="filter.type === 'desplegable'"
          class="form-select"
          :value="attributesJson[filter.name] ?? ''"
          @change="updateAttribute(filter.name, ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Seleccionar...</option>
          <option v-for="opt in getOptionsArray(filter)" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        <!-- Tick (checkbox) -->
        <label v-else-if="filter.type === 'tick'" class="checkbox-label">
          <input
            type="checkbox"
            :checked="!!attributesJson[filter.name]"
            @change="updateAttribute(filter.name, ($event.target as HTMLInputElement).checked)"
          >
          <span>Sí</span>
        </label>
        <!-- Slider (number) -->
        <input
          v-else-if="filter.type === 'slider'"
          :value="attributesJson[filter.name]"
          type="number"
          class="form-input"
          :min="getSliderMin(filter.options)"
          :max="getSliderMax(filter.options)"
          @input="
            updateAttribute(filter.name, Number(($event.target as HTMLInputElement).value) || null)
          "
        >
        <!-- Default: text -->
        <input
          v-else
          :value="attributesJson[filter.name]"
          type="text"
          class="form-input"
          @input="updateAttribute(filter.name, ($event.target as HTMLInputElement).value)"
        >
      </div>
    </div>
  </section>
</template>

<style scoped>
.form-section {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-4);
  padding-bottom: var(--spacing-3);
  border-bottom: 1px solid var(--border-color);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.form-input,
.form-select {
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  min-height: 44px;
  transition: border-color var(--transition-fast);
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-4);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;
  min-height: 44px;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
}
</style>
