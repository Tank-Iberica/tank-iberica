<template>
  <nav class="categories-section" :aria-label="$t('catalog.title')">
    <button
      v-show="canScrollLeft"
      class="scroll-btn scroll-btn-left"
      aria-hidden="true"
      @click="scrollLeft"
    >
      &#9664;
    </button>

    <div ref="scrollContainer" class="categories" @scroll="updateScrollButtons">
      <button
        v-for="cat in mainCategories"
        :key="cat.key"
        :class="['category-btn', { active: activeActions.has(cat.key) }]"
        @click="handleClick(cat.key)"
      >
        {{ $t(`catalog.${cat.key}`) }}
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
  </nav>
</template>

<script setup lang="ts">
import type { VehicleAction } from '~/composables/useCatalogState'

const emit = defineEmits<{
  change: [actions: VehicleAction[]]
}>()

const { setActions } = useCatalogState()
const { config } = useVerticalConfig()

// Use vertical_config.active_actions if available, otherwise fall back to defaults
const FALLBACK_ACTIONS = ['alquiler', 'venta', 'terceros']
const mainCategories = computed(() => {
  const actions = config.value?.active_actions?.length
    ? config.value.active_actions
    : FALLBACK_ACTIONS
  return actions.map((key) => ({ key }))
})

// Multi-select state — empty = show all (legacy behavior)
const activeActions = ref<Set<string>>(new Set())

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
  const action = key as VehicleAction
  const next = new Set(activeActions.value)

  if (next.has(action)) {
    next.delete(action)
  } else {
    next.add(action)
  }

  activeActions.value = next
  const arr = [...next] as VehicleAction[]
  setActions(arr)
  emit('change', arr)
}

onMounted(() => {
  const el = scrollContainer.value
  if (el) {
    el.addEventListener('scroll', updateScrollButtons, { passive: true })
    nextTick(updateScrollButtons)
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
  margin-top: 0.5rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

/* Scrollable row */
.categories {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0 0.5rem;
  min-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.categories::-webkit-scrollbar {
  display: none;
}

/* ============================================
   CATEGORY BUTTON — Base = mobile
   ============================================ */
.category-btn {
  padding: 0.3rem 0.6rem;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-full);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-xs);
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
  transition: opacity 0.2s ease;
}

.scroll-btn-left {
  left: 0.125rem;
}

.scroll-btn-right {
  right: 0.125rem;
}

/* ============================================
   RESPONSIVE: ≥30em (large mobile)
   ============================================ */
@media (min-width: 30em) {
  .categories {
    gap: 0.4rem;
    padding: 0 0.5rem;
  }

  .category-btn {
    font-size: var(--font-size-xs);
    padding: 0.25rem 0.45rem;
    letter-spacing: 0.006rem;
  }
}

/* ============================================
   RESPONSIVE: ≥48em (tablet — switch to desktop)
   ============================================ */
@media (min-width: 48em) {
  .categories-section {
    padding: 0.34rem 0;
    margin-top: 0;
  }

  .categories {
    padding: 0 1.5rem;
    gap: 0.5rem;
  }

  .category-btn {
    font-size: var(--font-size-xs);
    padding: 0.4rem 0.6rem;
    letter-spacing: 0.0125rem;
    min-height: 2.25rem;
    display: inline-flex;
    align-items: center;
  }
}

/* ============================================
   RESPONSIVE: ≥64em (desktop)
   ============================================ */
@media (min-width: 64em) {
  .categories {
    padding: 0 3rem;
    gap: 0.75rem;
  }

  .category-btn {
    font-size: var(--font-size-xs);
    padding: 0.4rem 0.6rem;
    letter-spacing: 0.019rem;
  }
}
</style>
