<template>
  <!-- MOBILE: Bottom sheet for dynamic/advanced filters -->
  <Transition name="fade">
    <div v-if="mobileOpen" class="filter-backdrop" @click="$emit('update:mobile-open', false)" />
  </Transition>
  <Transition name="slide-up">
    <div v-if="mobileOpen" class="filter-sheet">
      <div class="filter-sheet-header">
        <h3>{{ $t('catalog.advancedFilters') }}</h3>
        <button class="filter-close" @click="$emit('update:mobile-open', false)">&#215;</button>
      </div>
      <div class="filter-sheet-body">
        <CatalogFilterBarDynamicFilters
          :filters="filters"
          :active-filters="activeFilters"
          variant="mobile"
          @select="(n: string, v: string) => $emit('select', n, v)"
          @check="(n: string, o: string) => $emit('check', n, o)"
          @tick="(n: string) => $emit('tick', n)"
          @range="(n: string, v: number | null) => $emit('range', n, v)"
          @text="(n: string, v: string) => $emit('text', n, v)"
        />
      </div>
    </div>
  </Transition>

  <!-- DESKTOP: Collapsible advanced filters panel -->
  <Transition name="slide-down">
    <div v-if="desktopOpen && filters.length" class="advanced-panel">
      <div class="advanced-panel-grid">
        <CatalogFilterBarDynamicFilters
          :filters="filters"
          :active-filters="activeFilters"
          variant="desktop"
          @select="(n: string, v: string) => $emit('select', n, v)"
          @check="(n: string, o: string) => $emit('check', n, o)"
          @tick="(n: string) => $emit('tick', n)"
          @range="(n: string, v: number | null) => $emit('range', n, v)"
          @text="(n: string, v: string) => $emit('text', n, v)"
        />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface FilterDef {
  name: string
  type: string
  label: string
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number
  [key: string]: unknown
}

defineProps<{
  mobileOpen: boolean
  desktopOpen: boolean
  filters: FilterDef[]
  activeFilters: Record<string, unknown>
}>()

defineEmits<{
  'update:mobile-open': [value: boolean]
  select: [name: string, value: string]
  check: [name: string, option: string]
  tick: [name: string]
  range: [name: string, value: number | null]
  text: [name: string, value: string]
}>()
</script>

<style scoped>
/* ============================================
   MOBILE: Bottom sheet
   ============================================ */
.filter-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal-backdrop);
  background: rgba(0, 0, 0, 0.5);
}

.filter-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-modal);
  background: var(--bg-primary);
  border-radius: 16px 16px 0 0;
  max-height: 80vh;
  overflow-y: auto;
}

.filter-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color-light);
  position: sticky;
  top: 0;
  background: var(--bg-primary);
  z-index: 1;
}

.filter-sheet-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.filter-close {
  font-size: 18px;
  color: var(--text-auxiliary);
  min-height: 32px;
  min-width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-sheet-body {
  padding: 0.75rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* ============================================
   TRANSITIONS
   ============================================ */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 300ms ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 200ms ease;
  overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 500px;
}

/* ============================================
   DESKTOP: Advanced panel
   ============================================ */
.advanced-panel {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  padding: 0.75rem 1.5rem;
}

.advanced-panel-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;
  align-items: flex-start;
}

@media (min-width: 768px) {
  .filter-backdrop {
    display: none !important;
  }

  .filter-sheet {
    display: none !important;
  }
}
</style>
