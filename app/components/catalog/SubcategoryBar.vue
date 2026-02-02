<template>
  <section v-if="subcategories.length" class="subcategories-section" :aria-label="$t('catalog.subcategories')">
    <button
      v-show="canScrollLeft"
      class="scroll-btn scroll-btn-left"
      aria-hidden="true"
      @click="scrollLeft"
    >
      &#9664;
    </button>

    <div ref="scrollContainer" class="subcategories" @scroll="updateScrollState">
      <button
        v-for="sub in subcategories"
        :key="sub.id"
        :class="['subcategory-btn', {
          active: activeSubcategoryId === sub.id,
          disabled: !isApplicable(sub),
        }]"
        @click="selectSubcategory(sub)"
      >
        {{ locale === 'en' && sub.name_en ? sub.name_en : sub.name_es }}
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
  </section>
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
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

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
  if (!isApplicable(sub)) return

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
  canScrollLeft.value = el.scrollLeft > 0
  canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 1
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

onMounted(() => {
  fetchSubcategories()
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
  position: relative;
  overflow: hidden;
  border-top: 1px solid var(--border-color);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

/* Scrollable row — directly on section, arrows on parent */
.subcategories {
  display: flex;
  justify-content: flex-start;
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
   RESPONSIVE: ≥480px (large mobile)
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
}

/* ============================================
   RESPONSIVE: ≥768px (tablet)
   ============================================ */
@media (min-width: 768px) {
  .subcategories-section {
    padding: 0.34rem 0;
  }

  .subcategories {
    padding: 0 1.5rem;
    gap: 0.5rem;
  }

  .subcategory-btn {
    font-size: 11px;
    padding: 0.25rem 0.45rem;
  }
}

/* ============================================
   RESPONSIVE: ≥1024px (desktop)
   ============================================ */
@media (min-width: 1024px) {
  .subcategories {
    padding: 0 3rem;
    gap: 0.75rem;
  }

  .subcategory-btn {
    font-size: 12px;
    padding: 0.27rem 0.56rem;
  }
}
</style>
