<template>
  <div class="filter-bar">
    <!-- Mobile: toggle button -->
    <button class="filter-toggle" @click="open = !open">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="16" y2="12" />
        <line x1="4" y1="18" x2="12" y2="18" />
      </svg>
      {{ $t('catalog.filters') }}
      <span v-if="activeCount" class="filter-badge">{{ activeCount }}</span>
    </button>

    <!-- Mobile: bottom sheet backdrop -->
    <Transition name="fade">
      <div v-if="open" class="filter-backdrop" @click="open = false" />
    </Transition>

    <!-- Filter panel: bottom sheet on mobile, inline on desktop -->
    <Transition name="slide-up">
      <div v-if="open || isDesktop" class="filter-panel">
        <div class="filter-panel-header">
          <h3>{{ $t('catalog.filters') }}</h3>
          <button class="filter-close" @click="open = false">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div class="filter-list">
          <div v-for="filter in visibleFilters" :key="filter.id" class="filter-item">
            <!-- Desplegable / Select -->
            <template v-if="filter.type === 'desplegable'">
              <label class="filter-label">{{ filterLabel(filter) }}</label>
              <select
                class="filter-select"
                :value="activeFilters[filter.name] || ''"
                @change="onSelectChange(filter.name, $event)"
              >
                <option value="">
                  —
                </option>
                <option
                  v-for="opt in getOptions(filter)"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </option>
              </select>
            </template>

            <!-- Desplegable tick / Multi-select -->
            <template v-else-if="filter.type === 'desplegable_tick'">
              <label class="filter-label">{{ filterLabel(filter) }}</label>
              <div class="filter-checks">
                <label
                  v-for="opt in getOptions(filter)"
                  :key="opt"
                  class="filter-check"
                >
                  <input
                    type="checkbox"
                    :checked="isChecked(filter.name, opt)"
                    @change="onCheckChange(filter.name, opt)"
                  >
                  <span>{{ opt }}</span>
                </label>
              </div>
            </template>

            <!-- Tick / Toggle -->
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

            <!-- Slider / Range -->
            <template v-else-if="filter.type === 'slider'">
              <label class="filter-label">
                {{ filterLabel(filter) }}
                <span v-if="activeFilters[filter.name]" class="filter-value">
                  {{ activeFilters[filter.name] }}{{ filter.unit ? ` ${filter.unit}` : '' }}
                </span>
              </label>
              <input
                type="range"
                class="filter-range"
                :min="getSliderMin(filter)"
                :max="getSliderMax(filter)"
                :step="getSliderStep(filter)"
                :value="activeFilters[filter.name] || getSliderMin(filter)"
                @input="onSliderInput(filter.name, $event)"
              >
              <div class="filter-range-labels">
                <span>{{ getSliderMin(filter) }}{{ filter.unit ? ` ${filter.unit}` : '' }}</span>
                <span>{{ getSliderMax(filter) }}{{ filter.unit ? ` ${filter.unit}` : '' }}</span>
              </div>
            </template>

            <!-- Caja / Text input -->
            <template v-else-if="filter.type === 'caja'">
              <label class="filter-label">{{ filterLabel(filter) }}</label>
              <input
                type="text"
                class="filter-input"
                :value="activeFilters[filter.name] || ''"
                :placeholder="filterLabel(filter)"
                @input="onTextInput(filter.name, $event)"
              >
            </template>

            <!-- Calc / Calculated (display only) -->
            <template v-else-if="filter.type === 'calc'">
              <label class="filter-label">{{ filterLabel(filter) }}</label>
              <span class="filter-calc-value">
                {{ activeFilters[filter.name] || '—' }}
              </span>
            </template>
          </div>
        </div>

        <div v-if="activeCount" class="filter-actions">
          <button class="filter-clear" @click="handleClearAll">
            {{ $t('catalog.clearFilters') }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { FilterDefinition } from '~/composables/useFilters'

const emit = defineEmits<{
  change: []
}>()

const { locale } = useI18n()
const { visibleFilters, activeFilters, setFilter, clearFilter, clearAll } = useFilters()

const open = ref(false)
const isDesktop = useMediaQuery('(min-width: 1024px)')

const activeCount = computed(() => {
  return Object.keys(activeFilters.value).length
})

function filterLabel(filter: FilterDefinition): string {
  if (locale.value === 'en' && filter.label_en) return filter.label_en
  return filter.label_es || filter.name
}

function getOptions(filter: FilterDefinition): string[] {
  const opts = filter.options
  if (Array.isArray(opts?.values)) return opts.values as string[]
  if (Array.isArray(opts)) return opts as string[]
  return []
}

function getSliderMin(filter: FilterDefinition): number {
  return (filter.options?.min as number) || 0
}

function getSliderMax(filter: FilterDefinition): number {
  return (filter.options?.max as number) || 100
}

function getSliderStep(filter: FilterDefinition): number {
  return (filter.options?.step as number) || 1
}

function onSelectChange(name: string, event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (value) {
    setFilter(name, value)
  }
  else {
    clearFilter(name)
  }
  emit('change')
}

function onCheckChange(name: string, option: string) {
  const current = (activeFilters.value[name] as string[]) || []
  const index = current.indexOf(option)
  if (index >= 0) {
    const next = current.filter(v => v !== option)
    if (next.length) {
      setFilter(name, next)
    }
    else {
      clearFilter(name)
    }
  }
  else {
    setFilter(name, [...current, option])
  }
  emit('change')
}

function isChecked(name: string, option: string): boolean {
  const current = (activeFilters.value[name] as string[]) || []
  return current.includes(option)
}

function onTickChange(name: string) {
  if (activeFilters.value[name]) {
    clearFilter(name)
  }
  else {
    setFilter(name, true)
  }
  emit('change')
}

function onSliderInput(name: string, event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  setFilter(name, value)
  emit('change')
}

function onTextInput(name: string, event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (value) {
    setFilter(name, value)
  }
  else {
    clearFilter(name)
  }
  emit('change')
}

function handleClearAll() {
  clearAll()
  emit('change')
}

watch(open, (val) => {
  if (val && !isDesktop.value) {
    document.body.style.overflow = 'hidden'
  }
  else {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
/* Mobile toggle button */
.filter-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  margin: 0 var(--spacing-4) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background: var(--bg-primary);
  min-height: 44px;
}

.filter-badge {
  background: var(--color-primary);
  color: var(--color-white);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  min-width: 20px;
  height: 20px;
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--spacing-1);
}

/* Backdrop */
.filter-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal-backdrop);
  background: rgba(0, 0, 0, 0.5);
}

/* Panel */
.filter-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-modal);
  background: var(--bg-primary);
  border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
  max-height: 80vh;
  overflow-y: auto;
  padding: var(--spacing-4);
}

.filter-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-4);
}

.filter-panel-header h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.filter-close {
  color: var(--text-auxiliary);
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Filter items */
.filter-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.filter-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.filter-value {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

.filter-select {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background: var(--bg-primary);
  min-height: 44px;
}

.filter-input {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  min-height: 44px;
}

/* Tick */
.filter-tick {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  min-height: 44px;
  cursor: pointer;
}

.filter-tick input {
  width: 20px;
  height: 20px;
  accent-color: var(--color-primary);
}

/* Checkboxes */
.filter-checks {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.filter-check {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  min-height: 44px;
  cursor: pointer;
}

.filter-check input {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}

/* Slider */
.filter-range {
  width: 100%;
  accent-color: var(--color-primary);
  min-height: 44px;
}

.filter-range-labels {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

/* Calc */
.filter-calc-value {
  font-size: var(--font-size-base);
  color: var(--text-primary);
}

/* Clear button */
.filter-actions {
  margin-top: var(--spacing-4);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--border-color-light);
}

.filter-clear {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-4);
  border: 1px solid var(--color-error);
  border-radius: var(--border-radius);
  color: var(--color-error);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  min-height: 44px;
  transition: all var(--transition-fast);
}

.filter-clear:hover {
  background: var(--color-error);
  color: var(--color-white);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform var(--transition-base);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

/* Desktop: inline panel, no bottom sheet */
@media (min-width: 1024px) {
  .filter-toggle {
    display: none;
  }

  .filter-backdrop {
    display: none;
  }

  .filter-panel {
    position: static;
    border-radius: var(--border-radius);
    max-height: none;
    border: 1px solid var(--border-color-light);
    padding: var(--spacing-4);
  }

  .filter-close {
    display: none;
  }

  .slide-up-enter-from,
  .slide-up-leave-to {
    transform: none;
  }
}
</style>
