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

// ── Data ──
const categories = ref<CategoryRow[]>([])
const subcategories = ref<SubcategoryRow[]>([])
const subcategoryCategoryLinks = ref<Map<string, string[]>>(new Map())

// ── Dropdown open state (mobile) ──
const transactionOpen = ref(false)
const categoryOpen = ref(false)
const subcategoryOpen = ref(false)

// ── Desktop scroll refs ──
const scrollContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

// ── Actions config ──
const FALLBACK_ACTIONS = ['alquiler', 'venta', 'terceros']
const actionOptions = computed(() => {
  const actions = config.value?.active_actions?.length
    ? config.value.active_actions
    : FALLBACK_ACTIONS
  return actions.map((key) => ({ key }))
})

// Default: Venta selected
onMounted(async () => {
  // Set default action to 'venta' if none selected
  if (!activeActions.value.length) {
    setActions(['venta'] as VehicleAction[])
  }

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

// ── Helpers ──
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

// ── Transaction label (mobile) ──
const transactionLabel = computed(() => {
  if (!activeActions.value.length) return t('catalog.transaction')
  if (activeActions.value.length === 1) return t(`catalog.${activeActions.value[0]}`)
  return `${activeActions.value.length} ${t('catalog.transaction').toLowerCase()}`
})

// ── Fetch data ──
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

// ── Actions (transaction type) ──
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

// ── Category / Subcategory selection ──
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

// ── Dropdown toggles (avoids multiline inline handlers) ──
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

function clearCategoryAndClose() {
  clearCategory()
  categoryOpen.value = false
}

function clearSubcategoryAndClose() {
  clearSubcategory()
  subcategoryOpen.value = false
}

// ── Desktop scroll ──
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

// ── Close dropdowns on outside click ──
function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.dropdown-transaction')) transactionOpen.value = false
  if (!target.closest('.dropdown-category')) categoryOpen.value = false
  if (!target.closest('.dropdown-subcategory')) subcategoryOpen.value = false
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <nav class="category-bar" :aria-label="$t('catalog.title')">
    <!-- ═══════════════════════════════════════════
         MOBILE: 3 dropdown selectors in a row
         ═══════════════════════════════════════════ -->
    <div class="mobile-selectors">
      <!-- 1. Transaccion (multi-select) -->
      <div class="dropdown-wrapper dropdown-transaction">
        <button
          :class="['selector-btn', { active: transactionOpen || activeActions.length > 0 }]"
          @click.stop="openTransaction"
        >
          <span class="selector-label">{{ transactionLabel }}</span>
          <svg
            class="chevron"
            :class="{ open: transactionOpen }"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div v-show="transactionOpen" class="dropdown-menu">
          <button
            v-for="opt in actionOptions"
            :key="opt.key"
            :class="[
              'dropdown-item',
              { selected: activeActions.includes(opt.key as VehicleAction) },
            ]"
            @click.stop="toggleAction(opt.key)"
          >
            <span class="check-icon">{{
              activeActions.includes(opt.key as VehicleAction) ? '✓' : ''
            }}</span>
            {{ $t(`catalog.${opt.key}`) }}
          </button>
        </div>
      </div>

      <!-- 2. Tipo (single-select category) -->
      <div class="dropdown-wrapper dropdown-category">
        <button
          :class="['selector-btn', { active: categoryOpen || !!activeCategoryId }]"
          @click.stop="openCategory"
        >
          <span class="selector-label">{{
            activeCategoryId ? selectedCategoryName : $t('catalog.allTypes')
          }}</span>
          <svg
            class="chevron"
            :class="{ open: categoryOpen }"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div v-show="categoryOpen" class="dropdown-menu">
          <button
            :class="['dropdown-item', { selected: !activeCategoryId }]"
            @click="clearCategoryAndClose"
          >
            {{ $t('catalog.allTypes') }}
          </button>
          <button
            v-for="cat in visibleCategories"
            :key="cat.id"
            :class="['dropdown-item', { selected: activeCategoryId === cat.id }]"
            @click="selectCategory(cat)"
          >
            {{ localizedName(cat) }}
          </button>
        </div>
      </div>

      <!-- 3. Subtipo (single-select subcategory, only if category selected) -->
      <div
        v-if="activeCategoryId && linkedSubcategories.length"
        class="dropdown-wrapper dropdown-subcategory"
      >
        <button
          :class="['selector-btn', { active: subcategoryOpen || !!activeSubcategoryId }]"
          @click.stop="openSubcategory"
        >
          <span class="selector-label">{{
            activeSubcategoryId ? selectedSubcategoryName : $t('catalog.allSubtypes')
          }}</span>
          <svg
            class="chevron"
            :class="{ open: subcategoryOpen }"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div v-show="subcategoryOpen" class="dropdown-menu">
          <button
            :class="['dropdown-item', { selected: !activeSubcategoryId }]"
            @click="clearSubcategoryAndClose"
          >
            {{ $t('catalog.allSubtypes') }}
          </button>
          <button
            v-for="sub in linkedSubcategories"
            :key="sub.id"
            :class="['dropdown-item', { selected: activeSubcategoryId === sub.id }]"
            @click="selectSubcategory(sub)"
          >
            {{ localizedName(sub) }}
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════
         DESKTOP: action pills + breadcrumb
         ═══════════════════════════════════════════ -->
    <div class="desktop-bar">
      <!-- Action pills -->
      <div class="action-pills">
        <button
          v-for="opt in actionOptions"
          :key="opt.key"
          :class="['action-pill', { active: activeActions.includes(opt.key as VehicleAction) }]"
          @click="toggleAction(opt.key)"
        >
          {{ $t(`catalog.${opt.key}`) }}
        </button>
      </div>

      <!-- Breadcrumb separator -->
      <span v-if="categories.length" class="breadcrumb-sep">|</span>

      <!-- Category/Subcategory breadcrumb -->
      <div class="breadcrumb-area">
        <button
          v-show="canScrollLeft"
          class="scroll-btn scroll-btn-left"
          aria-hidden="true"
          @click="scrollLeftFn"
        >
          &#9664;
        </button>

        <div ref="scrollContainer" class="breadcrumb-scroll" @scroll="updateScrollState">
          <!-- Level 1: show all categories -->
          <template v-if="!activeCategoryId">
            <button
              v-for="cat in visibleCategories"
              :key="cat.id"
              :class="['breadcrumb-btn', { disabled: !isApplicable(cat) }]"
              @click="selectCategory(cat)"
            >
              {{ localizedName(cat) }}
            </button>
          </template>

          <!-- Level 2: selected category > subcategories -->
          <template v-else-if="!activeSubcategoryId">
            <button class="breadcrumb-btn active" @click="clearCategory">
              {{ selectedCategoryName }}
            </button>
            <span class="sep">&gt;</span>
            <button
              v-for="sub in linkedSubcategories"
              :key="sub.id"
              :class="['breadcrumb-btn type-btn', { disabled: !isSubcategoryApplicable(sub) }]"
              @click="selectSubcategory(sub)"
            >
              {{ localizedName(sub) }}
            </button>
          </template>

          <!-- Level 3: category > subcategory selected -->
          <template v-else>
            <button class="breadcrumb-btn active" @click="clearCategory">
              {{ selectedCategoryName }}
            </button>
            <span class="sep">&gt;</span>
            <button class="breadcrumb-btn type-btn active" @click="clearSubcategory">
              {{ selectedSubcategoryName }}
            </button>
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
    </div>
  </nav>
</template>

<style scoped>
.category-bar {
  background: var(--bg-primary);
  padding: 0.28rem 0;
  margin-top: 0.5rem;
  position: relative;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

/* ═══════════════════════════════════════════
   MOBILE SELECTORS (default, <768px)
   ═══════════════════════════════════════════ */
.mobile-selectors {
  display: flex;
  gap: 0.25rem;
  padding: 0 0.5rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.mobile-selectors::-webkit-scrollbar {
  display: none;
}

.desktop-bar {
  display: none;
}

/* Dropdown wrapper */
.dropdown-wrapper {
  position: relative;
  flex-shrink: 0;
}

.selector-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.3rem 0.5rem;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-full);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-xs);
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: auto;
  min-width: auto;
  line-height: 1.4;
}

.selector-btn.active {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.selector-label {
  max-width: 7rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chevron {
  flex-shrink: 0;
  transition: transform 0.2s;
}

.chevron.open {
  transform: rotate(180deg);
}

/* Dropdown menu */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  min-width: 10rem;
  max-height: 16rem;
  overflow-y: auto;
  background: var(--bg-primary);
  border: 2px solid var(--color-primary);
  border-radius: var(--border-radius);
  padding: 0.25rem 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.dropdown-item {
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
  min-height: 2.5rem;
  min-width: auto;
}

.dropdown-item:hover {
  background: var(--bg-secondary);
}

.dropdown-item.selected {
  color: var(--color-primary);
  font-weight: 600;
}

.check-icon {
  width: 1rem;
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-primary);
}

/* ═══════════════════════════════════════════
   DESKTOP BAR (>=768px)
   ═══════════════════════════════════════════ */
@media (min-width: 48em) {
  .mobile-selectors {
    display: none;
  }

  .desktop-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 1.5rem;
  }

  .category-bar {
    padding: 0.34rem 0;
    margin-top: 0;
  }

  /* Action pills */
  .action-pills {
    display: flex;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  .action-pill {
    padding: 0.35rem 0.6rem;
    border: 2px solid var(--border-color);
    border-radius: var(--border-radius-full);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: var(--font-size-xs);
    font-weight: 500;
    text-transform: uppercase;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.3s ease;
    min-height: 2.25rem;
    display: inline-flex;
    align-items: center;
    min-width: auto;
  }

  .action-pill:hover {
    border-color: var(--color-primary);
    background: var(--bg-secondary);
    color: var(--color-primary);
  }

  .action-pill.active {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    color: var(--color-white);
    border-color: var(--color-primary);
  }

  .breadcrumb-sep {
    color: var(--border-color);
    font-size: var(--font-size-base);
    flex-shrink: 0;
  }

  /* Breadcrumb area */
  .breadcrumb-area {
    flex: 1;
    min-width: 0;
    position: relative;
    overflow: hidden;
  }

  .breadcrumb-scroll {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .breadcrumb-scroll::-webkit-scrollbar {
    display: none;
  }

  .breadcrumb-btn {
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
    transition: all 0.3s ease;
    min-height: 2.25rem;
    display: inline-flex;
    align-items: center;
    text-transform: uppercase;
    min-width: auto;
  }

  .breadcrumb-btn:not(.disabled):not(.active):hover {
    color: var(--color-primary);
    background: var(--bg-secondary);
    border-color: var(--color-primary-light);
  }

  .breadcrumb-btn.active {
    background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-accent) 100%);
    color: var(--color-white);
    border-color: var(--color-primary-light);
  }

  .breadcrumb-btn.disabled {
    color: var(--text-auxiliary);
    cursor: not-allowed;
    background: var(--color-gray-50);
    border-color: var(--text-auxiliary);
  }

  .breadcrumb-btn.type-btn {
    border-style: dashed;
    text-transform: none;
  }

  .breadcrumb-btn.type-btn.active {
    border-style: solid;
  }

  .sep {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    font-weight: 600;
    flex-shrink: 0;
  }

  /* Scroll arrows */
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
}

@media (min-width: 64em) {
  .desktop-bar {
    padding: 0 3rem;
    gap: 0.75rem;
  }

  .action-pills {
    gap: 0.5rem;
  }

  .breadcrumb-scroll {
    gap: 0.5rem;
  }
}
</style>
