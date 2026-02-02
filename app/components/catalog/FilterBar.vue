<template>
  <section v-if="hasFilters" class="filters-section">
    <!-- MOBILE: Toggle button (< 768px) -->
    <button class="filter-toggle" @click="open = !open">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="16" y2="12" />
        <line x1="4" y1="18" x2="12" y2="18" />
      </svg>
      {{ $t('catalog.filters') }}
      <span v-if="totalActiveCount" class="filter-badge">{{ totalActiveCount }}</span>
    </button>

    <!-- MOBILE: Bottom sheet backdrop -->
    <Transition name="fade">
      <div v-if="open" class="filter-backdrop" @click="open = false" />
    </Transition>

    <!-- MOBILE: Bottom sheet panel -->
    <Transition name="slide-up">
      <div v-if="open" class="filter-sheet">
        <div class="filter-sheet-header">
          <h3>{{ $t('catalog.filters') }}</h3>
          <button class="filter-close" @click="open = false">&#215;</button>
        </div>
        <div class="filter-sheet-body">
          <!-- Static: Price -->
          <div class="filter-sheet-item">
            <label class="filter-label">{{ $t('catalog.price') }} (€)</label>
            <div class="filter-dual-range">
              <input
                type="number"
                class="filter-input-sm"
                :value="priceMin"
                min="0"
                max="200000"
                step="100"
                placeholder="Min"
                @change="onPriceMinChange"
              >
              <span class="filter-sep">—</span>
              <input
                type="number"
                class="filter-input-sm"
                :value="priceMax"
                min="0"
                max="200000"
                step="100"
                placeholder="Max"
                @change="onPriceMaxChange"
              >
            </div>
          </div>

          <!-- Static: Brand -->
          <div class="filter-sheet-item">
            <label class="filter-label">{{ $t('catalog.brand') }}</label>
            <select class="filter-select-mobile" :value="selectedBrand" @change="onBrandChange">
              <option value="">{{ $t('catalog.all') || '—' }}</option>
              <option v-for="b in brands" :key="b" :value="b">{{ b }}</option>
            </select>
          </div>

          <!-- Static: Year -->
          <div class="filter-sheet-item">
            <label class="filter-label">{{ $t('catalog.year') }}</label>
            <div class="filter-dual-range">
              <input
                type="number"
                class="filter-input-sm"
                :value="yearMin"
                min="1900"
                :max="currentYear"
                placeholder="Min"
                @change="onYearMinChange"
              >
              <span class="filter-sep">—</span>
              <input
                type="number"
                class="filter-input-sm"
                :value="yearMax"
                min="1900"
                :max="currentYear"
                :placeholder="String(currentYear)"
                @change="onYearMaxChange"
              >
            </div>
          </div>

          <!-- Dynamic filters -->
          <template v-for="filter in visibleFilters" :key="filter.id">
            <div class="filter-sheet-item">
              <template v-if="filter.type === 'desplegable'">
                <label class="filter-label">{{ filterLabel(filter) }}</label>
                <select class="filter-select-mobile" :value="activeFilters[filter.name] || ''" @change="onSelectChange(filter.name, $event)">
                  <option value="">—</option>
                  <option v-for="opt in getOptions(filter)" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </template>

              <template v-else-if="filter.type === 'desplegable_tick'">
                <label class="filter-label">{{ filterLabel(filter) }}</label>
                <div class="filter-checks">
                  <label v-for="opt in getOptions(filter)" :key="opt" class="filter-check">
                    <input type="checkbox" :checked="isChecked(filter.name, opt)" @change="onCheckChange(filter.name, opt)">
                    <span>{{ opt }}</span>
                  </label>
                </div>
              </template>

              <template v-else-if="filter.type === 'tick'">
                <label class="filter-tick">
                  <input type="checkbox" :checked="!!activeFilters[filter.name]" @change="onTickChange(filter.name)">
                  <span>{{ filterLabel(filter) }}</span>
                </label>
              </template>

              <template v-else-if="filter.type === 'slider' || filter.type === 'calc'">
                <label class="filter-label">{{ filterLabel(filter) }}{{ filter.unit ? ` (${filter.unit})` : '' }}</label>
                <div class="filter-dual-range">
                  <input
                    type="number"
                    class="filter-input-sm"
                    :value="activeFilters[filter.name + '_min'] || ''"
                    :min="getSliderMin(filter)"
                    :max="getSliderMax(filter)"
                    placeholder="Min"
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
                    @change="onRangeChange(filter.name + '_max', $event)"
                  >
                </div>
              </template>

              <template v-else-if="filter.type === 'caja'">
                <label class="filter-label">{{ filterLabel(filter) }}</label>
                <input
                  type="text"
                  class="filter-input-mobile"
                  :value="activeFilters[filter.name] || ''"
                  :placeholder="filterLabel(filter)"
                  @input="onTextInput(filter.name, $event)"
                >
              </template>
            </div>
          </template>

          <button v-if="totalActiveCount" class="btn-clear-filters-mobile" @click="handleClearAll">
            {{ $t('catalog.clearFilters') }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- DESKTOP: Inline horizontal scrollable bar (≥ 768px) -->
    <div class="filters-desktop">
      <div class="filters-container">
        <button
          v-show="canScrollLeft"
          class="scroll-btn scroll-btn-left"
          aria-hidden="true"
          @click="scrollLeft"
        >
          &#9664;
        </button>

        <div
          ref="scrollContainer"
          class="filters-wrapper"
          @scroll="updateScrollState"
          @mousedown="onGrabStart"
        >
          <!-- Static: Price -->
          <div class="filter-group">
            <span class="filter-label">{{ $t('catalog.price') }} (€)</span>
            <div class="filter-range-inputs">
              <input
                type="number"
                class="filter-input-inline"
                :value="priceMin"
                min="0"
                max="200000"
                step="100"
                placeholder="Min"
                @change="onPriceMinChange"
              >
              <span class="filter-dash">-</span>
              <input
                type="number"
                class="filter-input-inline"
                :value="priceMax"
                min="0"
                max="200000"
                step="100"
                placeholder="Max"
                @change="onPriceMaxChange"
              >
            </div>
          </div>

          <!-- Static: Brand -->
          <div class="filter-group">
            <span class="filter-label">{{ $t('catalog.brand') }}:</span>
            <select class="filter-select-inline" :value="selectedBrand" @change="onBrandChange">
              <option value="">{{ $t('catalog.all') || '—' }}</option>
              <option v-for="b in brands" :key="b" :value="b">{{ b }}</option>
            </select>
          </div>

          <!-- Static: Year -->
          <div class="filter-group">
            <span class="filter-label">{{ $t('catalog.year') }}:</span>
            <div class="filter-range-inputs">
              <input
                type="number"
                class="filter-input-inline"
                :value="yearMin"
                min="1900"
                :max="currentYear"
                placeholder="Min"
                @change="onYearMinChange"
              >
              <span class="filter-dash">-</span>
              <input
                type="number"
                class="filter-input-inline"
                :value="yearMax"
                min="1900"
                :max="currentYear"
                :placeholder="String(currentYear)"
                @change="onYearMaxChange"
              >
            </div>
          </div>

          <!-- Dynamic filters -->
          <template v-for="filter in visibleFilters" :key="filter.id">
            <div class="filter-group">
              <template v-if="filter.type === 'desplegable'">
                <span class="filter-label">{{ filterLabel(filter) }}:</span>
                <select class="filter-select-inline" :value="activeFilters[filter.name] || ''" @change="onSelectChange(filter.name, $event)">
                  <option value="">—</option>
                  <option v-for="opt in getOptions(filter)" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </template>

              <template v-else-if="filter.type === 'desplegable_tick'">
                <span class="filter-label">{{ filterLabel(filter) }}:</span>
                <div class="filter-checks-inline">
                  <label v-for="opt in getOptions(filter)" :key="opt" class="cb">
                    <input type="checkbox" :checked="isChecked(filter.name, opt)" @change="onCheckChange(filter.name, opt)">
                    <span>{{ opt }}</span>
                  </label>
                </div>
              </template>

              <template v-else-if="filter.type === 'tick'">
                <label class="cb">
                  <input type="checkbox" :checked="!!activeFilters[filter.name]" @change="onTickChange(filter.name)">
                  <span>{{ filterLabel(filter) }}</span>
                </label>
              </template>

              <template v-else-if="filter.type === 'slider' || filter.type === 'calc'">
                <span class="filter-label">{{ filterLabel(filter) }}{{ filter.unit ? ` (${filter.unit})` : '' }}:</span>
                <div class="filter-range-inputs">
                  <input
                    type="number"
                    class="filter-input-inline"
                    :value="activeFilters[filter.name + '_min'] || ''"
                    :min="getSliderMin(filter)"
                    :max="getSliderMax(filter)"
                    placeholder="Min"
                    @change="onRangeChange(filter.name + '_min', $event)"
                  >
                  <span class="filter-dash">-</span>
                  <input
                    type="number"
                    class="filter-input-inline"
                    :value="activeFilters[filter.name + '_max'] || ''"
                    :min="getSliderMin(filter)"
                    :max="getSliderMax(filter)"
                    placeholder="Max"
                    @change="onRangeChange(filter.name + '_max', $event)"
                  >
                </div>
              </template>

              <template v-else-if="filter.type === 'caja'">
                <span class="filter-label">{{ filterLabel(filter) }}:</span>
                <input
                  type="text"
                  class="filter-input-inline"
                  :value="activeFilters[filter.name] || ''"
                  :placeholder="filterLabel(filter)"
                  @input="onTextInput(filter.name, $event)"
                >
              </template>
            </div>
          </template>

          <!-- Clear filters inline -->
          <button v-if="totalActiveCount" class="btn-clear-filters" @click="handleClearAll">
            {{ $t('catalog.clearFilters') }}
          </button>
        </div>

        <button
          v-show="canScrollRight"
          class="scroll-btn scroll-btn-right"
          aria-hidden="true"
          @click="scrollRight"
        >
          &#9654;
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { FilterDefinition } from '~/composables/useFilters'

const emit = defineEmits<{
  change: []
}>()

const { locale } = useI18n()
const { visibleFilters, activeFilters, setFilter, clearFilter, clearAll } = useFilters()
const { updateFilters, filters } = useCatalogState()

const open = ref(false)
const currentYear = new Date().getFullYear()

const scrollContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

// Always show if there's at least static filters (price, brand, year)
const hasFilters = computed(() => true)

// Static filter values
const priceMin = computed(() => filters.value.price_min ?? null)
const priceMax = computed(() => filters.value.price_max ?? null)
const yearMin = computed(() => filters.value.year_min ?? null)
const yearMax = computed(() => filters.value.year_max ?? null)
const selectedBrand = computed(() => filters.value.brand ?? '')

// Brand list — will be dynamic from vehicles eventually
const brands = [
  'DAF', 'Iveco', 'MAN', 'Mercedes', 'Renault', 'Scania', 'Volvo',
]

const totalActiveCount = computed(() => {
  let count = Object.keys(activeFilters.value).length
  if (priceMin.value) count++
  if (priceMax.value) count++
  if (yearMin.value) count++
  if (yearMax.value) count++
  if (selectedBrand.value) count++
  return count
})

// Static filter handlers
function onPriceMinChange(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  updateFilters({ price_min: val || undefined })
  emit('change')
}

function onPriceMaxChange(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  updateFilters({ price_max: val || undefined })
  emit('change')
}

function onBrandChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  updateFilters({ brand: val || undefined })
  emit('change')
}

function onYearMinChange(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  updateFilters({ year_min: val || undefined })
  emit('change')
}

function onYearMaxChange(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  updateFilters({ year_max: val || undefined })
  emit('change')
}

// Dynamic filter helpers
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

function onSelectChange(name: string, event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (value) setFilter(name, value)
  else clearFilter(name)
  emit('change')
}

function onCheckChange(name: string, option: string) {
  const current = (activeFilters.value[name] as string[]) || []
  const index = current.indexOf(option)
  if (index >= 0) {
    const next = current.filter(v => v !== option)
    if (next.length) setFilter(name, next)
    else clearFilter(name)
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
  if (activeFilters.value[name]) clearFilter(name)
  else setFilter(name, true)
  emit('change')
}

function onRangeChange(name: string, event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (value) setFilter(name, value)
  else clearFilter(name)
  emit('change')
}

function onTextInput(name: string, event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (value) setFilter(name, value)
  else clearFilter(name)
  emit('change')
}

function handleClearAll() {
  clearAll()
  updateFilters({ price_min: undefined, price_max: undefined, year_min: undefined, year_max: undefined, brand: undefined })
  open.value = false
  emit('change')
}

// Scroll management
function updateScrollState() {
  const el = scrollContainer.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 0
  canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 1
}

function scrollLeft() {
  scrollContainer.value?.scrollBy({ left: -200, behavior: 'smooth' })
}

function scrollRight() {
  scrollContainer.value?.scrollBy({ left: 200, behavior: 'smooth' })
}

// Grab-to-scroll
let isGrabbing = false
let startX = 0
let scrollLeftStart = 0

function onGrabStart(e: MouseEvent) {
  const el = scrollContainer.value
  if (!el) return
  // Don't grab if clicking on an input/select/button
  const tag = (e.target as HTMLElement).tagName
  if (['INPUT', 'SELECT', 'BUTTON', 'LABEL'].includes(tag)) return
  isGrabbing = true
  startX = e.pageX - el.offsetLeft
  scrollLeftStart = el.scrollLeft
  el.style.cursor = 'grabbing'
  document.addEventListener('mousemove', onGrabMove)
  document.addEventListener('mouseup', onGrabEnd)
}

function onGrabMove(e: MouseEvent) {
  if (!isGrabbing) return
  const el = scrollContainer.value
  if (!el) return
  e.preventDefault()
  const x = e.pageX - el.offsetLeft
  el.scrollLeft = scrollLeftStart - (x - startX)
}

function onGrabEnd() {
  isGrabbing = false
  const el = scrollContainer.value
  if (el) el.style.cursor = 'grab'
  document.removeEventListener('mousemove', onGrabMove)
  document.removeEventListener('mouseup', onGrabEnd)
}

// Body scroll lock for mobile sheet
watch(open, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  }
  else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  const el = scrollContainer.value
  if (el) {
    el.addEventListener('scroll', updateScrollState, { passive: true })
    nextTick(updateScrollState)
  }
})

onUnmounted(() => {
  scrollContainer.value?.removeEventListener('scroll', updateScrollState)
  document.removeEventListener('mousemove', onGrabMove)
  document.removeEventListener('mouseup', onGrabEnd)
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* ============================================
   FILTERS SECTION — Base = mobile (360px)
   ============================================ */
.filters-section {
  background: var(--bg-primary);
  position: relative;
  z-index: 2;
  border-top: 1px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

/* ============================================
   MOBILE: Toggle button (< 768px)
   ============================================ */
.filter-toggle {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 1rem;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.15px;
  min-height: auto;
  min-width: auto;
  width: 100%;
  border-bottom: 1px solid var(--border-color-light);
}

.filter-badge {
  background: var(--color-primary);
  color: var(--color-white);
  font-size: 9px;
  font-weight: 600;
  min-width: 18px;
  height: 18px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

/* ============================================
   MOBILE: Bottom sheet
   ============================================ */
.filter-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal-backdrop);
  background: rgba(0, 0, 0, 0.5);
}

.filter-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-modal);
  background: var(--bg-primary);
  border-radius: 16px 16px 0 0;
  max-height: 80vh;
  overflow-y: auto;
}

.filter-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color-light);
  position: sticky;
  top: 0;
  background: var(--bg-primary);
  z-index: 1;
}

.filter-sheet-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.filter-close {
  font-size: 18px;
  color: var(--text-auxiliary);
  min-height: 32px;
  min-width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-sheet-body {
  padding: 0.75rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-sheet-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ============================================
   SHARED: Labels & inputs
   ============================================ */
.filter-label {
  font-weight: 500;
  color: var(--color-primary);
  font-size: 10px;
  line-height: 1.4;
  text-transform: uppercase;
  letter-spacing: 0.15px;
  white-space: nowrap;
}

.filter-dual-range {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.filter-sep {
  color: var(--text-auxiliary);
  font-size: 9px;
  flex-shrink: 0;
}

.filter-input-sm {
  flex: 1;
  min-width: 0;
  padding: 0.25rem 0.4rem;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  font-size: 10px;
  line-height: 1.4;
  color: var(--text-primary);
  background: var(--bg-primary);
  min-height: auto;
}

.filter-input-sm:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
}

.filter-select-mobile {
  padding: 0.3rem 0.4rem;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  font-size: 10px;
  line-height: 1.4;
  color: var(--text-primary);
  background: var(--bg-primary);
  min-height: auto;
  width: 100%;
}

.filter-input-mobile {
  padding: 0.3rem 0.4rem;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  font-size: 10px;
  line-height: 1.4;
  color: var(--text-primary);
  background: var(--bg-primary);
  min-height: auto;
  width: 100%;
}

/* ============================================
   MOBILE: Ticks & checks
   ============================================ */
.filter-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-check {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  cursor: pointer;
  min-height: auto;
  min-width: auto;
}

.filter-check input {
  width: auto;
  min-height: auto;
  min-width: auto;
}

.filter-tick {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  cursor: pointer;
  min-height: auto;
  min-width: auto;
}

.filter-tick input {
  width: auto;
  min-height: auto;
  min-width: auto;
  accent-color: var(--color-primary);
}

.btn-clear-filters-mobile {
  margin-top: 0.5rem;
  padding: 8px 16px;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  color: var(--text-auxiliary);
  min-height: auto;
  min-width: auto;
}

/* ============================================
   DESKTOP: Inline horizontal bar (hidden on mobile)
   ============================================ */
.filters-desktop {
  display: none;
}

/* ============================================
   TRANSITIONS
   ============================================ */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 300ms ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

/* ============================================
   RESPONSIVE: ≥480px
   ============================================ */
@media (min-width: 480px) {
  .filter-toggle {
    font-size: 11px;
  }

  .filter-label {
    font-size: 11px;
  }

  .filter-input-sm,
  .filter-select-mobile,
  .filter-input-mobile {
    font-size: 11px;
  }
}

/* ============================================
   RESPONSIVE: ≥768px — Switch to desktop inline bar
   ============================================ */
@media (min-width: 768px) {
  .filter-toggle {
    display: none;
  }

  .filter-backdrop {
    display: none !important;
  }

  .filter-sheet {
    display: none !important;
  }

  .filters-section {
    padding: 0.3rem 0;
    overflow: hidden;
  }

  .filters-desktop {
    display: block;
  }

  .filters-container {
    position: relative;
  }

  .filters-wrapper {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    padding: 0.15rem 1.5rem;
    cursor: grab;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .filters-wrapper::-webkit-scrollbar {
    display: none;
  }

  .filters-wrapper:active {
    cursor: grabbing;
  }

  /* Filter group with pipe separator */
  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex-shrink: 0;
    cursor: default;
  }

  .filter-group:not(:last-child)::after {
    content: '|';
    color: var(--border-color);
    margin-left: 0.6rem;
    font-weight: 300;
  }

  /* Inline select */
  .filter-select-inline {
    padding: 0.2rem 0.3rem;
    border: 2px solid var(--border-color);
    border-radius: 4px;
    font-size: 9.3px;
    line-height: 1.4;
    color: var(--text-primary);
    background: var(--bg-primary);
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 400;
    min-width: 74px;
    min-height: auto;
  }

  .filter-select-inline:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
  }

  /* Inline number/text inputs */
  .filter-input-inline {
    padding: 0.2rem 0.3rem;
    border: 2px solid var(--border-color);
    border-radius: 4px;
    font-size: 9.3px;
    line-height: 1.4;
    color: var(--text-primary);
    background: var(--bg-primary);
    min-width: 50px;
    max-width: 70px;
    min-height: auto;
    transition: all 0.3s ease;
  }

  .filter-input-inline:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
  }

  .filter-range-inputs {
    display: flex;
    align-items: center;
    gap: 0.2rem;
  }

  .filter-dash {
    color: var(--text-auxiliary);
    font-size: 9px;
    flex-shrink: 0;
  }

  /* Inline checkbox groups */
  .filter-checks-inline {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .cb {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 9.3px;
    cursor: pointer;
    min-height: auto;
    min-width: auto;
  }

  .cb input {
    width: auto;
    min-height: auto;
    min-width: auto;
    accent-color: var(--color-primary);
  }

  /* Clear button inline */
  .btn-clear-filters {
    padding: 0.2rem 0.5rem;
    background: none;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 9.3px;
    cursor: pointer;
    color: var(--text-auxiliary);
    white-space: nowrap;
    flex-shrink: 0;
    min-height: auto;
    min-width: auto;
    transition: all 0.2s ease;
  }

  .btn-clear-filters:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  /* Scroll arrows */
  .scroll-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(35, 66, 74, 0.8);
    border: none;
    color: white;
    width: 28px;
    height: 28px;
    min-width: 28px;
    min-height: 28px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    transition: all 0.3s ease;
    font-size: 10px;
  }

  .scroll-btn:hover {
    background: var(--color-primary);
  }

  .scroll-btn-left {
    left: 4px;
  }

  .scroll-btn-right {
    right: 4px;
  }
}

/* ============================================
   RESPONSIVE: ≥1024px (desktop)
   ============================================ */
@media (min-width: 1024px) {
  .filters-wrapper {
    padding: 0.6rem 3rem;
  }

  .filter-label {
    font-size: 10px;
  }

  .filter-select-inline,
  .filter-input-inline {
    font-size: 10px;
  }

  .cb {
    font-size: 10px;
  }

  .btn-clear-filters {
    font-size: 10px;
  }

  .scroll-btn {
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    font-size: 12px;
  }

  .scroll-btn-left {
    left: 6px;
  }

  .scroll-btn-right {
    right: 6px;
  }
}
</style>
