<script setup lang="ts">
/**
 * CatalogAlertCTA — "Crear alarma" button with two modes:
 * - Mobile: sticky pill top-right, shrinks to icon-only on scroll
 * - Desktop: inline banner below active filters
 * Self-contained: handles auth check + insert into search_alerts.
 */
const { t } = useI18n()
const { filters } = useCatalogState()
const { activeFilters } = useFilters()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const openSubscribeModal = inject<() => void>('openSubscribeModal')

const success = ref(false)

const hasFilters = computed(() => {
  const f = filters.value
  const hasCatalog = !!(
    f.brand ||
    f.price_min ||
    f.price_max ||
    f.year_min ||
    f.year_max ||
    f.category_id ||
    f.subcategory_id ||
    f.location_province_eq
  )
  const hasDynamic = Object.values(activeFilters.value).some((v) => !!v)
  return hasCatalog || hasDynamic
})

async function onCreateAlert() {
  if (!user.value) {
    openSubscribeModal?.()
    return
  }

  try {
    const allFilters = { ...toRaw(filters.value), ...toRaw(activeFilters.value) }
    const { error } = await supabase.from('search_alerts').insert({
      user_id: user.value.id,
      filters: allFilters,
      frequency: 'daily',
      active: true,
    } as never)
    if (error) throw error
    success.value = true
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch {
    // Silent — the button visual stays unchanged
  }
}

// Scroll detection for mobile pill collapse
const scrolled = ref(false)

function onScroll() {
  scrolled.value = window.scrollY > 80
}

onMounted(() => {
  scrolled.value = window.scrollY > 80
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <Transition name="alert-cta">
    <div v-if="hasFilters" class="alert-cta-wrap">
      <!-- Mobile: sticky pill -->
      <button
        class="alert-pill"
        :class="{ collapsed: scrolled, success }"
        :title="t('catalog.createAlert')"
        @click="onCreateAlert"
      >
        <svg
          class="alert-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span class="alert-label">{{
          success ? t('catalog.alertCreated') : t('catalog.createAlert')
        }}</span>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.alert-cta-wrap {
  position: relative;
}

/* ============================================
   MOBILE PILL (default, <768px)
   ============================================ */
.alert-pill {
  position: fixed;
  top: calc(var(--header-offset, 3.5rem) + 0.5rem);
  right: 0.5rem;
  z-index: var(--z-sticky, 10);
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--border-radius-full, 999px);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition:
    padding 0.25s ease,
    width 0.25s ease,
    border-radius 0.25s ease,
    background 0.2s;
  min-height: 2.75rem;
  white-space: nowrap;
}

.alert-pill:active {
  transform: scale(0.96);
}

.alert-pill.success {
  background: var(--color-success, #22c55e);
}

.alert-icon {
  flex-shrink: 0;
}

.alert-label {
  overflow: hidden;
  max-width: 10rem;
  transition:
    max-width 0.25s ease,
    opacity 0.2s ease;
  opacity: 1;
}

.alert-pill.collapsed {
  padding: 0.5rem;
  border-radius: 50%;
  width: 2.75rem;
  height: 2.75rem;
  justify-content: center;
}

.alert-pill.collapsed .alert-label {
  max-width: 0;
  opacity: 0;
  margin: 0;
  padding: 0;
}

/* ============================================
   DESKTOP (>=48em / 768px) — same pill, adjusted position
   ============================================ */
@media (min-width: 48em) {
  .alert-pill {
    top: calc(var(--header-offset, 4rem) + 0.75rem);
    right: 1rem;
    font-size: 0.875rem;
    min-height: 3rem;
  }

  .alert-pill.collapsed {
    width: 3rem;
    height: 3rem;
  }
}

/* ============================================
   TRANSITIONS
   ============================================ */
.alert-cta-enter-active {
  transition: all 0.25s ease;
}

.alert-cta-leave-active {
  transition: all 0.2s ease;
}

.alert-cta-enter-from,
.alert-cta-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}
</style>
