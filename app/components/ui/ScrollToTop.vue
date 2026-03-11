<script setup lang="ts">
/**
 * Scroll-to-top button — shows after scrolling down 400px.
 * Add to layout or individual pages with long scroll.
 */

const visible = ref(false)

function onScroll() {
  visible.value = window.scrollY > 400
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <Transition name="scroll-top">
    <button
      v-if="visible"
      class="scroll-to-top"
      :aria-label="$t('common.back')"
      @click="scrollToTop"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 16V4M10 4L4 10M10 4L16 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  </Transition>
</template>

<style scoped>
.scroll-to-top {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 50;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  border: none;
  background: var(--color-primary);
  color: var(--color-white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  transition: background 0.15s ease, transform 0.15s ease;
}

.scroll-to-top:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
}

.scroll-to-top:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 0.125rem;
}

.scroll-to-top:active {
  transform: translateY(0);
}

/* Transition */
.scroll-top-enter-active,
.scroll-top-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.scroll-top-enter-from,
.scroll-top-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}

@media (prefers-reduced-motion: reduce) {
  .scroll-to-top {
    transition: none;
  }

  .scroll-top-enter-active,
  .scroll-top-leave-active {
    transition: none;
  }
}
</style>
