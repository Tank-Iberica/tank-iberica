<template>
  <template v-for="filter in filters" :key="filter.id">
    <div :class="itemClass">
      <template v-if="filter.type === 'desplegable'">
        <label class="filter-label">{{ filterLabel(filter) }}</label>
        <select
          :class="selectClass"
          :value="activeFilters[filter.name] || ''"
          :aria-label="filterLabel(filter)"
          @change="onSelectChange(filter.name, $event)"
        >
          <option value="">—</option>
          <option v-for="opt in getOptions(filter)" :key="opt" :value="opt">
            {{ opt }}
          </option>
        </select>
      </template>

      <template v-else-if="filter.type === 'desplegable_tick'">
        <label class="filter-label">{{ filterLabel(filter) }}</label>
        <div class="filter-checks">
          <label v-for="opt in getOptions(filter)" :key="opt" class="filter-check">
            <input
              type="checkbox"
              :checked="isChecked(filter.name, opt)"
              @change="onCheckChange(filter.name, opt)"
            >
            <span>{{ opt }}</span>
          </label>
        </div>
      </template>

      <template v-else-if="filter.type === 'tick'">
        <label class="filter-tick">
          <input
            type="checkbox"
            :checked="!!activeFilters[filter.name]"
            @change="onTickChange(filter.name)"
          >
          <span>{{ filterLabel(filter) }}</span>
        </label>
      </template>

      <template v-else-if="filter.type === 'slider' || filter.type === 'calc'">
        <label class="filter-label"
          >{{ filterLabel(filter) }}{{ filter.unit ? ` (${filter.unit})` : '' }}</label
        >
        <div class="filter-dual-range">
          <input
            type="number"
            class="filter-input-sm"
            :value="activeFilters[filter.name + '_min'] || ''"
            :min="getSliderMin(filter)"
            :max="getSliderMax(filter)"
            placeholder="Min"
            :aria-label="`${filterLabel(filter)} min`"
            @change="onRangeChange(filter.name + '_min', $event)"
          >
          <span class="filter-sep">—</span>
          <input
            type="number"
            class="filter-input-sm"
            :value="activeFilters[filter.name + '_max'] || ''"
            :min="getSliderMin(filter)"
            :max="getSliderMax(filter)"
            placeholder="Max"
            :aria-label="`${filterLabel(filter)} max`"
            @change="onRangeChange(filter.name + '_max', $event)"
          >
        </div>
      </template>

      <template v-else-if="filter.type === 'caja'">
        <label class="filter-label">{{ filterLabel(filter) }}</label>
        <input
          type="text"
          :class="textInputClass"
          :value="activeFilters[filter.name] || ''"
          :placeholder="filterLabel(filter)"
          :aria-label="filterLabel(filter)"
          @input="onTextInput(filter.name, $event)"
        >
      </template>
    </div>
  </template>
</template>

<script setup lang="ts">
import type { AttributeDefinition } from '~/composables/useFilters'

const props = defineProps<{
  filters: AttributeDefinition[]
  activeFilters: Record<string, unknown>
  variant: 'mobile' | 'desktop'
}>()

const emit = defineEmits<{
  select: [name: string, value: string]
  check: [name: string, option: string]
  tick: [name: string]
  range: [name: string, value: number | null]
  text: [name: string, value: string]
}>()

const { locale } = useI18n()

const itemClass = computed(() =>
  props.variant === 'mobile' ? 'filter-sheet-item' : 'advanced-panel-item',
)
const selectClass = computed(() =>
  props.variant === 'mobile' ? 'filter-select-mobile' : 'filter-select-desktop',
)
const textInputClass = computed(() =>
  props.variant === 'mobile' ? 'filter-input-mobile' : 'filter-input-desktop',
)

function filterLabel(filter: AttributeDefinition): string {
  if (locale.value === 'en' && filter.label_en) return filter.label_en
  return filter.label_es || filter.name
}

function getOptions(filter: AttributeDefinition): string[] {
  const opts = filter.options
  if (Array.isArray(opts?.values)) return opts.values as string[]
  if (Array.isArray(opts)) return opts as string[]
  return []
}

function getSliderMin(filter: AttributeDefinition): number {
  return (filter.options?.min as number) || 0
}

function getSliderMax(filter: AttributeDefinition): number {
  return (filter.options?.max as number) || 100
}

function isChecked(name: string, option: string): boolean {
  const current = (props.activeFilters[name] as string[]) || []
  return current.includes(option)
}

function onSelectChange(name: string, event: Event) {
  const value = (event.target as HTMLSelectElement).value
  emit('select', name, value)
}

function onCheckChange(name: string, option: string) {
  emit('check', name, option)
}

function onTickChange(name: string) {
  emit('tick', name)
}

function onRangeChange(name: string, event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  emit('range', name, value || null)
}

function onTextInput(name: string, event: Event) {
  const value = (event.target as HTMLInputElement).value
  emit('text', name, value)
}
</script>
