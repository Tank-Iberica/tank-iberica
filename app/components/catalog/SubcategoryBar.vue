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

const { activeActions, activeCategoryId, activeSubcategoryId, setCategory, setSubcategory } =
  useCatalogState()

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
</style>
