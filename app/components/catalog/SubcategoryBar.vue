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
      <!-- Level 1: Categories -->
      <template v-if="!activeCategoryId">
        <button
          v-for="cat in visibleCategories"
          :key="cat.id"
          :class="['subcategory-btn', { disabled: !isApplicable(cat) }]"
          @click="selectCategory(cat)"
        >
          {{ localizedName(cat) }}
        </button>
      </template>

      <!-- Level 2: Selected category + Subcategories (no subcategory selected yet) -->
      <template v-else-if="!activeSubcategoryId">
        <!-- Selected category (clickable to go back) -->
        <button class="subcategory-btn active" @click="clearCategory">
          {{ selectedCategoryName }}
        </button>

        <!-- Separator -->
        <span class="separator">&gt;</span>

        <!-- Subcategories belonging to this category -->
        <button
          v-for="sub in linkedSubcategories"
          :key="sub.id"
          :class="[
            'subcategory-btn type-btn',
            {
              disabled: !isSubcategoryApplicable(sub),
            },
          ]"
          @click="selectSubcategory(sub)"
        >
          {{ localizedName(sub) }}
        </button>
      </template>

      <!-- Level 3: Selected category + Selected subcategory + Dynamic filters -->
      <template v-else>
        <!-- Selected category (clickable to go back to category selection) -->
        <button class="subcategory-btn active" @click="clearCategory">
          {{ selectedCategoryName }}
        </button>

        <!-- Separator -->
        <span class="separator">&gt;</span>

        <!-- Selected subcategory only (clickable to go back to subcategory selection) -->
        <button class="subcategory-btn type-btn active" @click="clearSubcategory">
          {{ selectedSubcategoryName }}
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
            <select
              class="filter-select-inline"
              :value="activeFilters[filter.name] || ''"
              @change="onSelectChange(filter.name, $event)"
            >
              <option value="">—</option>
              <option v-for="opt in getOptions(filter)" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>

          <!-- Desplegable tick (multi-select checkboxes) -->
          <div v-else-if="filter.type === 'desplegable_tick'" class="filter-inline">
            <span class="filter-label-inline">{{ filterLabel(filter) }}:</span>
            <div class="filter-checks-inline">
              <label v-for="opt in getOptions(filter)" :key="opt" class="filter-check-inline">
                <input
                  type="checkbox"
                  :checked="isChecked(filter.name, opt)"
                  @change="onCheckChange(filter.name, opt)"
                >
                <span>{{ opt }}</span>
              </label>
            </div>
          </div>

          <!-- Tick (single checkbox) -->
          <label v-else-if="filter.type === 'tick'" class="filter-tick-inline">
            <input
              type="checkbox"
              :checked="!!activeFilters[filter.name]"
              @change="onTickChange(filter.name)"
            >
            <span>{{ filterLabel(filter) }}</span>
          </label>

          <!-- Slider (range inputs with dynamic min/max from vehicle data) -->
          <div v-else-if="filter.type === 'slider'" class="filter-inline">
            <span class="filter-label-inline"
              >{{ filterLabel(filter) }}{{ filter.unit ? ` (${filter.unit})` : '' }}:</span
            >
            <div class="filter-range-inline">
              <input
                type="number"
                class="filter-input-inline"
                :value="activeFilters[filter.name + '_min'] || ''"
                :min="getSliderMin(filter)"
                :max="getSliderMax(filter)"
                :placeholder="String(getSliderMin(filter))"
                @change="onRangeChange(filter.name + '_min', $event)"
              >
              <span class="filter-dash">—</span>
              <input
                type="number"
                class="filter-input-inline"
                :value="activeFilters[filter.name + '_max'] || ''"
                :min="getSliderMin(filter)"
                :max="getSliderMax(filter)"
                :placeholder="String(getSliderMax(filter))"
                @change="onRangeChange(filter.name + '_max', $event)"
              >
            </div>
          </div>

          <!-- Calc (+/- buttons) -->
          <div v-else-if="filter.type === 'calc'" class="filter-inline">
            <span class="filter-label-inline"
              >{{ filterLabel(filter) }}{{ filter.unit ? ` (${filter.unit})` : '' }}:</span
            >
            <div class="filter-calc-inline">
              <button class="calc-btn" @click="onCalcDecrement(filter.name, getCalcStep(filter))">
                −
              </button>
              <span class="calc-value">{{ activeFilters[filter.name] || 0 }}</span>
              <button class="calc-btn" @click="onCalcIncrement(filter.name, getCalcStep(filter))">
                +
              </button>
            </div>
          </div>

          <!-- Caja (text input) -->
          <div v-else-if="filter.type === 'caja'" class="filter-inline">
            <span class="filter-label-inline">{{ filterLabel(filter) }}:</span>
            <input
              type="text"
              class="filter-input-inline"
              :value="activeFilters[filter.name] || ''"
              :placeholder="filterLabel(filter)"
              @input="onTextInput(filter.name, $event)"
            >
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
import type { AttributeDefinition } from '~/composables/useFilters'
import { localizedField as localizedJsonField } from '~/composables/useLocalized'

interface CategoryRow {
  id: string
  name_es: string
  name_en: string | null
  slug: string
  applicable_actions: string[]
  sort_order: number
}

interface SubcategoryRow {
  id: string
  name_es: string
  name_en: string | null
  slug: string
  applicable_actions: string[]
  sort_order: number
}

const emit = defineEmits<{
  categoryChange: [categoryId: string | null]
  subcategoryChange: [subcategoryId: string | null]
}>()

const supabase = useSupabaseClient()
const { locale } = useI18n()

/** Helper to display a localized column-based field (name_es, name_en) */
function localizedName(row: { name_es: string; name_en: string | null }): string {
  return localizedJsonField({ es: row.name_es, en: row.name_en || '' }, locale.value)
}

/** Helper to display a localized label field (label_es, label_en) */
function localizedLabel(row: { label_es: string | null; label_en: string | null }): string {
  return localizedJsonField({ es: row.label_es || '', en: row.label_en || '' }, locale.value)
}
const { activeActions, activeCategoryId, activeSubcategoryId, setCategory, setSubcategory } =
  useCatalogState()
const { visibleFilters, activeFilters, getFilterOptions, getSliderRange, setFilter, clearFilter } =
  useFilters()

const categories = ref<CategoryRow[]>([])
const subcategories = ref<SubcategoryRow[]>([])
const subcategoryCategoryLinks = ref<Map<string, string[]>>(new Map())
const scrollContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

// Check if category is applicable for current actions
function isApplicable(cat: CategoryRow): boolean {
  if (!activeActions.value.length) return true
  return activeActions.value.some((action) => cat.applicable_actions.includes(action))
}

// Check if subcategory is applicable for current actions
function isSubcategoryApplicable(sub: SubcategoryRow): boolean {
  if (!activeActions.value.length) return true
  return activeActions.value.some((action) => sub.applicable_actions.includes(action))
}

// Visible categories (filtered by action)
const visibleCategories = computed(() => {
  return categories.value.filter(isApplicable)
})

// Subcategories linked to the currently selected category
const linkedSubcategories = computed(() => {
  if (!activeCategoryId.value) return []

  // Get subcategory IDs linked to this category
  const linkedSubcategoryIds = new Set<string>()
  for (const [subcategoryId, catIds] of subcategoryCategoryLinks.value.entries()) {
    if (catIds.includes(activeCategoryId.value)) {
      linkedSubcategoryIds.add(subcategoryId)
    }
  }

  return subcategories.value
    .filter((s) => linkedSubcategoryIds.has(s.id))
    .sort((a, b) => a.sort_order - b.sort_order)
})

// Get the display name of the selected category
const selectedCategoryName = computed(() => {
  const cat = categories.value.find((c) => c.id === activeCategoryId.value)
  if (!cat) return ''
  return localizedName(cat)
})

// Get the display name of the selected subcategory
const selectedSubcategoryName = computed(() => {
  const sub = subcategories.value.find((s) => s.id === activeSubcategoryId.value)
  if (!sub) return ''
  return localizedName(sub)
})

// Check if we have items to display
const hasItems = computed(() => {
  return categories.value.length > 0 || subcategories.value.length > 0
})

// Fetch categories from the categories table
async function fetchCategories() {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  categories.value = (data as CategoryRow[]) || []
  nextTick(updateScrollState)
}

// Fetch subcategories from the subcategories table
async function fetchSubcategories() {
  const { data } = await supabase
    .from('subcategories')
    .select('*')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  subcategories.value = (data as SubcategoryRow[]) || []
}

// Fetch subcategory-category links from junction table
async function fetchSubcategoryCategoryLinks() {
  const { data } = await supabase
    .from('subcategory_categories')
    .select('subcategory_id, category_id')

  const links = new Map<string, string[]>()
  if (data) {
    for (const link of data as { subcategory_id: string; category_id: string }[]) {
      if (!links.has(link.subcategory_id)) {
        links.set(link.subcategory_id, [])
      }
      links.get(link.subcategory_id)!.push(link.category_id)
    }
  }
  subcategoryCategoryLinks.value = links
}

function selectCategory(cat: CategoryRow) {
  if (!isApplicable(cat)) return
  setCategory(cat.id, cat.slug)
  emit('categoryChange', cat.id)
  nextTick(updateScrollState)
}

function clearCategory() {
  setCategory(null, null)
  emit('categoryChange', null)
  emit('subcategoryChange', null)
  nextTick(updateScrollState)
}

function clearSubcategory() {
  setSubcategory(null, null)
  emit('subcategoryChange', null)
  nextTick(updateScrollState)
}

function selectSubcategory(sub: SubcategoryRow) {
  if (!isSubcategoryApplicable(sub)) return
  setSubcategory(sub.id, sub.slug)
  emit('subcategoryChange', sub.id)
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
function filterLabel(filter: {
  name: string
  label_es: string | null
  label_en: string | null
}): string {
  return localizedLabel(filter) || filter.name
}

function getOptions(filter: AttributeDefinition): string[] {
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
    const next = current.filter((v) => v !== option)
    if (next.length) setFilter(name, next)
    else clearFilter(name)
  } else {
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

function getSliderMin(filter: AttributeDefinition): number {
  const range = getSliderRange(filter)
  return range.min
}

function getSliderMax(filter: AttributeDefinition): number {
  const range = getSliderRange(filter)
  return range.max
}

function getCalcStep(filter: AttributeDefinition): number {
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

// When actions change, reset selections if no longer applicable
watch(
  activeActions,
  () => {
    if (activeCategoryId.value) {
      const current = categories.value.find((c) => c.id === activeCategoryId.value)
      if (current && !isApplicable(current)) {
        clearCategory()
      }
    }
  },
  { deep: true },
)

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchSubcategories(), fetchSubcategoryCategoryLinks()])

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
  color: var(--text-secondary, #6b7280);
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
  background: linear-gradient(
    135deg,
    var(--color-primary-light) 0%,
    var(--color-accent, #7fd1c8) 100%
  );
  color: var(--color-white);
  border-color: var(--color-primary-light);
  transform: scale(0.98);
}

.subcategory-btn.active {
  background: linear-gradient(
    135deg,
    var(--color-primary-light) 0%,
    var(--color-accent, #7fd1c8) 100%
  );
  color: var(--color-white);
  border-color: var(--color-primary-light);
}

.subcategory-btn.disabled {
  color: var(--text-auxiliary, #9ca3af);
  cursor: not-allowed;
  background: #f9fafb;
  border-color: var(--text-auxiliary, #9ca3af);
}

.subcategory-btn.disabled:hover {
  background: #f9fafb;
  color: var(--text-auxiliary, #9ca3af);
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
