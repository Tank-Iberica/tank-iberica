<template>
  <nav v-if="subcategories.length" class="subcategory-bar" :aria-label="$t('catalog.subcategories')">
    <div class="subcategory-wrapper">
      <button
        v-if="showScrollLeft"
        class="scroll-btn scroll-left"
        aria-label="Scroll left"
        @click="scrollLeft"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div ref="scrollContainer" class="subcategory-scroll" @scroll="updateScrollState">
        <button
          v-for="sub in subcategories"
          :key="sub.id"
          class="subcategory-chip"
          :class="{
            active: activeSubcategoryId === sub.id,
            disabled: !isApplicable(sub),
          }"
          :disabled="!isApplicable(sub)"
          @click="selectSubcategory(sub)"
        >
          {{ locale === 'en' && sub.name_en ? sub.name_en : sub.name_es }}
        </button>
      </div>

      <button
        v-if="showScrollRight"
        class="scroll-btn scroll-right"
        aria-label="Scroll right"
        @click="scrollRight"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
interface SubcategoryRow {
  id: string
  name_es: string
  name_en: string | null
  slug: string
  applicable_categories: string[]
  sort_order: number
}

const emit = defineEmits<{
  change: [subcategoryId: string | null]
}>()

const supabase = useSupabaseClient()
const { locale } = useI18n()
const { activeCategories, activeSubcategoryId, setSubcategory } = useCatalogState()

const subcategories = ref<SubcategoryRow[]>([])
const scrollContainer = ref<HTMLElement | null>(null)
const showScrollLeft = ref(false)
const showScrollRight = ref(false)

function isApplicable(sub: SubcategoryRow): boolean {
  if (!activeCategories.value.length) return true
  return activeCategories.value.some(cat => sub.applicable_categories.includes(cat))
}

async function fetchSubcategories() {
  const { data } = await supabase
    .from('subcategories')
    .select('*')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  subcategories.value = (data as SubcategoryRow[]) || []
  nextTick(updateScrollState)
}

function selectSubcategory(sub: SubcategoryRow) {
  if (activeSubcategoryId.value === sub.id) {
    setSubcategory(null, null)
    emit('change', null)
  }
  else {
    setSubcategory(sub.id, sub.slug)
    emit('change', sub.id)
  }
}

function updateScrollState() {
  const el = scrollContainer.value
  if (!el) return
  showScrollLeft.value = el.scrollLeft > 4
  showScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 4
}

function scrollLeft() {
  scrollContainer.value?.scrollBy({ left: -200, behavior: 'smooth' })
}

function scrollRight() {
  scrollContainer.value?.scrollBy({ left: 200, behavior: 'smooth' })
}

// When categories change, deselect subcategory if no longer applicable
watch(activeCategories, () => {
  if (activeSubcategoryId.value) {
    const current = subcategories.value.find(s => s.id === activeSubcategoryId.value)
    if (current && !isApplicable(current)) {
      setSubcategory(null, null)
      emit('change', null)
    }
  }
}, { deep: true })

onMounted(fetchSubcategories)
</script>

<style scoped>
.subcategory-bar {
  width: 100%;
  overflow: hidden;
}

.subcategory-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.subcategory-scroll {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.25rem 1rem 0.5rem;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  flex: 1;
}

.subcategory-scroll::-webkit-scrollbar {
  display: none;
}

.scroll-btn {
  position: absolute;
  z-index: 2;
  width: 28px;
  height: 28px;
  border-radius: var(--border-radius-full);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.scroll-left {
  left: 0;
}

.scroll-right {
  right: 0;
}

.subcategory-chip {
  flex-shrink: 0;
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-full);
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  white-space: nowrap;
  min-height: 44px;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.subcategory-chip.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  color: var(--text-auxiliary);
}

.subcategory-chip:not(.active):not(.disabled):hover {
  border-color: var(--color-primary);
}

.subcategory-chip.active {
  background: var(--color-white, #fff);
  border-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: 600;
}

@media (max-width: 479px) {
  .subcategory-chip {
    font-size: 10px;
    padding: 0.2rem 0.5rem;
  }
}

@media (min-width: 768px) {
  .subcategory-scroll {
    flex-wrap: wrap;
    overflow-x: visible;
    justify-content: center;
    padding: 0.25rem 1.5rem 0.5rem;
  }

  .subcategory-chip {
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.3px;
  }

  .scroll-btn {
    display: none;
  }
}
</style>
