<script setup lang="ts">
import { localizedField as localizedJsonField } from '~/composables/useLocalized'
import { getVerticalSlug } from '~/composables/useVerticalConfig'
import type { VehicleAction } from '~~/shared/types/vehicle'

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

const { t, locale } = useI18n()
const supabase = useSupabaseClient()
const { config } = useVerticalConfig()

const {
  activeActions,
  activeCategoryId,
  activeSubcategoryId,
  setCategory,
  setSubcategory,
  setActions,
} = useCatalogState()

// -- Data --
const categories = ref<CategoryRow[]>([])
const subcategories = ref<SubcategoryRow[]>([])
const subcategoryCategoryLinks = ref<Map<string, string[]>>(new Map())

// -- Dropdown open state --
const transactionOpen = ref(false)
const categoryOpen = ref(false)
const subcategoryOpen = ref(false)

// -- Scroll refs --
const scrollContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

// -- Actions config --
const FALLBACK_ACTIONS = ['venta', 'lotes', 'alquiler', 'subasta']
const actionOptions = computed(() => {
  const actions = config.value?.active_actions?.length
    ? config.value.active_actions
    : FALLBACK_ACTIONS
  return actions.map((key) => ({ key }))
})

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchSubcategories(), fetchSubcategoryCategoryLinks()])

  const el = scrollContainer.value
  if (el) {
    el.addEventListener('scroll', updateScrollState, { passive: true })
    nextTick(updateScrollState)
  }
})

onUnmounted(() => {
  scrollContainer.value?.removeEventListener('scroll', updateScrollState)
})

// -- Helpers --
function localizedName(row: { name_es: string; name_en: string | null }): string {
  return localizedJsonField({ es: row.name_es, en: row.name_en || '' }, locale.value)
}

function isApplicable(cat: CategoryRow): boolean {
  if (!activeActions.value.length) return true
  return activeActions.value.some((action) => cat.applicable_actions.includes(action))
}

function isSubcategoryApplicable(sub: SubcategoryRow): boolean {
  if (!activeActions.value.length) return true
  return activeActions.value.some((action) => sub.applicable_actions.includes(action))
}

const visibleCategories = computed(() => categories.value.filter(isApplicable))

const linkedSubcategories = computed(() => {
  if (!activeCategoryId.value) return []
  const linkedIds = new Set<string>()
  for (const [subId, catIds] of subcategoryCategoryLinks.value.entries()) {
    if (catIds.includes(activeCategoryId.value)) linkedIds.add(subId)
  }
  return subcategories.value
    .filter((s) => linkedIds.has(s.id) && isSubcategoryApplicable(s))
    .sort((a, b) => a.sort_order - b.sort_order)
})

const selectedCategoryName = computed(() => {
  const cat = categories.value.find((c) => c.id === activeCategoryId.value)
  return cat ? localizedName(cat) : ''
})

const selectedSubcategoryName = computed(() => {
  const sub = subcategories.value.find((s) => s.id === activeSubcategoryId.value)
  return sub ? localizedName(sub) : ''
})

// -- Transaction label --
const transactionLabel = computed(() => {
  if (!activeActions.value.length) return t('catalog.transaction')
  if (activeActions.value.length === 1) return t(`catalog.${activeActions.value[0]}`)
  return `${activeActions.value.length} ${t('catalog.transaction').toLowerCase()}`
})

// -- Fetch data --
async function fetchCategories() {
  const { data } = await supabase
    .from('categories')
    .select('id, name_es, name_en, slug, applicable_actions, sort_order')
    .eq('status', 'published')
    .eq('vertical', getVerticalSlug())
    .order('sort_order', { ascending: true })
  categories.value = (data as CategoryRow[]) || []
}

async function fetchSubcategories() {
  const { data } = await supabase
    .from('subcategories')
    .select('id, name_es, name_en, slug, applicable_actions, sort_order')
    .eq('status', 'published')
    .eq('vertical', getVerticalSlug())
    .order('sort_order', { ascending: true })
  subcategories.value = (data as SubcategoryRow[]) || []
}

async function fetchSubcategoryCategoryLinks() {
  const { data } = await supabase
    .from('subcategory_categories')
    .select('subcategory_id, category_id')
  const links = new Map<string, string[]>()
  if (data) {
    for (const link of data as { subcategory_id: string; category_id: string }[]) {
      if (!links.has(link.subcategory_id)) links.set(link.subcategory_id, [])
      links.get(link.subcategory_id)!.push(link.category_id)
    }
  }
  subcategoryCategoryLinks.value = links
}

// -- Actions (transaction type) --
function toggleAction(key: string) {
  const action = key as VehicleAction
  const current = new Set(activeActions.value)
  if (current.has(action)) {
    current.delete(action)
  } else {
    current.add(action)
  }
  setActions([...current] as VehicleAction[])
}

// -- Category / Subcategory selection --
function selectCategory(cat: CategoryRow) {
  if (!isApplicable(cat)) return
  setCategory(cat.id, cat.slug)
  setSubcategory(null, null)
  emit('categoryChange', cat.id)
  emit('subcategoryChange', null)
  categoryOpen.value = false
  nextTick(updateScrollState)
}

function clearCategory() {
  setCategory(null, null)
  setSubcategory(null, null)
  emit('categoryChange', null)
  emit('subcategoryChange', null)
  categoryOpen.value = false
  nextTick(updateScrollState)
}

function selectSubcategory(sub: SubcategoryRow) {
  if (!isSubcategoryApplicable(sub)) return
  setSubcategory(sub.id, sub.slug)
  emit('subcategoryChange', sub.id)
  subcategoryOpen.value = false
  nextTick(updateScrollState)
}

function clearSubcategory() {
  setSubcategory(null, null)
  emit('subcategoryChange', null)
  subcategoryOpen.value = false
  nextTick(updateScrollState)
}

// Reset category if action changes make it inapplicable
watch(
  activeActions,
  () => {
    if (activeCategoryId.value) {
      const current = categories.value.find((c) => c.id === activeCategoryId.value)
      if (current && !isApplicable(current)) clearCategory()
    }
  },
  { deep: true },
)

// Clear from a separator: clears category + subcategory
function clearFromCategory() {
  clearCategory()
}

// Clear from subcategory separator: clears subcategory only
function clearFromSubcategory() {
  clearSubcategory()
}

const anyDropdownOpen = computed(
  () => transactionOpen.value || categoryOpen.value || subcategoryOpen.value,
)

// -- Dropdown toggles --
function openTransaction() {
  transactionOpen.value = !transactionOpen.value
  categoryOpen.value = false
  subcategoryOpen.value = false
}

function openCategory() {
  categoryOpen.value = !categoryOpen.value
  transactionOpen.value = false
  subcategoryOpen.value = false
}

function openSubcategory() {
  subcategoryOpen.value = !subcategoryOpen.value
  transactionOpen.value = false
  categoryOpen.value = false
}

// -- Scroll --
function updateScrollState() {
  const el = scrollContainer.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 0
  canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 1
}

function scrollLeftFn() {
  scrollContainer.value?.scrollBy({ left: -200, behavior: 'smooth' })
}

function scrollRightFn() {
  scrollContainer.value?.scrollBy({ left: 200, behavior: 'smooth' })
}

// -- Close dropdowns on outside click --
function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.segment-transaction')) transactionOpen.value = false
  if (!target.closest('.segment-category')) categoryOpen.value = false
  if (!target.closest('.segment-subcategory')) subcategoryOpen.value = false
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <nav class="category-bar" :aria-label="$t('catalog.title')">
    <div :class="['breadcrumb-bar', { 'dropdown-open': anyDropdownOpen }]">
      <button
        v-show="canScrollLeft"
        class="scroll-btn scroll-btn-left"
        aria-hidden="true"
        @click="scrollLeftFn"
      >
        &#9664;
      </button>

      <div
        ref="scrollContainer"
        :class="['breadcrumb-scroll', { 'dropdown-open': anyDropdownOpen }]"
        @scroll="updateScrollState"
      >
        <!-- Segment 1: Transaction (dropdown, multi-select) -->
        <div class="breadcrumb-segment segment-transaction">
          <button
            :class="['bc-btn bc-btn--selected', { open: transactionOpen }]"
            :aria-expanded="transactionOpen"
            aria-haspopup="listbox"
            @click.stop="openTransaction"
          >
            <span class="bc-label">{{ transactionLabel }}</span>
            <svg
              class="bc-chevron"
              :class="{ open: transactionOpen }"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <div
            v-show="transactionOpen"
            class="bc-dropdown"
            role="listbox"
            :aria-label="$t('catalog.transaction')"
          >
            <label
              v-for="opt in actionOptions"
              :key="opt.key"
              :class="[
                'bc-dropdown-item bc-checkbox-item',
                { selected: activeActions.includes(opt.key as VehicleAction) },
              ]"
              @click.stop
            >
              <span class="bc-checkbox-label">{{ $t(`catalog.${opt.key}`) }}</span>
              <input
                type="checkbox"
                class="bc-checkbox"
                :checked="activeActions.includes(opt.key as VehicleAction)"
                @change="toggleAction(opt.key)"
              >
            </label>
          </div>
        </div>

        <!-- Separator after transaction (click clears category + subcategory) -->
        <button class="bc-sep" :title="$t('catalog.allTypes')" @click="clearFromCategory">
          &gt;
        </button>

        <!-- Segment 2: Category -->
        <!-- No category selected: show all as pills -->
        <template v-if="!activeCategoryId">
          <button
            v-for="cat in visibleCategories"
            :key="cat.id"
            :class="['bc-btn', { disabled: !isApplicable(cat) }]"
            @click="selectCategory(cat)"
          >
            {{ localizedName(cat) }}
          </button>
        </template>

        <!-- Category selected: show as dropdown segment -->
        <template v-else>
          <div class="breadcrumb-segment segment-category">
            <button
              :class="['bc-btn bc-btn--selected', { open: categoryOpen }]"
              :aria-expanded="categoryOpen"
              aria-haspopup="listbox"
              @click.stop="openCategory"
            >
              <span class="bc-label">{{ selectedCategoryName }}</span>
              <svg
                class="bc-chevron"
                :class="{ open: categoryOpen }"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div
              v-show="categoryOpen"
              class="bc-dropdown"
              role="listbox"
              :aria-label="$t('catalog.allTypes')"
            >
              <button
                role="option"
                :aria-selected="false"
                class="bc-dropdown-item"
                @click="clearCategory"
              >
                {{ $t('catalog.allTypes') }}
              </button>
              <button
                v-for="cat in visibleCategories"
                :key="cat.id"
                role="option"
                :aria-selected="activeCategoryId === cat.id"
                :class="['bc-dropdown-item', { selected: activeCategoryId === cat.id }]"
                @click="selectCategory(cat)"
              >
                {{ localizedName(cat) }}
              </button>
            </div>
          </div>

          <!-- Separator before subcategory (click clears subcategory) -->
          <template v-if="linkedSubcategories.length">
            <button class="bc-sep" :title="$t('catalog.allSubtypes')" @click="clearFromSubcategory">
              &gt;
            </button>

            <!-- Segment 3: Subcategory -->
            <!-- No subcategory selected: show all as pills -->
            <template v-if="!activeSubcategoryId">
              <button
                v-for="sub in linkedSubcategories"
                :key="sub.id"
                :class="['bc-btn bc-btn--sub', { disabled: !isSubcategoryApplicable(sub) }]"
                @click="selectSubcategory(sub)"
              >
                {{ localizedName(sub) }}
              </button>
            </template>

            <!-- Subcategory selected: show as dropdown segment -->
            <template v-else>
              <div class="breadcrumb-segment segment-subcategory">
                <button
                  :class="['bc-btn bc-btn--selected bc-btn--sub', { open: subcategoryOpen }]"
                  :aria-expanded="subcategoryOpen"
                  aria-haspopup="listbox"
                  @click.stop="openSubcategory"
                >
                  <span class="bc-label">{{ selectedSubcategoryName }}</span>
                  <svg
                    class="bc-chevron"
                    :class="{ open: subcategoryOpen }"
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <div
                  v-show="subcategoryOpen"
                  class="bc-dropdown"
                  role="listbox"
                  :aria-label="$t('catalog.allSubtypes')"
                >
                  <button
                    role="option"
                    :aria-selected="false"
                    class="bc-dropdown-item"
                    @click="clearSubcategory"
                  >
                    {{ $t('catalog.allSubtypes') }}
                  </button>
                  <button
                    v-for="sub in linkedSubcategories"
                    :key="sub.id"
                    role="option"
                    :aria-selected="activeSubcategoryId === sub.id"
                    :class="['bc-dropdown-item', { selected: activeSubcategoryId === sub.id }]"
                    @click="selectSubcategory(sub)"
                  >
                    {{ localizedName(sub) }}
                  </button>
                </div>
              </div>
            </template>
          </template>
        </template>
      </div>

      <button
        v-show="canScrollRight"
        class="scroll-btn scroll-btn-right"
        aria-hidden="true"
        @click="scrollRightFn"
      >
        &#9654;
      </button>
    </div>
  </nav>
</template>

<style scoped>
/* ============================================
   CATEGORY BAR — Unified breadcrumb (mobile-first)
   ============================================ */
.category-bar {
  background: var(--bg-primary);
  padding: 0.25rem 0;
  margin-top: 0.5rem;
  position: relative;
  z-index: 50;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.breadcrumb-bar {
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
  position: relative;
  overflow: hidden;
}

.breadcrumb-bar.dropdown-open {
  overflow: visible;
}

.breadcrumb-scroll {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  overflow-x: auto;
  scrollbar-width: none;
  flex: 1;
  min-width: 0;
}

.breadcrumb-scroll::-webkit-scrollbar {
  display: none;
}

.breadcrumb-scroll.dropdown-open {
  overflow: visible;
}

/* ============================================
   BREADCRUMB SEGMENT (wrapper for dropdown)
   ============================================ */
.breadcrumb-segment {
  position: relative;
  flex-shrink: 0;
}

/* ============================================
   BREADCRUMB BUTTONS
   ============================================ */
.bc-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.35rem 0.6rem;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-full);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-xs);
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 2.75rem;
  min-width: 2.75rem;
  text-transform: uppercase;
}

.bc-btn:not(.disabled):not(.bc-btn--selected):hover {
  color: var(--color-primary);
  background: var(--bg-secondary);
  border-color: var(--color-primary-light);
}

/* Selected segment (has dropdown) */
.bc-btn--selected {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.bc-btn--selected:hover,
.bc-btn--selected.open {
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-accent) 100%);
}

/* Subcategory pills: dashed border, no uppercase */
.bc-btn--sub {
  border-style: dashed;
  text-transform: none;
}

.bc-btn--sub.bc-btn--selected {
  border-style: solid;
}

.bc-btn.disabled {
  color: var(--text-auxiliary);
  cursor: not-allowed;
  background: var(--color-gray-50);
  border-color: var(--text-auxiliary);
}

.bc-label {
  max-width: 8rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bc-chevron {
  flex-shrink: 0;
  transition: transform 0.2s;
  opacity: 0.8;
}

.bc-chevron.open {
  transform: rotate(180deg);
}

/* ============================================
   SEPARATOR
   ============================================ */
.bc-sep {
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  flex-shrink: 0;
  padding: 0.2rem 0.15rem;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition: all 0.15s ease;
  min-height: 1.5rem;
  min-width: 1.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.bc-sep:hover {
  color: var(--color-primary);
  background: var(--bg-secondary);
}

/* ============================================
   DROPDOWN MENU
   ============================================ */
.bc-dropdown {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  min-width: 10rem;
  max-width: calc(100vw - 1rem);
  max-height: 16rem;
  overflow-y: auto;
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius);
  padding: 0.25rem 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.bc-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  transition: background 0.15s;
  min-height: 2.75rem;
  min-width: auto;
}

.bc-dropdown-item:hover {
  background: var(--bg-secondary);
}

.bc-dropdown-item.selected {
  color: var(--color-primary);
  font-weight: 600;
}

/* Checkbox items in transaction dropdown */
.bc-checkbox-item {
  justify-content: space-between;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.bc-checkbox-label {
  flex: 1;
}

.bc-checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-primary);
  cursor: pointer;
  flex-shrink: 0;
}

/* ============================================
   SCROLL ARROWS
   ============================================ */
.scroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border-color);
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  min-width: 1.5rem;
  min-height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  color: var(--text-primary);
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.scroll-btn-left {
  left: 0;
}

.scroll-btn-right {
  right: 0;
}

/* ============================================
   RESPONSIVE: >=768px
   ============================================ */
@media (min-width: 48em) {
  .category-bar {
    padding: 0.34rem 0;
    margin-top: 0;
  }

  .breadcrumb-bar {
    padding: 0 1.5rem;
  }

  .breadcrumb-scroll {
    gap: 0.4rem;
  }

  .bc-btn {
    min-height: 2.25rem;
    min-width: auto;
  }

  .bc-dropdown-item {
    min-height: 2.5rem;
  }
}

/* ============================================
   RESPONSIVE: >=1024px
   ============================================ */
@media (min-width: 64em) {
  .breadcrumb-bar {
    padding: 0 3rem;
  }

  .breadcrumb-scroll {
    gap: 0.5rem;
  }

  .bc-label {
    max-width: 12rem;
  }
}
</style>
