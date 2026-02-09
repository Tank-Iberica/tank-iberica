<template>
  <section v-if="hasItems" class="subcategories-section" :aria-label="$t('catalog.subcategories')">
    <button
      v-show="canScrollLeft"
      class="scroll-btn scroll-btn-left"
      aria-hidden="true"
      @click="scrollLeft"
    >
      &#9664;
    </button>

    <div ref="scrollContainer" class="subcategories" @scroll="updateScrollState">
      <!-- Level 1: Subcategories -->
      <template v-if="!activeSubcategoryId">
        <button
          v-for="sub in visibleSubcategories"
          :key="sub.id"
          :class="['subcategory-btn', { disabled: !isApplicable(sub) }]"
          @click="selectSubcategory(sub)"
        >
          {{ locale === 'en' && sub.name_en ? sub.name_en : sub.name_es }}
        </button>
      </template>

      <!-- Level 2: Selected subcategory + Types (no type selected yet) -->
      <template v-else-if="!activeTypeId">
        <!-- Selected subcategory (clickable to go back) -->
        <button
          class="subcategory-btn active"
          @click="clearSubcategory"
        >
          {{ selectedSubcategoryName }}
        </button>

        <!-- Separator -->
        <span class="separator">&gt;</span>

        <!-- Types belonging to this subcategory -->
        <button
          v-for="type in linkedTypes"
          :key="type.id"
          :class="['subcategory-btn type-btn', {
            disabled: !isTypeApplicable(type),
          }]"
          @click="selectType(type)"
        >
          {{ locale === 'en' && type.name_en ? type.name_en : type.name_es }}
        </button>
      </template>

      <!-- Level 3: Selected subcategory + Selected type (type selected) + Dynamic filters -->
      <template v-else>
        <!-- Selected subcategory (clickable to go back to subcategory selection) -->
        <button
          class="subcategory-btn active"
          @click="clearSubcategory"
        >
          {{ selectedSubcategoryName }}
        </button>

        <!-- Separator -->
        <span class="separator">&gt;</span>

        <!-- Selected type only (clickable to go back to type selection) -->
        <button
          class="subcategory-btn type-btn active"
          @click="clearType"
        >
          {{ selectedTypeName }}
        </button>

        <!-- Separator before dynamic filters -->
        <span v-if="visibleFilters.length" class="separator">&gt;</span>

        <!-- Dynamic filters inline -->
        <template v-for="(filter, idx) in visibleFilters" :key="filter.id">
          <!-- Separator between filters -->
          <span v-if="idx > 0" class="filter-divider" />

          <!-- Desplegable (select) -->
          <div v-if="filter.type === 'desplegable'" class="filter-inline">
            <span class="filter-label-inline">{{ filterLabel(filter) }}:</span>
            <select class="filter-select-inline" :value="activeFilters[filter.name] || ''" @change="onSelectChange(filter.name, $event)">
              <option value="">—</option>
              <option v-for="opt in getOptions(filter)" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>

          <!-- Desplegable tick (multi-select checkboxes) -->
          <div v-else-if="filter.type === 'desplegable_tick'" class="filter-inline">
            <span class="filter-label-inline">{{ filterLabel(filter) }}:</span>
            <div class="filter-checks-inline">
              <label v-for="opt in getOptions(filter)" :key="opt" class="filter-check-inline">
                <input type="checkbox" :checked="isChecked(filter.name, opt)" @change="onCheckChange(filter.name, opt)">
                <span>{{ opt }}</span>
              </label>
            </div>
          </div>

          <!-- Tick (single checkbox) -->
          <label v-else-if="filter.type === 'tick'" class="filter-tick-inline">
            <input type="checkbox" :checked="!!activeFilters[filter.name]" @change="onTickChange(filter.name)">
            <span>{{ filterLabel(filter) }}</span>
          </label>

          <!-- Slider (range inputs with dynamic min/max from vehicle data) -->
          <div v-else-if="filter.type === 'slider'" class="filter-inline">
            <span class="filter-label-inline">{{ filterLabel(filter) }}{{ filter.unit ? ` (${filter.unit})` : '' }}:</span>
            <div class="filter-range-inline">
              <input type="number" class="filter-input-inline" :value="activeFilters[filter.name + '_min'] || ''" :min="getSliderMin(filter)" :max="getSliderMax(filter)" :placeholder="String(getSliderMin(filter))" @change="onRangeChange(filter.name + '_min', $event)">
              <span class="filter-dash">—</span>
              <input type="number" class="filter-input-inline" :value="activeFilters[filter.name + '_max'] || ''" :min="getSliderMin(filter)" :max="getSliderMax(filter)" :placeholder="String(getSliderMax(filter))" @change="onRangeChange(filter.name + '_max', $event)">
            </div>
          </div>

          <!-- Calc (+/- buttons) -->
          <div v-else-if="filter.type === 'calc'" class="filter-inline">
            <span class="filter-label-inline">{{ filterLabel(filter) }}{{ filter.unit ? ` (${filter.unit})` : '' }}:</span>
            <div class="filter-calc-inline">
              <button class="calc-btn" @click="onCalcDecrement(filter.name, getCalcStep(filter))">−</button>
              <span class="calc-value">{{ activeFilters[filter.name] || 0 }}</span>
              <button class="calc-btn" @click="onCalcIncrement(filter.name, getCalcStep(filter))">+</button>
            </div>
          </div>

          <!-- Caja (text input) -->
          <div v-else-if="filter.type === 'caja'" class="filter-inline">
            <span class="filter-label-inline">{{ filterLabel(filter) }}:</span>
            <input type="text" class="filter-input-inline" :value="activeFilters[filter.name] || ''" :placeholder="filterLabel(filter)" @input="onTextInput(filter.name, $event)">
          </div>
        </template>
      </template>
    </div>

    <button
      v-show="canScrollRight"
      class="scroll-btn scroll-btn-right"
      aria-hidden="true"
      @click="scrollRight"
    >
      &#9654;
    </button>
  </section>
</template>

<script setup lang="ts">
import type { FilterDefinition } from '~/composables/useFilters'

interface SubcategoryRow {
  id: string
  name_es: string
  name_en: string | null
  slug: string
  applicable_categories: string[]
  sort_order: number
}

interface TypeRow {
  id: string
  name_es: string
  name_en: string | null
  slug: string
  applicable_categories: string[]
  sort_order: number
}

const emit = defineEmits<{
  subcategoryChange: [subcategoryId: string | null]
  typeChange: [typeId: string | null]
}>()

const supabase = useSupabaseClient()
const { locale } = useI18n()
const {
  activeCategories,
  activeSubcategoryId,
  activeTypeId,
  setSubcategory,
  setType,
} = useCatalogState()
const { visibleFilters, activeFilters, getFilterOptions, getSliderRange, setFilter, clearFilter } = useFilters()

const subcategories = ref<SubcategoryRow[]>([])
const types = ref<TypeRow[]>([])
const typeSubcategoryLinks = ref<Map<string, string[]>>(new Map())
const scrollContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

// Check if subcategory is applicable for current categories
function isApplicable(sub: SubcategoryRow): boolean {
  if (!activeCategories.value.length) return true
  return activeCategories.value.some(cat => sub.applicable_categories.includes(cat))
}

// Check if type is applicable for current categories
function isTypeApplicable(type: TypeRow): boolean {
  if (!activeCategories.value.length) return true
  return activeCategories.value.some(cat => type.applicable_categories.includes(cat))
}

// Visible subcategories (filtered by category)
const visibleSubcategories = computed(() => {
  return subcategories.value.filter(isApplicable)
})

// Types linked to the currently selected subcategory
const linkedTypes = computed(() => {
  if (!activeSubcategoryId.value) return []

  // Get type IDs linked to this subcategory
  const linkedTypeIds = new Set<string>()
  for (const [typeId, subcatIds] of typeSubcategoryLinks.value.entries()) {
    if (subcatIds.includes(activeSubcategoryId.value)) {
      linkedTypeIds.add(typeId)
    }
  }

  return types.value
    .filter(t => linkedTypeIds.has(t.id))
    .sort((a, b) => a.sort_order - b.sort_order)
})

// Get the display name of the selected subcategory
const selectedSubcategoryName = computed(() => {
  const sub = subcategories.value.find(s => s.id === activeSubcategoryId.value)
  if (!sub) return ''
  return locale.value === 'en' && sub.name_en ? sub.name_en : sub.name_es
})

// Get the display name of the selected type
const selectedTypeName = computed(() => {
  const type = types.value.find(t => t.id === activeTypeId.value)
  if (!type) return ''
  return locale.value === 'en' && type.name_en ? type.name_en : type.name_es
})

// Check if we have items to display
const hasItems = computed(() => {
  return subcategories.value.length > 0 || types.value.length > 0
})

// Fetch subcategories from the subcategories table
async function fetchSubcategories() {
  const { data } = await supabase
    .from('subcategories')
    .select('*')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  subcategories.value = (data as SubcategoryRow[]) || []
  nextTick(updateScrollState)
}

// Fetch types from the types table
async function fetchTypes() {
  const { data } = await supabase
    .from('types')
    .select('*')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  types.value = (data as TypeRow[]) || []
}

// Fetch type-subcategory links from junction table
async function fetchTypeSubcategoryLinks() {
  const { data } = await supabase
    .from('type_subcategories')
    .select('type_id, subcategory_id')

  const links = new Map<string, string[]>()
  if (data) {
    for (const link of data as { type_id: string; subcategory_id: string }[]) {
      if (!links.has(link.type_id)) {
        links.set(link.type_id, [])
      }
      links.get(link.type_id)!.push(link.subcategory_id)
    }
  }
  typeSubcategoryLinks.value = links
}

function selectSubcategory(sub: SubcategoryRow) {
  if (!isApplicable(sub)) return
  setSubcategory(sub.id, sub.slug)
  emit('subcategoryChange', sub.id)
  nextTick(updateScrollState)
}

function clearSubcategory() {
  setSubcategory(null, null)
  emit('subcategoryChange', null)
  emit('typeChange', null)
  nextTick(updateScrollState)
}

function clearType() {
  setType(null, null)
  emit('typeChange', null)
  nextTick(updateScrollState)
}

function selectType(type: TypeRow) {
  if (!isTypeApplicable(type)) return
  setType(type.id, type.slug)
  emit('typeChange', type.id)
  nextTick(updateScrollState)
}

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

// Filter helpers for dynamic filters in Level 3
function filterLabel(filter: { name: string; label_es: string | null; label_en: string | null }): string {
  if (locale.value === 'en' && filter.label_en) return filter.label_en
  return filter.label_es || filter.name
}

function getOptions(filter: FilterDefinition): string[] {
  return getFilterOptions(filter)
}

function onSelectChange(name: string, event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (value) setFilter(name, value)
  else clearFilter(name)
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
}

function isChecked(name: string, option: string): boolean {
  const current = (activeFilters.value[name] as string[]) || []
  return current.includes(option)
}

function onTickChange(name: string) {
  if (activeFilters.value[name]) clearFilter(name)
  else setFilter(name, true)
}

function getSliderMin(filter: FilterDefinition): number {
  const range = getSliderRange(filter)
  return range.min
}

function getSliderMax(filter: FilterDefinition): number {
  const range = getSliderRange(filter)
  return range.max
}

function getCalcStep(filter: FilterDefinition): number {
  return (filter.options?.step as number) || 1
}

function onCalcIncrement(name: string, step: number) {
  const current = Number(activeFilters.value[name]) || 0
  setFilter(name, current + step)
}

function onCalcDecrement(name: string, step: number) {
  const current = Number(activeFilters.value[name]) || 0
  const newVal = current - step
  if (newVal <= 0) clearFilter(name)
  else setFilter(name, newVal)
}

function onRangeChange(name: string, event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (value) setFilter(name, value)
  else clearFilter(name)
}

function onTextInput(name: string, event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (value) setFilter(name, value)
  else clearFilter(name)
}

// When categories change, reset selections if no longer applicable
watch(activeCategories, () => {
  if (activeSubcategoryId.value) {
    const current = subcategories.value.find(s => s.id === activeSubcategoryId.value)
    if (current && !isApplicable(current)) {
      clearSubcategory()
    }
  }
}, { deep: true })

onMounted(async () => {
  await Promise.all([
    fetchSubcategories(),
    fetchTypes(),
    fetchTypeSubcategoryLinks(),
  ])

  const el = scrollContainer.value
  if (el) {
    el.addEventListener('scroll', updateScrollState, { passive: true })
  }
})

onUnmounted(() => {
  scrollContainer.value?.removeEventListener('scroll', updateScrollState)
})
</script>

<style scoped>
/* ============================================
   SUBCATEGORIES SECTION — Base = mobile (360px)
   ============================================ */
.subcategories-section {
  background: var(--bg-primary);
  padding: 0.28rem 0;
  margin-top: 8px;
  position: relative;
  overflow: hidden;
  border-top: 1px solid var(--border-color);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

/* Scrollable row — directly on section, arrows on parent */
.subcategories {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 0.3rem;
  padding: 0 0.5rem;
  min-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.subcategories::-webkit-scrollbar {
  display: none;
}

/* ============================================
   SEPARATOR — ">" between subcategory and types
   ============================================ */
.separator {
  color: var(--text-secondary, #6B7280);
  font-size: 12px;
  font-weight: 600;
  padding: 0 0.25rem;
  flex-shrink: 0;
}

/* ============================================
   SUBCATEGORY BUTTON — Base = mobile
   ============================================ */
.subcategory-btn {
  padding: 0.3rem 0.6rem;
  border: 2px solid var(--border-color);
  border-radius: 9999px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: auto;
  min-width: auto;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.subcategory-btn:focus {
  outline: none;
}

.subcategory-btn:not(.disabled):not(.active):hover {
  color: var(--color-primary);
  background: var(--bg-secondary);
  border-color: var(--color-primary-light);
}

.subcategory-btn:not(.disabled):active {
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-accent, #7FD1C8) 100%);
  color: var(--color-white);
  border-color: var(--color-primary-light);
  transform: scale(0.98);
}

.subcategory-btn.active {
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-accent, #7FD1C8) 100%);
  color: var(--color-white);
  border-color: var(--color-primary-light);
}

.subcategory-btn.disabled {
  color: var(--text-auxiliary, #9CA3AF);
  cursor: not-allowed;
  background: #F9FAFB;
  border-color: var(--text-auxiliary, #9CA3AF);
}

.subcategory-btn.disabled:hover {
  background: #F9FAFB;
  color: var(--text-auxiliary, #9CA3AF);
}

/* Subcategory names in uppercase (not types) */
.subcategory-btn:not(.type-btn) {
  text-transform: uppercase;
}

/* Type button (level 2) - slightly different style */
.type-btn {
  border-style: dashed;
}

.type-btn.active {
  border-style: solid;
}

/* ============================================
   SCROLL ARROWS — positioned on the section
   ============================================ */
.scroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border-color);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--text-primary);
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  transition: opacity 0.2s ease;
}

.scroll-btn-left {
  left: 2px;
}

.scroll-btn-right {
  right: 2px;
}

/* ============================================
   RESPONSIVE: >=480px (large mobile)
   ============================================ */
@media (min-width: 480px) {
  .subcategories {
    gap: 0.4rem;
    padding: 0 0.5rem;
  }

  .subcategory-btn {
    font-size: 11px;
    padding: 0.25rem 0.45rem;
  }

  .separator {
    font-size: 13px;
    padding: 0 0.35rem;
  }
}

/* ============================================
   RESPONSIVE: >=768px (tablet)
   ============================================ */
@media (min-width: 768px) {
  .subcategories-section {
    padding: 0.34rem 0;
    margin-top: 0;
  }

  .subcategories {
    padding: 0 1.5rem;
    gap: 0.5rem;
  }

  .subcategory-btn {
    font-size: 12px;
    padding: 0.4rem 0.6rem;
    height: 36px;
    display: inline-flex;
    align-items: center;
  }

  .separator {
    font-size: 14px;
    padding: 0 0.5rem;
  }
}

/* ============================================
   RESPONSIVE: >=1024px (desktop)
   ============================================ */
@media (min-width: 1024px) {
  .subcategories {
    padding: 0 3rem;
    gap: 0.75rem;
  }

  .subcategory-btn {
    font-size: 12px;
    padding: 0.4rem 0.6rem;
  }
}

/* ============================================
   FILTER DIVIDER — vertical bar between filters
   ============================================ */
.filter-divider {
  width: 1px;
  height: 20px;
  background: var(--border-color, #e5e7eb);
  flex-shrink: 0;
}

/* ============================================
   INLINE FILTERS — Dynamic filters in Level 3
   ============================================ */
.filter-inline {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
}

.filter-label-inline {
  font-weight: 500;
  color: var(--color-primary);
  font-size: 10px;
  text-transform: uppercase;
  white-space: nowrap;
}

.filter-select-inline {
  padding: 0.2rem 0.3rem;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  font-size: 10px;
  color: var(--text-primary);
  background: var(--bg-primary);
  min-width: 60px;
  min-height: auto;
  cursor: pointer;
}

.filter-select-inline:focus {
  outline: none;
  border-color: var(--color-primary);
}

.filter-input-inline {
  padding: 0.2rem 0.3rem;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  font-size: 10px;
  color: var(--text-primary);
  background: var(--bg-primary);
  min-width: 45px;
  max-width: 60px;
  min-height: auto;
}

.filter-input-inline:focus {
  outline: none;
  border-color: var(--color-primary);
}

.filter-range-inline {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.filter-dash {
  color: var(--text-auxiliary);
  font-size: 9px;
  flex-shrink: 0;
}

.filter-checks-inline {
  display: flex;
  gap: 0.4rem;
}

.filter-check-inline {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 10px;
  cursor: pointer;
  min-height: auto;
  min-width: auto;
}

.filter-check-inline input {
  width: auto;
  min-height: auto;
  min-width: auto;
  accent-color: var(--color-primary);
}

.filter-tick-inline {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 10px;
  cursor: pointer;
  flex-shrink: 0;
  min-height: auto;
  min-width: auto;
}

.filter-tick-inline input {
  width: auto;
  min-height: auto;
  min-width: auto;
  accent-color: var(--color-primary);
}

/* Calc buttons */
.filter-calc-inline {
  display: flex;
  align-items: center;
  gap: 0;
}

.calc-btn {
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
  border: 2px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
  line-height: 1;
}

.calc-btn:first-child {
  border-radius: 4px 0 0 4px;
}

.calc-btn:last-child {
  border-radius: 0 4px 4px 0;
}

.calc-btn:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.calc-value {
  min-width: 28px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
  border-top: 2px solid var(--border-color);
  border-bottom: 2px solid var(--border-color);
  background: var(--bg-primary);
}

/* Responsive adjustments for inline filters */
@media (min-width: 768px) {
  .filter-label-inline {
    font-size: 11px;
  }

  .filter-select-inline,
  .filter-input-inline {
    font-size: 11px;
  }
}
</style>
