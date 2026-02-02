<template>
  <nav class="categories-section" :aria-label="$t('catalog.title')">
    <div class="categories-wrapper">
      <button
        v-show="canScrollLeft"
        class="scroll-btn scroll-btn-left"
        aria-hidden="true"
        @click="scrollLeft"
      >
        &#9664;
      </button>
      <div ref="scrollContainer" class="categories">
        <button
          v-for="cat in displayCategories"
          :key="cat.key"
          :class="['category-btn', { active: cat.key === 'anunciate' ? false : activeCategories.has(cat.key) }]"
          @click="handleClick(cat.key)"
        >
          {{ cat.key === 'anunciate' ? $t('catalog.anunciate') : $t(`catalog.${cat.key}`) }}
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
  </nav>
</template>

<script setup lang="ts">
import type { VehicleCategory } from '~/composables/useCatalogState'

const emit = defineEmits<{
  change: [categories: VehicleCategory[]]
  openAdvertise: []
}>()

const { setCategories } = useCatalogState()

const displayCategories = [
  { key: 'alquiler' },
  { key: 'venta' },
  { key: 'terceros' },
  { key: 'anunciate' },
] as const

// Multi-select state — empty = show all (legacy behavior)
const activeCategories = ref<Set<string>>(new Set())

const scrollContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

function updateScrollButtons() {
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

function handleClick(key: string) {
  if (key === 'anunciate') {
    emit('openAdvertise')
    return
  }

  const cat = key as VehicleCategory
  const next = new Set(activeCategories.value)

  // Toggle: no minimum — all can be deselected (legacy behavior)
  if (next.has(cat)) {
    next.delete(cat)
  }
  else {
    next.add(cat)
  }

  activeCategories.value = next
  const arr = [...next] as VehicleCategory[]
  setCategories(arr)
  emit('change', arr)
}

onMounted(() => {
  const el = scrollContainer.value
  if (el) {
    el.addEventListener('scroll', updateScrollButtons, { passive: true })
    updateScrollButtons()
  }
})

onUnmounted(() => {
  scrollContainer.value?.removeEventListener('scroll', updateScrollButtons)
})
</script>

<style scoped>
/* ============================================
   CATEGORIES SECTION — Base = mobile (360px)
   ============================================ */
.categories-section {
  background: var(--bg-primary);
  padding: 0.28rem 0;
  margin-top: 5px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.categories-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  position: relative;
}

.categories-wrapper::-webkit-scrollbar {
  display: none;
}

.categories {
  display: flex;
  justify-content: flex-start;
  gap: 0.25rem;
  padding: 0 1rem;
  min-width: 100%;
}

/* ============================================
   CATEGORY BUTTON — Base = smallest mobile
   ============================================ */
.category-btn {
  padding: 0.16rem 0.28rem;
  border: 2px solid var(--border-color);
  border-radius: 9999px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 8px;
  font-weight: 500;
  text-transform: uppercase;
  line-height: 1.4;
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: 0;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: auto;
  min-width: auto;
}

.category-btn:hover {
  border-color: var(--color-primary);
  background: var(--bg-secondary);
  color: var(--color-primary);
}

.category-btn.active {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: var(--color-white);
  border-color: var(--color-primary);
}

/* ============================================
   SCROLL ARROWS
   ============================================ */
.scroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
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
  .categories {
    gap: 0.4rem;
  }

  .category-btn {
    font-size: 9px;
    padding: 0.2rem 0.36rem;
    letter-spacing: 0.1px;
  }
}

/* ============================================
   RESPONSIVE: ≥768px (tablet — switch to desktop)
   ============================================ */
@media (min-width: 768px) {
  .categories-section {
    padding: 0.34rem 0;
    margin-top: 6px;
  }

  .categories {
    padding: 0 1.5rem;
    gap: 0.5rem;
  }

  .category-btn {
    font-size: 10px;
    padding: 0.3rem 0.5rem;
    letter-spacing: 0.2px;
  }
}

/* ============================================
   RESPONSIVE: ≥1024px (desktop)
   ============================================ */
@media (min-width: 1024px) {
  .categories {
    padding: 0 3rem;
    gap: 0.75rem;
  }

  .category-btn {
    font-size: 12px;
    padding: 0.31rem 0.56rem;
    letter-spacing: 0.3px;
  }
}
</style>
