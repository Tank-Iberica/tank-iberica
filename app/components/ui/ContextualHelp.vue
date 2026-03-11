<script setup lang="ts">
/**
 * ContextualHelp — Inline info icon with tooltip/popover.
 *
 * Usage:
 *   <UiContextualHelp :text="$t('help.priceExplanation')" />
 *   <UiContextualHelp :text="$t('help.filters')" position="bottom" />
 */
defineProps<{
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}>()

const open = ref(false)
const triggerRef = ref<HTMLButtonElement | null>(null)

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

// Close on click outside
function handleClickOutside(e: MouseEvent) {
  if (triggerRef.value && !triggerRef.value.contains(e.target as Node)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside, { passive: true })
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <span class="contextual-help" :class="`contextual-help--${position || 'top'}`">
    <button
      ref="triggerRef"
      type="button"
      class="contextual-help__trigger"
      :aria-expanded="open"
      aria-haspopup="true"
      :aria-label="$t('common.moreInfo')"
      @click.stop="toggle"
    >
      <svg
        class="contextual-help__icon"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" />
        <text
          x="8"
          y="11.5"
          text-anchor="middle"
          font-size="10"
          font-weight="600"
          fill="currentColor"
        >
          ?
        </text>
      </svg>
    </button>
    <Transition name="help-tooltip">
      <div v-if="open" class="contextual-help__tooltip" role="tooltip">
        {{ text }}
      </div>
    </Transition>
  </span>
</template>

<style scoped>
.contextual-help {
  position: relative;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.contextual-help__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0.125rem;
  cursor: pointer;
  color: var(--text-auxiliary);
  border-radius: var(--border-radius-full);
  min-height: 2.75rem;
  min-width: 2.75rem;
  transition: color 0.15s ease;
}

.contextual-help__trigger:hover,
.contextual-help__trigger:focus-visible {
  color: var(--color-primary);
}

.contextual-help__trigger:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.contextual-help__icon {
  flex-shrink: 0;
}

.contextual-help__tooltip {
  position: absolute;
  z-index: 50;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-normal);
  max-width: 15rem;
  width: max-content;
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
}

/* Position variants */
.contextual-help--top .contextual-help__tooltip {
  bottom: calc(100% + 0.5rem);
  left: 50%;
  transform: translateX(-50%);
}

.contextual-help--bottom .contextual-help__tooltip {
  top: calc(100% + 0.5rem);
  left: 50%;
  transform: translateX(-50%);
}

.contextual-help--left .contextual-help__tooltip {
  right: calc(100% + 0.5rem);
  top: 50%;
  transform: translateY(-50%);
}

.contextual-help--right .contextual-help__tooltip {
  left: calc(100% + 0.5rem);
  top: 50%;
  transform: translateY(-50%);
}

/* Transition */
.help-tooltip-enter-active,
.help-tooltip-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.help-tooltip-enter-from,
.help-tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}

@media (min-width: 48em) {
  .contextual-help__trigger {
    min-height: 1.5rem;
    min-width: 1.5rem;
  }
}
</style>
