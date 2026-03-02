<template>
  <nav
    v-if="availableLevels.length"
    class="level-pills-nav"
    :aria-label="$t('catalog.locationLevelNav')"
  >
    <button
      v-show="canScrollLeft"
      class="scroll-btn scroll-btn-left"
      aria-hidden="true"
      tabindex="-1"
      @click="scrollLeft"
    >
      &#9664;
    </button>

    <div ref="scrollContainer" class="level-pills" @scroll="updateScrollButtons">
      <button
        v-for="level in availableLevels"
        :key="level"
        :class="['level-pill', { active: level === currentLevel }]"
        :aria-pressed="level === currentLevel"
        @click="$emit('change', level)"
      >
        {{
          getLevelLabel(level, userLocation?.province, userLocation?.region, userLocation?.country)
        }}
      </button>
    </div>

    <button
      v-show="canScrollRight"
      class="scroll-btn scroll-btn-right"
      aria-hidden="true"
      tabindex="-1"
      @click="scrollRight"
    >
      &#9654;
    </button>
  </nav>
</template>

<script setup lang="ts">
import { type LocationLevel, getAvailableLevels } from '~/utils/geoData'
import { useGeoFallback } from '~/composables/catalog/useGeoFallback'

const props = defineProps<{
  currentLevel: LocationLevel | null
  userCountry?: string | null
}>()

defineEmits<{
  change: [level: LocationLevel]
}>()

const { getLevelLabel } = useGeoFallback()
const { location: userLocation } = useUserLocation()

const availableLevels = computed(() =>
  getAvailableLevels(props.userCountry ?? userLocation.value?.country ?? null),
)

// Scroll logic (same pattern as CategoryBar)
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
  scrollContainer.value?.scrollBy({ left: -160, behavior: 'smooth' })
}

function scrollRight() {
  scrollContainer.value?.scrollBy({ left: 160, behavior: 'smooth' })
}

onMounted(() => {
  updateScrollButtons()
  // Scroll active pill into view
  nextTick(() => {
    const el = scrollContainer.value
    if (!el || !props.currentLevel) return
    const active = el.querySelector<HTMLElement>('.level-pill.active')
    active?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  })
})
</script>

<style scoped>
.level-pills-nav {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-3);
  border-bottom: 1px solid var(--border-color-light);
  background: var(--bg-primary);
}

.level-pills {
  display: flex;
  gap: var(--spacing-2);
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
  padding: var(--spacing-2) 0;
  flex: 1;
}

.level-pills::-webkit-scrollbar {
  display: none;
}

.level-pill {
  flex-shrink: 0;
  padding: var(--spacing-1) var(--spacing-3);
  border: 1px solid var(--border-color-light);
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background: transparent;
  white-space: nowrap;
  min-height: 32px;
  transition: all var(--transition-fast);
  cursor: pointer;
}

@media (hover: hover) {
  .level-pill:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

.level-pill.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

/* Scroll arrows */
.scroll-btn {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--text-auxiliary);
  border: 1px solid var(--border-color-light);
  border-radius: 50%;
  background: var(--bg-primary);
  z-index: 1;
  cursor: pointer;
  transition: color var(--transition-fast);
}

@media (hover: hover) {
  .scroll-btn:hover {
    color: var(--text-primary);
  }
}

.scroll-btn-left {
  margin-right: var(--spacing-1);
}
.scroll-btn-right {
  margin-left: var(--spacing-1);
}
</style>
